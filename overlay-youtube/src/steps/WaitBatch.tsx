import React, { useCallback, useEffect, useState } from "react";
import { Button, Divider, Progress } from "semantic-ui-react";
import { bridge, Info } from "../bridge";
import { Steps } from "../components/Steps";
import { VideoCard } from "../components/VideoCard";
import { UploadingStep } from "../types";
import { convertTime } from "../utils";

const WAITING_TIME_GOERLI = 5 * 60 * 1000; // 5 minutes (20 blocks * 15 seconds)
const WAITING_TIME_XDAI = 110 * 1000; // 110 seconds (20 blocks * 5.5 seconds)

interface Props {
    swarmPostageStampId: string;
    info: Info;
    onContinueClick: () => void;
}

export const WaitBatch: React.FC<Props> = ({
    info,
    swarmPostageStampId,
    onContinueClick,
}: Props) => {
    const WAITING_TIME =
        info.network === "goerli" ? WAITING_TIME_GOERLI : WAITING_TIME_XDAI;
    const [progress, setProgress] = useState(0.2); // max = 0.7
    const [remainingTime, setRemainingTime] = useState(WAITING_TIME);

    useEffect(function () {
        const updateInterval = 1000; // 1 sec
        let time = remainingTime;

        const id = setInterval(() => {
            time -= updateInterval;
            const percents = 1 - time / WAITING_TIME;
            setRemainingTime(time);
            setProgress(0.2 + percents * 0.5);
            if (time <= 0) {
                clearInterval(id);
                onContinueClick();
            }
        }, updateInterval);

        return () => clearInterval(id);
    }, []);

    return (
        <div>
            <Divider horizontal>You're uploading the video</Divider>
            <VideoCard info={info} />

            <Steps activeStep={UploadingStep.WAIT_BATCH} />

            <Progress
                style={{ margin: "2em 0" }}
                percent={Math.floor(progress * 100)}
                progress
                color="green"
            />

            <div style={{ marginTop: "15px" }}>
                <p>Time remaining: {convertTime(remainingTime / 1000)}</p>
                <p>The batch of postage stamps is created.</p>
                <p style={{ overflowWrap: "break-word" }}>
                    Batch ID: {swarmPostageStampId}
                </p>
            </div>
        </div>
    );
};
