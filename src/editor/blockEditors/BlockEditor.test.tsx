import { render, screen, fireEvent } from "@testing-library/react";
import { BlockEditor } from "./BlockEditor";
import { parseDiff, formatDiff } from "./diff";
import type { Block } from "../../state/types";

test("parseDiff classifies lines by prefix", () => {
  expect(parseDiff("+a\n-b\nc")).toEqual([
    { kind: "add", text: "a" },
    { kind: "remove", text: "b" },
    { kind: "context", text: "c" },
  ]);
});

test("formatDiff round-trips", () => {
  const lines = parseDiff("+a\n-b\nc");
  expect(formatDiff(lines)).toBe("+a\n-b\nc");
});

test("editing a userPrompt textarea fires onChange with text patch", () => {
  const onChange = vi.fn();
  const b: Block = { id: "1", type: "userPrompt", text: "" };
  render(<BlockEditor block={b} onChange={onChange} />);
  fireEvent.change(screen.getByRole("textbox"), { target: { value: "hi" } });
  expect(onChange).toHaveBeenCalledWith({ text: "hi" });
});
