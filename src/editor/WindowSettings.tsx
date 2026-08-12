import type { TerminalWindow } from "../state/types";

type Props = { win: TerminalWindow; onChange: (patch: Partial<TerminalWindow>) => void };

export function WindowSettings({ win, onChange }: Props) {
  return (
    <div className="ccsg-settings">
      <label>Permission mode
        <select value={win.permissionMode}
          onChange={(e) => onChange({ permissionMode: e.target.value as TerminalWindow["permissionMode"] })}>
          <option value="normal">normal</option>
          <option value="acceptEdits">accept edits</option>
          <option value="plan">plan mode</option>
          <option value="bypassPermissions">bypass permissions</option>
        </select>
      </label>
      <label>cwd
        <input value={win.cwd} onChange={(e) => onChange({ cwd: e.target.value })} />
      </label>
      <label>model
        <input value={win.model} onChange={(e) => onChange({ model: e.target.value })} />
      </label>
    </div>
  );
}
