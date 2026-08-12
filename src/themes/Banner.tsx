import type { BannerSpec } from "./agentThemes";

export function Banner({ spec }: { spec: BannerSpec }) {
  const gradient = spec.gradient.length > 1
    ? {
        background: `linear-gradient(90deg, ${spec.gradient.join(", ")})`,
        WebkitBackgroundClip: "text" as const,
        backgroundClip: "text" as const,
        color: "transparent",
      }
    : { color: spec.gradient[0] };
  return (
    <div
      className="ccsg-banner"
      style={{ fontWeight: 700, letterSpacing: "0.18em", fontSize: 20, marginBottom: 12, ...gradient }}
    >
      {spec.text}
    </div>
  );
}
