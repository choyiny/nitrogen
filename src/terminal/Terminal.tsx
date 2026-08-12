import { Session } from "../state/types";
import { permissionLabel, permissionColor } from "./theme";
import { BlockView } from "./blocks/BlockView";
import "./terminal.css";

export function Terminal({ session }: { session: Session }) {
  const { blocks, settings } = session;
  const label = permissionLabel(settings.permissionMode);
  return (
    <div className="ccsg-terminal">
      <div className="ccsg-blocks">
        {blocks.length === 0 && (
          <div style={{ color: "#78716c" }}>Add a block to get started…</div>
        )}
        {blocks.map((b) => <BlockView key={b.id} block={b} />)}
      </div>
      <div
        className="ccsg-statusbar"
        style={{
          display: "flex", justifyContent: "space-between",
          marginTop: 14, color: "#78716c", fontSize: 12,
        }}
      >
        <span style={{ color: permissionColor(settings.permissionMode) }}>{label}</span>
        <span>{settings.cwd} · {settings.model}</span>
      </div>
    </div>
  );
}
