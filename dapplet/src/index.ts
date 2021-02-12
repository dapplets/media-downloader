import { } from '@dapplets/dapplet-extension'
//import { T_TwitterFeatureConfig, ITwitterAdapter } from '@dapplets/twitter-adapter'
import DOWNLOAD_ICON from './icons/download-24px.svg';
import DONE_ICON from './icons/done-24px.svg';
import { AutoProperties, Connection } from '@dapplets/dapplet-extension/lib/inpage/connection';

@Injectable
export default class TwitterFeature {

    constructor(
        @Inject("youtube-adapter.dapplet-base.eth")
        public adapter: any //ITwitterAdapter;
    ) {
        const { button } = this.adapter.exports;

        this.adapter.attachConfig({
            MENU: [
                button({
                    initial: "DEFAULT",
                    "DEFAULT": {
                        img: DOWNLOAD_ICON,
                        label: "DOWNLOAD",
                        tooltip: 'Download and upload video to Swarm',
                        //init: (ctx, me) => console.log(ctx),
                        exec: async (ctx, me) => {

                            me.state = 'FETCHING';

                            const overlayUrl = await Core.storage.get('overlayUrl');
                            const overlay = Core.overlay({ url: overlayUrl, title: 'Media Downloader' });
                            overlay.send(null); // just open overlay

                            const swarmGatewayUrl = await Core.storage.get('swarmGatewayUrl');

                            const info = await ctx.getInfo();
                            info.swarmGatewayUrl = swarmGatewayUrl;
                            overlay.sendAndListen('info', info, {
                                'download': async (op, { type, message }) => {
                                    const url = message;

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
                                        const response2 = await fetch(swarmGatewayUrl + '/files', {
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
                                        })
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
                                        xhr.open('POST', swarmGatewayUrl + '/files', true);
                                        xhr.onload = function (e: any) {
                                            const result = JSON.parse(e.target.responseText);
                                            overlay.send('downloaded', {
                                                reference: result.reference,
                                                tag: xhr.getResponseHeader('Swarm-Tag') ?? xhr.getResponseHeader('Swarm-Tag-Uid')
                                            })
                                        };

                                        xhr.upload.onprogress = function (e) {
                                            if (e.lengthComputable) {
                                                overlay.send('upload_status', (e.loaded / e.total));
                                            }
                                        };

                                        xhr.send(blob);
                                    }
                                },
                            });

                            me.state = 'DEFAULT';

                            // me.state = 'DOWNLOADING';

                            // const url = info.formats[info.formats.length - 1].url;
                            // const resp1 = await fetch(url);
                            // const blob = await resp1.blob();

                            // me.state = 'UPLOADING';

                            // const resp2 = await fetch('https://gateway.ethswarm.org/files', {
                            //     method: 'POST',
                            //     body: blob
                            // });

                            // const json = await resp2.json();
                            // alert(json.reference);

                            // me.state = 'DONE';

                        }
                    },
                    "FETCHING": {
                        img: DOWNLOAD_ICON,
                        label: 'FETCHING',
                        disabled: true,
                        loading: true
                    },
                    "DOWNLOADING": {
                        img: DOWNLOAD_ICON,
                        label: 'DOWNLOADING',
                        disabled: true,
                        loading: true
                    },
                    "UPLOADING": {
                        img: DOWNLOAD_ICON,
                        label: 'UPLOADING',
                        disabled: true,
                        loading: true
                    },
                    "DONE": {
                        img: DONE_ICON,
                        label: 'DONE',
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

}