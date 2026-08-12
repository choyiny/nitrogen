import { newBlock, defaultSettings, BLOCK_TYPES } from "./types";

test("newBlock creates a userPrompt with empty text", () => {
  const b = newBlock("userPrompt", "id1");
  expect(b).toEqual({ id: "id1", type: "userPrompt", text: "" });
});

test("newBlock creates an edit block with empty diff lines", () => {
  const b = newBlock("edit", "id2");
  expect(b).toEqual({ id: "id2", type: "edit", filepath: "", lines: [] });
});

test("BLOCK_TYPES lists all six block types", () => {
  expect(BLOCK_TYPES).toEqual([
    "userPrompt", "assistant", "bash", "edit", "read", "bare",
  ]);
});

test("defaultSettings returns normal permission mode", () => {
  expect(defaultSettings().permissionMode).toBe("normal");
});
