import React, { useState } from "react";
import { Button, Divider, Progress } from "semantic-ui-react";
import { bridge, Info } from "../bridge";
import { Steps } from "../components/Steps";
import { UploadingStep } from "../types";
import { VideoCard } from "../components/VideoCard";
import { ethers } from "ethers";

interface Props {
    info: Info;
    onContinueClick: () => void;
    totalAmount: string;
}

export const ApproveToken: React.FC<Props> = ({
    info,
    onContinueClick,
    totalAmount: totalAmountString,
}: Props) => {
    const [isLoading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);

    async function handleApproveButtonClick() {
        try {
            setError(null);
            setLoading(true);
            setProgress(0.05);

            const allowanceString = await bridge.getAllowance();

            const allowance = ethers.BigNumber.from(allowanceString);
            const totalAmount = ethers.BigNumber.from(totalAmountString);

            if (allowance.gte(totalAmount)) {
                onContinueClick();
                return;
            }

            const needToAllow = totalAmount.sub(allowance);

            await bridge.approve(needToAllow.toString());

            setProgress(0.1);
            onContinueClick();
        } catch (e: any) {
            console.error(e);
            setError((typeof e === 'string') ? e : (e.reason ?? e.message ?? 'An error has occurred. Please, try again.'));
            setProgress(0);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div>
            <Divider horizontal>You're uploading the video</Divider>
            <VideoCard info={info} />

            <Steps
                activeStep={UploadingStep.APPROVE_TOKEN}
                isHalf={isLoading}
            />

            {progress !== 0 ? (
                <Progress
                    style={{ margin: "2em 0" }}
                    percent={Math.floor(progress * 100)}
                    progress
                    color="green"
                    label={!isLoading ? "Waiting action..." : undefined}
                />
            ) : null}

            {error && (
                <div style={{ marginTop: "15px", color: "#9f3a38" }}>
                    <p>{error}</p>
                </div>
            )}

            <div style={{ marginTop: "15px" }}>
                <Button
                    primary
                    onClick={handleApproveButtonClick}
                    disabled={isLoading}
                    loading={isLoading}
                >
                    Approve
                </Button>
            </div>
        </div>
    );
};
