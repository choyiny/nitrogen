import type { RefObject } from "react";
import type { Session } from "../state/types";
import { Terminal } from "../terminal/Terminal";
import { backgroundFor, aspectRatioFor } from "./backdrops";

type Props = { session: Session; captureRef: RefObject<HTMLDivElement | null> };

export function PreviewPane({ session, captureRef }: Props) {
  const { settings } = session;
  const aspect = aspectRatioFor(settings.aspect);
  return (
    <div className="ccsg-preview">
      <div
        ref={captureRef}
        style={{
          background: backgroundFor(settings.backdrop),
          padding: settings.padding,
          aspectRatio: aspect,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        <div style={{ width: "100%", maxWidth: 720 }}>
          <Terminal session={session} />
        </div>
      </div>
    </div>
  );
}
