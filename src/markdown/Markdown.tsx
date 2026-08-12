import { marked } from "marked";

marked.setOptions({ breaks: true });

export function Markdown({ source }: { source: string }) {
  const html = marked.parse(source, { async: false }) as string;
  return <div className="ccsg-md" dangerouslySetInnerHTML={{ __html: html }} />;
}
