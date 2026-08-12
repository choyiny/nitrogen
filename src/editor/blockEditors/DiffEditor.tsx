import type { DiffLine } from "../../state/types";

export function parseDiff(text: string): DiffLine[] {
  if (text === "") return [];
  return text.split("\n").map((line) => {
    if (line.startsWith("+")) return { kind: "add", text: line.slice(1) };
    if (line.startsWith("-")) return { kind: "remove", text: line.slice(1) };
    return { kind: "context", text: line };
  });
}

export function formatDiff(lines: DiffLine[]): string {
  return lines
    .map((l) => (l.kind === "add" ? "+" : l.kind === "remove" ? "-" : "") + l.text)
    .join("\n");
}

export function DiffEditor({
  lines, onChange,
}: { lines: DiffLine[]; onChange: (lines: DiffLine[]) => void }) {
  return (
    <textarea
      aria-label="diff"
      rows={5}
      placeholder={"+ added line\n- removed line\n  context line"}
      value={formatDiff(lines)}
      onChange={(e) => onChange(parseDiff(e.target.value))}
    />
  );
}
