import { useRef } from "react";
import { useDoc } from "./state/useDoc";
import { EditorPane } from "./editor/EditorPane";
import { PreviewPane } from "./preview/PreviewPane";
import { exportPng } from "./export/exportPng";
import "./app.css";

export default function App() {
  const { doc, addBlock, updateBlock, removeBlock, moveBlock, updateWindow, updateFrame, setActiveWindow } = useDoc();
  const captureRef = useRef<HTMLDivElement>(null);

  return (
    <div className="ccsg-app">
      <EditorPane
        doc={doc}
        addBlock={addBlock} updateBlock={updateBlock} removeBlock={removeBlock}
        moveBlock={moveBlock} updateWindow={updateWindow} updateFrame={updateFrame}
        setActiveWindow={setActiveWindow}
      />
      <div className="ccsg-preview-wrap" style={{ position: "relative", overflow: "auto" }}>
        <button
          className="ccsg-export-btn"
          onClick={() => captureRef.current && exportPng(captureRef.current)}
        >
          Export PNG
        </button>
        <PreviewPane doc={doc} captureRef={captureRef} />
      </div>
    </div>
  );
}
