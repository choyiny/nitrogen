import { useCallback, useEffect, useState } from "react";
import { Block, BlockType, SessionSettings } from "./types";
import {
  addBlock, loadSession, moveBlock, removeBlock, saveSession,
  updateBlock, updateSettings,
} from "./sessionStore";

let counter = 0;
const genId = () => `blk_${Date.now().toString(36)}_${counter++}`;

export function useSession() {
  const [session, setSession] = useState(loadSession);
  useEffect(() => saveSession(session), [session]);

  const add = useCallback((t: BlockType) => setSession((s) => addBlock(s, t, genId())), []);
  const update = useCallback(
    (id: string, patch: Partial<Block>) => setSession((s) => updateBlock(s, id, patch)),
    [],
  );
  const remove = useCallback((id: string) => setSession((s) => removeBlock(s, id)), []);
  const move = useCallback(
    (id: string, dir: "up" | "down") => setSession((s) => moveBlock(s, id, dir)),
    [],
  );
  const setSettings = useCallback(
    (patch: Partial<SessionSettings>) => setSession((s) => updateSettings(s, patch)),
    [],
  );

  return { session, add, update, remove, move, setSettings };
}
