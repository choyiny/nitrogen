import { backgroundFor, aspectRatioFor } from "./backdrops";

test("transparent backdrop", () => {
  expect(backgroundFor("transparent")).toBe("transparent");
});

test("coral backdrop is a gradient", () => {
  expect(backgroundFor("coral")).toContain("gradient");
});

test("auto aspect is undefined", () => {
  expect(aspectRatioFor("auto")).toBeUndefined();
});

test("square aspect is 1 / 1", () => {
  expect(aspectRatioFor("square")).toBe("1 / 1");
});
