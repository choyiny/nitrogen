import type { Block, BlockType, Session, SessionSettings } from "../state/types";
import { BLOCK_TYPES } from "../state/types";
import { BlockEditor } from "./blockEditors/BlockEditor";
import { SettingsPanel } from "./SettingsPanel";

type Props = {
  session: Session;
  add: (t: BlockType) => void;
  update: (id: string, patch: Partial<Block>) => void;
  remove: (id: string) => void;
  move: (id: string, dir: "up" | "down") => void;
  setSettings: (patch: Partial<SessionSettings>) => void;
};

export function EditorPane({ session, add, update, remove, move, setSettings }: Props) {
  return (
    <div className="ccsg-editor">
      <SettingsPanel settings={session.settings} setSettings={setSettings} />
      <div className="ccsg-add-row">
        {BLOCK_TYPES.map((t) => (
          <button key={t} onClick={() => add(t)}>{t}</button>
        ))}
      </div>
      <div className="ccsg-block-list">
        {session.blocks.map((b) => (
          <div key={b.id} className="ccsg-block-row">
            <div className="ccsg-block-head">
              <span>{b.type}</span>
              <span>
                <button aria-label="↑" onClick={() => move(b.id, "up")}>↑</button>
                <button aria-label="↓" onClick={() => move(b.id, "down")}>↓</button>
                <button aria-label="✕" onClick={() => remove(b.id)}>✕</button>
              </span>
            </div>
            <BlockEditor block={b} onChange={(patch) => update(b.id, patch)} />
          </div>
        ))}
      </div>
    </div>
  );
}
