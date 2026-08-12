import type { SessionSettings } from "../state/types";

type Props = {
  settings: SessionSettings;
  setSettings: (patch: Partial<SessionSettings>) => void;
};

export function SettingsPanel({ settings, setSettings }: Props) {
  return (
    <div className="ccsg-settings">
      <label>
        Permission mode
        <select
          value={settings.permissionMode}
          onChange={(e) => setSettings({ permissionMode: e.target.value as SessionSettings["permissionMode"] })}
        >
          <option value="normal">normal</option>
          <option value="acceptEdits">accept edits</option>
          <option value="plan">plan mode</option>
          <option value="bypassPermissions">bypass permissions</option>
        </select>
      </label>
      <label>cwd
        <input value={settings.cwd} onChange={(e) => setSettings({ cwd: e.target.value })} />
      </label>
      <label>model
        <input value={settings.model} onChange={(e) => setSettings({ model: e.target.value })} />
      </label>
      <label>Backdrop
        <select value={settings.backdrop} onChange={(e) => setSettings({ backdrop: e.target.value as SessionSettings["backdrop"] })}>
          <option value="transparent">transparent</option>
          <option value="slate">slate</option>
          <option value="coral">coral</option>
          <option value="indigo">indigo</option>
          <option value="black">black</option>
        </select>
      </label>
      <label>Padding
        <input type="range" min={0} max={160} value={settings.padding}
          onChange={(e) => setSettings({ padding: Number(e.target.value) })} />
      </label>
      <label>Aspect
        <select value={settings.aspect} onChange={(e) => setSettings({ aspect: e.target.value as SessionSettings["aspect"] })}>
          <option value="auto">auto</option>
          <option value="16:9">16:9</option>
          <option value="square">square</option>
          <option value="twitter">X / Twitter</option>
          <option value="linkedin">LinkedIn</option>
        </select>
      </label>
    </div>
  );
}
