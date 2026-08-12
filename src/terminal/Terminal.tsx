import { Session } from "../state/types";
import { permissionLabel } from "./theme";
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
        {/* Block rendering wired in Task 6 */}
      </div>
      <div
        className="ccsg-statusbar"
        style={{
          display: "flex", justifyContent: "space-between",
          marginTop: 14, color: "#78716c", fontSize: 12,
        }}
      >
        <span style={{ color: label ? "#d97757" : "#78716c" }}>{label}</span>
        <span>{settings.cwd} · {settings.model}</span>
      </div>
    </div>
  );
}
