import { ReactNode } from "react";

export function Bullet() {
  return <span style={{ color: "#d97757" }}>●</span>;
}

export function Connector({ children }: { children: ReactNode }) {
  return (
    <div style={{ color: "#78716c", paddingLeft: 2 }}>
      <span style={{ color: "#78716c" }}>{"  ⎿  "}</span>
      <span>{children}</span>
    </div>
  );
}
