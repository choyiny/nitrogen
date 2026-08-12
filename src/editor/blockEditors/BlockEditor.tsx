import type { Block } from "../../state/types";
import { DiffEditor } from "./DiffEditor";

type Props = { block: Block; onChange: (patch: Partial<Block>) => void };

export function BlockEditor({ block, onChange }: Props) {
  switch (block.type) {
    case "userPrompt":
    case "bare":
      return (
        <textarea
          rows={3}
          value={block.text}
          onChange={(e) => onChange({ text: e.target.value } as Partial<Block>)}
        />
      );
    case "assistant":
      return (
        <textarea
          rows={4}
          value={block.markdown}
          onChange={(e) => onChange({ markdown: e.target.value } as Partial<Block>)}
        />
      );
    case "bash":
      return (
        <div>
          <input
            placeholder="command"
            value={block.command}
            onChange={(e) => onChange({ command: e.target.value } as Partial<Block>)}
          />
          <textarea
            rows={3}
            placeholder="output"
            value={block.output}
            onChange={(e) => onChange({ output: e.target.value } as Partial<Block>)}
          />
        </div>
      );
    case "read":
      return (
        <div>
          <input
            placeholder="filepath"
            value={block.filepath}
            onChange={(e) => onChange({ filepath: e.target.value } as Partial<Block>)}
          />
          <input
            placeholder="summary (e.g. Read 42 lines)"
            value={block.summary}
            onChange={(e) => onChange({ summary: e.target.value } as Partial<Block>)}
          />
        </div>
      );
    case "edit":
      return (
        <div>
          <input
            placeholder="filepath"
            value={block.filepath}
            onChange={(e) => onChange({ filepath: e.target.value } as Partial<Block>)}
          />
          <DiffEditor
            lines={block.lines}
            onChange={(lines) => onChange({ lines } as Partial<Block>)}
          />
        </div>
      );
  }
}
