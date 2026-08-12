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

test("strips inline event handlers from markdown HTML (XSS via shared links)", () => {
  const { container } = render(<Markdown source={'<img src=x onerror="alert(1)">'} />);
  expect(container.querySelector("img")?.getAttribute("onerror")).toBeNull();
});

test("removes <script> tags from markdown HTML", () => {
  const { container } = render(<Markdown source={"<script>alert(1)</script>hello"} />);
  expect(container.querySelector("script")).toBeNull();
});

test("keeps safe markdown formatting (bold still renders)", () => {
  const { container } = render(<Markdown source={"**bold**"} />);
  expect(container.querySelector("strong")?.textContent).toBe("bold");
});
