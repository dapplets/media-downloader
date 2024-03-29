import React, { ProfilerOnRenderCallback, useState } from "react";
import { Bridge, bridge, Info } from "../bridge";
import {
    Button,
    Container,
    Divider,
    Dropdown,
    DropdownProps,
    Form,
    Header,
    Icon,
    Item,
    Loader,
    Message,
    Progress,
    Segment,
} from "semantic-ui-react";
import { AttachmentService, Attachment } from "../services/attachment";
import { digestMessage } from "../utils";
import { Attachments } from "../components/Attachments";
import mime from "mime";
import * as ethers from "ethers";
import { CalculationPriceResult } from "../types";
import { VideoCard } from "../components/VideoCard";

interface Props {
    bridge: Bridge;
    info: Info;
    selectedUrl: string | null;
    formatOptions: {
        key: string;
        text: string;
        value: string;
    }[];
    uploading: boolean;
    swarmReference: string | null;
    videoId: string | null;
    error: string | null;
    price: CalculationPriceResult | null;
    storageDays: string;
    filesize: number | null;
    isPriceLoading: boolean;
    onContinueClick: () => void;
    onQualityChange: (value: string) => void;
    onStorageDaysChange: (value: string) => void;
}

export const SelectVideo: React.FC<Props> = ({
    bridge,
    info,
    selectedUrl,
    formatOptions,
    uploading,
    swarmReference,
    videoId,
    error,
    price,
    filesize,
    storageDays,
    isPriceLoading,
    onContinueClick,
    onQualityChange,
    onStorageDaysChange,
}: Props) => {
    const [isBatchDetailsVisible, setBatchDetailsVisible] = useState(false);

    const format = info?.videoInfo.formats.find(
        (x: any) => x.url === selectedUrl
    );

    return (
        <>
            {swarmReference ? (
                <Message success style={{ wordBreak: "break-word" }}>
                    <Message.Header>Uploaded</Message.Header>
                    <p>
                        The video is uploaded and will be available <b>later</b>{" "}
                        by this URL:{" "}
                        <a
                            target="_blank"
                            href={`${
                                info!.swarmGatewayUrl
                            }/bzz/${swarmReference!}`}
                        >
                            {info!.swarmGatewayUrl}/bzz/{swarmReference}
                        </a>
                    </p>
                </Message>
            ) : null}

            {error ? (
                <Message error style={{ wordBreak: "break-word" }}>
                    <Message.Header>Error</Message.Header>
                    <p>{error}</p>
                </Message>
            ) : null}

            {videoId && info ? (
                <>
                    <Attachments
                        bridge={bridge}
                        videoId={videoId}
                        swarmGateway={info.swarmGatewayUrl}
                        contractAddress={info.contractAddress}
                    />
                </>
            ) : null}

            <Divider horizontal>You're uploading the video</Divider>
            <VideoCard info={info} />

            <Form>
                <Form.Group>
                    <Form.Select
                        label="Quality"
                        selection
                        options={formatOptions}
                        onChange={(_, { value }) =>
                            onQualityChange(value as string)
                        }
                        value={selectedUrl as any as string}
                        disabled={uploading}
                    />
                    <Form.Input
                        type="number"
                        label="Storage time, days"
                        onChange={(_, { value }) =>
                            onStorageDaysChange(value as string)
                        }
                        value={storageDays}
                        disabled={uploading}
                    />
                </Form.Group>

                {!isPriceLoading ? (
                    <>
                        {price && filesize && (
                            <div style={{ marginTop: "15px" }}>
                                <div>You will pay</div>

                                <Header
                                    size="large"
                                    style={{ margin: "5px 0" }}
                                >
                                    {ethers.utils.formatUnits(
                                        price.totalAmount,
                                        16
                                    )}{" "}
                                    BZZ
                                </Header>

                                <div>
                                    for {(filesize / 1024 / 1024).toFixed(2)} MB
                                </div>
                                <div>
                                    until{" "}
                                    {new Date(
                                        Date.now() +
                                            Number(storageDays) *
                                                24 *
                                                60 *
                                                60 *
                                                1000
                                    ).toLocaleDateString()}
                                </div>

                                {isBatchDetailsVisible && price && (
                                    <>
                                        <div>Chunks: {price.chunks}</div>
                                        <div>Depth: {price.depth}</div>
                                        <div>
                                            TTL:{" "}
                                            {Number(storageDays) * 24 * 60 * 60}
                                        </div>
                                        <div>
                                            Initial balance per chunk:{" "}
                                            {price.initialBalancePerChunk?.toString()}
                                        </div>
                                    </>
                                )}

                                {!isBatchDetailsVisible ? (
                                    <div>
                                        <a
                                            style={{ cursor: "pointer" }}
                                            onClick={() =>
                                                setBatchDetailsVisible(true)
                                            }
                                        >
                                            More details...
                                        </a>
                                    </div>
                                ) : (
                                    <div>
                                        <a
                                            style={{ cursor: "pointer" }}
                                            onClick={() =>
                                                setBatchDetailsVisible(false)
                                            }
                                        >
                                            Less details...
                                        </a>
                                    </div>
                                )}
                            </div>
                        )}

                        {filesize && !price?.isBalanceEnough && (
                            <p>
                                <Icon name="warning sign" />
                                You don't have enough BZZ tokens. Top up your
                                account to continue.
                            </p>
                        )}

                        {!price && !filesize && (
                            <p>
                                <Icon name="warning sign" />
                                Video is unavailable for downloading.
                            </p>
                        )}
                    </>
                ) : (
                    <p>Price calculation...</p>
                )}

                <div style={{ marginTop: "15px" }}>
                    {!swarmReference && !uploading ? (
                        <Button
                            primary
                            onClick={onContinueClick}
                            disabled={!price?.isBalanceEnough || isPriceLoading}
                            // loading={uploading}
                        >
                            Continue
                        </Button>
                    ) : null}
                </div>
            </Form>
        </>
    );
};
