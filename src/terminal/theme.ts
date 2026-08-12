import { PermissionMode } from "../state/types";

export const THEME = {
  bg: "#1c1917",
  text: "#e7e5e4",
  dim: "#78716c",
  coral: "#d97757",
  promptBorder: "#57534e",
  add: "#4ade80",
  remove: "#f87171",
  context: "#a8a29e",
} as const;

export function permissionLabel(mode: PermissionMode): string {
  switch (mode) {
    case "normal": return "";
    case "acceptEdits": return "⏵⏵ accept edits on (shift+tab to cycle)";
    case "plan": return "⏵ plan mode on (shift+tab to cycle)";
  }
}
