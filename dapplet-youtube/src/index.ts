import {} from "@dapplets/dapplet-extension";
//import { T_TwitterFeatureConfig, ITwitterAdapter } from '@dapplets/twitter-adapter'
import DOWNLOAD_ICON from "./icons/download-24px.svg";
import { DappletApi } from "./api";

@Injectable
export default class TwitterFeature {
    private _api: DappletApi;
    private _network: string;
    private _videoRegistryAddress: string;
    private _bzzTokenAddress: string;
    private _postageStampAddress: string;
    private _swarmGatewayUrl: string;
    private _operatorAddress: string;

    @Inject("youtube-adapter")
    public adapter: any; //ITwitterAdapter;

    public async activate() {

        this._network = await Core.storage.get('network');

        if (this._network === 'goerli') {
            this._swarmGatewayUrl = "https://swarmgateway.mooo.com";
            this._operatorAddress = "0x74f0D4F6eb62b93dfDD3E5CD15DF99b4f5D1A86a";
            this._bzzTokenAddress = "0x2ac3c1d3e24b45c6c310534bc2dd84b5ed576335";
            this._postageStampAddress = "0x621e455c4a139f5c4e4a8122ce55dc21630769e4";
            this._videoRegistryAddress = "0x2A5170cCcfbB90EA6c10cCcfc0D9e1F9aFBBA063";
        } else if (this._network === 'xdai') {
            this._swarmGatewayUrl = "https://swarm-mainnet.mooo.com";
            this._operatorAddress = "0x80ff8c6ee38d10522f65fecb517da2a839f6fc81";
            this._bzzTokenAddress = "0xdBF3Ea6F5beE45c02255B2c26a16F300502F68da";
            this._postageStampAddress = "0x6a1A21ECA3aB28BE85C7Ba22b2d6eAE5907c900E";
            this._videoRegistryAddress = "0xB76E21a8Af501fc5def4Eca6fdd1eA0A858B5ee2";
        } else {
            throw new Error('Unsupported network. The Media Downloader is able to work on "goerli" and "xdai" networks');
        }

        const useCustomNode = await Core.storage.get('useCustomNode');

        if (useCustomNode) {
            this._swarmGatewayUrl = await Core.storage.get('swarmGatewayUrl');
            this._operatorAddress = await Core.storage.get('operatorAddress');
        }

        this._api = new DappletApi({
            network: this._network,
            postageStampAddress: this._postageStampAddress,
            bzzTokenAddress: this._bzzTokenAddress,
            nodeOperatorAddress: this._operatorAddress,
            videoRegistryAddress: this._videoRegistryAddress,
            swarmGatewayUrl: this._swarmGatewayUrl,
        });

        const { button, badge, result } = this.adapter.exports;

        this.adapter.attachConfig({
            SEARCH_RESULT: () => [
                badge({
                    DEFAULT: {
                        hidden: true,
                        init: this._handleSearchResultInit,
                    },
                    AVAILABLE: {
                        label: "AVAILABLE IN SWARM",
                        color: "#ffc300",
                    },
                }),
            ],
            VIDEO: () => [
                button({
                    initial: "DEFAULT",
                    DEFAULT: {
                        img: DOWNLOAD_ICON,
                        label: "DOWNLOAD",
                        tooltip: "Download and upload video to Swarm",
                        init: this._handleVideoInit,
                        exec: this._handleVideoExec,
                    },
                    LOADING: {
                        img: DOWNLOAD_ICON,
                        label: "LOADING",
                        disabled: true,
                        loading: true,
                    },
                    ERROR: {
                        img: DOWNLOAD_ICON,
                        label: "ERROR",
                        exec: (_, me) => (me.state = "DEFAULT"),
                    },
                }),
            ],
        });
    }

    _handleSearchResultInit = async (ctx, me) => {
        const attachments = await this._api.getAttachments(ctx.videoId);
        if (attachments.length > 0) {
            me.state = "AVAILABLE";
        }
    };

    _handleVideoInit = async (ctx, me) => {
        me.state = "LOADING";
        const attachments = await this._api.getAttachments(ctx.videoId);
        me.state = "DEFAULT";
        if (attachments.length > 0) {
            me.label = "AVAILABLE IN SWARM";
        } else {
            me.label = "UPLOAD TO SWARM";
        }
    };

    _handleVideoExec = async (ctx, me) => {
        try {
            me.state = "LOADING";
            await this._openOverlay();
            me.state = "DEFAULT";
        } catch (err) {
            console.error(err);
            me.state = "ERROR";
        }
    };

    _openOverlay = async () => {
        const videoInfo = await this.adapter.getCurrentVideoInfo();

        if (
            !videoInfo ||
            !videoInfo.videoDetails ||
            !videoInfo.videoDetails.videoId
        ) {
            throw Error("Cannot fetch videoInfo");
        }

        const data = {
            network: this._network,
            videoInfo,
            swarmGatewayUrl: this._swarmGatewayUrl,
            contractAddress: this._videoRegistryAddress
        };

        const overlay = Core.overlay({
            name: "swarm-hackathon-downloader-overlay",
            title: "Swarm Downloader",
        });

        overlay.send("info", data);
        
        // ToDo: use new overlay.declare() API for function declaration
        overlay.listen({
            download: async (_, { message }) => {
                try {
                    const { blob, reference, tag } =
                        await this._api.uploadVideoToSwarm({
                            url: message.url,
                            filename: message.filename,
                            swarmPostageStampId: message.swarmPostageStampId,
                            onChangeDownloadStatus: (value) => {
                                overlay.send("download_status", value);
                            },
                            onChangeUploadStatus: (value) => {
                                overlay.send("upload_status", value);
                            },
                        });

                    overlay.send("download_done", {
                        reference,
                        tag,
                    });

                    this._api
                        .addVideoToIndex(
                            videoInfo,
                            blob,
                            reference,
                            message.filename
                        )
                        .then((x) => {
                            console.log("Video added to the index");
                        })
                        .catch(() => {
                            console.error("Cannot add video to the index");
                        });
                } catch (e) {
                    overlay.send("download_error", e.message);
                }
            },
            getAttachments: (_, { message }) => {
                this._api
                    .getAttachments(message.videoId)
                    .then((x) => overlay.send("getAttachments_done", x))
                    .catch((e) => {
                        console.error(e);
                        overlay.send("getAttachments_error", e);
                    });
            },
            addAttachment: async (_, { message }) => {
                this._api
                    .addAttachment(message.videoId, message.reference)
                    .then(() => overlay.send("addAttachment_done"))
                    .catch((e) => {
                        console.error(e);
                        overlay.send("addAttachment_error", e);
                    });
            },
            calcPrice: async (_, { message }) => {
                this._api
                    .calcPrice(message.ttl, message.sizeInBytes)
                    .then((x) => overlay.send("calcPrice_done", x))
                    .catch((e) => {
                        console.error(e);
                        overlay.send("calcPrice_error", e);
                    });
            },
            createBatch: async (_, { message }) => {
                this._api
                    .createBatch(message.initialBalancePerChunk, message.depth)
                    .then((x) => overlay.send("createBatch_done", x))
                    .catch((e) => {
                        console.error(e);
                        overlay.send("createBatch_error", e);
                    });
            },
            getAllowance: async (_, { message }) => {
                this._api
                    .getAllowance()
                    .then((x) => overlay.send("getAllowance_done", x))
                    .catch((e) => {
                        console.error(e);
                        overlay.send("getAllowance_error", e);
                    });
            },
            approve: async (_, { message }) => {
                this._api
                    .approve(message.amount)
                    .then((x) => overlay.send("approve_done", x))
                    .catch((e) => {
                        console.error(e);
                        overlay.send("approve_error", e);
                    });
            },
            fetchFilesize: async (_, { message }) => {
                this._api
                    .fetchFilesize(message.url)
                    .then((x) => overlay.send("fetchFilesize_done", x))
                    .catch((e) => {
                        console.error(e);
                        overlay.send("fetchFilesize_error", e);
                    });
            },
        });
    };
}
