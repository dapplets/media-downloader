import abi from './abi';
import * as ethers from "ethers";

export type Attachment = {
    mimetype: string;
    filename: string;
    reference: string;
}

export class AttachmentService {
    private _contract;

    constructor(_contractAddress: string, private _swarmGatewayAddress: string) {
        const signer = ethers.getDefaultProvider('rinkeby');
        this._contract = new ethers.Contract(_contractAddress, abi, signer);
    }

    public async getAttachments(key: string): Promise<Attachment[]> {
        if (key.indexOf('0x') === -1) key = '0x' + key;
        const references: string[] = await this._contract.getByKey(key);
        const manifests = await Promise.all(references.map(ref => this._fetchSwarmManifest(ref).then(x => ({ ...x, reference: ref.replace('0x', '') }))));
        return manifests;
    }

    private async _fetchSwarmManifest(ref: string): Promise<{ mimetype: string, filename: string }> {
        if (ref.indexOf('0x') !== -1) ref = ref.replace('0x', '');
        const resp = await fetch(this._swarmGatewayAddress + '/bytes/' + ref);
        const buf = await resp.arrayBuffer();
        const manifestRef = this._buf2hex(buf.slice(32, 64));
        const resp2 = await fetch(this._swarmGatewayAddress + '/bytes/' + manifestRef);
        const manifest = await resp2.json();
        return manifest;
    }

    private _buf2hex(buffer: ArrayBuffer) {
        return Array.prototype.map.call(new Uint8Array(buffer), x => ('00' + x.toString(16)).slice(-2)).join('');
    }
}