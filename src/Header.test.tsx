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
