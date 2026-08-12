import {
  Block, BlockType, Session, SessionSettings, newBlock, defaultSettings,
} from "./types";

export const STORAGE_KEY = "ccsg.session.v1";

export function emptySession(): Session {
  return { blocks: [], settings: defaultSettings() };
}

export function seedSession(): Session {
  return {
    settings: { ...defaultSettings(), permissionMode: "acceptEdits" },
    blocks: [
      { id: "s1", type: "userPrompt", text: "Add a dark mode toggle to the navbar" },
      { id: "s2", type: "assistant", markdown: "I'll add a **theme toggle**. Plan:\n\n- Add a `useTheme` hook\n- Wire a button into the navbar" },
      { id: "s3", type: "read", filepath: "src/Navbar.tsx", summary: "Read 48 lines" },
      { id: "s4", type: "edit", filepath: "src/Navbar.tsx", lines: [
        { kind: "context", text: "function Navbar() {" },
        { kind: "add", text: "  const { theme, toggle } = useTheme();" },
        { kind: "add", text: "  return <button onClick={toggle}>{theme}</button>;" },
      ] },
      { id: "s5", type: "bash", command: "npm test", output: "✓ 12 passed" },
    ],
  };
}

export function addBlock(s: Session, type: BlockType, id: string): Session {
  return { ...s, blocks: [...s.blocks, newBlock(type, id)] };
}

export function updateBlock(s: Session, id: string, patch: Partial<Block>): Session {
  return {
    ...s,
    blocks: s.blocks.map((b) => (b.id === id ? ({ ...b, ...patch } as Block) : b)),
  };
}

export function removeBlock(s: Session, id: string): Session {
  return { ...s, blocks: s.blocks.filter((b) => b.id !== id) };
}

export function moveBlock(s: Session, id: string, dir: "up" | "down"): Session {
  const i = s.blocks.findIndex((b) => b.id === id);
  if (i < 0) return s;
  const j = dir === "up" ? i - 1 : i + 1;
  if (j < 0 || j >= s.blocks.length) return s;
  const blocks = [...s.blocks];
  [blocks[i], blocks[j]] = [blocks[j], blocks[i]];
  return { ...s, blocks };
}

export function updateSettings(s: Session, patch: Partial<SessionSettings>): Session {
  return { ...s, settings: { ...s.settings, ...patch } };
}

export function saveSession(s: Session): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    /* ignore quota/serialization errors */
  }
}

export function loadSession(): Session {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedSession();
    const parsed = JSON.parse(raw) as Session;
    if (!parsed || !Array.isArray(parsed.blocks) || !parsed.settings) {
      return emptySession();
    }
    return parsed;
  } catch {
    return emptySession();
  }
}
