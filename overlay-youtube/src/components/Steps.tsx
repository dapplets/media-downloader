import React from "react";
import { Button } from "semantic-ui-react";
import { UploadingStep } from "../types";

const STEPS = [
    {
        number: 1,
        title: "Approve BZZ",
        description: "Allow the smart contract to spend your BZZ tokens",
    },
    {
        number: 2,
        title: "Buy postage stamps",
        description:
            "To keep your data alive you need to attach some amount of postage stamps",
    },
    {
        number: 3,
        title: "Wait a few minutes",
        description:
            "Once your batch has been purchased, it will take a few minutes for other Bee nodes in the Swarm to catch up and register your batch. Allow some time for your batch to propagate in the network before proceeding to the next step. Do not close the window. Otherwise, you will have to buy postage stamps again.",
    },
    {
        number: 4,
        title: "Upload video",
        description:
            "The video you selected will be uploaded to Swarm and becomes publicly available. After upload, you'll receive a swarm reference (hash). Please keep it safe,  you will need it to retrieve the file later.",
    },
    {
        number: 5,
        title: "Register Swarm reference",
        description:
            "To make the uploaded file available in YouTube you need to link them. The Ethereum smart-contract stores these links.",
    },
];

interface Props {
    activeStep: UploadingStep;
    isHalf?: boolean;
}

export const Steps: React.FC<Props> = ({ activeStep, isHalf }: Props) => {
    return (
        <div className="steps-container">
            {STEPS.map((x) => (
                <div
                    key={x.number}
                    className={
                        x.number < activeStep
                            ? "step done"
                            : activeStep === x.number
                            ? isHalf === true
                                ? "step half-active"
                                : "step active"
                            : "step inactive"
                    }
                >
                    <div className="step-circle">{x.number}</div>
                    <div>
                        <div className="step-title">{x.title}</div>
                        <div className="step-description">{x.description}</div>
                    </div>
                </div>
            ))}
        </div>
    );
};
