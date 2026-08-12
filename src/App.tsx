import { useRef } from "react";
import { useSession } from "./state/useSession";
import { EditorPane } from "./editor/EditorPane";
import { PreviewPane } from "./preview/PreviewPane";
import { exportPng } from "./export/exportPng";
import "./app.css";

export default function App() {
  const { session, add, update, remove, move, setSettings } = useSession();
  const captureRef = useRef<HTMLDivElement>(null);

  return (
    <div className="ccsg-app">
      <EditorPane
        session={session} add={add} update={update}
        remove={remove} move={move} setSettings={setSettings}
      />
      <div className="ccsg-preview-wrap" style={{ position: "relative", overflow: "auto" }}>
        <button
          className="ccsg-export-btn"
          onClick={() => captureRef.current && exportPng(captureRef.current)}
        >
          Export PNG
        </button>
        <PreviewPane session={session} captureRef={captureRef} />
      </div>
    </div>
  );
}
