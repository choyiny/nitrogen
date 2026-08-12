import {
  Block, BlockType, Doc, FrameSettings, TerminalWindow,
  newBlock, newWindow, defaultFrame,
} from "./types";

export const STORAGE_KEY = "ccsg.doc.v2";

export function emptyDoc(): Doc {
  return { windows: [newWindow(), newWindow()], frame: defaultFrame(), activeWindow: 0 };
}

function mapWindow(doc: Doc, w: 0 | 1, fn: (win: TerminalWindow) => TerminalWindow): Doc {
  const windows: [TerminalWindow, TerminalWindow] = [doc.windows[0], doc.windows[1]];
  windows[w] = fn(windows[w]);
  return { ...doc, windows };
}

export function addBlock(doc: Doc, w: 0 | 1, type: BlockType, id: string): Doc {
  return mapWindow(doc, w, (win) => ({ ...win, blocks: [...win.blocks, newBlock(type, id)] }));
}

export function updateBlock(doc: Doc, w: 0 | 1, id: string, patch: Partial<Block>): Doc {
  return mapWindow(doc, w, (win) => ({
    ...win,
    blocks: win.blocks.map((b) => (b.id === id ? ({ ...b, ...patch } as Block) : b)),
  }));
}

export function removeBlock(doc: Doc, w: 0 | 1, id: string): Doc {
  return mapWindow(doc, w, (win) => ({ ...win, blocks: win.blocks.filter((b) => b.id !== id) }));
}

export function moveBlock(doc: Doc, w: 0 | 1, id: string, dir: "up" | "down"): Doc {
  return mapWindow(doc, w, (win) => {
    const i = win.blocks.findIndex((b) => b.id === id);
    if (i < 0) return win;
    const j = dir === "up" ? i - 1 : i + 1;
    if (j < 0 || j >= win.blocks.length) return win;
    const blocks = [...win.blocks];
    [blocks[i], blocks[j]] = [blocks[j], blocks[i]];
    return { ...win, blocks };
  });
}

export function updateWindow(doc: Doc, w: 0 | 1, patch: Partial<TerminalWindow>): Doc {
  return mapWindow(doc, w, (win) => ({ ...win, ...patch }));
}

export function updateFrame(doc: Doc, patch: Partial<FrameSettings>): Doc {
  return { ...doc, frame: { ...doc.frame, ...patch } };
}

export function setActiveWindow(doc: Doc, w: 0 | 1): Doc {
  return { ...doc, activeWindow: w };
}

export function saveDoc(doc: Doc): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(doc));
  } catch {
    /* ignore quota/serialization errors */
  }
}

export function loadDoc(): Doc {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedDoc();
    const parsed = JSON.parse(raw) as Doc;
    if (!parsed || !Array.isArray(parsed.windows) || parsed.windows.length !== 2 || !parsed.frame) {
      return emptyDoc();
    }
    return parsed;
  } catch {
    return emptyDoc();
  }
}

export function seedDoc(): Doc {
  const w0: TerminalWindow = {
    permissionMode: "acceptEdits", cwd: "~/project", model: "claude-opus-4-8",
    blocks: [
      { id: "a1", type: "userPrompt", text: "Add a dark mode toggle to the navbar" },
      { id: "a2", type: "assistant", markdown: "I'll add a **theme toggle**:\n\n- a `useTheme` hook\n- a button in the navbar" },
      { id: "a3", type: "edit", filepath: "src/Navbar.tsx", lines: [
        { kind: "context", text: "function Navbar() {" },
        { kind: "add", text: "  const { theme, toggle } = useTheme();" },
      ] },
    ],
  };
  const w1: TerminalWindow = {
    permissionMode: "plan", cwd: "~/project", model: "claude-opus-4-8",
    blocks: [
      { id: "b1", type: "userPrompt", text: "Same, but plan it first before editing" },
      { id: "b2", type: "assistant", markdown: "Here's the **plan**:\n\n1. Read the navbar\n2. Add the hook\n3. Wire the button" },
      { id: "b3", type: "read", filepath: "src/Navbar.tsx", summary: "Read 48 lines" },
    ],
  };
  return { windows: [w0, w1], frame: { ...defaultFrame(), layout: "split-h" }, activeWindow: 0 };
}
