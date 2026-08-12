import { render, screen, fireEvent } from "@testing-library/react";
import { WindowSettings } from "./WindowSettings";
import { newWindow } from "../state/types";

test("permission mode select fires onChange", () => {
  const onChange = vi.fn();
  render(<WindowSettings win={newWindow()} onChange={onChange} />);
  fireEvent.change(screen.getByLabelText(/permission mode/i), { target: { value: "bypassPermissions" } });
  expect(onChange).toHaveBeenCalledWith({ permissionMode: "bypassPermissions" });
});

test("cwd input fires onChange", () => {
  const onChange = vi.fn();
  render(<WindowSettings win={newWindow()} onChange={onChange} />);
  fireEvent.change(screen.getByLabelText(/cwd/i), { target: { value: "~/app" } });
  expect(onChange).toHaveBeenCalledWith({ cwd: "~/app" });
});

test("agent select fires onChange with the agent and its default model", () => {
  const onChange = vi.fn();
  render(<WindowSettings win={newWindow()} onChange={onChange} />);
  fireEvent.change(screen.getByLabelText(/agent/i), { target: { value: "gemini" } });
  expect(onChange).toHaveBeenCalledWith({ agent: "gemini", model: "gemini-2.5-pro" });
});
