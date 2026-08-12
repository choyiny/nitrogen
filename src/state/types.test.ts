import { newBlock, BLOCK_TYPES, newWindow, defaultFrame } from "./types";

test("newBlock creates a userPrompt with empty text", () => {
  const b = newBlock("userPrompt", "id1");
  expect(b).toEqual({ id: "id1", type: "userPrompt", text: "" });
});

test("newBlock creates an edit block with empty diff lines", () => {
  const b = newBlock("edit", "id2");
  expect(b).toEqual({ id: "id2", type: "edit", filepath: "", lines: [] });
});

test("BLOCK_TYPES lists all six block types", () => {
  expect(BLOCK_TYPES).toEqual(["userPrompt", "assistant", "bash", "edit", "read", "bare"]);
});

test("newWindow is an empty window with normal mode", () => {
  expect(newWindow()).toEqual({
    blocks: [],
    agent: "claude-code",
    permissionMode: "normal",
    cwd: "~/project",
    model: "opus-4-8",
  });
});

test("defaultFrame is coral/auto/single", () => {
  expect(defaultFrame()).toEqual({
    backdrop: "coral",
    padding: 48,
    aspect: "auto",
    layout: "single",
  });
});
