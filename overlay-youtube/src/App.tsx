import React, { ProfilerOnRenderCallback } from "react";
import "./App.css";
import { bridge, Info } from "./bridge";
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
import { AttachmentService, Attachment } from "./services/attachment";
import { digestMessage, isStreamingSupported } from "./utils";
import { Attachments } from "./components/Attachments";

import * as ethers from "ethers";
import { CalculationPriceResult } from "./types";
import { SelectVideo } from "./steps/SelectVideo";
import { ApproveToken } from "./steps/ApproveToken";
import { BuyBatch } from "./steps/BuyBatch";
import { WaitBatch } from "./steps/WaitBatch";
import { UploadVideo } from "./steps/UploadVideo";
import { RegisterLink } from "./steps/RegisterLink";
import { Done } from "./steps/Done";
import { UploadingStep } from "./types";

interface Props {}

interface State {
    info: Info | null;
    selectedUrl: string | null;
    formatOptions: {
        key: string;
        text: string;
        value: string;
    }[];
    uploading: boolean;
    swarmReference: string | null;
    hash: string | null;
    error: string | null;
    price: CalculationPriceResult | null;
    storageDays: string;
    swarmPostageStampId: string;
    isBatchDetailsVisible: boolean;
    step: UploadingStep;
    filesize: number | null;
    isPriceLoading: boolean;
}

class App extends React.Component<Props, State> {
    constructor(p: Props) {
        super(p);
        this.state = {
            info: null,
            selectedUrl: null,
            formatOptions: [],
            uploading: false,
            swarmReference: null,
            hash: null,
            error: null,
            price: null,
            storageDays: "365",
            swarmPostageStampId: "",
            isBatchDetailsVisible: false,
            step: UploadingStep.SELECT_VIDEO,
            filesize: null,
            isPriceLoading: false
        };
    }

    componentDidMount() {
        bridge.onInfo(async (info) => {
            const hash = await digestMessage(
                info.videoInfo.videoDetails.videoId
            );

            const formatOptions = info.videoInfo.formats
                .filter((x: any) => x.hasAudio && x.hasVideo)
                .map((x: any, i: number) => ({
                    key: x.url,
                    text: `${x.qualityLabel}`,
                    value: x.url,
                }));

            const selectedUrl = formatOptions[0]?.key;
            this.setState({ info, formatOptions, selectedUrl, hash });

            this._handleQualityChange(selectedUrl);
        });
    }

    _handleQualityChange = async (value: string) => {
        this.setState(
            {
                selectedUrl: value as string,
                swarmReference: null,
            },
            () => this._updatePrice()
        );
    };

    _handleStorageDaysChange = (storageDays: string) => {
        this.setState({ storageDays }, () => this._updatePrice());
    };

    async _updatePrice() {
        try {
            this.setState({ isPriceLoading: true });

            const value = this.state.selectedUrl;
            if (!value) return;

            const ttl = Number(this.state.storageDays) * 24 * 60 * 60; // ttl in seconds
            const filesize = await bridge.fetchFilesize(value);
            if (!filesize) {
                this.setState({ price: null, filesize });
            } else {
                const price = await bridge.calcPrice(ttl, filesize);
                this.setState({ price, filesize });
            }
        } catch (_) {

        } finally {
            this.setState({ isPriceLoading: false });
        }
    }

    render() {
        const s = this.state;
        const {
            step,
            info,
            selectedUrl,
            formatOptions,
            uploading,
            swarmReference,
            hash,
            error,
            price,
            storageDays,
            swarmPostageStampId,
            filesize,
            isPriceLoading
        } = this.state;

        const format = this.state.info?.videoInfo.formats.find(
            (x: any) => x.url === s.selectedUrl
        );

        if (!info)
            return (
                <div style={{ paddingTop: "calc(50vh - 31px)" }}>
                    <Loader active inline="centered">
                        Loading Video Info
                    </Loader>
                </div>
            );

        switch (step) {
            case UploadingStep.SELECT_VIDEO:
                return (
                    <Container style={{ paddingTop: "15px" }}>
                        <SelectVideo
                            info={info}
                            selectedUrl={selectedUrl}
                            formatOptions={formatOptions}
                            uploading={uploading}
                            swarmReference={swarmReference}
                            hash={hash}
                            error={error}
                            price={price}
                            storageDays={storageDays}
                            filesize={filesize}
                            isPriceLoading={isPriceLoading}
                            onContinueClick={() =>
                                this.setState({
                                    step: UploadingStep.APPROVE_TOKEN,
                                })
                            }
                            onQualityChange={this._handleQualityChange}
                            onStorageDaysChange={this._handleStorageDaysChange}
                        />
                    </Container>
                );

            case UploadingStep.APPROVE_TOKEN:
                return (
                    <Container style={{ paddingTop: "15px" }}>
                        <ApproveToken
                            totalAmount={price!.totalAmount}
                            info={info}
                            onContinueClick={() =>
                                this.setState({ step: UploadingStep.BUY_BATCH })
                            }
                        />
                    </Container>
                );

            case UploadingStep.BUY_BATCH:
                return (
                    <Container style={{ paddingTop: "15px" }}>
                        <BuyBatch
                            info={info}
                            price={price!}
                            onContinueClick={(swarmPostageStampId) =>
                                this.setState({
                                    step: UploadingStep.WAIT_BATCH,
                                    swarmPostageStampId
                                })
                            }
                        />
                    </Container>
                );

            case UploadingStep.WAIT_BATCH:
                return (
                    <Container style={{ paddingTop: "15px" }}>
                        <WaitBatch
                            info={info}
                            swarmPostageStampId={swarmPostageStampId}
                            onContinueClick={() =>
                                this.setState({
                                    step: UploadingStep.UPLOAD_VIDEO,
                                })
                            }
                        />
                    </Container>
                );

            case UploadingStep.UPLOAD_VIDEO:
                return (
                    <Container style={{ paddingTop: "15px" }}>
                        <UploadVideo
                            info={info}
                            selectedUrl={selectedUrl}
                            formatOptions={formatOptions}
                            swarmPostageStampId={swarmPostageStampId}
                            onContinueClick={({ reference }) =>
                                this.setState({
                                    step: UploadingStep.REGISTER_LINK,
                                    swarmReference: reference
                                })
                            }
                        />
                    </Container>
                );

            case UploadingStep.REGISTER_LINK:
                return (
                    <Container style={{ paddingTop: "15px" }}>
                        <RegisterLink
                            swarmReference={swarmReference!}
                            videoId={info.videoInfo.videoDetails.videoId!}
                            info={info}
                            onContinueClick={() =>
                                this.setState({ step: UploadingStep.DONE })
                            }
                        />
                    </Container>
                );

            case UploadingStep.DONE:
                return (
                    <Container style={{ paddingTop: "15px" }}>
                        <Done
                            info={info}
                            onContinueClick={() =>
                                this.setState({
                                    step: UploadingStep.SELECT_VIDEO,
                                })
                            }
                        />
                    </Container>
                );

            default:
                return null;
        }

        /* {uploading ? (
        <Progress
            percent={progress}
            label={status}
            progress
            indicating
        />
    ) : null} */
    }
}

export default App;
