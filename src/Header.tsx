type Props = { onExport: () => void };

export function Header({ onExport }: Props) {
  return (
    <header className="ccsg-header">
      <div className="ccsg-brand">
        <div className="ccsg-tile" aria-hidden="true">
          <span className="ccsg-tile-num">7</span>
          <span className="ccsg-tile-sym">N</span>
        </div>
        <div className="ccsg-brand-text">
          <span className="ccsg-wordmark">nitrogen</span>
          <span className="ccsg-tagline">claude code snippets</span>
        </div>
      </div>
      <button className="ccsg-export-btn" onClick={onExport}>
        Export PNG
      </button>
    </header>
  );
}
