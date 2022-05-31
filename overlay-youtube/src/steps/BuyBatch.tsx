import React, { useState } from "react";
import { Button, Divider, Progress } from "semantic-ui-react";
import { Steps } from "../components/Steps";
import { CalculationPriceResult, UploadingStep } from "../types";
import { VideoCard } from "../components/VideoCard";
import { bridge, Info } from "../bridge";

interface Props {
    info: Info;
    price: CalculationPriceResult;
    onContinueClick: (swarmPostageStampId: string) => void;
}

export const BuyBatch: React.FC<Props> = ({
    info,
    price,
    onContinueClick,
}: Props) => {
    const [isLoading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0.1);

    async function handleBuyStampClick() {
        try {
            setLoading(true);
            setProgress(0.15);
            const { initialBalancePerChunk, depth } = price;
            const swarmPostageStampId = await bridge.createBatch(
                initialBalancePerChunk,
                depth
            );
            setProgress(0.2);
            onContinueClick(swarmPostageStampId);
        } catch (e) {
            console.error(e);
            setProgress(0.1);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div>
            <Divider horizontal>You're uploading the video</Divider>
            <VideoCard info={info} />

            <Steps activeStep={UploadingStep.BUY_BATCH} />

            <Progress
                style={{ margin: '2em 0' }}
                percent={Math.floor(progress * 100)}
                progress
                color="green"
                label={!isLoading ? "Waiting action..." : undefined}
            />

            <div style={{ marginTop: "15px" }}>
                <Button
                    primary
                    onClick={handleBuyStampClick}
                    disabled={isLoading}
                    loading={isLoading}
                >
                    Buy
                </Button>
            </div>
        </div>
    );
};
