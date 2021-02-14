import { } from '@dapplets/dapplet-extension'
//import { T_TwitterFeatureConfig, ITwitterAdapter } from '@dapplets/twitter-adapter'
import DOWNLOAD_ICON from './icons/download-24px.svg';
import DONE_ICON from './icons/done-24px.svg';
import THUMBNAIL_IMG from './icons/thumbnail.png';
import abi from './abi';
import { AutoProperties, Connection } from '@dapplets/dapplet-extension/lib/inpage/connection';

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

    constructor(
        @Inject("youtube-adapter.dapplet-base.eth")
        public adapter: any //ITwitterAdapter;
    ) {
        const { button, badge, result } = this.adapter.exports;

        this.adapter.attachConfig({
            SEARCH_RESULTS: [
                result({
                    "DEFAULT": {
                        title: "RUSSIAN CYBERPUNK FARM",
                        views: "8.8M",
                        date: "2 months ago",
                        channel: "birchpunk",
                        description: "cyberpunk #russia #robots #birchpunk They say that Russia is a technically backward country, there are no roads, robotics do not ...",
                        img: THUMBNAIL_IMG,
                        badges: [{
                            label: 'AVAILABLE IN FAIRTUBE',
                            color: '#ffc300'
                        }],
                        // init: (ctx, me) => {

                        // },
                        exec: (ctx, me) => {
                            window.open('https://swarm.dapplets.org/files/6995fd78ab680c53d6cc4003082e5cf9b5225644ae6e0f1892ecf966075f0248', '_blank')
                        }
                    }
                })
            ],
            SEARCH_RESULT_BADGES: [
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
            MENU: [
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

                            me.state = 'LOADING';

                            const overlayUrl = await Core.storage.get('overlayUrl');
                            const overlay = Core.overlay({ url: overlayUrl, title: 'Media Downloader' });
                            overlay.send(null); // just open overlay

                            const swarmGatewayUrl = await Core.storage.get('swarmGatewayUrl');
                            const contractAddress = await Core.storage.get('contractAddress');

                            // ToDo: fix it
                            let info;
                            let i = 3;
                            while (i > 0) {
                                try {
                                    info = await ctx.getInfo();
                                    i = 0;
                                } catch (err) {
                                    i--;
                                    if (i === 0) {
                                        throw Error(err);
                                    } else {
                                        console.error(err);
                                    }
                                }
                            }

                            info.swarmGatewayUrl = swarmGatewayUrl;
                            info.contractAddress = contractAddress;

                            overlay.sendAndListen('info', info, {
                                'download': async (_, { message }) => this._download(
                                    message.url,
                                    message.filename,
                                    overlay,
                                    swarmGatewayUrl,
                                    me,
                                    info
                                )
                            });

                            me.state = 'DEFAULT';

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

    public activate() {
        this.adapter.attachFeature(this);
    }

    public deactivate() {
        this.adapter.detachFeature(this);
    }

    private async _getAttachments(key: string) {
        const contract = await this._getContract();
        return contract.getByKey(key);
    }

    private async _addAttachment(key: string, ref: string) {
        const contract = await this._getContract();
        const tx = await contract.add(key, ref);
        return tx.wait();
    }

    private async _getContract() {
        if (!this._contract) {
            const address = await Core.storage.get('contractAddress');
            this._contract = Core.contract(address, abi);
        }

        return this._contract;
    }

    private async _download(url: string, filename: string, overlay: AutoProperties<unknown> & Connection, swarmGatewayUrl: string, me: any, info: any) {
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
            const response2 = await fetch(swarmGatewayUrl + '/files?name=' + encodeURIComponent(filename), {
                method: 'POST',
                body: readable, //.pipeThrough(transformStream2),
                headers: {
                    "Content-Type": response.headers.get('Content-Type')
                }
            });

            const json2 = await response2.json();
            overlay.send('downloaded', {
                reference: json2.reference,
                tag: response2.headers.get('Swarm-Tag') ?? response2.headers.get('Swarm-Tag-Uid')
            });
            digestMessage(info.info.id).then(async (x) => {
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
            xhr.open('POST', swarmGatewayUrl + '/files?name=' + encodeURIComponent(filename), true);
            xhr.onload = (e: any) => {
                const result = JSON.parse(e.target.responseText);
                overlay.send('downloaded', {
                    reference: result.reference,
                    tag: xhr.getResponseHeader('Swarm-Tag') ?? xhr.getResponseHeader('Swarm-Tag-Uid')
                })
                digestMessage(info.info.id).then(async (x) => {
                    await this._addAttachment('0x' + x, '0x' + result.reference)
                    me.label = 'AVAILABLE IN SWARM';
                });
            };

            xhr.upload.onprogress = function (e) {
                if (e.lengthComputable) {
                    overlay.send('upload_status', (e.loaded / e.total));
                }
            };

            xhr.send(blob);
        }
    }
}