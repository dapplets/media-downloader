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

    @Inject("twitter-adapter.dapplet-base.eth")
    public adapter: any //ITwitterAdapter;

    public async activate() {
        const address = await Core.storage.get('contractAddress');
        this._contract = await Core.contract('ethereum', address, abi);

        const { button, badge } = this.adapter.exports;

        this.adapter.attachConfig({
            POST: () => [
                button({
                    "DEFAULT": {
                        img: ATTACHMENT_ICON,
                        init: (ctx, me) => this._getLabelForTweet(ctx.id).then(x => me.label = x),
                        exec: async (ctx, me) => {
                            const swarmGatewayUrl = await Core.storage.get('swarmGatewayUrl');
                            const contractAddress = await Core.storage.get('contractAddress');
                            const overlay = await Core.overlay({ name: 'swarm-hackathon-attachments-overlay', title: 'Swarm Attachments' });

                            overlay.sendAndListen('info', { ...ctx, swarmGatewayUrl, contractAddress }, {
                                'get_account': async () => {
                                    const wallet = await Core.wallet({ type: 'ethereum', network: 'rinkeby' });
                                    if (!await wallet.isConnected()) await wallet.connect();
                                    wallet.sendAndListen('eth_accounts', [], {
                                        result: (op, { type, data }) => overlay.send('current_account', data[0])
                                    });
                                },
                                'attach': (_, { message }) => {
                                    this._contract.add(message.key, message.reference).then(tx => tx.wait()).then(() => {
                                        overlay.send('attached');
                                        this._getLabelForTweet(ctx.id).then(x => me.label = x);
                                    })
                                }
                            });
                        }
                    }
                })
            ]
        });
    }

    private async _getAttachments(key: string) {
        return this._contract.getByKey(key);
    }

    private async _getLabelForTweet(videoId: string) {
        const hash = await digestMessage(videoId);
        const attachments = await this._getAttachments('0x' + hash);
        return (attachments.length > 0) ? attachments.length.toString() : undefined;
    }
}