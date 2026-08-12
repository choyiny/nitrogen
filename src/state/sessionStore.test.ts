import {
  emptySession, addBlock, updateBlock, removeBlock, moveBlock,
  updateSettings, loadSession, saveSession, STORAGE_KEY, seedSession,
} from "./sessionStore";

test("addBlock appends a new block of the given type", () => {
  const s = addBlock(emptySession(), "bash", "b1");
  expect(s.blocks).toHaveLength(1);
  expect(s.blocks[0]).toMatchObject({ id: "b1", type: "bash", command: "" });
});

test("updateBlock patches only the matching block", () => {
  let s = addBlock(emptySession(), "userPrompt", "b1");
  s = updateBlock(s, "b1", { text: "hello" } as any);
  expect((s.blocks[0] as any).text).toBe("hello");
});

test("removeBlock drops the block", () => {
  let s = addBlock(emptySession(), "read", "b1");
  s = removeBlock(s, "b1");
  expect(s.blocks).toHaveLength(0);
});

test("moveBlock up swaps with previous", () => {
  let s = addBlock(addBlock(emptySession(), "read", "a"), "bash", "b");
  s = moveBlock(s, "b", "up");
  expect(s.blocks.map((b) => b.id)).toEqual(["b", "a"]);
});

test("moveBlock up on first block is a no-op", () => {
  let s = addBlock(emptySession(), "read", "a");
  s = moveBlock(s, "a", "up");
  expect(s.blocks.map((b) => b.id)).toEqual(["a"]);
});

test("updateSettings patches settings", () => {
  const s = updateSettings(emptySession(), { permissionMode: "plan" });
  expect(s.settings.permissionMode).toBe("plan");
});

test("save then load round-trips the session", () => {
  const s = addBlock(emptySession(), "bash", "b1");
  saveSession(s);
  expect(loadSession()).toEqual(s);
});

test("loadSession falls back to empty on invalid JSON", () => {
  localStorage.setItem(STORAGE_KEY, "{not json");
  expect(loadSession()).toEqual(emptySession());
});

test("seedSession has a mix of block types", () => {
  const types = seedSession().blocks.map((b) => b.type);
  expect(types).toContain("userPrompt");
  expect(types).toContain("assistant");
  expect(types.length).toBeGreaterThanOrEqual(3);
});

test("loadSession returns the seed when storage is empty", () => {
  localStorage.clear();
  expect(loadSession().blocks.length).toBeGreaterThan(0);
});
