import { render, screen } from "@testing-library/react";
import { createRef } from "react";
import { PreviewPane } from "./PreviewPane";
import { seedDoc, updateFrame, emptyDoc } from "../state/docStore";

test("single layout renders one terminal", () => {
  const doc = updateFrame(seedDoc(), { layout: "single" });
  const { container } = render(<PreviewPane doc={doc} captureRef={createRef()} />);
  expect(container.querySelectorAll(".ccsg-terminal").length).toBe(1);
});

test("split-h renders two terminals in a row", () => {
  const doc = updateFrame(seedDoc(), { layout: "split-h" });
  const { container } = render(<PreviewPane doc={doc} captureRef={createRef()} />);
  expect(container.querySelectorAll(".ccsg-terminal").length).toBe(2);
  expect(screen.getByTestId("window-container")).toHaveStyle({ flexDirection: "row" });
});

test("split-v renders two terminals in a column", () => {
  const doc = updateFrame(emptyDoc(), { layout: "split-v" });
  const { container } = render(<PreviewPane doc={doc} captureRef={createRef()} />);
  expect(container.querySelectorAll(".ccsg-terminal").length).toBe(2);
  expect(screen.getByTestId("window-container")).toHaveStyle({ flexDirection: "column" });
});
