import type { FrameSettings } from "../state/types";

type Props = { frame: FrameSettings; updateFrame: (patch: Partial<FrameSettings>) => void };

export function FrameControls({ frame, updateFrame }: Props) {
  return (
    <div className="ccsg-settings">
      <label>
        Layout
        <select
          value={frame.layout}
          onChange={(e) => updateFrame({ layout: e.target.value as FrameSettings["layout"] })}
        >
          <option value="single">single</option>
          <option value="split-h">split ↔ (left / right)</option>
          <option value="split-v">split ↕ (top / bottom)</option>
        </select>
      </label>
      <label>
        Backdrop
        <select
          value={frame.backdrop}
          onChange={(e) => updateFrame({ backdrop: e.target.value as FrameSettings["backdrop"] })}
        >
          <option value="transparent">transparent</option>
          <option value="slate">slate</option>
          <option value="coral">coral</option>
          <option value="indigo">indigo</option>
          <option value="black">black</option>
        </select>
      </label>
      <label>
        Padding
        <input
          type="range"
          min={0}
          max={160}
          value={frame.padding}
          onChange={(e) => updateFrame({ padding: Number(e.target.value) })}
        />
      </label>
      <label>
        Aspect
        <select
          value={frame.aspect}
          onChange={(e) => updateFrame({ aspect: e.target.value as FrameSettings["aspect"] })}
        >
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
