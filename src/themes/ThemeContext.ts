import { createContext, useContext } from "react";
import type { AgentTheme } from "./agentThemes";
import { THEMES } from "./agentThemes";

export const ThemeContext = createContext<AgentTheme>(THEMES["claude-code"]);
export const useTheme = () => useContext(ThemeContext);
