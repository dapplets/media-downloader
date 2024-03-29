import React, { useState } from "react";
import { Button, Divider, Progress } from "semantic-ui-react";
import { bridge, Info } from "../bridge";
import { Steps } from "../components/Steps";
import { VideoCard } from "../components/VideoCard";
import { UploadingStep } from "../types";

interface Props {
    info: Info;
    swarmReference: string;
    videoId: string;
    onContinueClick: () => void;
}

export const RegisterLink: React.FC<Props> = ({
    info,
    swarmReference,
    videoId,
    onContinueClick,
}: Props) => {
    const [isLoading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0.9);
    const [error, setError] = useState<string | null>(null);

    const fileUrl = new URL(`/bzz/${swarmReference}`, info.swarmGatewayUrl).href;

    async function handleRegisterButtonClick() {
        try {
            setError(null);
            setLoading(true);
            setProgress(0.95);
            await bridge.addAttachment(videoId, swarmReference);
            setProgress(1);
            onContinueClick();
        } catch (e: any) {
            console.error(e);
            setError((typeof e === 'string') ? e : (e.reason ?? e.message ?? 'An error has occurred. Please, try again.'));
            setProgress(0.9);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div>
            <Divider horizontal>You're uploading the video</Divider>
            <VideoCard info={info} />

            <Steps activeStep={UploadingStep.REGISTER_LINK} />

            <Progress
                style={{ margin: '2em 0' }}
                percent={Math.floor(progress * 100)}
                progress
                color="green"
                label={!isLoading ? "Waiting action..." : undefined}
            />

            <div style={{ marginTop: "15px" }}>
                <p>The video is uploaded to the Swarm.</p>
                <p style={{ overflowWrap: 'break-word' }}>Swarm link: {fileUrl}</p>
            </div>

            {error && (
                <div style={{ marginTop: "15px", color: "#9f3a38" }}>
                    <p>{error}</p>
                </div>
            )}

            <div style={{ marginTop: "15px" }}>
                <Button
                    primary
                    onClick={handleRegisterButtonClick}
                    disabled={isLoading}
                    loading={isLoading}
                >
                    Register
                </Button>
            </div>
        </div>
    );
};
