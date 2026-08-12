import { vi } from "vitest";

vi.mock("html-to-image", () => ({
  toPng: vi.fn().mockResolvedValue("data:image/png;base64,zzz"),
}));

import { triggerDownload, exportPng } from "./exportPng";

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

test("exportPng downloads as nitrogen.png by default", async () => {
  const a = document.createElement("a");
  a.click = vi.fn();
  const spy = vi.spyOn(document, "createElement").mockReturnValue(a);
  await exportPng(a);
  expect(a.download).toBe("nitrogen.png");
  spy.mockRestore();
});
