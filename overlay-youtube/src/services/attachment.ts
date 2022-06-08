import abi from "./abi";
import * as ethers from "ethers";
import { Bee } from "@ethersphere/bee-js";
import mime from "mime";
import { Bridge } from "../bridge";

function extractJSON(str: string) {
    let firstOpen: any, firstClose: any, candidate: any;
    firstOpen = str.indexOf("{", firstOpen + 1);
    do {
        firstClose = str.lastIndexOf("}");
        if (firstClose <= firstOpen) {
            return null;
        }
        do {
            candidate = str.substring(firstOpen, firstClose + 1);
            try {
                let res = JSON.parse(candidate);
                return res;
            } catch (_) {}
            firstClose = str.substr(0, firstClose).lastIndexOf("}");
        } while (firstClose > firstOpen);
        firstOpen = str.indexOf("{", firstOpen + 1);
    } while (firstOpen != -1);

    return null;
}

export type Attachment = {
    mimetype: string;
    filename: string;
    reference: string;
    isAvailable: boolean;
};

export class AttachmentService {
    private _bee;

    constructor(private _swarmGatewayAddress: string, private _bridge: Bridge) {
        this._bee = new Bee(this._swarmGatewayAddress);
    }

    public async getAttachments(videoId: string): Promise<Attachment[]> {
        const references: string[] = await this._bridge.getAttachments(videoId);
        const manifests = await Promise.all(
            references.map((ref) =>
                this._fetchSwarmManifest(ref).then((x) => ({
                    ...x,
                    reference: ref.replace("0x", ""),
                    isAvailable: !!x,
                }))
            )
        );
        return manifests.filter((x) => !!x) as any;
    }

    private async _fetchSwarmManifest(
        ref: string
    ): Promise<{ mimetype: string; filename: string } | null> {
        try {
            if (ref.indexOf("0x") !== -1) ref = ref.replace("0x", "");
            const arr = await this._bee.downloadData(ref);
            const data = new TextDecoder("utf-8").decode(arr);
            const manifest = extractJSON(data);
            if (!manifest || !manifest["website-index-document"]) return null;
            return {
                filename: manifest["website-index-document"],
                mimetype:
                    mime.getType(manifest["website-index-document"]) ?? "",
            };
        } catch (_) {
            return null;
        }
    }
}
