import { useState } from "react";

type Props = { onExport: () => void };

export function Header({ onExport }: Props) {
  const [copied, setCopied] = useState(false);
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable (insecure context) */
    }
  };
  return (
    <header className="ccsg-header">
      <div className="ccsg-brand">
        <div className="ccsg-tile" aria-hidden="true">
          <span className="ccsg-tile-num">7</span>
          <span className="ccsg-tile-sym">N</span>
        </div>
        <div className="ccsg-brand-text">
          <span className="ccsg-wordmark">nitrogen</span>
          <span className="ccsg-tagline">coding agent snippets</span>
        </div>
      </div>
      <div className="ccsg-actions">
        <button className="ccsg-copy-btn" onClick={copyLink}>
          {copied ? "Copied!" : "Copy link"}
        </button>
        <button className="ccsg-export-btn" onClick={onExport}>
          Export PNG
        </button>
      </div>
    </header>
  );
}
