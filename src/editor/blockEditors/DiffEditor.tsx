import type { DiffLine } from "../../state/types";
import { formatDiff, parseDiff } from "./diff";

export function DiffEditor({
  lines,
  onChange,
}: {
  lines: DiffLine[];
  onChange: (lines: DiffLine[]) => void;
}) {
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
