import {} from "@dapplets/dapplet-extension";
//import { T_TwitterFeatureConfig, ITwitterAdapter } from '@dapplets/twitter-adapter'
import DOWNLOAD_ICON from "./icons/download-24px.svg";
import { DappletApi } from "./api";

@Injectable
export default class TwitterFeature {
    private _api: DappletApi;
    private _swarmGatewayUrl: string;
    private _contractAddress: string;

    @Inject("youtube-adapter")
    public adapter: any; //ITwitterAdapter;

    public async activate() {
        this._swarmGatewayUrl = "https://swarmgateway.mooo.com";
        this._contractAddress = "0x2A5170cCcfbB90EA6c10cCcfc0D9e1F9aFBBA063";

        this._api = new DappletApi({
            postageStampAddress: "0x621e455c4a139f5c4e4a8122ce55dc21630769e4",
            bzzTokenAddress: "0x2ac3c1d3e24b45c6c310534bc2dd84b5ed576335",
            nodeOperatorAddress: "0x74f0D4F6eb62b93dfDD3E5CD15DF99b4f5D1A86a",
            videoRegistryAddress: this._contractAddress,
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
            videoInfo,
            swarmGatewayUrl: this._swarmGatewayUrl,
            contractAddress: this._contractAddress,
        };

        const overlay = Core.overlay({
            name: "swarm-hackathon-downloader-overlay",
            title: "Swarm Downloader",
        });

        overlay.send(null); // just open overlay

        // ToDo: use new overlay.declare() API for function declaration
        overlay.sendAndListen("info", data, {
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
        });
    };
}
