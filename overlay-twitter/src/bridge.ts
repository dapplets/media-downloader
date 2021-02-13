import AbstractBridge from '@dapplets/dapplet-overlay-bridge';

export type Info = {
    id: string;
    text: string;
    authorFullname: string;
    authorUsername: string;
    authorImg: string;
    swarmGatewayUrl: string;
    contractAddress: string;
    account: string;
}

class Bridge extends AbstractBridge {
    _subId = 0;

    onInfo(callback: (info: Info) => void) {
        this.subscribe('info', (data: Info) => {
            const id = (++this._subId).toString();
            setTimeout(() => callback(data), 0);
            return id;
        });
    }

    refreshDapplet() {
        this.publish(this._subId.toString(), {
            type: 'refresh_dapplet',
            message: null
        });
    }

    attach(key: string, reference: string) {
        return this.call('attach', { key, reference }, 'attached');
    }

    async getAccount(): Promise<string> {
        return this.call('get_account', null, 'current_account');
    }

    public async call(method: string, args: any, callbackEvent: string): Promise<any> {
        return new Promise((res, rej) => {
            this.publish(this._subId.toString(), {
                type: method,
                message: args
            });
            this.subscribe(callbackEvent, (result: any) => {
                this.unsubscribe(callbackEvent);
                res(result);
                // ToDo: add reject call
            });
        });
    }
}

const bridge = new Bridge();

export { bridge };