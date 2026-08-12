export type PermissionMode = "normal" | "acceptEdits" | "plan" | "bypassPermissions";
export type Agent = "claude-code" | "codex" | "gemini";
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

export interface TerminalWindow {
  blocks: Block[];
  agent: Agent;
  permissionMode: PermissionMode;
  cwd: string;
  model: string;
}

export type Layout = "single" | "split-h" | "split-v";

export interface FrameSettings {
  backdrop: BackdropId;
  padding: number;
  aspect: AspectId;
  layout: Layout;
}

export interface Doc {
  windows: [TerminalWindow, TerminalWindow];
  frame: FrameSettings;
  activeWindow: 0 | 1;
}

export function newWindow(): TerminalWindow {
  return { blocks: [], agent: "claude-code", permissionMode: "normal", cwd: "~/project", model: "opus-4-8" };
}

export function defaultFrame(): FrameSettings {
  return { backdrop: "coral", padding: 48, aspect: "auto", layout: "single" };
}
