import { useCallback, useEffect, useState } from "react";
import { Block, BlockType, FrameSettings, TerminalWindow } from "./types";
import {
  addBlock, loadDoc, moveBlock, removeBlock, saveDoc, setActiveWindow,
  updateBlock, updateFrame, updateWindow,
} from "./docStore";

let counter = 0;
const genId = () => `blk_${Date.now().toString(36)}_${counter++}`;

export function useDoc() {
  const [doc, setDoc] = useState(loadDoc);
  useEffect(() => saveDoc(doc), [doc]);

  return {
    doc,
    addBlock: useCallback((w: 0 | 1, t: BlockType) => setDoc((d) => addBlock(d, w, t, genId())), []),
    updateBlock: useCallback((w: 0 | 1, id: string, patch: Partial<Block>) => setDoc((d) => updateBlock(d, w, id, patch)), []),
    removeBlock: useCallback((w: 0 | 1, id: string) => setDoc((d) => removeBlock(d, w, id)), []),
    moveBlock: useCallback((w: 0 | 1, id: string, dir: "up" | "down") => setDoc((d) => moveBlock(d, w, id, dir)), []),
    updateWindow: useCallback((w: 0 | 1, patch: Partial<TerminalWindow>) => setDoc((d) => updateWindow(d, w, patch)), []),
    updateFrame: useCallback((patch: Partial<FrameSettings>) => setDoc((d) => updateFrame(d, patch)), []),
    setActiveWindow: useCallback((w: 0 | 1) => setDoc((d) => setActiveWindow(d, w)), []),
  };
}
