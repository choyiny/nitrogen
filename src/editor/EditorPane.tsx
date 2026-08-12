import type { Block, BlockType, Doc, FrameSettings, TerminalWindow } from "../state/types";
import { BLOCK_TYPES } from "../state/types";
import { BlockEditor } from "./blockEditors/BlockEditor";
import { FrameControls } from "./FrameControls";
import { WindowSettings } from "./WindowSettings";

type Props = {
  doc: Doc;
  addBlock: (w: 0 | 1, t: BlockType) => void;
  updateBlock: (w: 0 | 1, id: string, patch: Partial<Block>) => void;
  removeBlock: (w: 0 | 1, id: string) => void;
  moveBlock: (w: 0 | 1, id: string, dir: "up" | "down") => void;
  updateWindow: (w: 0 | 1, patch: Partial<TerminalWindow>) => void;
  updateFrame: (patch: Partial<FrameSettings>) => void;
  setActiveWindow: (w: 0 | 1) => void;
};

export function EditorPane(props: Props) {
  const {
    doc,
    addBlock,
    updateBlock,
    removeBlock,
    moveBlock,
    updateWindow,
    updateFrame,
    setActiveWindow,
  } = props;
  const isSplit = doc.frame.layout !== "single";
  const active: 0 | 1 = isSplit ? doc.activeWindow : 0;
  const win = doc.windows[active];
  return (
    <div className="ccsg-editor">
      <FrameControls frame={doc.frame} updateFrame={updateFrame} />
      {isSplit && (
        <div className="ccsg-tabs">
          {[0, 1].map((i) => (
            <button
              key={i}
              className={active === i ? "active" : ""}
              aria-pressed={active === i}
              onClick={() => setActiveWindow(i as 0 | 1)}
            >
              Window {i + 1}
            </button>
          ))}
        </div>
      )}
      <WindowSettings win={win} onChange={(patch) => updateWindow(active, patch)} />
      <div className="ccsg-add-row">
        {BLOCK_TYPES.map((t) => (
          <button key={t} onClick={() => addBlock(active, t)}>
            {t}
          </button>
        ))}
      </div>
      <div className="ccsg-block-list">
        {win.blocks.map((b) => (
          <div key={b.id} className="ccsg-block-row">
            <div className="ccsg-block-head">
              <span>{b.type}</span>
              <span>
                <button aria-label="↑" onClick={() => moveBlock(active, b.id, "up")}>
                  ↑
                </button>
                <button aria-label="↓" onClick={() => moveBlock(active, b.id, "down")}>
                  ↓
                </button>
                <button aria-label="✕" onClick={() => removeBlock(active, b.id)}>
                  ✕
                </button>
              </span>
            </div>
            <BlockEditor block={b} onChange={(patch) => updateBlock(active, b.id, patch)} />
          </div>
        ))}
      </div>
    </div>
  );
}
