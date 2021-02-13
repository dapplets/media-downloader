import AbstractBridge from '@dapplets/dapplet-overlay-bridge';

export interface Thumbnail {
    url: string;
    width: number;
    height: number;
}

export interface Author {
    id: string;
    vanity?: any;
    title: string;
}

export interface VideoInfo {
    id: string;
    type: string;
    title: string;
    description: string;
    thumbnails: Thumbnail[];
    date: string;
    duration: number;
    views: number;
    author: Author;
}

export interface Stats {
    width?: number;
    height?: number;
    bitrate: number;
    samplerate?: number;
    channels?: number;
    size?: number;
    duration: number;
    fps?: number;
}

export interface Format {
    itag: number;
    url: string;
    mime: string;
    codecs: string[];
    quality: string;
    stats: Stats;
}

export interface Info {
    info: VideoInfo;
    formats: Format[];
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
        return this.call('download', { url, filename }, 'downloaded');
    }

    onDownloadStatus(callback: (value: number) => void) {
        this.subscribe('download_status', callback);
    }

    onUploadStatus(callback: (value: number) => void) {
        this.subscribe('upload_status', callback);
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