import { toPng } from "html-to-image";

export function triggerDownload(dataUrl: string, filename: string): void {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  a.click();
}

export async function exportPng(
  node: HTMLElement,
  filename = "nitrogen.png",
): Promise<void> {
  const dataUrl = await toPng(node, { pixelRatio: 2, cacheBust: true });
  triggerDownload(dataUrl, filename);
}
