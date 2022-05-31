export async function digestMessage(message: string) {
    const msgUint8 = new TextEncoder().encode(message); // encode as (utf-8) Uint8Array
    const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8); // hash the message
    const hashArray = Array.from(new Uint8Array(hashBuffer)); // convert buffer to byte array
    const hashHex = hashArray
        .map((b) => b.toString(16).padStart(2, "0"))
        .join(""); // convert bytes to hex string
    return hashHex;
}

export function isStreamingSupported() {
    return !new Request("", {
        body: new ReadableStream(),
        method: "POST",
    }).headers.has("Content-Type");
}

export function convertTime(seconds: number) {
    var hours = Math.floor(seconds / 3600);
    var minutes = Math.floor((seconds - hours * 3600) / 60);
    var seconds = seconds - hours * 3600 - minutes * 60;
    if (!!hours) {
        if (!!minutes) {
            return `${hours}h ${minutes}m ${seconds}s`;
        } else {
            return `${hours}h ${seconds}s`;
        }
    }
    if (!!minutes) {
        return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
}
