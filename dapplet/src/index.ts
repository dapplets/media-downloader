import { } from '@dapplets/dapplet-extension'
//import { T_TwitterFeatureConfig, ITwitterAdapter } from '@dapplets/twitter-adapter'
import EXAMPLE_IMG from './icons/icon344.png'


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
                        label: "Injected Button",
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
                            console.log(json.reference);
                            
                            me.state = 'DONE';

                        },
                        img: EXAMPLE_IMG
                    },
                    "FETCHING": {
                        label: 'FETCHING'
                    },
                    "DOWNLOADING": {
                        label: 'DOWNLOADING'
                    },
                    "UPLOADING": {
                        label: 'UPLOADING'
                    },
                    "DONE": {
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