import { render, screen } from "@testing-library/react";
import { BlockView } from "./BlockView";
import type { Block } from "../../state/types";
import { ThemeContext } from "../../themes/ThemeContext";
import { themeFor } from "../../themes/agentThemes";

test("userPrompt renders the prompt box with text", () => {
  const b: Block = { id: "1", type: "userPrompt", text: "fix the bug" };
  render(<BlockView block={b} />);
  expect(screen.getByTestId("prompt-box")).toHaveTextContent("fix the bug");
});

test("assistant renders markdown", () => {
  const b: Block = { id: "1", type: "assistant", markdown: "**done**" };
  const { container } = render(<BlockView block={b} />);
  expect(container.querySelector("strong")?.textContent).toBe("done");
});

test("bash renders command and output", () => {
  const b: Block = { id: "1", type: "bash", command: "npm test", output: "3 passed" };
  render(<BlockView block={b} />);
  expect(screen.getByText(/npm test/)).toBeInTheDocument();
  expect(screen.getByText(/3 passed/)).toBeInTheDocument();
});

test("edit renders diff lines with kind markers", () => {
  const b: Block = {
    id: "1", type: "edit", filepath: "a.ts",
    lines: [
      { kind: "add", text: "const x = 1" },
      { kind: "remove", text: "const x = 0" },
    ],
  };
  const { container } = render(<BlockView block={b} />);
  expect(container.querySelector('[data-diff="add"]')?.textContent).toContain("const x = 1");
  expect(container.querySelector('[data-diff="remove"]')?.textContent).toContain("const x = 0");
});

test("read renders filepath and summary", () => {
  const b: Block = { id: "1", type: "read", filepath: "a.ts", summary: "Read 42 lines" };
  render(<BlockView block={b} />);
  expect(screen.getByText(/a\.ts/)).toBeInTheDocument();
  expect(screen.getByText(/Read 42 lines/)).toBeInTheDocument();
});

test("gemini theme renders ✦ marker and Shell/ReadFile tool labels", () => {
  const bash: Block = { id: "1", type: "bash", command: "ls", output: "" };
  const { rerender } = render(
    <ThemeContext.Provider value={themeFor("gemini")}><BlockView block={bash} /></ThemeContext.Provider>
  );
  expect(screen.getByText("Shell")).toBeInTheDocument();
  expect(screen.getByText("✦")).toBeInTheDocument();

  const read: Block = { id: "2", type: "read", filepath: "a.ts", summary: "Read 10 lines" };
  rerender(<ThemeContext.Provider value={themeFor("gemini")}><BlockView block={read} /></ThemeContext.Provider>);
  expect(screen.getByText("ReadFile")).toBeInTheDocument();
});
