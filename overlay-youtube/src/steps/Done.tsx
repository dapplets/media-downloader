import React from "react";
import { Button, Divider, Progress } from "semantic-ui-react";
import { bridge, Info } from "../bridge";
import { Steps } from "../components/Steps";
import { VideoCard } from "../components/VideoCard";
import { UploadingStep } from "../types";

interface Props {
    info: Info;
    onContinueClick: () => void;
}

export const Done: React.FC<Props> = ({ info, onContinueClick }: Props) => {
    return (
        <div>
            <Divider horizontal>You're uploading the video</Divider>
            <VideoCard info={info} />

            <Steps activeStep={UploadingStep.DONE} />

            <Progress percent={100} progress indicating />

            <div style={{ marginTop: "15px" }}>
                <Button primary onClick={onContinueClick}>
                    Done
                </Button>
            </div>
        </div>
    );
};
