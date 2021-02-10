import { IFeature } from '@dapplets/dapplet-extension';
//import { IDynamicAdapter } from 'dynamic-adapter.dapplet-base.eth';
import { IButtonState, Button } from './button';
import  './ytdl.js';

@Injectable
export default class TwitterAdapter {

    // ToDo: refactor it
    public exports = featureId => ({
        button: this.adapter.createWidgetFactory(Button)
    });

    public config = [{
        containerSelector: '#primary',
        contextSelector: "#primary-inner",
        insPoints: {
            MENU: {
                selector: "#info-contents #top-level-buttons ytd-button-renderer",
                insert: 'begin'
            }
        },
        contextBuilder: (p: any) => ({
            title: p.querySelector('#info-contents h1').innerText,
            views: parseInt(p.querySelector('#info-contents #info-text #count').innerText.match(/[0-9]/g).join('')),
            videoId: (new URL(document.location.href)).searchParams.get('v'),
            getInfo: () => window['ytdlr']()
        })
    }];

    constructor(
        @Inject("dynamic-adapter.dapplet-base.eth")
        readonly adapter: any
    ) {
        this.adapter.configure(this.config);
    }

    // ToDo: refactor it
    public attachConfig(feature: IFeature): void { // ToDo: automate two-way dependency handling(?)
        this.adapter.attachConfig(feature);
    }

    // ToDo: refactor it
    public detachConfig(feature: IFeature): void {
        this.adapter.detachConfig(feature);
    }
}