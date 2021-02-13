import { } from '@dapplets/dapplet-extension'
import ATTACHMENT_ICON from './icons/attach_file-24px.svg';
import abi from './abi';

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
        @Inject("twitter-adapter.dapplet-base.eth")
        public adapter: any //ITwitterAdapter;
    ) {
        const { button, badge } = this.adapter.exports;

        this.adapter.attachConfig({
            POST_SOUTH: [
                button({
                    "DEFAULT": {
                        img: ATTACHMENT_ICON,
                        init: async (ctx, me) => {
                            const hash = await digestMessage(ctx.videoId);
                            const attachments = await this._getAttachments('0x' + hash);
                            me.label = (attachments.length > 0) ? attachments.length.toString() : undefined;
                        },
                        exec: () => alert('hi!')
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
}