import React from "react";
import { Item, Segment } from "semantic-ui-react";
import { Info } from "../bridge";

interface Props {
    info: Info;
}

export const VideoCard: React.FC<Props> = ({ info }: Props) => {
    return (
        <Segment>
            <Item.Group unstackable>
                <Item>
                    <Item.Image
                        size="tiny"
                        src={info.videoInfo.videoDetails.thumbnails[0].url}
                    />

                    <Item.Content>
                        <Item.Header className="item-header">
                            {info.videoInfo.videoDetails.title}
                        </Item.Header>
                        <Item.Meta>
                            {info.videoInfo.videoDetails.author.name}
                        </Item.Meta>
                        {/* <Item.Description>{info.info.description}</Item.Description> */}
                        <Item.Extra>
                            {info.videoInfo.videoDetails.viewCount} views ·{" "}
                            {info.videoInfo.videoDetails.uploadDate}
                        </Item.Extra>
                    </Item.Content>
                </Item>
            </Item.Group>
        </Segment>
    );
};
