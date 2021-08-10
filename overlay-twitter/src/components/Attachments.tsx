import React from 'react';
import { Button, List } from 'semantic-ui-react';

interface Props {
    attachments: {
        reference: string;
        mimetype: string;
        filename: string;
        isAttached?: boolean;
    }[];
    swarmGateway: string;
    onAttachmentClick?: (x: {
        reference: string;
        mimetype: string;
        filename: string;
        isAttached?: boolean;
    }) => void;
}

interface State {

}

export class Attachments extends React.Component<Props, State> {
    render() {
        const p = this.props;
        return <List divided relaxed>
            {p.attachments.map((x, i) =>
                <List.Item key={i} style={{ display: 'flex'}}>
                    <List.Icon name='file' verticalAlign='middle' />
                    <List.Content style={{
                        flex: 'auto',
                        width: 'initial',
                        overflow: 'hidden',
                        wordBreak: 'break-word'
                    }}>
                        <List.Header as='a' href={p.swarmGateway + '/bzz/' + x.reference} target="_blank">{x.filename}</List.Header>
                        {/* <List.Description as='a'>{x.mimetype}</List.Description> */}
                    </List.Content>
                    {(p.onAttachmentClick) ?
                        <List.Content floated='right'>
                            {(!x.isAttached) ? <Button onClick={() => this.props.onAttachmentClick!(x)}>Attach</Button> : <Button disabled>Attached</Button>}
                        </List.Content> : null}
                </List.Item>
            )}
        </List>
    }
}