import { THEMES, themeFor } from "./agentThemes";

test("themeFor returns the matching theme", () => {
  expect(themeFor("gemini").name).toBe("Gemini CLI");
  expect(themeFor("codex").id).toBe("codex");
});

test("every agent has a full theme with a default model", () => {
  for (const id of ["claude-code", "codex", "gemini"] as const) {
    const t = THEMES[id];
    expect(t.id).toBe(id);
    expect(t.defaultModel.length).toBeGreaterThan(0);
    expect(t.colors.accent).toMatch(/^#/);
    expect(t.toolLabels.bash.length).toBeGreaterThan(0);
  }
});

test("claude tool label is Bash, gemini is Shell", () => {
  expect(themeFor("claude-code").toolLabels.bash).toBe("Bash");
  expect(themeFor("gemini").toolLabels.bash).toBe("Shell");
});

test("claude status uses the permission label; gemini shows context", () => {
  const claude = themeFor("claude-code").statusBar({ permissionMode: "acceptEdits", cwd: "~/p", model: "opus-4-8" });
  expect(claude.leftText).toBe("⏵⏵ accept edits on");
  const gem = themeFor("gemini").statusBar({ permissionMode: "plan", cwd: "~/p", model: "gemini-2.5-pro" });
  expect(gem.rightText).toContain("context left");
});
