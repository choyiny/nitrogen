import { ReactNode } from "react";
import { useTheme } from "../../themes/ThemeContext";

export function Bullet() {
  const t = useTheme();
  return <span style={{ color: t.colors.accent }}>{t.assistantMarker}</span>;
}

export function Connector({ children }: { children: ReactNode }) {
  const t = useTheme();
  return (
    <div style={{ color: t.colors.dim, paddingLeft: 2 }}>
      <span style={{ color: t.colors.dim }}>{`  ${t.connector}  `}</span>
      <span>{children}</span>
    </div>
  );
}
