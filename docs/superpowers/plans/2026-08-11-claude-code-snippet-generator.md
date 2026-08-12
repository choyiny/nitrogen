# Claude Code Snippet Generator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a pure client-side web app that composes a multi-turn Claude Code session from typed blocks and exports it as a shareable Claude Code TUI screenshot (2× PNG).

**Architecture:** A Vite + React + TypeScript SPA. Session state (an ordered list of typed blocks + settings) lives in a small store backed by `localStorage`. A `terminal/` renderer turns the session into a faithful, stylized Claude Code TUI. A two-pane UI (block editor left, live preview right) drives it, and `html-to-image` exports the preview node to a 2× PNG with embedded fonts.

**Tech Stack:** Vite, React 18, TypeScript, Tailwind CSS v4 (`@tailwindcss/vite`), Vitest + @testing-library/react + jsdom, `html-to-image`, `marked` (markdown), `@fontsource/jetbrains-mono`.

## Global Constraints

- Package manager: **npm**. Node 22.
- Pure client-side. No backend, no network calls at runtime, no accounts.
- All source under `src/`. Tests colocated as `*.test.ts` / `*.test.tsx` next to the code they cover.
- TypeScript strict mode on. No `any` in committed code unless narrowly justified.
- Terminal theme is Claude-Code-default only; visual variety comes from the backdrop.
- Tool block set is exactly: Bash, Edit, Read (plus userPrompt, assistant, bare). Do not add more block types.
- Everything in the terminal renders in monospace (JetBrains Mono).
- Commit after every task with a `feat:`/`test:`/`chore:` message.

---

### Task 1: Project scaffold + toolchain

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.node.json`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/index.css`, `.gitignore`, `vitest.setup.ts`
- Test: `src/App.test.tsx`

**Interfaces:**
- Consumes: nothing.
- Produces: a working Vite dev/build/test toolchain; `App` React component exported from `src/App.tsx`.

- [ ] **Step 1: Scaffold dependencies**

Run:
```bash
npm init -y
npm install react react-dom marked html-to-image @fontsource/jetbrains-mono
npm install -D vite @vitejs/plugin-react typescript @types/react @types/react-dom \
  tailwindcss @tailwindcss/vite vitest @testing-library/react @testing-library/jest-dom \
  @testing-library/user-event jsdom
```

- [ ] **Step 2: Write config files**

`vite.config.ts`:
```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
  },
});
```

`vitest.setup.ts`:
```ts
import "@testing-library/jest-dom";
```

`tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "types": ["vitest/globals", "@testing-library/jest-dom"]
  },
  "include": ["src", "vitest.setup.ts"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

`tsconfig.node.json`:
```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "strict": true
  },
  "include": ["vite.config.ts"]
}
```

`src/index.css`:
```css
@import "tailwindcss";
@import "@fontsource/jetbrains-mono/400.css";
@import "@fontsource/jetbrains-mono/500.css";
@import "@fontsource/jetbrains-mono/700.css";
```

`index.html`:
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Claude Code Snippet Generator</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

`src/main.tsx`:
```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

`.gitignore`:
```
node_modules
dist
*.local
.DS_Store
```

Add scripts to `package.json`:
```json
"scripts": {
  "dev": "vite",
  "build": "tsc -b && vite build",
  "test": "vitest run",
  "test:watch": "vitest"
}
```
Also set `"type": "module"` in `package.json`.

- [ ] **Step 3: Write the failing smoke test**

`src/App.test.tsx`:
```tsx
import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders the app title", () => {
  render(<App />);
  expect(screen.getByText(/Claude Code Snippet Generator/i)).toBeInTheDocument();
});
```

- [ ] **Step 4: Run test, verify it fails**

Run: `npm test`
Expected: FAIL (App has no such text / does not exist).

- [ ] **Step 5: Write minimal App**

`src/App.tsx`:
```tsx
export default function App() {
  return <h1>Claude Code Snippet Generator</h1>;
}
```

- [ ] **Step 6: Run test + typecheck, verify pass**

Run: `npm test && npx tsc -b`
Expected: test PASS, no type errors.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: scaffold Vite + React + TS + Tailwind + Vitest toolchain"
```

---

### Task 2: Domain types

**Files:**
- Create: `src/state/types.ts`
- Test: `src/state/types.test.ts`

**Interfaces:**
- Produces:
  - `PermissionMode = "normal" | "acceptEdits" | "plan"`
  - `type BackdropId` (string union, see below), `type AspectId` (string union)
  - `interface DiffLine { kind: "add" | "remove" | "context"; text: string }`
  - Block interfaces each with `id: string` and a `type` discriminant:
    `UserPromptBlock`, `AssistantBlock`, `BashBlock`, `EditBlock`, `ReadBlock`, `BareBlock`
  - `type Block` = union of the above; `type BlockType = Block["type"]`
  - `interface SessionSettings`, `interface Session`
  - `const BLOCK_TYPES: BlockType[]`
  - `function newBlock(type: BlockType, id: string): Block` (returns a block with empty/default fields)
  - `function defaultSettings(): SessionSettings`

- [ ] **Step 1: Write the failing test**

`src/state/types.test.ts`:
```ts
import { newBlock, defaultSettings, BLOCK_TYPES } from "./types";

test("newBlock creates a userPrompt with empty text", () => {
  const b = newBlock("userPrompt", "id1");
  expect(b).toEqual({ id: "id1", type: "userPrompt", text: "" });
});

test("newBlock creates an edit block with empty diff lines", () => {
  const b = newBlock("edit", "id2");
  expect(b).toEqual({ id: "id2", type: "edit", filepath: "", lines: [] });
});

test("BLOCK_TYPES lists all six block types", () => {
  expect(BLOCK_TYPES).toEqual([
    "userPrompt", "assistant", "bash", "edit", "read", "bare",
  ]);
});

test("defaultSettings returns normal permission mode", () => {
  expect(defaultSettings().permissionMode).toBe("normal");
});
```

- [ ] **Step 2: Run test, verify fail**

Run: `npm test -- types`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement types**

`src/state/types.ts`:
```ts
export type PermissionMode = "normal" | "acceptEdits" | "plan";
export type BackdropId =
  | "transparent" | "slate" | "coral" | "indigo" | "black";
export type AspectId =
  | "auto" | "16:9" | "square" | "twitter" | "linkedin";

export interface DiffLine {
  kind: "add" | "remove" | "context";
  text: string;
}

export interface UserPromptBlock { id: string; type: "userPrompt"; text: string; }
export interface AssistantBlock { id: string; type: "assistant"; markdown: string; }
export interface BashBlock { id: string; type: "bash"; command: string; output: string; }
export interface EditBlock { id: string; type: "edit"; filepath: string; lines: DiffLine[]; }
export interface ReadBlock { id: string; type: "read"; filepath: string; summary: string; }
export interface BareBlock { id: string; type: "bare"; text: string; }

export type Block =
  | UserPromptBlock | AssistantBlock | BashBlock
  | EditBlock | ReadBlock | BareBlock;
export type BlockType = Block["type"];

export const BLOCK_TYPES: BlockType[] = [
  "userPrompt", "assistant", "bash", "edit", "read", "bare",
];

export interface SessionSettings {
  permissionMode: PermissionMode;
  cwd: string;
  model: string;
  backdrop: BackdropId;
  padding: number;
  aspect: AspectId;
}

export interface Session {
  blocks: Block[];
  settings: SessionSettings;
}

export function newBlock(type: BlockType, id: string): Block {
  switch (type) {
    case "userPrompt": return { id, type, text: "" };
    case "assistant": return { id, type, markdown: "" };
    case "bash": return { id, type, command: "", output: "" };
    case "edit": return { id, type, filepath: "", lines: [] };
    case "read": return { id, type, filepath: "", summary: "" };
    case "bare": return { id, type, text: "" };
  }
}

export function defaultSettings(): SessionSettings {
  return {
    permissionMode: "normal",
    cwd: "~/project",
    model: "claude-opus-4-8",
    backdrop: "coral",
    padding: 48,
    aspect: "auto",
  };
}
```

- [ ] **Step 4: Run test + typecheck, verify pass**

Run: `npm test -- types && npx tsc -b`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/state/types.ts src/state/types.test.ts
git commit -m "feat: add session and block domain types"
```

---

### Task 3: Session store + localStorage persistence

**Files:**
- Create: `src/state/sessionStore.ts`, `src/state/useSession.ts`
- Test: `src/state/sessionStore.test.ts`

**Interfaces:**
- Consumes: `Block`, `BlockType`, `Session`, `SessionSettings`, `newBlock`, `defaultSettings` from `./types`.
- Produces:
  - `const STORAGE_KEY = "ccsg.session.v1"`
  - `function emptySession(): Session` (no blocks, default settings)
  - Pure reducers operating on `Session` and returning a **new** `Session`:
    - `addBlock(s: Session, type: BlockType, id: string): Session`
    - `updateBlock(s: Session, id: string, patch: Partial<Block>): Session`
    - `removeBlock(s: Session, id: string): Session`
    - `moveBlock(s: Session, id: string, dir: "up" | "down"): Session`
    - `updateSettings(s: Session, patch: Partial<SessionSettings>): Session`
  - `function loadSession(): Session` (reads localStorage, falls back to `emptySession()` on missing/invalid JSON)
  - `function saveSession(s: Session): void`
  - `useSession()` hook (Task uses `useSession.ts`) exposing `{ session, add, update, remove, move, setSettings }`, auto-saving on change. (Hook itself is exercised via components later; unit-test the pure reducers here.)

- [ ] **Step 1: Write failing tests**

`src/state/sessionStore.test.ts`:
```ts
import {
  emptySession, addBlock, updateBlock, removeBlock, moveBlock,
  updateSettings, loadSession, saveSession, STORAGE_KEY,
} from "./sessionStore";

test("addBlock appends a new block of the given type", () => {
  const s = addBlock(emptySession(), "bash", "b1");
  expect(s.blocks).toHaveLength(1);
  expect(s.blocks[0]).toMatchObject({ id: "b1", type: "bash", command: "" });
});

test("updateBlock patches only the matching block", () => {
  let s = addBlock(emptySession(), "userPrompt", "b1");
  s = updateBlock(s, "b1", { text: "hello" } as any);
  expect((s.blocks[0] as any).text).toBe("hello");
});

test("removeBlock drops the block", () => {
  let s = addBlock(emptySession(), "read", "b1");
  s = removeBlock(s, "b1");
  expect(s.blocks).toHaveLength(0);
});

test("moveBlock up swaps with previous", () => {
  let s = addBlock(addBlock(emptySession(), "read", "a"), "bash", "b");
  s = moveBlock(s, "b", "up");
  expect(s.blocks.map((b) => b.id)).toEqual(["b", "a"]);
});

test("moveBlock up on first block is a no-op", () => {
  let s = addBlock(emptySession(), "read", "a");
  s = moveBlock(s, "a", "up");
  expect(s.blocks.map((b) => b.id)).toEqual(["a"]);
});

test("updateSettings patches settings", () => {
  const s = updateSettings(emptySession(), { permissionMode: "plan" });
  expect(s.settings.permissionMode).toBe("plan");
});

test("save then load round-trips the session", () => {
  const s = addBlock(emptySession(), "bash", "b1");
  saveSession(s);
  expect(loadSession()).toEqual(s);
});

test("loadSession falls back to empty on invalid JSON", () => {
  localStorage.setItem(STORAGE_KEY, "{not json");
  expect(loadSession()).toEqual(emptySession());
});
```

- [ ] **Step 2: Run tests, verify fail**

Run: `npm test -- sessionStore`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement the store**

`src/state/sessionStore.ts`:
```ts
import {
  Block, BlockType, Session, SessionSettings, newBlock, defaultSettings,
} from "./types";

export const STORAGE_KEY = "ccsg.session.v1";

export function emptySession(): Session {
  return { blocks: [], settings: defaultSettings() };
}

export function addBlock(s: Session, type: BlockType, id: string): Session {
  return { ...s, blocks: [...s.blocks, newBlock(type, id)] };
}

export function updateBlock(s: Session, id: string, patch: Partial<Block>): Session {
  return {
    ...s,
    blocks: s.blocks.map((b) => (b.id === id ? ({ ...b, ...patch } as Block) : b)),
  };
}

export function removeBlock(s: Session, id: string): Session {
  return { ...s, blocks: s.blocks.filter((b) => b.id !== id) };
}

export function moveBlock(s: Session, id: string, dir: "up" | "down"): Session {
  const i = s.blocks.findIndex((b) => b.id === id);
  if (i < 0) return s;
  const j = dir === "up" ? i - 1 : i + 1;
  if (j < 0 || j >= s.blocks.length) return s;
  const blocks = [...s.blocks];
  [blocks[i], blocks[j]] = [blocks[j], blocks[i]];
  return { ...s, blocks };
}

export function updateSettings(s: Session, patch: Partial<SessionSettings>): Session {
  return { ...s, settings: { ...s.settings, ...patch } };
}

export function saveSession(s: Session): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    /* ignore quota/serialization errors */
  }
}

export function loadSession(): Session {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptySession();
    const parsed = JSON.parse(raw) as Session;
    if (!parsed || !Array.isArray(parsed.blocks) || !parsed.settings) {
      return emptySession();
    }
    return parsed;
  } catch {
    return emptySession();
  }
}
```

- [ ] **Step 4: Run tests, verify pass**

Run: `npm test -- sessionStore`
Expected: PASS.

- [ ] **Step 5: Implement the hook**

`src/state/useSession.ts`:
```ts
import { useCallback, useEffect, useState } from "react";
import { Block, BlockType, SessionSettings } from "./types";
import {
  addBlock, loadSession, moveBlock, removeBlock, saveSession,
  updateBlock, updateSettings,
} from "./sessionStore";

let counter = 0;
const genId = () => `blk_${Date.now().toString(36)}_${counter++}`;

export function useSession() {
  const [session, setSession] = useState(loadSession);
  useEffect(() => saveSession(session), [session]);

  const add = useCallback((t: BlockType) => setSession((s) => addBlock(s, t, genId())), []);
  const update = useCallback(
    (id: string, patch: Partial<Block>) => setSession((s) => updateBlock(s, id, patch)),
    [],
  );
  const remove = useCallback((id: string) => setSession((s) => removeBlock(s, id)), []);
  const move = useCallback(
    (id: string, dir: "up" | "down") => setSession((s) => moveBlock(s, id, dir)),
    [],
  );
  const setSettings = useCallback(
    (patch: Partial<SessionSettings>) => setSession((s) => updateSettings(s, patch)),
    [],
  );

  return { session, add, update, remove, move, setSettings };
}
```

- [ ] **Step 6: Typecheck, commit**

Run: `npm test -- sessionStore && npx tsc -b`
```bash
git add src/state/sessionStore.ts src/state/sessionStore.test.ts src/state/useSession.ts
git commit -m "feat: add session store, reducers, and persistence hook"
```

---

### Task 4: Markdown renderer

**Files:**
- Create: `src/markdown/Markdown.tsx`
- Test: `src/markdown/Markdown.test.tsx`

**Interfaces:**
- Consumes: `marked`.
- Produces: `function Markdown({ source }: { source: string }): JSX.Element` — renders markdown to HTML inside a `<div className="ccsg-md">`. Uses `marked.parse(source)` (sync) and `dangerouslySetInnerHTML`. Configure `marked` with `breaks: true`.

- [ ] **Step 1: Write failing tests**

`src/markdown/Markdown.test.tsx`:
```tsx
import { render } from "@testing-library/react";
import { Markdown } from "./Markdown";

test("renders bold text as <strong>", () => {
  const { container } = render(<Markdown source="**hi**" />);
  expect(container.querySelector("strong")?.textContent).toBe("hi");
});

test("renders a fenced code block as <pre><code>", () => {
  const { container } = render(<Markdown source={"```\nx = 1\n```"} />);
  expect(container.querySelector("pre code")?.textContent).toContain("x = 1");
});

test("renders a bullet list", () => {
  const { container } = render(<Markdown source={"- a\n- b"} />);
  expect(container.querySelectorAll("li")).toHaveLength(2);
});
```

- [ ] **Step 2: Run, verify fail**

Run: `npm test -- Markdown`
Expected: FAIL.

- [ ] **Step 3: Implement**

`src/markdown/Markdown.tsx`:
```tsx
import { marked } from "marked";

marked.setOptions({ breaks: true });

export function Markdown({ source }: { source: string }) {
  const html = marked.parse(source, { async: false }) as string;
  return <div className="ccsg-md" dangerouslySetInnerHTML={{ __html: html }} />;
}
```

- [ ] **Step 4: Run, verify pass; commit**

Run: `npm test -- Markdown && npx tsc -b`
```bash
git add src/markdown/Markdown.tsx src/markdown/Markdown.test.tsx
git commit -m "feat: add markdown renderer for assistant blocks"
```

---

### Task 5: Terminal theme tokens + base shell

**Files:**
- Create: `src/terminal/theme.ts`, `src/terminal/Terminal.tsx`, `src/terminal/terminal.css`
- Test: `src/terminal/theme.test.ts`

**Interfaces:**
- Consumes: `Session`, `PermissionMode` from state types.
- Produces:
  - `theme.ts`: `const THEME` object with hex color tokens:
    `bg`, `text`, `dim`, `coral`, `promptBorder`, `add`, `remove`, `context`.
  - `permissionLabel(mode: PermissionMode): string` → `""` for normal,
    `"⏵⏵ accept edits on (shift+tab to cycle)"` for acceptEdits,
    `"⏵ plan mode on (shift+tab to cycle)"` for plan.
  - `Terminal.tsx`: `function Terminal({ session }: { session: Session }): JSX.Element`
    — outer `<div className="ccsg-terminal">` applying the theme, mapping each block to
    its renderer (added in Task 6), then a status bar. For now render an empty shell +
    status bar; block rendering wired in Task 6.
  - `terminal.css`: scopes `.ccsg-terminal` font-family to JetBrains Mono, background,
    text color, padding, border-radius; and `.ccsg-md` element styles (lists, code, etc.).

- [ ] **Step 1: Write failing test**

`src/terminal/theme.test.ts`:
```ts
import { permissionLabel } from "./theme";

test("normal mode has empty label", () => {
  expect(permissionLabel("normal")).toBe("");
});

test("acceptEdits label", () => {
  expect(permissionLabel("acceptEdits")).toBe("⏵⏵ accept edits on (shift+tab to cycle)");
});

test("plan label", () => {
  expect(permissionLabel("plan")).toBe("⏵ plan mode on (shift+tab to cycle)");
});
```

- [ ] **Step 2: Run, verify fail**

Run: `npm test -- theme`
Expected: FAIL.

- [ ] **Step 3: Implement theme + shell**

`src/terminal/theme.ts`:
```ts
import { PermissionMode } from "../state/types";

export const THEME = {
  bg: "#1c1917",
  text: "#e7e5e4",
  dim: "#78716c",
  coral: "#d97757",
  promptBorder: "#57534e",
  add: "#4ade80",
  remove: "#f87171",
  context: "#a8a29e",
} as const;

export function permissionLabel(mode: PermissionMode): string {
  switch (mode) {
    case "normal": return "";
    case "acceptEdits": return "⏵⏵ accept edits on (shift+tab to cycle)";
    case "plan": return "⏵ plan mode on (shift+tab to cycle)";
  }
}
```

`src/terminal/terminal.css`:
```css
.ccsg-terminal {
  font-family: "JetBrains Mono", ui-monospace, monospace;
  font-size: 14px;
  line-height: 1.55;
  background: #1c1917;
  color: #e7e5e4;
  padding: 20px 22px 8px;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.35);
  white-space: pre-wrap;
  word-break: break-word;
}
.ccsg-terminal .ccsg-md { display: inline; }
.ccsg-terminal .ccsg-md p { margin: 0 0 8px; }
.ccsg-terminal .ccsg-md p:last-child { margin-bottom: 0; }
.ccsg-terminal .ccsg-md ul,
.ccsg-terminal .ccsg-md ol { margin: 4px 0 8px; padding-left: 20px; }
.ccsg-terminal .ccsg-md code {
  background: #292524; padding: 1px 5px; border-radius: 4px; font-size: 0.92em;
}
.ccsg-terminal .ccsg-md pre {
  background: #0c0a09; padding: 10px 12px; border-radius: 8px;
  overflow-x: auto; margin: 6px 0 10px;
}
.ccsg-terminal .ccsg-md pre code { background: transparent; padding: 0; }
.ccsg-terminal .ccsg-md strong { color: #fafaf9; font-weight: 700; }
.ccsg-terminal .ccsg-md h1,
.ccsg-terminal .ccsg-md h2,
.ccsg-terminal .ccsg-md h3 { color: #fafaf9; font-weight: 700; margin: 8px 0 6px; }
```

`src/terminal/Terminal.tsx`:
```tsx
import { Session } from "../state/types";
import { permissionLabel } from "./theme";
import "./terminal.css";

export function Terminal({ session }: { session: Session }) {
  const { blocks, settings } = session;
  const label = permissionLabel(settings.permissionMode);
  return (
    <div className="ccsg-terminal">
      <div className="ccsg-blocks">
        {blocks.length === 0 && (
          <div style={{ color: "#78716c" }}>Add a block to get started…</div>
        )}
        {/* Block rendering wired in Task 6 */}
      </div>
      <div
        className="ccsg-statusbar"
        style={{
          display: "flex", justifyContent: "space-between",
          marginTop: 14, color: "#78716c", fontSize: 12,
        }}
      >
        <span style={{ color: label ? "#d97757" : "#78716c" }}>{label}</span>
        <span>{settings.cwd} · {settings.model}</span>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run, verify pass; commit**

Run: `npm test -- theme && npx tsc -b`
```bash
git add src/terminal/theme.ts src/terminal/theme.test.ts src/terminal/Terminal.tsx src/terminal/terminal.css
git commit -m "feat: add terminal theme tokens, status bar, and shell"
```

---

### Task 6: Block renderers

**Files:**
- Create: `src/terminal/blocks/BlockView.tsx`, `src/terminal/blocks/parts.tsx`
- Modify: `src/terminal/Terminal.tsx` (wire block rendering)
- Test: `src/terminal/blocks/BlockView.test.tsx`

**Interfaces:**
- Consumes: `Block`, `DiffLine` from state types; `Markdown` from `../../markdown/Markdown`.
- Produces:
  - `parts.tsx`: presentational helpers
    - `Bullet()` → the coral `●` marker span
    - `Connector({ children })` → dim `⎿` prefixed indented line
  - `BlockView({ block }: { block: Block }): JSX.Element` — switches on `block.type`:
    - `userPrompt`: a bordered box (`data-testid="prompt-box"`) with `>` and the text
    - `assistant`: `<Bullet/>` + `<Markdown source={block.markdown} />`
    - `bash`: `<Bullet/> Bash(command)` then `<Connector>` output lines
    - `edit`: `<Bullet/> Update(filepath)` then diff lines; add → green (`data-diff="add"`),
      remove → red (`data-diff="remove"`), context → muted, each prefixed `+`/`-`/` `
    - `read`: `<Bullet/> Read(filepath)` then `<Connector>{summary}</Connector>`
    - `bare`: dim text line

- [ ] **Step 1: Write failing tests**

`src/terminal/blocks/BlockView.test.tsx`:
```tsx
import { render, screen } from "@testing-library/react";
import { BlockView } from "./BlockView";
import type { Block } from "../../state/types";

test("userPrompt renders the prompt box with text", () => {
  const b: Block = { id: "1", type: "userPrompt", text: "fix the bug" };
  render(<BlockView block={b} />);
  expect(screen.getByTestId("prompt-box")).toHaveTextContent("fix the bug");
});

test("assistant renders markdown", () => {
  const b: Block = { id: "1", type: "assistant", markdown: "**done**" };
  const { container } = render(<BlockView block={b} />);
  expect(container.querySelector("strong")?.textContent).toBe("done");
});

test("bash renders command and output", () => {
  const b: Block = { id: "1", type: "bash", command: "npm test", output: "3 passed" };
  render(<BlockView block={b} />);
  expect(screen.getByText(/npm test/)).toBeInTheDocument();
  expect(screen.getByText(/3 passed/)).toBeInTheDocument();
});

test("edit renders diff lines with kind markers", () => {
  const b: Block = {
    id: "1", type: "edit", filepath: "a.ts",
    lines: [
      { kind: "add", text: "const x = 1" },
      { kind: "remove", text: "const x = 0" },
    ],
  };
  const { container } = render(<BlockView block={b} />);
  expect(container.querySelector('[data-diff="add"]')?.textContent).toContain("const x = 1");
  expect(container.querySelector('[data-diff="remove"]')?.textContent).toContain("const x = 0");
});

test("read renders filepath and summary", () => {
  const b: Block = { id: "1", type: "read", filepath: "a.ts", summary: "Read 42 lines" };
  render(<BlockView block={b} />);
  expect(screen.getByText(/a\.ts/)).toBeInTheDocument();
  expect(screen.getByText(/Read 42 lines/)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run, verify fail**

Run: `npm test -- BlockView`
Expected: FAIL.

- [ ] **Step 3: Implement parts + BlockView**

`src/terminal/blocks/parts.tsx`:
```tsx
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
```

`src/terminal/blocks/BlockView.tsx`:
```tsx
import type { Block, DiffLine } from "../../state/types";
import { Markdown } from "../../markdown/Markdown";
import { Bullet, Connector } from "./parts";

const diffColor: Record<DiffLine["kind"], string> = {
  add: "#4ade80", remove: "#f87171", context: "#a8a29e",
};
const diffPrefix: Record<DiffLine["kind"], string> = {
  add: "+", remove: "-", context: " ",
};

export function BlockView({ block }: { block: Block }) {
  switch (block.type) {
    case "userPrompt":
      return (
        <div
          data-testid="prompt-box"
          style={{
            border: "1px solid #57534e", borderRadius: 8,
            padding: "8px 12px", margin: "10px 0",
          }}
        >
          <span style={{ color: "#78716c" }}>{"> "}</span>
          <span>{block.text}</span>
        </div>
      );
    case "assistant":
      return (
        <div style={{ margin: "10px 0", display: "flex", gap: 8 }}>
          <Bullet />
          <div style={{ flex: 1 }}><Markdown source={block.markdown} /></div>
        </div>
      );
    case "bash":
      return (
        <div style={{ margin: "10px 0" }}>
          <div><Bullet /> <span style={{ color: "#e7e5e4" }}>Bash</span>(<span style={{ color: "#a8a29e" }}>{block.command}</span>)</div>
          {block.output && <Connector>{block.output}</Connector>}
        </div>
      );
    case "edit":
      return (
        <div style={{ margin: "10px 0" }}>
          <div><Bullet /> <span style={{ color: "#e7e5e4" }}>Update</span>(<span style={{ color: "#a8a29e" }}>{block.filepath}</span>)</div>
          <div style={{ paddingLeft: 24, marginTop: 4 }}>
            {block.lines.map((l, i) => (
              <div key={i} data-diff={l.kind} style={{ color: diffColor[l.kind] }}>
                {diffPrefix[l.kind]} {l.text}
              </div>
            ))}
          </div>
        </div>
      );
    case "read":
      return (
        <div style={{ margin: "10px 0" }}>
          <div><Bullet /> <span style={{ color: "#e7e5e4" }}>Read</span>(<span style={{ color: "#a8a29e" }}>{block.filepath}</span>)</div>
          <Connector>{block.summary}</Connector>
        </div>
      );
    case "bare":
      return <div style={{ color: "#78716c", margin: "8px 0" }}>{block.text}</div>;
  }
}
```

- [ ] **Step 4: Wire into Terminal**

In `src/terminal/Terminal.tsx`, import `BlockView` and replace the placeholder comment:
```tsx
import { BlockView } from "./blocks/BlockView";
// ...
{blocks.map((b) => <BlockView key={b.id} block={b} />)}
```

- [ ] **Step 5: Run, verify pass; commit**

Run: `npm test -- BlockView && npx tsc -b`
```bash
git add src/terminal/blocks src/terminal/Terminal.tsx
git commit -m "feat: add per-block terminal renderers"
```

---

### Task 7: Per-block editors

**Files:**
- Create: `src/editor/blockEditors/BlockEditor.tsx`, `src/editor/blockEditors/DiffEditor.tsx`
- Test: `src/editor/blockEditors/BlockEditor.test.tsx`

**Interfaces:**
- Consumes: `Block`, `DiffLine` from state types.
- Produces:
  - `BlockEditor({ block, onChange }: { block: Block; onChange: (patch: Partial<Block>) => void })`
    — renders the correct labeled inputs per block type:
    - `userPrompt`, `bare`: one `<textarea>` bound to `text`
    - `assistant`: one `<textarea>` bound to `markdown`
    - `bash`: `command` input + `output` textarea
    - `read`: `filepath` input + `summary` input
    - `edit`: `filepath` input + `<DiffEditor lines onChange>`
  - `DiffEditor({ lines, onChange }: { lines: DiffLine[]; onChange: (lines: DiffLine[]) => void })`
    — a single textarea where each line becomes a `DiffLine`: leading `+` → add,
    leading `-` → remove, else context. `parseDiff(text: string): DiffLine[]` and
    `formatDiff(lines: DiffLine[]): string` exported for testing.

- [ ] **Step 1: Write failing tests**

`src/editor/blockEditors/BlockEditor.test.tsx`:
```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { BlockEditor } from "./BlockEditor";
import { parseDiff, formatDiff } from "./DiffEditor";
import type { Block } from "../../state/types";

test("parseDiff classifies lines by prefix", () => {
  expect(parseDiff("+a\n-b\nc")).toEqual([
    { kind: "add", text: "a" },
    { kind: "remove", text: "b" },
    { kind: "context", text: "c" },
  ]);
});

test("formatDiff round-trips", () => {
  const lines = parseDiff("+a\n-b\nc");
  expect(formatDiff(lines)).toBe("+a\n-b\nc");
});

test("editing a userPrompt textarea fires onChange with text patch", () => {
  const onChange = vi.fn();
  const b: Block = { id: "1", type: "userPrompt", text: "" };
  render(<BlockEditor block={b} onChange={onChange} />);
  fireEvent.change(screen.getByRole("textbox"), { target: { value: "hi" } });
  expect(onChange).toHaveBeenCalledWith({ text: "hi" });
});
```

- [ ] **Step 2: Run, verify fail**

Run: `npm test -- BlockEditor`
Expected: FAIL.

- [ ] **Step 3: Implement DiffEditor**

`src/editor/blockEditors/DiffEditor.tsx`:
```tsx
import type { DiffLine } from "../../state/types";

export function parseDiff(text: string): DiffLine[] {
  if (text === "") return [];
  return text.split("\n").map((line) => {
    if (line.startsWith("+")) return { kind: "add", text: line.slice(1) };
    if (line.startsWith("-")) return { kind: "remove", text: line.slice(1) };
    return { kind: "context", text: line };
  });
}

export function formatDiff(lines: DiffLine[]): string {
  return lines
    .map((l) => (l.kind === "add" ? "+" : l.kind === "remove" ? "-" : "") + l.text)
    .join("\n");
}

export function DiffEditor({
  lines, onChange,
}: { lines: DiffLine[]; onChange: (lines: DiffLine[]) => void }) {
  return (
    <textarea
      aria-label="diff"
      rows={5}
      placeholder={"+ added line\n- removed line\n  context line"}
      value={formatDiff(lines)}
      onChange={(e) => onChange(parseDiff(e.target.value))}
    />
  );
}
```

- [ ] **Step 4: Implement BlockEditor**

`src/editor/blockEditors/BlockEditor.tsx`:
```tsx
import type { Block } from "../../state/types";
import { DiffEditor } from "./DiffEditor";

type Props = { block: Block; onChange: (patch: Partial<Block>) => void };

export function BlockEditor({ block, onChange }: Props) {
  switch (block.type) {
    case "userPrompt":
    case "bare":
      return (
        <textarea
          rows={3}
          value={block.text}
          onChange={(e) => onChange({ text: e.target.value } as Partial<Block>)}
        />
      );
    case "assistant":
      return (
        <textarea
          rows={4}
          value={block.markdown}
          onChange={(e) => onChange({ markdown: e.target.value } as Partial<Block>)}
        />
      );
    case "bash":
      return (
        <div>
          <input
            placeholder="command"
            value={block.command}
            onChange={(e) => onChange({ command: e.target.value } as Partial<Block>)}
          />
          <textarea
            rows={3}
            placeholder="output"
            value={block.output}
            onChange={(e) => onChange({ output: e.target.value } as Partial<Block>)}
          />
        </div>
      );
    case "read":
      return (
        <div>
          <input
            placeholder="filepath"
            value={block.filepath}
            onChange={(e) => onChange({ filepath: e.target.value } as Partial<Block>)}
          />
          <input
            placeholder="summary (e.g. Read 42 lines)"
            value={block.summary}
            onChange={(e) => onChange({ summary: e.target.value } as Partial<Block>)}
          />
        </div>
      );
    case "edit":
      return (
        <div>
          <input
            placeholder="filepath"
            value={block.filepath}
            onChange={(e) => onChange({ filepath: e.target.value } as Partial<Block>)}
          />
          <DiffEditor
            lines={block.lines}
            onChange={(lines) => onChange({ lines } as Partial<Block>)}
          />
        </div>
      );
  }
}
```

- [ ] **Step 5: Run, verify pass; commit**

Run: `npm test -- BlockEditor && npx tsc -b`
```bash
git add src/editor/blockEditors
git commit -m "feat: add per-block editor inputs and diff editor"
```

---

### Task 8: Editor pane (block list, add menu, settings)

**Files:**
- Create: `src/editor/EditorPane.tsx`, `src/editor/SettingsPanel.tsx`
- Test: `src/editor/EditorPane.test.tsx`

**Interfaces:**
- Consumes: `Session`, `BlockType`, `SessionSettings`, `BLOCK_TYPES` from types;
  `BlockEditor` from `./blockEditors/BlockEditor`.
- Produces:
  - `EditorPane({ session, add, update, remove, move, setSettings })` — props match the
    `useSession()` return shape (minus `session` destructured). Renders:
    - `SettingsPanel`
    - an "Add block" row: one button per `BLOCK_TYPES` entry (label = type), calls `add(type)`
    - the block list: each row shows the type label, `BlockEditor`, and ↑ / ↓ / ✕ buttons
      wired to `move(id,"up")`, `move(id,"down")`, `remove(id)`
  - `SettingsPanel({ settings, setSettings })`:
    - permission mode `<select>` (normal / acceptEdits / plan)
    - cwd `<input>`, model `<input>`
    - backdrop `<select>` (transparent/slate/coral/indigo/black)
    - padding `<input type="range" min=0 max=160>`
    - aspect `<select>` (auto/16:9/square/twitter/linkedin)

- [ ] **Step 1: Write failing tests**

`src/editor/EditorPane.test.tsx`:
```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { EditorPane } from "./EditorPane";
import { emptySession, addBlock } from "../state/sessionStore";

function noop() {}

test("clicking an add button calls add with that type", () => {
  const add = vi.fn();
  render(
    <EditorPane
      session={emptySession()} add={add} update={noop}
      remove={noop} move={noop} setSettings={noop}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "bash" }));
  expect(add).toHaveBeenCalledWith("bash");
});

test("remove button calls remove with block id", () => {
  const remove = vi.fn();
  const session = addBlock(emptySession(), "read", "b1");
  render(
    <EditorPane
      session={session} add={noop} update={noop}
      remove={remove} move={noop} setSettings={noop}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "✕" }));
  expect(remove).toHaveBeenCalledWith("b1");
});

test("permission mode select calls setSettings", () => {
  const setSettings = vi.fn();
  render(
    <EditorPane
      session={emptySession()} add={noop} update={noop}
      remove={noop} move={noop} setSettings={setSettings}
    />,
  );
  fireEvent.change(screen.getByLabelText(/permission mode/i), {
    target: { value: "plan" },
  });
  expect(setSettings).toHaveBeenCalledWith({ permissionMode: "plan" });
});
```

- [ ] **Step 2: Run, verify fail**

Run: `npm test -- EditorPane`
Expected: FAIL.

- [ ] **Step 3: Implement SettingsPanel**

`src/editor/SettingsPanel.tsx`:
```tsx
import type { SessionSettings } from "../state/types";

type Props = {
  settings: SessionSettings;
  setSettings: (patch: Partial<SessionSettings>) => void;
};

export function SettingsPanel({ settings, setSettings }: Props) {
  return (
    <div className="ccsg-settings">
      <label>
        Permission mode
        <select
          value={settings.permissionMode}
          onChange={(e) => setSettings({ permissionMode: e.target.value as SessionSettings["permissionMode"] })}
        >
          <option value="normal">normal</option>
          <option value="acceptEdits">accept edits</option>
          <option value="plan">plan mode</option>
        </select>
      </label>
      <label>cwd
        <input value={settings.cwd} onChange={(e) => setSettings({ cwd: e.target.value })} />
      </label>
      <label>model
        <input value={settings.model} onChange={(e) => setSettings({ model: e.target.value })} />
      </label>
      <label>Backdrop
        <select value={settings.backdrop} onChange={(e) => setSettings({ backdrop: e.target.value as SessionSettings["backdrop"] })}>
          <option value="transparent">transparent</option>
          <option value="slate">slate</option>
          <option value="coral">coral</option>
          <option value="indigo">indigo</option>
          <option value="black">black</option>
        </select>
      </label>
      <label>Padding
        <input type="range" min={0} max={160} value={settings.padding}
          onChange={(e) => setSettings({ padding: Number(e.target.value) })} />
      </label>
      <label>Aspect
        <select value={settings.aspect} onChange={(e) => setSettings({ aspect: e.target.value as SessionSettings["aspect"] })}>
          <option value="auto">auto</option>
          <option value="16:9">16:9</option>
          <option value="square">square</option>
          <option value="twitter">X / Twitter</option>
          <option value="linkedin">LinkedIn</option>
        </select>
      </label>
    </div>
  );
}
```

- [ ] **Step 4: Implement EditorPane**

`src/editor/EditorPane.tsx`:
```tsx
import type { Block, BlockType, Session, SessionSettings } from "../state/types";
import { BLOCK_TYPES } from "../state/types";
import { BlockEditor } from "./blockEditors/BlockEditor";
import { SettingsPanel } from "./SettingsPanel";

type Props = {
  session: Session;
  add: (t: BlockType) => void;
  update: (id: string, patch: Partial<Block>) => void;
  remove: (id: string) => void;
  move: (id: string, dir: "up" | "down") => void;
  setSettings: (patch: Partial<SessionSettings>) => void;
};

export function EditorPane({ session, add, update, remove, move, setSettings }: Props) {
  return (
    <div className="ccsg-editor">
      <SettingsPanel settings={session.settings} setSettings={setSettings} />
      <div className="ccsg-add-row">
        {BLOCK_TYPES.map((t) => (
          <button key={t} onClick={() => add(t)}>{t}</button>
        ))}
      </div>
      <div className="ccsg-block-list">
        {session.blocks.map((b) => (
          <div key={b.id} className="ccsg-block-row">
            <div className="ccsg-block-head">
              <span>{b.type}</span>
              <span>
                <button aria-label="↑" onClick={() => move(b.id, "up")}>↑</button>
                <button aria-label="↓" onClick={() => move(b.id, "down")}>↓</button>
                <button aria-label="✕" onClick={() => remove(b.id)}>✕</button>
              </span>
            </div>
            <BlockEditor block={b} onChange={(patch) => update(b.id, patch)} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Run, verify pass; commit**

Run: `npm test -- EditorPane && npx tsc -b`
```bash
git add src/editor/EditorPane.tsx src/editor/SettingsPanel.tsx src/editor/EditorPane.test.tsx
git commit -m "feat: add editor pane with add menu, block list, and settings"
```

---

### Task 9: Preview pane (backdrop + aspect framing)

**Files:**
- Create: `src/preview/backdrops.ts`, `src/preview/PreviewPane.tsx`
- Test: `src/preview/backdrops.test.ts`

**Interfaces:**
- Consumes: `Session`, `BackdropId`, `AspectId` from types; `Terminal` from `../terminal/Terminal`.
- Produces:
  - `backdrops.ts`:
    - `backgroundFor(id: BackdropId): string` → CSS background value; `transparent` → `"transparent"`.
    - `aspectRatioFor(id: AspectId): string | undefined` → CSS `aspect-ratio` value
      (`"auto"` → `undefined`, `"16:9"` → `"16 / 9"`, `"square"` → `"1 / 1"`,
      `"twitter"` → `"16 / 9"`, `"linkedin"` → `"1200 / 627"`).
  - `PreviewPane({ session, captureRef }: { session: Session; captureRef: RefObject<HTMLDivElement> })`
    — outer wrapper; inner `<div ref={captureRef}>` is the **capture node** styled with the
    backdrop background, `padding`, and `aspect-ratio`, centering the `<Terminal>`.

- [ ] **Step 1: Write failing tests**

`src/preview/backdrops.test.ts`:
```ts
import { backgroundFor, aspectRatioFor } from "./backdrops";

test("transparent backdrop", () => {
  expect(backgroundFor("transparent")).toBe("transparent");
});

test("coral backdrop is a gradient", () => {
  expect(backgroundFor("coral")).toContain("gradient");
});

test("auto aspect is undefined", () => {
  expect(aspectRatioFor("auto")).toBeUndefined();
});

test("square aspect is 1 / 1", () => {
  expect(aspectRatioFor("square")).toBe("1 / 1");
});
```

- [ ] **Step 2: Run, verify fail**

Run: `npm test -- backdrops`
Expected: FAIL.

- [ ] **Step 3: Implement backdrops + PreviewPane**

`src/preview/backdrops.ts`:
```ts
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
```

`src/preview/PreviewPane.tsx`:
```tsx
import type { RefObject } from "react";
import type { Session } from "../state/types";
import { Terminal } from "../terminal/Terminal";
import { backgroundFor, aspectRatioFor } from "./backdrops";

type Props = { session: Session; captureRef: RefObject<HTMLDivElement> };

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
```

- [ ] **Step 4: Run, verify pass; commit**

Run: `npm test -- backdrops && npx tsc -b`
```bash
git add src/preview
git commit -m "feat: add preview pane with backdrops and aspect framing"
```

---

### Task 10: PNG export

**Files:**
- Create: `src/export/exportPng.ts`
- Test: `src/export/exportPng.test.ts`

**Interfaces:**
- Consumes: `html-to-image` (`toPng`).
- Produces:
  - `async function exportPng(node: HTMLElement, filename = "claude-session.png"): Promise<void>`
    — calls `toPng(node, { pixelRatio: 2, cacheBust: true })`, then triggers a download by
    creating an `<a>` with the data URL and clicking it.
  - `function triggerDownload(dataUrl: string, filename: string): void` (exported for testing).

- [ ] **Step 1: Write failing tests**

`src/export/exportPng.test.ts`:
```ts
import { vi } from "vitest";
import { triggerDownload } from "./exportPng";

test("triggerDownload creates an anchor and clicks it", () => {
  const click = vi.fn();
  const a = document.createElement("a");
  a.click = click;
  const spy = vi.spyOn(document, "createElement").mockReturnValue(a);
  triggerDownload("data:image/png;base64,xxx", "out.png");
  expect(a.href).toContain("data:image/png");
  expect(a.download).toBe("out.png");
  expect(click).toHaveBeenCalled();
  spy.mockRestore();
});
```

- [ ] **Step 2: Run, verify fail**

Run: `npm test -- exportPng`
Expected: FAIL.

- [ ] **Step 3: Implement**

`src/export/exportPng.ts`:
```ts
import { toPng } from "html-to-image";

export function triggerDownload(dataUrl: string, filename: string): void {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  a.click();
}

export async function exportPng(
  node: HTMLElement,
  filename = "claude-session.png",
): Promise<void> {
  const dataUrl = await toPng(node, { pixelRatio: 2, cacheBust: true });
  triggerDownload(dataUrl, filename);
}
```

- [ ] **Step 4: Run, verify pass; commit**

Run: `npm test -- exportPng && npx tsc -b`
```bash
git add src/export
git commit -m "feat: add 2x PNG export via html-to-image"
```

---

### Task 11: App assembly + layout styles

**Files:**
- Modify: `src/App.tsx`, `src/App.test.tsx`
- Create: `src/app.css`

**Interfaces:**
- Consumes: `useSession` from `./state/useSession`; `EditorPane`, `PreviewPane`, `exportPng`.
- Produces: the assembled two-pane app. `App` renders `EditorPane` (left) and `PreviewPane`
  (right) sharing one `useSession()`, with a floating **Export PNG** button calling
  `exportPng(captureRef.current)`.

- [ ] **Step 1: Update the smoke test to assert the two panes render**

Replace `src/App.test.tsx`:
```tsx
import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders editor add buttons and an export control", () => {
  render(<App />);
  expect(screen.getByRole("button", { name: "userPrompt" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /export png/i })).toBeInTheDocument();
});
```

- [ ] **Step 2: Run, verify fail**

Run: `npm test -- App`
Expected: FAIL (App still renders only the `<h1>`).

- [ ] **Step 3: Implement App + styles**

`src/app.css`:
```css
* { box-sizing: border-box; }
body { margin: 0; background: #0f0f0f; color: #e7e5e4;
  font-family: ui-sans-serif, system-ui, sans-serif; }
.ccsg-app { display: grid; grid-template-columns: 380px 1fr; height: 100vh; }
.ccsg-editor { overflow-y: auto; padding: 16px; background: #171717;
  border-right: 1px solid #262626; }
.ccsg-editor textarea, .ccsg-editor input, .ccsg-editor select {
  width: 100%; margin: 4px 0; background: #0f0f0f; color: #e7e5e4;
  border: 1px solid #333; border-radius: 6px; padding: 6px 8px;
  font-family: ui-monospace, monospace; }
.ccsg-settings { display: grid; gap: 8px; margin-bottom: 16px; }
.ccsg-settings label { display: grid; font-size: 12px; color: #a3a3a3; gap: 2px; }
.ccsg-add-row { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 16px; }
.ccsg-add-row button, .ccsg-block-head button {
  background: #262626; color: #e7e5e4; border: 1px solid #3f3f3f;
  border-radius: 6px; padding: 4px 10px; cursor: pointer; }
.ccsg-block-row { border: 1px solid #262626; border-radius: 8px;
  padding: 10px; margin-bottom: 10px; }
.ccsg-block-head { display: flex; justify-content: space-between;
  align-items: center; font-size: 12px; color: #a3a3a3; margin-bottom: 6px; }
.ccsg-preview { display: flex; align-items: center; justify-content: center;
  padding: 32px; overflow: auto; position: relative; }
.ccsg-export-btn { position: fixed; top: 16px; right: 16px; z-index: 10;
  background: #d97757; color: #1c1917; border: none; border-radius: 8px;
  padding: 10px 16px; font-weight: 700; cursor: pointer; }
```

`src/App.tsx`:
```tsx
import { useRef } from "react";
import { useSession } from "./state/useSession";
import { EditorPane } from "./editor/EditorPane";
import { PreviewPane } from "./preview/PreviewPane";
import { exportPng } from "./export/exportPng";
import "./app.css";

export default function App() {
  const { session, add, update, remove, move, setSettings } = useSession();
  const captureRef = useRef<HTMLDivElement>(null);

  return (
    <div className="ccsg-app">
      <EditorPane
        session={session} add={add} update={update}
        remove={remove} move={move} setSettings={setSettings}
      />
      <div className="ccsg-preview-wrap" style={{ position: "relative", overflow: "auto" }}>
        <button
          className="ccsg-export-btn"
          onClick={() => captureRef.current && exportPng(captureRef.current)}
        >
          Export PNG
        </button>
        <PreviewPane session={session} captureRef={captureRef} />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run tests + typecheck + build**

Run: `npm test && npx tsc -b && npm run build`
Expected: all tests PASS, build succeeds.

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx src/App.test.tsx src/app.css
git commit -m "feat: assemble two-pane app with live preview and export"
```

---

### Task 12: Seed a default session + manual verification

**Files:**
- Modify: `src/state/sessionStore.ts` (add `seedSession()`), `src/state/useSession.ts` (use seed when storage empty)
- Test: `src/state/sessionStore.test.ts` (add seed test)

**Interfaces:**
- Produces: `function seedSession(): Session` — a small, realistic demo session (a userPrompt,
  an assistant reply, a Bash block, an Edit block with a couple diff lines) so first load looks
  great instead of empty. `loadSession()` returns `seedSession()` when storage is empty (instead
  of `emptySession()`).

- [ ] **Step 1: Write failing test**

Add to `src/state/sessionStore.test.ts`:
```ts
import { seedSession } from "./sessionStore";

test("seedSession has a mix of block types", () => {
  const types = seedSession().blocks.map((b) => b.type);
  expect(types).toContain("userPrompt");
  expect(types).toContain("assistant");
  expect(types.length).toBeGreaterThanOrEqual(3);
});

test("loadSession returns the seed when storage is empty", () => {
  localStorage.clear();
  expect(loadSession().blocks.length).toBeGreaterThan(0);
});
```

- [ ] **Step 2: Run, verify fail**

Run: `npm test -- sessionStore`
Expected: FAIL.

- [ ] **Step 3: Implement seed**

Add to `src/state/sessionStore.ts`:
```ts
export function seedSession(): Session {
  return {
    settings: { ...defaultSettings(), permissionMode: "acceptEdits" },
    blocks: [
      { id: "s1", type: "userPrompt", text: "Add a dark mode toggle to the navbar" },
      { id: "s2", type: "assistant", markdown: "I'll add a **theme toggle**. Plan:\n\n- Add a `useTheme` hook\n- Wire a button into the navbar" },
      { id: "s3", type: "read", filepath: "src/Navbar.tsx", summary: "Read 48 lines" },
      { id: "s4", type: "edit", filepath: "src/Navbar.tsx", lines: [
        { kind: "context", text: "function Navbar() {" },
        { kind: "add", text: "  const { theme, toggle } = useTheme();" },
        { kind: "add", text: "  return <button onClick={toggle}>{theme}</button>;" },
      ] },
      { id: "s5", type: "bash", command: "npm test", output: "✓ 12 passed" },
    ],
  };
}
```

Change `loadSession()`'s empty branch from `return emptySession();` (the `!raw` case only)
to `return seedSession();`. Keep the invalid-JSON and shape-guard fallbacks returning
`emptySession()`.

- [ ] **Step 4: Run tests, typecheck, verify pass**

Run: `npm test && npx tsc -b`
Expected: PASS. (Update the earlier "loadSession falls back to empty on invalid JSON" test
still passes — invalid JSON path is unchanged.)

- [ ] **Step 5: Manual verification**

Run: `npm run dev`, open the app. Confirm:
- The seed session renders as a faithful Claude Code TUI (prompt box, `●` lines, diff colors, `⎿` connectors, status bar with `⏵⏵ accept edits on`).
- Editing blocks updates the preview live; add/reorder/delete work.
- Changing backdrop, padding, and aspect reframes the preview.
- **Export PNG** downloads a crisp 2× image; open it and confirm the monospace font is embedded (text not falling back to a system font) and a transparent backdrop yields transparency.

- [ ] **Step 6: Commit**

```bash
git add src/state/sessionStore.ts src/state/sessionStore.test.ts src/state/useSession.ts
git commit -m "feat: seed a demo session on first load"
```

---

## Self-Review Notes

**Spec coverage:**
- Client-side, no backend → Tasks 1–12 (no network). ✓
- Block model (6 types) → Task 2. ✓
- Store + reducers + localStorage → Task 3. ✓
- Markdown in assistant blocks → Task 4. ✓
- Faux terminal (palette, prompt box, ● lines, ⎿ connector, diff colors, status bar w/ permission mode) → Tasks 5–6. ✓
- Per-block editors incl. diff editor → Task 7. ✓
- Editor pane: add menu, reorder/delete, settings (permission mode, cwd, model, backdrop, padding, aspect) → Task 8. ✓
- Preview pane: backdrops (gradients/solid/transparent), padding, aspect presets → Task 9. ✓
- 2× PNG export w/ embedded fonts → Task 10 + manual check in Task 12. ✓
- Persistence / no data loss on refresh → Task 3 + seed in Task 12. ✓
- Font embedding risk (from spec risks) → verified in Task 12 manual step. ✓

**Type consistency:** `useSession()` return shape (`session, add, update, remove, move, setSettings`) is defined in Task 3 and consumed identically in Tasks 8 and 11. `BlockType` order in `BLOCK_TYPES` (Task 2) matches the add-button test (Task 8). `captureRef: RefObject<HTMLDivElement>` defined in Task 9 matches App usage in Task 11. `exportPng(node, filename?)` signature (Task 10) matches call in Task 11.

**Placeholder scan:** No placeholders — every code step contains real, runnable content.
