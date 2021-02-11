import { } from '@dapplets/dapplet-extension'
//import { T_TwitterFeatureConfig, ITwitterAdapter } from '@dapplets/twitter-adapter'
import DOWNLOAD_ICON from './icons/download-24px.svg';
import DONE_ICON from './icons/done-24px.svg';


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
                        init: (ctx, me) => console.log(ctx),
                        exec: async (ctx, me) => {

                            me.state = 'FETCHING';

                            const info = await ctx.getInfo();

                            me.state = 'DOWNLOADING';

                            const url = info.formats[info.formats.length - 1].url;
                            const resp1 = await fetch(url);
                            const blob = await resp1.blob();

                            me.state = 'UPLOADING';

                            const resp2 = await fetch('https://gateway.ethswarm.org/files', {
                                method: 'POST',
                                body: blob
                            });

                            const json = await resp2.json();
                            alert(json.reference);
                            
                            me.state = 'DONE';

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