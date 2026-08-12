import { marked } from "marked";
import DOMPurify from "dompurify";

marked.setOptions({ breaks: true });

export function Markdown({ source }: { source: string }) {
  const html = marked.parse(source, { async: false }) as string;
  return <div className="ccsg-md" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }} />;
}
