import { render, screen, fireEvent } from "@testing-library/react";
import { Header } from "./Header";

test("renders the nitrogen wordmark and the element tile", () => {
  render(<Header onExport={() => {}} />);
  expect(screen.getByText("nitrogen")).toBeInTheDocument();
  expect(screen.getByText("N")).toBeInTheDocument();
  expect(screen.getByText("7")).toBeInTheDocument();
});

test("Export button fires onExport", () => {
  const onExport = vi.fn();
  render(<Header onExport={onExport} />);
  fireEvent.click(screen.getByRole("button", { name: /export png/i }));
  expect(onExport).toHaveBeenCalled();
});

test("Copy link button copies the URL and shows Copied!", async () => {
  const writeText = vi.fn().mockResolvedValue(undefined);
  Object.assign(navigator, { clipboard: { writeText } });
  render(<Header onExport={() => {}} />);
  fireEvent.click(screen.getByRole("button", { name: /copy link/i }));
  expect(writeText).toHaveBeenCalledWith(window.location.href);
  expect(await screen.findByRole("button", { name: /copied/i })).toBeInTheDocument();
});
