export type CalculationPriceResult = {
    depth: number;
    chunks: number;
    pricePerBlock: string;
    blockTime: number;
    postageStampChunks: number;
    initialBalancePerChunk: string;
    totalAmount: string;
};

export enum UploadingStep {
    SELECT_VIDEO,
    APPROVE_TOKEN,
    BUY_BATCH,
    WAIT_BATCH,
    UPLOAD_VIDEO,
    REGISTER_LINK,
    DONE,
};