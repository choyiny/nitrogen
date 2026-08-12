import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders editor add buttons and an export control", () => {
  render(<App />);
  expect(screen.getByRole("button", { name: "userPrompt" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /export png/i })).toBeInTheDocument();
});
