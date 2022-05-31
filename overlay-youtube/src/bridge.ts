import AbstractBridge from '@dapplets/dapplet-overlay-bridge';

export interface Info {
    videoInfo: any;
    swarmGatewayUrl: string;
    contractAddress: string;
}

export class Bridge extends AbstractBridge {
    _subId = 0;

    onInfo(callback: (info: Info) => void) {
        this.subscribe('info', (data: Info) => {
            callback(data);
            return (++this._subId).toString();
        });
    }

    download(url: string, filename: string, swarmPostageStampId: string) {
        return this.call('download', { url, filename, swarmPostageStampId }, 'download_done', 'download_error');
    }

    calcPrice(ttl: number, sizeInBytes: string) {
        return this.call('calcPrice', { ttl, sizeInBytes }, 'calcPrice_done', 'calcPrice_error');
    }

    getAllowance() {
        return this.call('getAllowance', { }, 'getAllowance_done', 'getAllowance_error');
    }

    approve(amount: string) {
        return this.call('approve', { amount }, 'approve_done', 'approve_error');
    }

    createBatch(initialBalancePerChunk: string, depth: number) {
        return this.call('createBatch', { initialBalancePerChunk, depth }, 'createBatch_done', 'createBatch_error');
    }

    addAttachment(videoId: string, reference: string) {
        return this.call('addAttachment', { videoId, reference }, 'addAttachment_done', 'addAttachment_error');
    }

    onDownloadStatus(callback: (value: number) => void) {
        this.subscribe('download_status', callback);
        return {
            unsubscribe: () => {
                this.unsubscribe('download_status');
            }
        }
    }

    onUploadStatus(callback: (value: number) => void) {
        this.subscribe('upload_status', callback);
        return {
            unsubscribe: () => {
                this.unsubscribe('upload_status');
            }
        }
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