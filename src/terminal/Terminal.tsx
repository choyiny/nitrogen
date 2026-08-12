import type { CSSProperties } from "react";
import { TerminalWindow } from "../state/types";
import { themeFor } from "../themes/agentThemes";
import { ThemeContext } from "../themes/ThemeContext";
import { BlockView } from "./blocks/BlockView";
import "./terminal.css";

export function Terminal({ win }: { win: TerminalWindow }) {
  const theme = themeFor(win.agent);
  const { blocks, permissionMode, cwd, model } = win;
  const c = theme.colors;
  const status = theme.statusBar({ permissionMode, cwd, model });
  const vars = {
    "--ccsg-bg": c.bg,
    "--ccsg-text": c.text,
    "--ccsg-code-bg": c.codeBg,
  } as CSSProperties;
  return (
    <ThemeContext.Provider value={theme}>
      <div className="ccsg-terminal" style={vars}>
        <div className="ccsg-blocks">
          {blocks.length === 0 && <div style={{ color: c.dim }}>Add a block to get started…</div>}
          {blocks.map((b) => (
            <BlockView key={b.id} block={b} />
          ))}
        </div>
        <div
          className="ccsg-statusbar"
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 14,
            color: c.dim,
            fontSize: 12,
          }}
        >
          <span style={{ color: status.leftColor }}>{status.leftText}</span>
          <span>{status.rightText}</span>
        </div>
      </div>
    </ThemeContext.Provider>
  );
}
