import React, { useEffect, useState } from "react";
import { Button, Divider, Progress } from "semantic-ui-react";
import { bridge, Info } from "../bridge";
import { Steps } from "../components/Steps";
import { VideoCard } from "../components/VideoCard";
import { UploadingStep } from "../types";
import mime from "mime";

interface Props {
    info: Info;
    selectedUrl: string | null;
    formatOptions: {
        key: string;
        text: string;
        value: string;
    }[];
    swarmPostageStampId: string;
    onContinueClick: (data: { reference: string; tag: string }) => void;
}

export const UploadVideo: React.FC<Props> = ({
    info,
    selectedUrl,
    formatOptions,
    swarmPostageStampId,
    onContinueClick,
}: Props) => {
    const [isLoading, setLoading] = useState(false);
    const [downloadStatus, setDownloadStatus] = useState(0);
    const [uploadStatus, setUploadStatus] = useState(0);
    const [progress, setProgress] = useState(0.7);

    useEffect(() => {
        const { unsubscribe: unsubscribeDownload } =
            bridge.onDownloadStatus(setDownloadStatus);

        const { unsubscribe: unsubscribeUpload } =
            bridge.onUploadStatus(setUploadStatus);

        return () => {
            unsubscribeDownload();
            unsubscribeUpload();
        };
    }, []);

    useEffect(() => {
        const total = (downloadStatus + uploadStatus) / 2;
        setProgress(0.7 + total * 0.2); // max 0.9
    }, [downloadStatus, uploadStatus]);

    async function hanldeUploadButtonClick() {
        try {
            setLoading(true);

            const qualityName = formatOptions.find(
                (x) => x.key === selectedUrl
            )!.text;

            const mimeType = info!.videoInfo.formats.find(
                (x: any) => x.url === selectedUrl
            )!.mimeType;

            const url: string = selectedUrl as any;
            const extension = mime.getExtension(mimeType);
            const filename = `${info.videoInfo.videoDetails.author.name} - ${info.videoInfo.videoDetails.title} (${qualityName}).${extension}`;

            const { reference, tag } = await bridge.download(
                url,
                filename,
                swarmPostageStampId
            );

            onContinueClick({ reference, tag });
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div>
            <Divider horizontal>You're uploading the video</Divider>
            <VideoCard info={info} />

            <Steps activeStep={UploadingStep.UPLOAD_VIDEO} />
            
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
                    onClick={hanldeUploadButtonClick}
                    disabled={isLoading}
                    loading={isLoading}
                >
                    Upload
                </Button>
            </div>
        </div>
    );
};