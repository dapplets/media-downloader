import React, { ProfilerOnRenderCallback } from 'react';
import './App.css';
import { bridge, Format, Info } from './bridge';
import { Button, Container, Divider, Dropdown, Form, Icon, Item, Loader, Message, Progress, Segment } from 'semantic-ui-react';
import { AttachmentService, Attachment } from './services/attachment';
import { digestMessage } from './utils';
import { Attachments } from './components/Attachments';
import mime from 'mime';

interface Props {

}

interface State {
  swarmGatewayUrl: string;
  info: Info | null;
  quality: string | null;
  formatOptions: {
    key: string, text: string, value: string
  }[];
  uploading: boolean;
  swarmReference: string | null;
  downloadStatus: number;
  uploadStatus: number;
  isStreamingSupported: boolean;
  tag: string | null;
  attachments: Attachment[];
}

class App extends React.Component<Props, State> {

  private _attachmentService?: AttachmentService;

  constructor(p: Props) {
    super(p);
    this.state = {
      swarmGatewayUrl: 'https://gateway.ethswarm.org',
      info: null,
      quality: null,
      formatOptions: [],
      uploading: false,
      swarmReference: null,
      downloadStatus: 0,
      uploadStatus: 0,
      isStreamingSupported: !new Request('', { body: new ReadableStream(), method: 'POST' }).headers.has('Content-Type'),
      tag: null,
      attachments: []
    };
  }

  componentDidMount() {
    bridge.onInfo(async (info) => {
      this._attachmentService = new AttachmentService(info.contractAddress, info.swarmGatewayUrl);

      const hash = await digestMessage(info.info.id);
      const attachments = await this._attachmentService.getAttachments(hash);

      const formatOptions = info.formats.filter(x => !!x.stats.channels && !!x.stats.width).map((x, i) => ({
        key: x.url,
        text: `${x.quality}`,
        value: x.url
      }))

      this.setState({ swarmGatewayUrl: info.swarmGatewayUrl, info, formatOptions, quality: formatOptions[0]?.key, attachments });

    });

    bridge.onDownloadStatus(x => this.setState({ downloadStatus: x }));
    bridge.onUploadStatus(x => this.setState({ uploadStatus: x }));
  }

  private async _download() {
    const s = this.state;
    const info = this.state.info as any as Info;

    this.setState({ uploading: true });

    const qualityName = s.formatOptions.find(x => x.key === s.quality)!.text;
    const mimeType = s.info!.formats.find(x => x.url === s.quality)!.mime;

    const url: string = s.quality as any;
    const extension = mime.getExtension(mimeType); 
    const filename = `${info.info.author.title} - ${info.info.title} (${qualityName}).${extension}`;
    
    const data = await bridge.download(url, filename);
    this.setState({ uploading: false, swarmReference: data.reference, tag: data.tag })
  }

  render() {

    const s = this.state;
    const info = this.state.info as any as Info;

    if (!info) return (
      <div style={{ paddingTop: 'calc(50vh - 31px)' }}>
        <Loader active inline='centered'>Loading Video Info</Loader>
      </div>
    );

    const progress = Math.round((s.downloadStatus * 0.45 + s.uploadStatus * 0.45 + (s.swarmReference ? 0.1 : 0)) * 100);
    let status = null;
    if (s.downloadStatus === 1 && s.uploadStatus === 1 && s.swarmReference) {
      status = 'Done'
    } else if (s.downloadStatus === 1 && s.uploadStatus === 1) {
      status = '3/3 Waiting Swarm Hash'
    } else if (s.downloadStatus === 1) {
      status = '2/3 Uploading'
    } else {
      status = '1/3 Downloading'
    }

    return <Container style={{ paddingTop: '15px' }}>
      {(!s.isStreamingSupported) ? <Message warning>
        <Message.Header>Compatibility Mode</Message.Header>
        <p>
          Your browser doesn't support streaming requests with the fetch API.
          Downloading and uploading will be sequential and take a longer time.
          More details read here: <a href="https://web.dev/fetch-upload-streaming" target="_blank">https://web.dev/fetch-upload-streaming</a>
        </p>
      </Message> : null}

      {(s.attachments.length > 0) ? <>
        <Divider horizontal>Available Attachments</Divider>
        <Attachments attachments={s.attachments} swarmGateway={s.swarmGatewayUrl} />
      </> : null}

      <Divider horizontal>You're uploading the video</Divider>

      <Segment>
        <Item.Group unstackable>
          <Item>
            <Item.Image size='tiny' src={info.info.thumbnails[0].url} />

            <Item.Content>
              <Item.Header className="item-header">{info.info.title}</Item.Header>
              <Item.Meta>{info.info.author.title}</Item.Meta>
              {/* <Item.Description>{info.info.description}</Item.Description> */}
              <Item.Extra>{info.info.views} views · {info.info.date}</Item.Extra>
            </Item.Content>
          </Item>
        </Item.Group>
      </Segment>

      <Form>
        <Form.Group>
          <Form.Select
            label='Quality'
            selection
            options={s.formatOptions}
            onChange={(e, { value }) => this.setState({
              quality: value as string,
              downloadStatus: 0,
              uploadStatus: 0,
              swarmReference: null
            })}
            value={s.quality as any as string}
            disabled={s.uploading}
          />
        </Form.Group>

        <p>
          <Icon name='info circle' />
          The video you selected will be uploaded to Swarm and becomes publicly available. 
          After upload, you'll receive a swarm reference (hash). 
          Please keep it safe; you will need it to retrieve the file later.
        </p>

        <div style={{ marginTop: '15px' }}>
          {(!s.swarmReference && !s.uploading) ? <Button
            primary
            onClick={() => this._download()}
          // disabled={s.uploading}
          // loading={s.uploading}
          >Start</Button> : null}
        </div>

      </Form>

      {(s.uploading) ? <Progress percent={progress} label={status} progress indicating /> : null}

      {(s.swarmReference) ? <Message success style={{ wordBreak: 'break-word' }}>
        <Message.Header>Uploaded</Message.Header>
        <p>
          The video is uploaded and will be available <b>later</b> by this URL: <a target='_blank' href={`${s.swarmGatewayUrl}/files/${s.swarmReference!}`}>{s.swarmGatewayUrl}/files/{s.swarmReference}</a>
        </p>
        <p>Swarm Tag: {s.tag}</p>
      </Message> : null}

    </Container>
  }
}

export default App;
