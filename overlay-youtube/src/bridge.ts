import AbstractBridge from '@dapplets/dapplet-overlay-bridge';

export interface Info {
    videoInfo: any;
    swarmGatewayUrl: string;
    contractAddress: string;
}

class Bridge extends AbstractBridge {
    _subId = 0;

    onInfo(callback: (info: Info) => void) {
        this.subscribe('info', (data: Info) => {
            callback(data);
            return (++this._subId).toString();
        });
    }

    download(url: string, filename: string) {
        return this.call('download', { url, filename }, 'download_done', 'download_error');
    }

    onDownloadStatus(callback: (value: number) => void) {
        this.subscribe('download_status', callback);
    }

    onUploadStatus(callback: (value: number) => void) {
        this.subscribe('upload_status', callback);
    }

    public async call(method: string, args: any, successEvent: string, errorEvent: string): Promise<any> {
        return new Promise((res, rej) => {
            this.publish(this._subId.toString(), {
                type: method,
                message: args
            });
            this.subscribe(successEvent, (result: any) => {
                this.unsubscribe(successEvent);
                this.unsubscribe(errorEvent);
                res(result);
            });
            this.subscribe(errorEvent, (error: any) => {
                this.unsubscribe(successEvent);
                this.unsubscribe(errorEvent);
                rej(error);
            });
        });
    }
}

const bridge = new Bridge();

export { bridge };