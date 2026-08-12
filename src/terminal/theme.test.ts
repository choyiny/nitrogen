import { permissionLabel } from "./theme";

test("normal mode has empty label", () => {
  expect(permissionLabel("normal")).toBe("");
});

test("acceptEdits label", () => {
  expect(permissionLabel("acceptEdits")).toBe("⏵⏵ accept edits on (shift+tab to cycle)");
});

test("plan label", () => {
  expect(permissionLabel("plan")).toBe("⏵ plan mode on (shift+tab to cycle)");
});
