import { PermissionMode } from "../state/types";

export function permissionLabel(mode: PermissionMode): string {
  switch (mode) {
    case "normal":
      return "";
    case "acceptEdits":
      return "⏵⏵ accept edits on";
    case "plan":
      return "⏵ plan mode on";
    case "bypassPermissions":
      return "⏵⏵ bypass permissions on";
  }
}

export function permissionColor(mode: PermissionMode): string {
  switch (mode) {
    case "normal":
      return "#78716c";
    case "acceptEdits":
      return "#d97757";
    case "plan":
      return "#d97757";
    case "bypassPermissions":
      return "#ef4444";
  }
}
