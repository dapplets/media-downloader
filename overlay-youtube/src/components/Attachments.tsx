import React from "react";
import { List, Placeholder } from "semantic-ui-react";
import { AttachmentService } from "../services/attachment";

interface Props {
  hash: string;
  swarmGateway: string;
  contractAddress: string;
}

interface State {
  attachments: {
    reference: string;
    mimetype: string;
    filename: string;
    isAvailable: boolean;
  }[];
  isLoading: boolean;
}

export class Attachments extends React.Component<Props, State> {
  private _attachmentService: AttachmentService;

  constructor(p: Props) {
    super(p);
    this.state = {
      attachments: [],
      isLoading: true,
    };
    this._attachmentService = new AttachmentService(
      p.contractAddress,
      p.swarmGateway
    );
  }

  async componentDidMount() {
    try {
      const attachments = await this._attachmentService.getAttachments(
        this.props.hash
      );
      this.setState({ attachments, isLoading: false });
    } catch (_) {
      this.setState({ attachments: [], isLoading: false });
    }
  }

  render() {
    const p = this.props;
    const s = this.state;

    if (s.isLoading) {
      return (
        <Placeholder>
          <Placeholder.Line />
          <Placeholder.Line />
          <Placeholder.Line />
          <Placeholder.Line />
          <Placeholder.Line />
        </Placeholder>
      );
    }

    return (
      <List divided relaxed>
        {s.attachments.map((x, i) =>
          x.isAvailable ? (
            <List.Item key={i}>
              <List.Icon name="file" verticalAlign="middle" />
              <List.Content>
                <List.Header
                  as="a"
                  href={p.swarmGateway + "/files/" + x.reference}
                  target="_blank"
                  style={{ wordBreak: "break-word" }}
                >
                  {x.filename}
                </List.Header>
                <List.Description as="a">{x.mimetype}</List.Description>
              </List.Content>
            </List.Item>
          ) : (
            <List.Item key={i}>
              <List.Icon name="file" verticalAlign="middle" />
              <List.Content>
                <List.Header style={{ wordBreak: "break-word" }}>
                  {x.filename ?? x.reference}
                </List.Header>
                <List.Description>{x.mimetype ?? "NOT FOUND"}</List.Description>
              </List.Content>
            </List.Item>
          )
        )}
      </List>
    );
  }
}
