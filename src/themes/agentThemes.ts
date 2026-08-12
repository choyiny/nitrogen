import type { Agent, PermissionMode } from "../state/types";
import { permissionLabel, permissionColor } from "../terminal/theme";

export interface ThemeColors {
  bg: string; text: string; dim: string; accent: string;
  promptBorder: string; add: string; remove: string; context: string; codeBg: string;
}
export interface StatusBar { leftText: string; leftColor: string; rightText: string; }

export interface AgentTheme {
  id: Agent;
  name: string;
  defaultModel: string;
  colors: ThemeColors;
  prompt: { kind: "box" | "plain"; glyph: string };
  assistantMarker: string;
  connector: string;
  toolLabels: { bash: string; edit: string; read: string };
  statusBar: (w: { permissionMode: PermissionMode; cwd: string; model: string }) => StatusBar;
}

const DIFF = { add: "#4ade80", remove: "#f87171" };

function codexApproval(mode: PermissionMode): string {
  switch (mode) {
    case "normal": return "suggest";
    case "acceptEdits": return "auto-edit";
    case "plan": return "read-only";
    case "bypassPermissions": return "full-auto";
  }
}

export const THEMES: Record<Agent, AgentTheme> = {
  "claude-code": {
    id: "claude-code", name: "Claude Code", defaultModel: "opus-4-8",
    colors: { bg: "#1c1917", text: "#e7e5e4", dim: "#78716c", accent: "#d97757",
      promptBorder: "#57534e", add: DIFF.add, remove: DIFF.remove, context: "#a8a29e", codeBg: "#292524" },
    prompt: { kind: "box", glyph: ">" },
    assistantMarker: "●", connector: "⎿",
    toolLabels: { bash: "Bash", edit: "Update", read: "Read" },
    statusBar: (w) => ({
      leftText: permissionLabel(w.permissionMode),
      leftColor: permissionColor(w.permissionMode),
      rightText: `${w.cwd} · ${w.model}`,
    }),
  },
  codex: {
    id: "codex", name: "Codex CLI", defaultModel: "gpt-5-codex",
    colors: { bg: "#0d0d0d", text: "#ececec", dim: "#8e8e8e", accent: "#10a37f",
      promptBorder: "#333333", add: DIFF.add, remove: DIFF.remove, context: "#8e8e8e", codeBg: "#1a1a1a" },
    prompt: { kind: "plain", glyph: "›" },
    assistantMarker: "•", connector: "└",
    toolLabels: { bash: "shell", edit: "apply_patch", read: "read" },
    statusBar: (w) => ({
      leftText: codexApproval(w.permissionMode), leftColor: "#10a37f",
      rightText: `${w.cwd} · ${w.model}`,
    }),
  },
  gemini: {
    id: "gemini", name: "Gemini CLI", defaultModel: "gemini-2.5-pro",
    colors: { bg: "#0b0e14", text: "#e6e6e6", dim: "#8b949e", accent: "#4796E3",
      promptBorder: "#30363d", add: DIFF.add, remove: DIFF.remove, context: "#8b949e", codeBg: "#161b22" },
    prompt: { kind: "box", glyph: ">" },
    assistantMarker: "✦", connector: "⎿",
    toolLabels: { bash: "Shell", edit: "Edit", read: "ReadFile" },
    statusBar: (w) => ({
      leftText: "no sandbox", leftColor: "#8b949e",
      rightText: `${w.cwd} · ${w.model} (98% context left)`,
    }),
  },
};

export function themeFor(agent: Agent): AgentTheme {
  return THEMES[agent] ?? THEMES["claude-code"];
}
