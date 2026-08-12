import {
  emptyDoc, seedDoc, addBlock, updateBlock, removeBlock, moveBlock,
  updateWindow, updateFrame, setActiveWindow, loadDoc, saveDoc, STORAGE_KEY,
} from "./docStore";

test("addBlock targets the given window only", () => {
  const d = addBlock(emptyDoc(), 1, "bash", "b1");
  expect(d.windows[1].blocks).toHaveLength(1);
  expect(d.windows[0].blocks).toHaveLength(0);
});

test("updateBlock patches the block in the right window", () => {
  let d = addBlock(emptyDoc(), 0, "userPrompt", "b1");
  d = updateBlock(d, 0, "b1", { text: "hi" } as any);
  expect((d.windows[0].blocks[0] as any).text).toBe("hi");
});

test("removeBlock drops from the right window", () => {
  let d = addBlock(emptyDoc(), 0, "read", "b1");
  d = removeBlock(d, 0, "b1");
  expect(d.windows[0].blocks).toHaveLength(0);
});

test("moveBlock up swaps within a window", () => {
  let d = addBlock(addBlock(emptyDoc(), 0, "read", "a"), 0, "bash", "b");
  d = moveBlock(d, 0, "b", "up");
  expect(d.windows[0].blocks.map((b) => b.id)).toEqual(["b", "a"]);
});

test("updateWindow patches permission mode of one window", () => {
  const d = updateWindow(emptyDoc(), 1, { permissionMode: "plan" });
  expect(d.windows[1].permissionMode).toBe("plan");
  expect(d.windows[0].permissionMode).toBe("normal");
});

test("updateFrame patches the frame", () => {
  const d = updateFrame(emptyDoc(), { layout: "split-h" });
  expect(d.frame.layout).toBe("split-h");
});

test("setActiveWindow sets the active index", () => {
  expect(setActiveWindow(emptyDoc(), 1).activeWindow).toBe(1);
});

test("seedDoc has two windows and split-h layout", () => {
  const d = seedDoc();
  expect(d.windows).toHaveLength(2);
  expect(d.windows[0].blocks.length).toBeGreaterThan(0);
  expect(d.windows[1].blocks.length).toBeGreaterThan(0);
  expect(d.frame.layout).toBe("split-h");
  expect(d.windows[0].agent).toBe("claude-code");
  expect(d.windows[1].agent).toBe("gemini");
});

test("save then load round-trips", () => {
  const d = addBlock(emptyDoc(), 0, "bash", "b1");
  saveDoc(d);
  expect(loadDoc()).toEqual(d);
});

test("loadDoc returns seed when storage empty", () => {
  localStorage.clear();
  expect(loadDoc().windows[0].blocks.length).toBeGreaterThan(0);
});

test("loadDoc falls back to empty on invalid JSON", () => {
  localStorage.setItem(STORAGE_KEY, "{bad");
  expect(loadDoc()).toEqual(emptyDoc());
});

test("loadDoc falls back to empty when windows length wrong", () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ windows: [], frame: {}, activeWindow: 0 }));
  expect(loadDoc()).toEqual(emptyDoc());
});
