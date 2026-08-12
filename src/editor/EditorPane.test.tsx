import { render, screen, fireEvent } from "@testing-library/react";
import { EditorPane } from "./EditorPane";
import { emptySession, addBlock } from "../state/sessionStore";

function noop() {}

test("clicking an add button calls add with that type", () => {
  const add = vi.fn();
  render(
    <EditorPane
      session={emptySession()} add={add} update={noop}
      remove={noop} move={noop} setSettings={noop}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "bash" }));
  expect(add).toHaveBeenCalledWith("bash");
});

test("remove button calls remove with block id", () => {
  const remove = vi.fn();
  const session = addBlock(emptySession(), "read", "b1");
  render(
    <EditorPane
      session={session} add={noop} update={noop}
      remove={remove} move={noop} setSettings={noop}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "✕" }));
  expect(remove).toHaveBeenCalledWith("b1");
});

test("permission mode select calls setSettings", () => {
  const setSettings = vi.fn();
  render(
    <EditorPane
      session={emptySession()} add={noop} update={noop}
      remove={noop} move={noop} setSettings={setSettings}
    />,
  );
  fireEvent.change(screen.getByLabelText(/permission mode/i), {
    target: { value: "plan" },
  });
  expect(setSettings).toHaveBeenCalledWith({ permissionMode: "plan" });
});
