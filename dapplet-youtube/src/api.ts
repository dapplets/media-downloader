import PostageStamp from "./abi/PostageStamp";
import BzzToken from "./abi/BzzToken";
import VideoRegistry from "./abi/VideoRegistry";

async function digestMessage(message) {
    const msgUint8 = new TextEncoder().encode(message); // encode as (utf-8) Uint8Array
    const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8); // hash the message
    const hashArray = Array.from(new Uint8Array(hashBuffer)); // convert buffer to byte array
    const hashHex = hashArray
        .map((b) => b.toString(16).padStart(2, "0"))
        .join(""); // convert bytes to hex string
    return hashHex;
}

type IndexMetadata = {
    title: string;
    description: string;
    thumbnailUrl: string;
    channelName: string;
    channelIconUrl: string;
    type: string;
    url: string;
    reference: string;
    name: string;
    size: number;
    contentType: string;
};

type CalculationPriceResult = {
    depth: number;
    chunks: number;
    pricePerBlock: string;
    blockTime: number;
    postageStampChunks: number;
    initialBalancePerChunk: string;
    totalAmount: string;
};

type DappletApiConfig = {
    postageStampAddress: string;
    bzzTokenAddress: string;
    nodeOperatorAddress: string;
    videoRegistryAddress: string;
    swarmGatewayUrl: string;
};

export class DappletApi {
    private _postageStampAddress: string;
    private _bzzTokenAddress: string;
    private _nodeOperatorAddress: string;
    private _videoRegistryAddress: string;
    private _swarmGatewayUrl: string;

    constructor(config: DappletApiConfig) {
        this._postageStampAddress = config.postageStampAddress;
        this._bzzTokenAddress = config.bzzTokenAddress;
        this._nodeOperatorAddress = config.nodeOperatorAddress;
        this._videoRegistryAddress = config.videoRegistryAddress;
        this._swarmGatewayUrl = config.swarmGatewayUrl;
    }

    async calcPrice(
        ttl: number,
        sizeInBytes: string
    ): Promise<CalculationPriceResult> {
        const contract = await Core.contract(
            "ethereum",
            this._postageStampAddress,
            PostageStamp
        );

        const chunks = Math.ceil(Number(sizeInBytes) / 4096);
        let depth = Math.ceil(Math.log2(chunks));
        if (depth < 20) depth = 20; // depth is minimum 20

        // const cumulativePayout = await contract.currentTotalOutPayment();
        const pricePerBlock = await contract.lastPrice();
        const blockTime = 15;
        const postageStampChunks = 2 ** depth;
        const initialBalancePerChunk = pricePerBlock.mul(ttl).div(blockTime);
        const totalAmount = initialBalancePerChunk.mul(postageStampChunks);

        return {
            depth,
            chunks,
            pricePerBlock: pricePerBlock.toString(),
            blockTime,
            postageStampChunks,
            initialBalancePerChunk: initialBalancePerChunk.toString(),
            totalAmount: totalAmount.toString(),
        };
    }

    async createBatch(initialBalancePerChunk: string, depth: number) {
        const { ethers } = Core.ethers;

        const wallet = await Core.wallet({
            type: "ethereum",
            network: "goerli",
        });
        if (!(await wallet.isConnected())) await wallet.connect();
        const [sender] = await wallet.request({
            method: "eth_accounts",
            params: [],
        });

        const bucketDepth = 16;
        const nonce = ethers.utils.hexlify(ethers.utils.randomBytes(32));
        const immutable = false;
        const batchId = ethers.utils.keccak256(
            ethers.utils.defaultAbiCoder.encode(
                ["address", "bytes32"],
                [sender, nonce]
            )
        );

        const contract = await Core.contract(
            "ethereum",
            this._postageStampAddress,
            PostageStamp
        );
        const tx = await contract.createBatch(
            this._nodeOperatorAddress,
            initialBalancePerChunk,
            depth,
            bucketDepth,
            nonce,
            immutable
        );

        await tx.wait();

        return batchId;
    }

    async getAllowance(): Promise<string> {
        const wallet = await Core.wallet({
            type: "ethereum",
            network: "goerli",
        });
        if (!(await wallet.isConnected())) await wallet.connect();
        const [account] = await wallet.request({
            method: "eth_accounts",
            params: [],
        });
        const contract = await Core.contract(
            "ethereum",
            this._bzzTokenAddress,
            BzzToken
        );
        const allowed = await contract.allowance(
            account,
            this._postageStampAddress
        );
        return allowed.toString();
    }

    async approve(amount: string) {
        const contract = await Core.contract(
            "ethereum",
            this._bzzTokenAddress,
            BzzToken
        );
        const tx = await contract.approve(this._postageStampAddress, amount);
        await tx.wait();
    }

    async uploadVideoToSwarm({
        url,
        filename,
        swarmPostageStampId,
        onChangeDownloadStatus,
        onChangeUploadStatus,
    }: {
        url: string;
        filename: string;
        swarmPostageStampId: string;
        onChangeDownloadStatus: (value: number) => void;
        onChangeUploadStatus: (value: number) => void;
    }): Promise<{ blob: Blob; reference: string; tag: string }> {
        const swarmGatewayUrl = this._swarmGatewayUrl;

        const response = await fetch(url);
        var loaded = 0;
        var size = +response.headers.get("Content-Length");

        const { readable, writable } = new TransformStream({
            transform(chunk, controller) {
                loaded += chunk.length;
                onChangeDownloadStatus(loaded / size);
                controller.enqueue(chunk);
            },
        });

        response.body.pipeTo(writable);
        const blob = await new Response(readable, {
            headers: {
                "Content-Type": response.headers.get("Content-Type"),
            },
        }).blob();

        return new Promise((res, rej) => {
            var xhr = new XMLHttpRequest();
            // xhr.withCredentials = true;
            xhr.open(
                "POST",
                swarmGatewayUrl + "/bzz?name=" + encodeURIComponent(filename),
                true
            );
            xhr.setRequestHeader(
                "swarm-postage-batch-id",
                swarmPostageStampId.replace("0x", "")
            );
            xhr.setRequestHeader("swarm-collection", "false");
            xhr.setRequestHeader(
                "Content-Type",
                response.headers.get("Content-Type")
            );
            xhr.onload = (e: any) => {
                const result = JSON.parse(e.target.responseText);

                res({
                    blob,
                    reference: result.reference,
                    tag:
                        xhr.getResponseHeader("Swarm-Tag") ??
                        xhr.getResponseHeader("Swarm-Tag-Uid"),
                });
            };
            xhr.onerror = () => {
                rej("Cannot upload video");
            };

            xhr.upload.onprogress = function (e) {
                if (e.lengthComputable) {
                    onChangeUploadStatus(e.loaded / e.total);
                }
            };

            xhr.send(blob);
        });
    }

    async getAttachments(videoId: string) {
        const hash = await digestMessage(videoId);
        const contract = await Core.contract(
            "ethereum",
            this._videoRegistryAddress,
            VideoRegistry
        );
        return contract.getByKey("0x" + hash);
    }

    async addAttachment(videoId: string, ref: string) {
        if (!ref.includes("0x")) {
            ref = "0x" + ref;
        }

        const hash = await digestMessage(videoId);
        const contract = await Core.contract(
            "ethereum",
            this._videoRegistryAddress,
            VideoRegistry
        );
        const tx = await contract.add("0x" + hash, ref);
        return tx.wait();
    }

    async addVideoToIndex(
        videoInfo: any,
        blob: any,
        reference: string,
        filename: string
    ) {
        const metadata: IndexMetadata = {
            title: videoInfo.videoDetails.title,
            description: videoInfo.videoDetails.description,
            thumbnailUrl: (videoInfo.videoDetails.thumbnails.length > 1
                ? videoInfo.videoDetails.thumbnails[
                      videoInfo.videoDetails.thumbnails.length - 2
                  ]
                : videoInfo.videoDetails.thumbnails[
                      videoInfo.videoDetails.thumbnails.length - 1
                  ]
            )?.url,
            channelName: videoInfo.videoDetails.ownerChannelName,
            channelIconUrl:
                videoInfo.videoDetails.author.thumbnails.reverse()[0]?.url,
            type: "video",
            url: this._swarmGatewayUrl + "/bzz/" + reference,
            reference: reference,
            name: filename,
            size: blob.size,
            contentType: blob.type,
        };

        return this._addFileToIndex(metadata, blob);
    }

    private async _addFileToIndex(metadata: IndexMetadata, file: any) {
        const searchEngineUrl = await Core.storage.get("searchEngineUrl");
        if (!searchEngineUrl)
            throw new Error(
                "searchEngineUrl is required. Check dapplet's settings."
            );

        const formData = new FormData();
        formData.append("file", file);
        formData.append("metadata", JSON.stringify(metadata));

        const resp = await fetch(searchEngineUrl + "files", {
            method: "POST",
            body: formData,
        });
        if (!resp.ok) throw new Error("Cannot add file to index");
    }
}
