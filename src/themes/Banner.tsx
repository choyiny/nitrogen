import type { BannerSpec } from "./agentThemes";

// Solid on-brand fill (spec.gradient[0]) rather than a background-clip:text gradient:
// html-to-image can drop background-clip:text and export a blank (transparent) banner,
// which would silently break the exported PNG. A solid color always renders in export.
export function Banner({ spec }: { spec: BannerSpec }) {
  return (
    <div
      className="ccsg-banner"
      style={{ fontWeight: 700, letterSpacing: "0.18em", fontSize: 20, marginBottom: 12, color: spec.gradient[0] }}
    >
      {spec.text}
    </div>
  );
}
