import React from 'react';
import { List } from 'semantic-ui-react';

interface Props {
    attachments: {
        reference: string;
        mimetype: string;
        filename: string;
    }[];
    swarmGateway: string;
}

interface State {

}

export class Attachments extends React.Component<Props, State> {
    render() {
        const p = this.props;
        return <List divided relaxed>
            {p.attachments.map((x, i) =>
                <List.Item key={i}>
                    <List.Icon name='file' verticalAlign='middle' />
                    <List.Content>
                        <List.Header as='a' href={p.swarmGateway + '/files/' + x.reference} target="_blank">{x.filename}</List.Header>
                        <List.Description as='a'>{x.mimetype}</List.Description>
                    </List.Content>
                </List.Item>
            )}
        </List>
    }
}