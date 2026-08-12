import { render, screen, fireEvent } from "@testing-library/react";
import { FrameControls } from "./FrameControls";
import { defaultFrame } from "../state/types";

test("layout select fires updateFrame with the chosen layout", () => {
  const updateFrame = vi.fn();
  render(<FrameControls frame={defaultFrame()} updateFrame={updateFrame} />);
  fireEvent.change(screen.getByLabelText(/layout/i), { target: { value: "split-h" } });
  expect(updateFrame).toHaveBeenCalledWith({ layout: "split-h" });
});

test("padding range fires updateFrame with a number", () => {
  const updateFrame = vi.fn();
  render(<FrameControls frame={defaultFrame()} updateFrame={updateFrame} />);
  fireEvent.change(screen.getByLabelText(/padding/i), { target: { value: "80" } });
  expect(updateFrame).toHaveBeenCalledWith({ padding: 80 });
});
