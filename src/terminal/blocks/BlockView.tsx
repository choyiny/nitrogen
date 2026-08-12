import type { Block, DiffLine } from "../../state/types";
import { Markdown } from "../../markdown/Markdown";
import { Bullet, Connector } from "./parts";

const diffColor: Record<DiffLine["kind"], string> = {
  add: "#4ade80", remove: "#f87171", context: "#a8a29e",
};
const diffPrefix: Record<DiffLine["kind"], string> = {
  add: "+", remove: "-", context: " ",
};

export function BlockView({ block }: { block: Block }) {
  switch (block.type) {
    case "userPrompt":
      return (
        <div
          data-testid="prompt-box"
          style={{
            border: "1px solid #57534e", borderRadius: 8,
            padding: "8px 12px", margin: "10px 0",
          }}
        >
          <span style={{ color: "#78716c" }}>{"> "}</span>
          <span>{block.text}</span>
        </div>
      );
    case "assistant":
      return (
        <div style={{ margin: "10px 0", display: "flex", gap: 8 }}>
          <Bullet />
          <div style={{ flex: 1 }}><Markdown source={block.markdown} /></div>
        </div>
      );
    case "bash":
      return (
        <div style={{ margin: "10px 0" }}>
          <div><Bullet /> <span style={{ color: "#e7e5e4" }}>Bash</span>(<span style={{ color: "#a8a29e" }}>{block.command}</span>)</div>
          {block.output && <Connector>{block.output}</Connector>}
        </div>
      );
    case "edit":
      return (
        <div style={{ margin: "10px 0" }}>
          <div><Bullet /> <span style={{ color: "#e7e5e4" }}>Update</span>(<span style={{ color: "#a8a29e" }}>{block.filepath}</span>)</div>
          <div style={{ paddingLeft: 24, marginTop: 4 }}>
            {block.lines.map((l, i) => (
              <div key={i} data-diff={l.kind} style={{ color: diffColor[l.kind] }}>
                {diffPrefix[l.kind]} {l.text}
              </div>
            ))}
          </div>
        </div>
      );
    case "read":
      return (
        <div style={{ margin: "10px 0" }}>
          <div><Bullet /> <span style={{ color: "#e7e5e4" }}>Read</span>(<span style={{ color: "#a8a29e" }}>{block.filepath}</span>)</div>
          <Connector>{block.summary}</Connector>
        </div>
      );
    case "bare":
      return <div style={{ color: "#78716c", margin: "8px 0" }}>{block.text}</div>;
  }
}
