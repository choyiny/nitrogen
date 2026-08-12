import { renderHook } from "@testing-library/react";
import { useDoc } from "./useDoc";
import { encodeDoc } from "./shareLink";
import { emptyDoc, addBlock } from "./docStore";

afterEach(() => {
  window.location.hash = "";
});

test("initializes from the URL hash when present", () => {
  const shared = addBlock(emptyDoc(), 1, "bash", "x1");
  window.location.hash = "#s=" + encodeDoc(shared);
  const { result } = renderHook(() => useDoc());
  expect(result.current.doc.windows[1].blocks).toHaveLength(1);
  expect(result.current.doc.windows[0].blocks).toHaveLength(0);
});

test("falls back to seed/localStorage when there is no hash", () => {
  window.location.hash = "";
  localStorage.clear();
  const { result } = renderHook(() => useDoc());
  // seed has content in both windows
  expect(result.current.doc.windows[0].blocks.length).toBeGreaterThan(0);
});
