import { render, screen } from "@testing-library/react";
import { Banner } from "./Banner";

test("renders the banner text in a solid color (export-safe, not transparent)", () => {
  render(<Banner spec={{ text: "GEMINI", gradient: ["#4796E3", "#9168E0"] }} />);
  const el = screen.getByText("GEMINI");
  expect(el).toBeInTheDocument();
  expect(el).toHaveStyle({ color: "#4796E3" });
  // must NOT be transparent (the export-unsafe failure mode)
  expect((el as HTMLElement).style.color).not.toBe("transparent");
});
