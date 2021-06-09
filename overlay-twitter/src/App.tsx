import React from 'react';
import './App.css';
import { Container, List, Button, Divider, Loader, Placeholder } from 'semantic-ui-react';
import { bridge, Info } from './bridge';
import { Attachment, AttachmentService } from './services/attachment';
import { digestMessage } from './utils';
import { Attachments } from './components/Attachments';

interface Props {

}

interface State {
  info: Info | null;
  attachmentsLoading: boolean;
  myFilesLoading: boolean;
  attachments: Attachment[];
  myFiles: Attachment[];
  currentAccount?: string;
  disabled: boolean;
}

class App extends React.Component<Props, State> {

  private _attachmentService?: AttachmentService;

  constructor(p: Props) {
    super(p);
    this.state = {
      info: null,
      attachmentsLoading: true,
      myFilesLoading: true,
      attachments: [],
      myFiles: [],
      currentAccount: undefined,
      disabled: false
    };
  }

  componentDidMount() {
    bridge.onInfo(async (info) => {
      this.setState({ info });

      const currentAccount = await bridge.getAccount();
      this.setState({ currentAccount });

      this._attachmentService = new AttachmentService(info.contractAddress, info.swarmGatewayUrl);

      digestMessage(info.id)
        .then(x => this._attachmentService!.getAttachments(x))
        .then(x => this.setState({ attachments: x, attachmentsLoading: false }));

      this._attachmentService!.getMyFiles(currentAccount)
        .then(x => this.setState({ myFiles: x, myFilesLoading: false }));

    })
  }

  private async _attach(x: { reference: string; mimetype: string; filename: string; }) {
    this.setState({ disabled: true });
    let hash = await digestMessage(this.state.info!.id);
    let reference = x.reference;
    if (hash.indexOf('0x') === -1) hash = '0x' + hash;
    if (reference.indexOf('0x') === -1) reference = '0x' + reference;
    await bridge.attach(hash, reference);
    this.setState({ disabled: false });
  }

  render() {
    const s = this.state;

    const placeholder = <Placeholder>
      <Placeholder.Line />
      <Placeholder.Line />
      <Placeholder.Line />
      <Placeholder.Line />
      <Placeholder.Line />
    </Placeholder>;

    if (!s.info) return null;

    return <Container style={{ paddingTop: '15px' }}>

      <Divider horizontal>Available Attachments</Divider>
      {(!s.attachmentsLoading) ? <div>
        {(s.attachments.length > 0) ? <List divided relaxed>
          {s.attachments.map((x, i) =>
            <List.Item key={i} style={{ display: 'flex' }}>
              <List.Icon name='file' verticalAlign='middle' />
              <List.Content style={{
                flex: 'auto',
                width: 'initial',
                overflow: 'hidden',
                wordBreak: 'break-word'
              }}>
                <List.Header as='a' href={s.info!.swarmGatewayUrl + '/files/' + x.reference} target="_blank">{x.filename}</List.Header>
                {/* <List.Description as='a'>{x.mimetype}</List.Description> */}
              </List.Content>
            </List.Item>
          )}
        </List> : <>
              No attachments
        </>}
      </div> : placeholder}

      <Divider horizontal>My Files</Divider>
      {(!s.myFilesLoading) ? <div>
        <List divided relaxed>
          {s.myFiles.map((x, i) =>
            <List.Item key={i} style={{ display: 'flex' }}>
              <List.Icon name='file' verticalAlign='middle' />
              <List.Content style={{
                flex: 'auto',
                width: 'initial',
                overflow: 'hidden',
                wordBreak: 'break-word'
              }}>
                <List.Header as='a' href={s.info!.swarmGatewayUrl + '/files/' + x.reference} target="_blank">{x.filename}</List.Header>
                {/* <List.Description as='a'>{x.mimetype}</List.Description> */}
              </List.Content>
              <List.Content floated='right'>
                {(!(s.attachments.find(a => a.reference === x.reference))) ? <Button disabled={s.disabled} onClick={() => this._attach(x)}>Attach</Button> : <Button disabled>Attached</Button>}
              </List.Content>
            </List.Item>
          )}
        </List>
      </div> : placeholder}

    </Container>;
  }
}

export default App;
