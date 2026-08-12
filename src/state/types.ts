export type PermissionMode = "normal" | "acceptEdits" | "plan";
export type BackdropId =
  | "transparent" | "slate" | "coral" | "indigo" | "black";
export type AspectId =
  | "auto" | "16:9" | "square" | "twitter" | "linkedin";

export interface DiffLine {
  kind: "add" | "remove" | "context";
  text: string;
}

export interface UserPromptBlock { id: string; type: "userPrompt"; text: string; }
export interface AssistantBlock { id: string; type: "assistant"; markdown: string; }
export interface BashBlock { id: string; type: "bash"; command: string; output: string; }
export interface EditBlock { id: string; type: "edit"; filepath: string; lines: DiffLine[]; }
export interface ReadBlock { id: string; type: "read"; filepath: string; summary: string; }
export interface BareBlock { id: string; type: "bare"; text: string; }

export type Block =
  | UserPromptBlock | AssistantBlock | BashBlock
  | EditBlock | ReadBlock | BareBlock;
export type BlockType = Block["type"];

export const BLOCK_TYPES: BlockType[] = [
  "userPrompt", "assistant", "bash", "edit", "read", "bare",
];

export interface SessionSettings {
  permissionMode: PermissionMode;
  cwd: string;
  model: string;
  backdrop: BackdropId;
  padding: number;
  aspect: AspectId;
}

export interface Session {
  blocks: Block[];
  settings: SessionSettings;
}

export function newBlock(type: BlockType, id: string): Block {
  switch (type) {
    case "userPrompt": return { id, type, text: "" };
    case "assistant": return { id, type, markdown: "" };
    case "bash": return { id, type, command: "", output: "" };
    case "edit": return { id, type, filepath: "", lines: [] };
    case "read": return { id, type, filepath: "", summary: "" };
    case "bare": return { id, type, text: "" };
  }
}

export function defaultSettings(): SessionSettings {
  return {
    permissionMode: "normal",
    cwd: "~/project",
    model: "claude-opus-4-8",
    backdrop: "coral",
    padding: 48,
    aspect: "auto",
  };
}
