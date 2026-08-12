import { render } from "@testing-library/react";
import { Markdown } from "./Markdown";

test("renders bold text as <strong>", () => {
  const { container } = render(<Markdown source="**hi**" />);
  expect(container.querySelector("strong")?.textContent).toBe("hi");
});

test("renders a fenced code block as <pre><code>", () => {
  const { container } = render(<Markdown source={"```\nx = 1\n```"} />);
  expect(container.querySelector("pre code")?.textContent).toContain("x = 1");
});

test("renders a bullet list", () => {
  const { container } = render(<Markdown source={"- a\n- b"} />);
  expect(container.querySelectorAll("li")).toHaveLength(2);
});
