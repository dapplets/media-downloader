import { } from '@dapplets/dapplet-extension'
//import { T_TwitterFeatureConfig, ITwitterAdapter } from '@dapplets/twitter-adapter'
import DOWNLOAD_ICON from './icons/download-24px.svg';
import DONE_ICON from './icons/done-24px.svg';
import THUMBNAIL_IMG from './icons/thumbnail.png';
import abi from './abi';
import { AutoProperties, Connection } from '@dapplets/dapplet-extension/lib/inpage/connection';

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
}

async function digestMessage(message) {
    const msgUint8 = new TextEncoder().encode(message);                           // encode as (utf-8) Uint8Array
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);           // hash the message
    const hashArray = Array.from(new Uint8Array(hashBuffer));                     // convert buffer to byte array
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join(''); // convert bytes to hex string
    return hashHex;
}

@Injectable
export default class TwitterFeature {

    private _contract;

    @Inject("youtube-adapter")
    public adapter: any //ITwitterAdapter;

    public async activate() {

        const address = await Core.storage.get('contractAddress');
        this._contract = await Core.contract('ethereum', address, abi);

        console.log(this._contract);

        const { button, badge, result } = this.adapter.exports;

        this.adapter.attachConfig({
            // SEARCH_RESULT_GROUP: () => [
            //     result({
            //         "DEFAULT": {
            //             title: "RUSSIAN CYBERPUNK FARM",
            //             views: "8.8M",
            //             date: "2 months ago",
            //             channel: "birchpunk",
            //             description: "cyberpunk #russia #robots #birchpunk They say that Russia is a technically backward country, there are no roads, robotics do not ...",
            //             img: THUMBNAIL_IMG,
            //             badges: [{
            //                 label: 'AVAILABLE IN FAIRTUBE',
            //                 color: '#ffc300'
            //             }],
            //             // init: (ctx, me) => {

            //             // },
            //             exec: (ctx, me) => {
            //                 window.open('https://gateway.ethswarm.org/files/6995fd78ab680c53d6cc4003082e5cf9b5225644ae6e0f1892ecf966075f0248', '_blank')
            //             }
            //         }
            //     })
            // ],
            SEARCH_RESULT: () => [
                badge({
                    "DEFAULT": {
                        hidden: true,
                        init: async (ctx, me) => {
                            const hash = await digestMessage(ctx.videoId);
                            const attachments = await this._getAttachments('0x' + hash);
                            if (attachments.length > 0) {
                                me.state = "AVAILABLE";
                            }
                        }
                    },
                    "AVAILABLE": {
                        label: 'AVAILABLE IN SWARM',
                        color: '#ffc300'
                    }
                })
            ],
            VIDEO: () => [
                button({
                    initial: "DEFAULT",
                    "DEFAULT": {
                        img: DOWNLOAD_ICON,
                        label: "DOWNLOAD",
                        tooltip: 'Download and upload video to Swarm',
                        init: async (ctx, me) => {
                            me.state = "LOADING";
                            const hash = await digestMessage(ctx.videoId);
                            const attachments = await this._getAttachments('0x' + hash);
                            me.state = 'DEFAULT';
                            if (attachments.length > 0) {
                                me.label = 'AVAILABLE IN SWARM';
                            } else {
                                me.label = 'UPLOAD TO SWARM';
                            }
                        },
                        exec: async (ctx, me) => {
                            try {
                                me.state = 'LOADING';

                                const overlay = Core.overlay({ name: "swarm-hackathon-downloader-overlay", title: 'Swarm Downloader' });
                                overlay.send(null); // just open overlay

                                const swarmGatewayUrl = await Core.storage.get('swarmGatewayUrl');
                                const swarmPostageStampId = await Core.storage.get('swarmPostageStampId');
                                const contractAddress = await Core.storage.get('contractAddress');

                                const videoInfo = await this.adapter.getCurrentVideoInfo();

                                if (!videoInfo || !videoInfo.videoDetails || !videoInfo.videoDetails.videoId) throw Error('Cannot fetch videoInfo');

                                const data = { videoInfo, swarmGatewayUrl, contractAddress };

                                overlay.sendAndListen('info', data, {
                                    'download': async (_, { message }) => this._download(
                                        message.url,
                                        message.filename,
                                        overlay,
                                        swarmGatewayUrl,
                                        me,
                                        videoInfo.videoDetails.videoId,
                                        swarmPostageStampId,
                                        videoInfo
                                    )
                                });

                                me.state = 'DEFAULT';

                            } catch (err) {
                                console.error(err);
                                me.state = "ERROR";
                            }
                        }
                    },
                    "LOADING": {
                        img: DOWNLOAD_ICON,
                        label: 'LOADING',
                        disabled: true,
                        loading: true
                    },
                    "ERROR": {
                        img: DOWNLOAD_ICON,
                        label: 'ERROR',
                        exec: (_, me) => me.state = 'DEFAULT'
                    }
                })
            ]
        });
    }

    private async _getAttachments(key: string) {
        return this._contract.getByKey(key);
    }

    private async _addAttachment(key: string, ref: string) {
        const tx = await this._contract.add(key, ref);
        return tx.wait();
    }

    private async _download(url: string, filename: string, overlay: AutoProperties<unknown> & Connection, swarmGatewayUrl: string, me: any, videoId: string, swarmPostageStampId: string, videoInfo: any) {
        try {
            const supportsRequestStreams = !new Request('', {
                body: new ReadableStream(),
                method: 'POST',
            }).headers.has('Content-Type');

            if (supportsRequestStreams) {

                const response = await fetch(url);

                var loaded = 0
                var size = +response.headers.get('Content-Length')

                const { readable, writable } = new TransformStream({
                    transform(chunk, controller) {
                        loaded += chunk.length;
                        overlay.send('download_status', loaded / size);
                        overlay.send('upload_status', loaded / size);
                        controller.enqueue(chunk);
                    }
                });

                response.body.pipeTo(writable);

                // Post to url2:
                const response2 = await fetch(swarmGatewayUrl + '/bzz?name=' + encodeURIComponent(filename), {
                    method: 'POST',
                    body: readable, //.pipeThrough(transformStream2),
                    headers: {
                        "Content-Type": response.headers.get('Content-Type'),
                        "swarm-postage-batch-id": swarmPostageStampId,
                        "swarm-collection": 'false'
                    },
                    //credentials: 'include'
                });

                const json2 = await response2.json();
                overlay.send('download_done', {
                    reference: json2.reference,
                    tag: response2.headers.get('Swarm-Tag') ?? response2.headers.get('Swarm-Tag-Uid')
                });
                digestMessage(videoId).then(async (x) => {
                    await this._addAttachment('0x' + x, '0x' + json2.reference)
                    me.label = 'AVAILABLE IN SWARM';
                });
            } else {
                const response = await fetch(url);
                var loaded = 0
                var size = +response.headers.get('Content-Length')

                const { readable, writable } = new TransformStream({
                    transform(chunk, controller) {
                        loaded += chunk.length;
                        overlay.send('download_status', loaded / size);
                        controller.enqueue(chunk);
                    }
                });

                response.body.pipeTo(writable);
                const blob = await new Response(readable, {
                    headers: {
                        'Content-Type': response.headers.get('Content-Type')
                    }
                }).blob();

                var xhr = new XMLHttpRequest();
                // xhr.withCredentials = true;
                xhr.open('POST', swarmGatewayUrl + '/bzz?name=' + encodeURIComponent(filename), true);
                xhr.setRequestHeader('swarm-postage-batch-id', swarmPostageStampId);
                xhr.setRequestHeader('swarm-collection', 'false');
                xhr.setRequestHeader('Content-Type', response.headers.get('Content-Type'));
                xhr.onload = (e: any) => {
                    const result = JSON.parse(e.target.responseText);

                    digestMessage(videoId).then(async (x) => {
                        await this._addAttachment('0x' + x, '0x' + result.reference)
                        me.label = 'AVAILABLE IN SWARM';
                    });

                    this._addVideoToIndex({
                        title: videoInfo.videoDetails.title,
                        description: videoInfo.videoDetails.description,
                        thumbnailUrl: ((videoInfo.videoDetails.thumbnails.length > 1) ? videoInfo.videoDetails.thumbnails[videoInfo.videoDetails.thumbnails.length - 2] : videoInfo.videoDetails.thumbnails[videoInfo.videoDetails.thumbnails.length - 1])?.url,
                        channelName: videoInfo.videoDetails.ownerChannelName,
                        channelIconUrl: videoInfo.videoDetails.author.thumbnails.reverse()[0]?.url,
                        type: 'video',
                        url: swarmGatewayUrl + '/bzz/' + result.reference,
                        reference: result.reference,
                        name: filename,
                        size: blob.size,
                        contentType: blob.type
                    }, blob).then(x => {
                        overlay.send('download_done', {
                            reference: result.reference,
                            tag: xhr.getResponseHeader('Swarm-Tag') ?? xhr.getResponseHeader('Swarm-Tag-Uid')
                        })
                    })
                    .catch(() => overlay.send('download_error', 'Cannot add video to the index'))
                };
                xhr.onerror = () => overlay.send('download_error', 'Cannot upload video');

                xhr.upload.onprogress = function (e) {
                    if (e.lengthComputable) {
                        overlay.send('upload_status', (e.loaded / e.total));
                    }
                };

                xhr.send(blob);
            }
        } catch (err) {
            overlay.send('download_error', err.message);
        }
    }

    private async _addVideoToIndex(metadata: IndexMetadata, file: any) {
        const searchEngineUrl = await Core.storage.get('searchEngineUrl');
        if (!searchEngineUrl) throw new Error('searchEngineUrl is required. Check dapplet\'s settings.');

        const formData = new FormData();
        formData.append("file", file);
        formData.append("metadata", JSON.stringify(metadata));

        const resp = await fetch(searchEngineUrl + 'files', { method: 'POST', body: formData });
        if (!resp.ok) throw new Error("Cannot add file to index");
    }
}