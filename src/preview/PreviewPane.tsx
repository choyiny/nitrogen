import type { RefObject } from "react";
import type { Doc } from "../state/types";
import { Terminal } from "../terminal/Terminal";
import { backgroundFor, aspectRatioFor } from "./backdrops";

type Props = { doc: Doc; captureRef: RefObject<HTMLDivElement | null> };

export function PreviewPane({ doc, captureRef }: Props) {
  const { frame, windows } = doc;
  const aspect = aspectRatioFor(frame.aspect);
  const isSplit = frame.layout !== "single";
  const direction = frame.layout === "split-v" ? "column" : "row";
  const shown = isSplit ? windows : [windows[0]];
  return (
    <div className="ccsg-preview">
      <div
        ref={captureRef}
        style={{
          background: backgroundFor(frame.backdrop),
          padding: frame.padding,
          aspectRatio: aspect,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        <div
          data-testid="window-container"
          style={{
            display: "flex",
            flexDirection: direction,
            gap: 24,
            width: "100%",
            justifyContent: "center",
            alignItems: isSplit ? "stretch" : "center",
          }}
        >
          {shown.map((w, i) => (
            <div
              key={i}
              style={{
                flex: isSplit ? 1 : "0 1 720px",
                minWidth: 0,
                maxWidth: isSplit ? undefined : 720,
                width: "100%",
              }}
            >
              <Terminal win={w} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
