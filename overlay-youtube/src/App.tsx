import React, { ProfilerOnRenderCallback } from 'react';
import './App.css';
import { bridge, Info } from './bridge';
import { Button, Container, Divider, Dropdown, Form, Icon, Item, Loader, Message, Progress, Segment } from 'semantic-ui-react';
import { AttachmentService, Attachment } from './services/attachment';
import { digestMessage } from './utils';
import { Attachments } from './components/Attachments';
import mime from 'mime';

interface Props {

}

interface State {
  info: Info | null;
  selectedUrl: string | null;
  formatOptions: {
    key: string, text: string, value: string
  }[];
  uploading: boolean;
  swarmReference: string | null;
  downloadStatus: number;
  uploadStatus: number;
  isStreamingSupported: boolean;
  tag: string | null;
  hash: string | null;
  error: string | null;
}

class App extends React.Component<Props, State> {

  private _attachmentService?: AttachmentService;

  constructor(p: Props) {
    super(p);
    this.state = {
      info: null,
      selectedUrl: null,
      formatOptions: [],
      uploading: false,
      swarmReference: null,
      downloadStatus: 0,
      uploadStatus: 0,
      isStreamingSupported: !new Request('', { body: new ReadableStream(), method: 'POST' }).headers.has('Content-Type'),
      tag: null,
      hash: null,
      error: null
    };
  }

  componentDidMount() {
    bridge.onInfo(async (info) => {
      const hash = await digestMessage(info.videoInfo.videoDetails.videoId);

      const formatOptions = info.videoInfo.formats.filter((x: any) => x.hasAudio && x.hasVideo).map((x: any, i: number) => ({
        key: x.url,
        text: `${x.qualityLabel}`,
        value: x.url
      }));

      this.setState({ info, formatOptions, selectedUrl: formatOptions[0]?.key, hash });

    });

    bridge.onDownloadStatus(x => this.setState({ downloadStatus: x }));
    bridge.onUploadStatus(x => this.setState({ uploadStatus: x }));
  }

  private async _download() {
    const s = this.state;
    const info = this.state.info as any as Info;

    this.setState({ uploading: true });

    const qualityName = s.formatOptions.find(x => x.key === s.selectedUrl)!.text;
    const mimeType = s.info!.videoInfo.formats.find((x: any) => x.url === s.selectedUrl)!.mimeType;

    const url: string = s.selectedUrl as any;
    const extension = mime.getExtension(mimeType); 
    const filename = `${info.videoInfo.videoDetails.author.name} - ${info.videoInfo.videoDetails.title} (${qualityName}).${extension}`;
    
    bridge.download(url, filename)
      .then(data => this.setState({ uploading: false, swarmReference: data.reference, tag: data.tag }))
      .catch(err => this.setState({ uploading: false, error: err }))
    
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
      status = '3/3 Indexing and waiting Swarm hash'
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

      {(s.hash && s.info) ? <>
        <Divider horizontal>Available Attachments</Divider>
        <Attachments 
          hash={s.hash} 
          swarmGateway={s.info.swarmGatewayUrl} 
          contractAddress={s.info.contractAddress} 
        />
      </> : null}

      <Divider horizontal>You're uploading the video</Divider>

      <Segment>
        <Item.Group unstackable>
          <Item>
            <Item.Image size='tiny' src={info.videoInfo.videoDetails.thumbnails[0].url} />

            <Item.Content>
              <Item.Header className="item-header">{info.videoInfo.videoDetails.title}</Item.Header>
              <Item.Meta>{info.videoInfo.videoDetails.author.name}</Item.Meta>
              {/* <Item.Description>{info.info.description}</Item.Description> */}
              <Item.Extra>{info.videoInfo.videoDetails.viewCount} views · {info.videoInfo.videoDetails.uploadDate}</Item.Extra>
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
              selectedUrl: value as string,
              downloadStatus: 0,
              uploadStatus: 0,
              swarmReference: null
            })}
            value={s.selectedUrl as any as string}
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
          The video is uploaded and will be available <b>later</b> by this URL: <a target='_blank' href={`${s.info!.swarmGatewayUrl}/bzz/${s.swarmReference!}`}>{s.info!.swarmGatewayUrl}/bzz/{s.swarmReference}</a>
        </p>
        <p>Swarm Tag: {s.tag}</p>
      </Message> : null}

      {(s.error) ? <Message error style={{ wordBreak: 'break-word' }}>
        <Message.Header>Error</Message.Header>
        <p>{s.error}</p>
      </Message> : null}

    </Container>
  }
}

export default App;
