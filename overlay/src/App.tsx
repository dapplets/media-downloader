import React from 'react';
import './App.css';
import { bridge, Format, VideoInfo } from './bridge';
import { Button, Container, Divider, Dropdown, Form, Icon, Item, Loader, Message, Progress, Segment } from 'semantic-ui-react';

interface Props {

}

interface State {
  swarmGatewayUrl: string;
  info: VideoInfo | null;
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
}

class App extends React.Component<Props, State> {

  state = {
    swarmGatewayUrl: 'https://gateway.ethswarm.org',
    info: null,
    quality: null,
    formatOptions: [],
    uploading: false,
    swarmReference: null,
    downloadStatus: 0,
    uploadStatus: 0,
    isStreamingSupported: !new Request('', { body: new ReadableStream(), method: 'POST' }).headers.has('Content-Type'),
    tag: null
  }

  componentDidMount() {
    bridge.onInfo((info) => {
      const formatOptions = info.formats.filter(x => !!x.stats.channels && !!x.stats.width).map((x, i) => ({
        key: x.url,
        text: `${x.quality}`,
        value: x.url
      }))

      this.setState({ swarmGatewayUrl: info.swarmGatewayUrl, info, formatOptions, quality: formatOptions[0]?.key });

    });

    bridge.onDownloadStatus(x => this.setState({ downloadStatus: x }));
    bridge.onUploadStatus(x => this.setState({ uploadStatus: x }));
  }

  private async _download() {
    this.setState({ uploading: true });
    const url: string = this.state.quality as any;
    const data = await bridge.download(url);
    this.setState({ uploading: false, swarmReference: data.reference, tag: data.tag })
  }

  render() {

    const s = this.state;
    const info = this.state.info as any as VideoInfo;

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
          Selected video will be uploaded to Swarm and public available.
          After uploading you'll recieve a swarm referenece (hash).
          Keep this address safe, it's need you to retrieve the file later.
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
          The video is uploaded and will be available by this URL: <a target='_blank' href={`${s.swarmGatewayUrl}/files/${s.swarmReference!}`}>{s.swarmGatewayUrl}/files/{s.swarmReference}</a>
        </p>
        <p>Swarm Tag: {s.tag}</p>
      </Message> : null}

    </Container>
  }
}

export default App;
