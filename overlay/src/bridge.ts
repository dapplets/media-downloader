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

export interface Info {
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

export interface VideoInfo {
    info: Info;
    formats: Format[];
    swarmGatewayUrl: string;
}

class Bridge extends AbstractBridge {
    _subId = 0;

    onInfo(callback: (info: VideoInfo) => void) {
        this.subscribe('info', (data: VideoInfo) => {
            callback(data);
            return (++this._subId).toString();
        });
    }

    download(url: string) {
        return this.call('download', url, 'downloaded');
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