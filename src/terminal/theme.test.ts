import { permissionLabel, permissionColor } from "./theme";

test("normal mode has empty label", () => {
  expect(permissionLabel("normal")).toBe("");
});

test("acceptEdits label", () => {
  expect(permissionLabel("acceptEdits")).toBe("⏵⏵ accept edits on");
});

test("plan label", () => {
  expect(permissionLabel("plan")).toBe("⏵ plan mode on");
});

test("bypassPermissions label", () => {
  expect(permissionLabel("bypassPermissions")).toBe("⏵⏵ bypass permissions on");
});

test("bypassPermissions renders in red", () => {
  expect(permissionColor("bypassPermissions")).toBe("#ef4444");
});
