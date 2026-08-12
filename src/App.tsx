import { useRef } from "react";
import { useDoc } from "./state/useDoc";
import { Header } from "./Header";
import { EditorPane } from "./editor/EditorPane";
import { PreviewPane } from "./preview/PreviewPane";
import { exportPng } from "./export/exportPng";
import "./app.css";

export default function App() {
  const {
    doc,
    addBlock,
    updateBlock,
    removeBlock,
    moveBlock,
    updateWindow,
    updateFrame,
    setActiveWindow,
  } = useDoc();
  const captureRef = useRef<HTMLDivElement>(null);

  return (
    <div className="ccsg-app">
      <Header onExport={() => captureRef.current && exportPng(captureRef.current)} />
      <div className="ccsg-body">
        <EditorPane
          doc={doc}
          addBlock={addBlock}
          updateBlock={updateBlock}
          removeBlock={removeBlock}
          moveBlock={moveBlock}
          updateWindow={updateWindow}
          updateFrame={updateFrame}
          setActiveWindow={setActiveWindow}
        />
        <div className="ccsg-preview-wrap" style={{ position: "relative", overflow: "auto" }}>
          <PreviewPane doc={doc} captureRef={captureRef} />
        </div>
      </div>
    </div>
  );
}
