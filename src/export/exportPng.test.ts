import { vi } from "vitest";
import { triggerDownload } from "./exportPng";

test("triggerDownload creates an anchor and clicks it", () => {
  const click = vi.fn();
  const a = document.createElement("a");
  a.click = click;
  const spy = vi.spyOn(document, "createElement").mockReturnValue(a);
  triggerDownload("data:image/png;base64,xxx", "out.png");
  expect(a.href).toContain("data:image/png");
  expect(a.download).toBe("out.png");
  expect(click).toHaveBeenCalled();
  spy.mockRestore();
});
