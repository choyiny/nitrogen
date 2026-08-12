import { render, screen, fireEvent } from "@testing-library/react";
import { EditorPane } from "./EditorPane";
import { emptyDoc, addBlock, updateFrame } from "../state/docStore";

function noop() {}
const actions = { addBlock: noop, updateBlock: noop, removeBlock: noop, moveBlock: noop, updateWindow: noop, updateFrame: noop, setActiveWindow: noop };

test("add button calls addBlock with active window and type", () => {
  const addBlockFn = vi.fn();
  const doc = updateFrame(emptyDoc(), { layout: "split-h" });
  doc.activeWindow = 1;
  render(<EditorPane {...actions} addBlock={addBlockFn} doc={doc} />);
  fireEvent.click(screen.getByRole("button", { name: "bash" }));
  expect(addBlockFn).toHaveBeenCalledWith(1, "bash");
});

test("tab bar hidden in single layout", () => {
  render(<EditorPane {...actions} doc={emptyDoc()} />);
  expect(screen.queryByRole("button", { name: /window 2/i })).toBeNull();
});

test("tab bar shown in split layout and click sets active window", () => {
  const setActiveWindow = vi.fn();
  const doc = updateFrame(emptyDoc(), { layout: "split-h" });
  render(<EditorPane {...actions} setActiveWindow={setActiveWindow} doc={doc} />);
  fireEvent.click(screen.getByRole("button", { name: /window 2/i }));
  expect(setActiveWindow).toHaveBeenCalledWith(1);
});

test("remove button targets the active window's block", () => {
  const removeBlock = vi.fn();
  const doc = addBlock(emptyDoc(), 0, "read", "b1");
  render(<EditorPane {...actions} removeBlock={removeBlock} doc={doc} />);
  fireEvent.click(screen.getByRole("button", { name: "✕" }));
  expect(removeBlock).toHaveBeenCalledWith(0, "b1");
});
