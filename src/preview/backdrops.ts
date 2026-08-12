import type { BackdropId, AspectId } from "../state/types";

export function backgroundFor(id: BackdropId): string {
  switch (id) {
    case "transparent": return "transparent";
    case "black": return "#0c0a09";
    case "slate": return "linear-gradient(135deg, #334155, #0f172a)";
    case "coral": return "linear-gradient(135deg, #f0a68a, #d97757)";
    case "indigo": return "linear-gradient(135deg, #818cf8, #4338ca)";
  }
}

export function aspectRatioFor(id: AspectId): string | undefined {
  switch (id) {
    case "auto": return undefined;
    case "16:9": return "16 / 9";
    case "square": return "1 / 1";
    case "twitter": return "16 / 9";
    case "linkedin": return "1200 / 627";
  }
}
