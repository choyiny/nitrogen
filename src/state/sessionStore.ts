import {
  Block, BlockType, Session, SessionSettings, newBlock, defaultSettings,
} from "./types";

export const STORAGE_KEY = "ccsg.session.v1";

export function emptySession(): Session {
  return { blocks: [], settings: defaultSettings() };
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
    if (!raw) return emptySession();
    const parsed = JSON.parse(raw) as Session;
    if (!parsed || !Array.isArray(parsed.blocks) || !parsed.settings) {
      return emptySession();
    }
    return parsed;
  } catch {
    return emptySession();
  }
}
