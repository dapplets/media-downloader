import abi from './abi';
import * as ethers from "ethers";
import { Bee } from "@ethersphere/bee-js";

export type Attachment = {
    mimetype: string;
    filename: string;
    reference: string;
}

export class AttachmentService {
    private _contract;
    private _bee;

    constructor(_contractAddress: string, private _swarmGatewayAddress: string) {
        const signer = new ethers.providers.StaticJsonRpcProvider('https://rinkeby.infura.io/v3/e2b99cd257a5468d94749fa32f75fc3c', 4);
        this._contract = new ethers.Contract(_contractAddress, abi, signer);
        this._bee = new Bee(_swarmGatewayAddress);
    }

    public async getAttachments(key: string): Promise<Attachment[]> {
        if (key.indexOf('0x') === -1) key = '0x' + key;
        const references: string[] = await this._contract.getByKey(key);
        const manifests = await Promise.all(references.map(ref => this._fetchSwarmManifest(ref).then(x => ({ ...x, reference: ref.replace('0x', '') }))));
        return manifests.filter(x => x !== null) as any;
    }

    public async getMyFiles(account: string): Promise<Attachment[]> {
        const references: string[] = await this._contract.getByAccount(account);
        const manifests = await Promise.all(references.map(ref => this._fetchSwarmManifest(ref).then(x => ({ ...x, reference: ref.replace('0x', '') }))));
        return manifests.filter(x => x !== null) as any;
    }

    private async _fetchSwarmManifest(ref: string): Promise<{ mimetype: string, filename: string } | null> {
        try {
            if (ref.indexOf('0x') !== -1) ref = ref.replace('0x', '');
            const arr = await this._bee.downloadData(ref);
            const manifestRef = this._buf2hex(arr.slice(32, 64));
            const arr2 = await this._bee.downloadData(manifestRef);
            const json = new TextDecoder("utf-8").decode(arr2);
            const manifest = JSON.parse(json);
            return manifest;
        } catch (_) {
            return null;
        }
    }

    private _buf2hex(buffer: ArrayBuffer) {
        return Array.prototype.map.call(new Uint8Array(buffer), x => ('00' + x.toString(16)).slice(-2)).join('');
    }
}