import type { Block, DiffLine } from "../../state/types";
import { Markdown } from "../../markdown/Markdown";
import { Bullet, Connector } from "./parts";
import { useTheme } from "../../themes/ThemeContext";

const diffPrefix: Record<DiffLine["kind"], string> = { add: "+", remove: "-", context: " " };

export function BlockView({ block }: { block: Block }) {
  const t = useTheme();
  const c = t.colors;
  const diffColor: Record<DiffLine["kind"], string> = { add: c.add, remove: c.remove, context: c.context };
  switch (block.type) {
    case "userPrompt":
      return t.prompt.kind === "box" ? (
        <div data-testid="prompt-box" style={{ border: `1px solid ${c.promptBorder}`, borderRadius: 8, padding: "8px 12px", margin: "10px 0" }}>
          <span style={{ color: c.dim }}>{`${t.prompt.glyph} `}</span>
          <span>{block.text}</span>
        </div>
      ) : (
        <div data-testid="prompt-box" style={{ margin: "10px 0" }}>
          <span style={{ color: c.accent }}>{`${t.prompt.glyph} `}</span>
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
          <div><Bullet /> <span style={{ color: c.text }}>{t.toolLabels.bash}</span>(<span style={{ color: c.context }}>{block.command}</span>)</div>
          {block.output && <Connector>{block.output}</Connector>}
        </div>
      );
    case "edit":
      return (
        <div style={{ margin: "10px 0" }}>
          <div><Bullet /> <span style={{ color: c.text }}>{t.toolLabels.edit}</span>(<span style={{ color: c.context }}>{block.filepath}</span>)</div>
          <div style={{ paddingLeft: 24, marginTop: 4 }}>
            {block.lines.map((l, i) => (
              <div key={i} data-diff={l.kind} style={{ color: diffColor[l.kind] }}>{diffPrefix[l.kind]} {l.text}</div>
            ))}
          </div>
        </div>
      );
    case "read":
      return (
        <div style={{ margin: "10px 0" }}>
          <div><Bullet /> <span style={{ color: c.text }}>{t.toolLabels.read}</span>(<span style={{ color: c.context }}>{block.filepath}</span>)</div>
          <Connector>{block.summary}</Connector>
        </div>
      );
    case "bare":
      return <div style={{ color: c.dim, margin: "8px 0" }}>{block.text}</div>;
  }
}
