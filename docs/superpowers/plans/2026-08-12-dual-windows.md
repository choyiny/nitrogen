# Dual Independent Windows Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the user compose two independent Claude Code terminal windows in one exported image, arranged single / left↔right / top↕bottom, each with its own blocks and permission mode / cwd / model.

**Architecture:** The single `Session` model splits into a `Doc` = two `TerminalWindow`s + a shared `FrameSettings` (backdrop/padding/aspect/layout) + `activeWindow`. New additive tasks build the types, `docStore`, `useDoc` hook, and the two new editor sub-components alongside the old code (build stays green). Then ONE atomic swap task rewires Terminal/PreviewPane/EditorPane/App onto `Doc` and removes the old `sessionStore`/`useSession`/`SettingsPanel`.

**Tech Stack:** Vite, React 18, TypeScript strict, Tailwind v4, Vitest + @testing-library/react. (No new dependencies.)

## Global Constraints

- Package manager npm; Node 22.
- Pure client-side; no backend, no network.
- TypeScript strict; all source under `src/`; tests colocated `*.test.ts(x)`.
- Exactly TWO windows max. Per-window: blocks, permissionMode, cwd, model. Shared/image-level: backdrop, padding, aspect, layout.
- `Layout` values are exactly `"single" | "split-h" | "split-v"` (split-h = left↔right, split-v = top↕bottom).
- localStorage key is exactly `"ccsg.doc.v2"`. Do NOT migrate the old `ccsg.session.v1` data.
- Reuse existing untouched modules: `blocks/BlockView`, `blockEditors/BlockEditor`, `markdown/Markdown`, `terminal/theme`, `preview/backdrops`, `export/exportPng`. Do not modify them except where a task says so.
- Commit after every task.

---

### Task 1: New domain types (additive)

**Files:**
- Modify: `src/state/types.ts`
- Test: `src/state/types.test.ts` (add cases)

**Interfaces:**
- Consumes: existing `Block`, `PermissionMode`, `BackdropId`, `AspectId`.
- Produces (ADD these; do NOT remove `Session`/`SessionSettings`/`defaultSettings` yet — later tasks still reference them and removing now breaks the build):
  - `interface TerminalWindow { blocks: Block[]; permissionMode: PermissionMode; cwd: string; model: string }`
  - `type Layout = "single" | "split-h" | "split-v"`
  - `interface FrameSettings { backdrop: BackdropId; padding: number; aspect: AspectId; layout: Layout }`
  - `interface Doc { windows: [TerminalWindow, TerminalWindow]; frame: FrameSettings; activeWindow: 0 | 1 }`
  - `function newWindow(): TerminalWindow`
  - `function defaultFrame(): FrameSettings`

- [ ] **Step 1: Write failing tests** — append to `src/state/types.test.ts`:
```ts
import { newWindow, defaultFrame } from "./types";

test("newWindow is an empty window with normal mode", () => {
  expect(newWindow()).toEqual({ blocks: [], permissionMode: "normal", cwd: "~/project", model: "claude-opus-4-8" });
});

test("defaultFrame is coral/auto/single", () => {
  expect(defaultFrame()).toEqual({ backdrop: "coral", padding: 48, aspect: "auto", layout: "single" });
});
```

- [ ] **Step 2: Run, verify fail** — `npm test -- types` → FAIL (exports missing).

- [ ] **Step 3: Implement** — append to `src/state/types.ts`:
```ts
export interface TerminalWindow {
  blocks: Block[];
  permissionMode: PermissionMode;
  cwd: string;
  model: string;
}

export type Layout = "single" | "split-h" | "split-v";

export interface FrameSettings {
  backdrop: BackdropId;
  padding: number;
  aspect: AspectId;
  layout: Layout;
}

export interface Doc {
  windows: [TerminalWindow, TerminalWindow];
  frame: FrameSettings;
  activeWindow: 0 | 1;
}

export function newWindow(): TerminalWindow {
  return { blocks: [], permissionMode: "normal", cwd: "~/project", model: "claude-opus-4-8" };
}

export function defaultFrame(): FrameSettings {
  return { backdrop: "coral", padding: 48, aspect: "auto", layout: "single" };
}
```

- [ ] **Step 4: Run + typecheck** — `npm test -- types && npx tsc -b` → PASS.

- [ ] **Step 5: Commit**
```bash
git add src/state/types.ts src/state/types.test.ts
git commit -m "feat: add Doc/TerminalWindow/FrameSettings domain types"
```

---

### Task 2: Doc store + persistence (additive)

**Files:**
- Create: `src/state/docStore.ts`
- Test: `src/state/docStore.test.ts`

**Interfaces:**
- Consumes: `Block`, `BlockType`, `Doc`, `FrameSettings`, `TerminalWindow`, `newBlock`, `newWindow`, `defaultFrame` from `./types`.
- Produces:
  - `const STORAGE_KEY = "ccsg.doc.v2"`
  - `function emptyDoc(): Doc`
  - `function seedDoc(): Doc`
  - Reducers (all pure, return new `Doc`): `addBlock(doc, w, type, id)`, `updateBlock(doc, w, id, patch)`, `removeBlock(doc, w, id)`, `moveBlock(doc, w, id, dir)`, `updateWindow(doc, w, patch)`, `updateFrame(doc, patch)`, `setActiveWindow(doc, w)`. `w` is `0 | 1`.
  - `function loadDoc(): Doc`, `function saveDoc(doc: Doc): void`.

- [ ] **Step 1: Write failing tests** — `src/state/docStore.test.ts`:
```ts
import {
  emptyDoc, seedDoc, addBlock, updateBlock, removeBlock, moveBlock,
  updateWindow, updateFrame, setActiveWindow, loadDoc, saveDoc, STORAGE_KEY,
} from "./docStore";

test("addBlock targets the given window only", () => {
  const d = addBlock(emptyDoc(), 1, "bash", "b1");
  expect(d.windows[1].blocks).toHaveLength(1);
  expect(d.windows[0].blocks).toHaveLength(0);
});

test("updateBlock patches the block in the right window", () => {
  let d = addBlock(emptyDoc(), 0, "userPrompt", "b1");
  d = updateBlock(d, 0, "b1", { text: "hi" } as any);
  expect((d.windows[0].blocks[0] as any).text).toBe("hi");
});

test("removeBlock drops from the right window", () => {
  let d = addBlock(emptyDoc(), 0, "read", "b1");
  d = removeBlock(d, 0, "b1");
  expect(d.windows[0].blocks).toHaveLength(0);
});

test("moveBlock up swaps within a window", () => {
  let d = addBlock(addBlock(emptyDoc(), 0, "read", "a"), 0, "bash", "b");
  d = moveBlock(d, 0, "b", "up");
  expect(d.windows[0].blocks.map((b) => b.id)).toEqual(["b", "a"]);
});

test("updateWindow patches permission mode of one window", () => {
  const d = updateWindow(emptyDoc(), 1, { permissionMode: "plan" });
  expect(d.windows[1].permissionMode).toBe("plan");
  expect(d.windows[0].permissionMode).toBe("normal");
});

test("updateFrame patches the frame", () => {
  const d = updateFrame(emptyDoc(), { layout: "split-h" });
  expect(d.frame.layout).toBe("split-h");
});

test("setActiveWindow sets the active index", () => {
  expect(setActiveWindow(emptyDoc(), 1).activeWindow).toBe(1);
});

test("seedDoc has two windows and split-h layout", () => {
  const d = seedDoc();
  expect(d.windows).toHaveLength(2);
  expect(d.windows[0].blocks.length).toBeGreaterThan(0);
  expect(d.windows[1].blocks.length).toBeGreaterThan(0);
  expect(d.frame.layout).toBe("split-h");
});

test("save then load round-trips", () => {
  const d = addBlock(emptyDoc(), 0, "bash", "b1");
  saveDoc(d);
  expect(loadDoc()).toEqual(d);
});

test("loadDoc returns seed when storage empty", () => {
  localStorage.clear();
  expect(loadDoc().windows[0].blocks.length).toBeGreaterThan(0);
});

test("loadDoc falls back to empty on invalid JSON", () => {
  localStorage.setItem(STORAGE_KEY, "{bad");
  expect(loadDoc()).toEqual(emptyDoc());
});

test("loadDoc falls back to empty when windows length wrong", () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ windows: [], frame: {}, activeWindow: 0 }));
  expect(loadDoc()).toEqual(emptyDoc());
});
```

- [ ] **Step 2: Run, verify fail** — `npm test -- docStore` → FAIL.

- [ ] **Step 3: Implement** — `src/state/docStore.ts`:
```ts
import {
  Block, BlockType, Doc, FrameSettings, TerminalWindow,
  newBlock, newWindow, defaultFrame,
} from "./types";

export const STORAGE_KEY = "ccsg.doc.v2";

export function emptyDoc(): Doc {
  return { windows: [newWindow(), newWindow()], frame: defaultFrame(), activeWindow: 0 };
}

function mapWindow(doc: Doc, w: 0 | 1, fn: (win: TerminalWindow) => TerminalWindow): Doc {
  const windows: [TerminalWindow, TerminalWindow] = [doc.windows[0], doc.windows[1]];
  windows[w] = fn(windows[w]);
  return { ...doc, windows };
}

export function addBlock(doc: Doc, w: 0 | 1, type: BlockType, id: string): Doc {
  return mapWindow(doc, w, (win) => ({ ...win, blocks: [...win.blocks, newBlock(type, id)] }));
}

export function updateBlock(doc: Doc, w: 0 | 1, id: string, patch: Partial<Block>): Doc {
  return mapWindow(doc, w, (win) => ({
    ...win,
    blocks: win.blocks.map((b) => (b.id === id ? ({ ...b, ...patch } as Block) : b)),
  }));
}

export function removeBlock(doc: Doc, w: 0 | 1, id: string): Doc {
  return mapWindow(doc, w, (win) => ({ ...win, blocks: win.blocks.filter((b) => b.id !== id) }));
}

export function moveBlock(doc: Doc, w: 0 | 1, id: string, dir: "up" | "down"): Doc {
  return mapWindow(doc, w, (win) => {
    const i = win.blocks.findIndex((b) => b.id === id);
    if (i < 0) return win;
    const j = dir === "up" ? i - 1 : i + 1;
    if (j < 0 || j >= win.blocks.length) return win;
    const blocks = [...win.blocks];
    [blocks[i], blocks[j]] = [blocks[j], blocks[i]];
    return { ...win, blocks };
  });
}

export function updateWindow(doc: Doc, w: 0 | 1, patch: Partial<TerminalWindow>): Doc {
  return mapWindow(doc, w, (win) => ({ ...win, ...patch }));
}

export function updateFrame(doc: Doc, patch: Partial<FrameSettings>): Doc {
  return { ...doc, frame: { ...doc.frame, ...patch } };
}

export function setActiveWindow(doc: Doc, w: 0 | 1): Doc {
  return { ...doc, activeWindow: w };
}

export function saveDoc(doc: Doc): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(doc));
  } catch {
    /* ignore quota/serialization errors */
  }
}

export function loadDoc(): Doc {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedDoc();
    const parsed = JSON.parse(raw) as Doc;
    if (!parsed || !Array.isArray(parsed.windows) || parsed.windows.length !== 2 || !parsed.frame) {
      return emptyDoc();
    }
    return parsed;
  } catch {
    return emptyDoc();
  }
}

export function seedDoc(): Doc {
  const w0: TerminalWindow = {
    permissionMode: "acceptEdits", cwd: "~/project", model: "claude-opus-4-8",
    blocks: [
      { id: "a1", type: "userPrompt", text: "Add a dark mode toggle to the navbar" },
      { id: "a2", type: "assistant", markdown: "I'll add a **theme toggle**:\n\n- a `useTheme` hook\n- a button in the navbar" },
      { id: "a3", type: "edit", filepath: "src/Navbar.tsx", lines: [
        { kind: "context", text: "function Navbar() {" },
        { kind: "add", text: "  const { theme, toggle } = useTheme();" },
      ] },
    ],
  };
  const w1: TerminalWindow = {
    permissionMode: "plan", cwd: "~/project", model: "claude-opus-4-8",
    blocks: [
      { id: "b1", type: "userPrompt", text: "Same, but plan it first before editing" },
      { id: "b2", type: "assistant", markdown: "Here's the **plan**:\n\n1. Read the navbar\n2. Add the hook\n3. Wire the button" },
      { id: "b3", type: "read", filepath: "src/Navbar.tsx", summary: "Read 48 lines" },
    ],
  };
  return { windows: [w0, w1], frame: { ...defaultFrame(), layout: "split-h" }, activeWindow: 0 };
}
```

- [ ] **Step 4: Run + typecheck** — `npm test -- docStore && npx tsc -b` → PASS.

- [ ] **Step 5: Commit**
```bash
git add src/state/docStore.ts src/state/docStore.test.ts
git commit -m "feat: add Doc store, window/frame reducers, and persistence"
```

---

### Task 3: useDoc hook (additive)

**Files:**
- Create: `src/state/useDoc.ts`

**Interfaces:**
- Consumes: reducers + `loadDoc`/`saveDoc` from `./docStore`; `Block`, `BlockType`, `FrameSettings`, `TerminalWindow` from `./types`.
- Produces: `useDoc()` returning `{ doc, addBlock, updateBlock, removeBlock, moveBlock, updateWindow, updateFrame, setActiveWindow }` where block/window actions take a window index `w: 0 | 1` as the first arg, auto-saving on change.

- [ ] **Step 1: Implement** — `src/state/useDoc.ts`:
```ts
import { useCallback, useEffect, useState } from "react";
import { Block, BlockType, FrameSettings, TerminalWindow } from "./types";
import {
  addBlock, loadDoc, moveBlock, removeBlock, saveDoc, setActiveWindow,
  updateBlock, updateFrame, updateWindow,
} from "./docStore";

let counter = 0;
const genId = () => `blk_${Date.now().toString(36)}_${counter++}`;

export function useDoc() {
  const [doc, setDoc] = useState(loadDoc);
  useEffect(() => saveDoc(doc), [doc]);

  return {
    doc,
    addBlock: useCallback((w: 0 | 1, t: BlockType) => setDoc((d) => addBlock(d, w, t, genId())), []),
    updateBlock: useCallback((w: 0 | 1, id: string, patch: Partial<Block>) => setDoc((d) => updateBlock(d, w, id, patch)), []),
    removeBlock: useCallback((w: 0 | 1, id: string) => setDoc((d) => removeBlock(d, w, id)), []),
    moveBlock: useCallback((w: 0 | 1, id: string, dir: "up" | "down") => setDoc((d) => moveBlock(d, w, id, dir)), []),
    updateWindow: useCallback((w: 0 | 1, patch: Partial<TerminalWindow>) => setDoc((d) => updateWindow(d, w, patch)), []),
    updateFrame: useCallback((patch: Partial<FrameSettings>) => setDoc((d) => updateFrame(d, patch)), []),
    setActiveWindow: useCallback((w: 0 | 1) => setDoc((d) => setActiveWindow(d, w)), []),
  };
}
```

- [ ] **Step 2: Typecheck** — `npx tsc -b` → clean. (Hook is exercised by components in Task 6; no standalone test.)

- [ ] **Step 3: Commit**
```bash
git add src/state/useDoc.ts
git commit -m "feat: add useDoc hook"
```

---

### Task 4: FrameControls component (additive)

**Files:**
- Create: `src/editor/FrameControls.tsx`
- Test: `src/editor/FrameControls.test.tsx`

**Interfaces:**
- Consumes: `FrameSettings` from `../state/types`.
- Produces: `FrameControls({ frame, updateFrame }: { frame: FrameSettings; updateFrame: (patch: Partial<FrameSettings>) => void })` — a Layout select (single / split ↔ / split ↕), backdrop select, padding range (0-160), aspect select. Reuses the `.ccsg-settings` container class.

- [ ] **Step 1: Write failing test** — `src/editor/FrameControls.test.tsx`:
```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { FrameControls } from "./FrameControls";
import { defaultFrame } from "../state/types";

test("layout select fires updateFrame with the chosen layout", () => {
  const updateFrame = vi.fn();
  render(<FrameControls frame={defaultFrame()} updateFrame={updateFrame} />);
  fireEvent.change(screen.getByLabelText(/layout/i), { target: { value: "split-h" } });
  expect(updateFrame).toHaveBeenCalledWith({ layout: "split-h" });
});

test("padding range fires updateFrame with a number", () => {
  const updateFrame = vi.fn();
  render(<FrameControls frame={defaultFrame()} updateFrame={updateFrame} />);
  fireEvent.change(screen.getByLabelText(/padding/i), { target: { value: "80" } });
  expect(updateFrame).toHaveBeenCalledWith({ padding: 80 });
});
```

- [ ] **Step 2: Run, verify fail** — `npm test -- FrameControls` → FAIL.

- [ ] **Step 3: Implement** — `src/editor/FrameControls.tsx`:
```tsx
import type { FrameSettings } from "../state/types";

type Props = { frame: FrameSettings; updateFrame: (patch: Partial<FrameSettings>) => void };

export function FrameControls({ frame, updateFrame }: Props) {
  return (
    <div className="ccsg-settings">
      <label>Layout
        <select value={frame.layout}
          onChange={(e) => updateFrame({ layout: e.target.value as FrameSettings["layout"] })}>
          <option value="single">single</option>
          <option value="split-h">split ↔ (left / right)</option>
          <option value="split-v">split ↕ (top / bottom)</option>
        </select>
      </label>
      <label>Backdrop
        <select value={frame.backdrop}
          onChange={(e) => updateFrame({ backdrop: e.target.value as FrameSettings["backdrop"] })}>
          <option value="transparent">transparent</option>
          <option value="slate">slate</option>
          <option value="coral">coral</option>
          <option value="indigo">indigo</option>
          <option value="black">black</option>
        </select>
      </label>
      <label>Padding
        <input type="range" min={0} max={160} value={frame.padding}
          onChange={(e) => updateFrame({ padding: Number(e.target.value) })} />
      </label>
      <label>Aspect
        <select value={frame.aspect}
          onChange={(e) => updateFrame({ aspect: e.target.value as FrameSettings["aspect"] })}>
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

- [ ] **Step 4: Run + typecheck** — `npm test -- FrameControls && npx tsc -b` → PASS.

- [ ] **Step 5: Commit**
```bash
git add src/editor/FrameControls.tsx src/editor/FrameControls.test.tsx
git commit -m "feat: add FrameControls (layout + backdrop/padding/aspect)"
```

---

### Task 5: WindowSettings component (additive)

**Files:**
- Create: `src/editor/WindowSettings.tsx`
- Test: `src/editor/WindowSettings.test.tsx`

**Interfaces:**
- Consumes: `TerminalWindow` from `../state/types`.
- Produces: `WindowSettings({ win, onChange }: { win: TerminalWindow; onChange: (patch: Partial<TerminalWindow>) => void })` — permission mode select (normal / accept edits / plan / bypass permissions), cwd input, model input.

- [ ] **Step 1: Write failing test** — `src/editor/WindowSettings.test.tsx`:
```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { WindowSettings } from "./WindowSettings";
import { newWindow } from "../state/types";

test("permission mode select fires onChange", () => {
  const onChange = vi.fn();
  render(<WindowSettings win={newWindow()} onChange={onChange} />);
  fireEvent.change(screen.getByLabelText(/permission mode/i), { target: { value: "bypassPermissions" } });
  expect(onChange).toHaveBeenCalledWith({ permissionMode: "bypassPermissions" });
});

test("cwd input fires onChange", () => {
  const onChange = vi.fn();
  render(<WindowSettings win={newWindow()} onChange={onChange} />);
  fireEvent.change(screen.getByLabelText(/cwd/i), { target: { value: "~/app" } });
  expect(onChange).toHaveBeenCalledWith({ cwd: "~/app" });
});
```

- [ ] **Step 2: Run, verify fail** — `npm test -- WindowSettings` → FAIL.

- [ ] **Step 3: Implement** — `src/editor/WindowSettings.tsx`:
```tsx
import type { TerminalWindow } from "../state/types";

type Props = { win: TerminalWindow; onChange: (patch: Partial<TerminalWindow>) => void };

export function WindowSettings({ win, onChange }: Props) {
  return (
    <div className="ccsg-settings">
      <label>Permission mode
        <select value={win.permissionMode}
          onChange={(e) => onChange({ permissionMode: e.target.value as TerminalWindow["permissionMode"] })}>
          <option value="normal">normal</option>
          <option value="acceptEdits">accept edits</option>
          <option value="plan">plan mode</option>
          <option value="bypassPermissions">bypass permissions</option>
        </select>
      </label>
      <label>cwd
        <input value={win.cwd} onChange={(e) => onChange({ cwd: e.target.value })} />
      </label>
      <label>model
        <input value={win.model} onChange={(e) => onChange({ model: e.target.value })} />
      </label>
    </div>
  );
}
```

- [ ] **Step 4: Run + typecheck** — `npm test -- WindowSettings && npx tsc -b` → PASS.

- [ ] **Step 5: Commit**
```bash
git add src/editor/WindowSettings.tsx src/editor/WindowSettings.test.tsx
git commit -m "feat: add WindowSettings (per-window permission/cwd/model)"
```

---

### Task 6: Swap UI onto Doc (atomic integration)

This is the atomic swap: nothing between the last additive task and the end of this task keeps the app runnable, so it is ONE task. Work through the steps, then run the FULL suite + typecheck + build at the end.

**Files:**
- Modify: `src/terminal/Terminal.tsx`, `src/preview/PreviewPane.tsx`, `src/editor/EditorPane.tsx`, `src/editor/EditorPane.test.tsx`, `src/App.tsx`, `src/App.test.tsx`, `src/state/types.ts`, `src/app.css`
- Create: `src/preview/PreviewPane.test.tsx`
- Delete: `src/state/sessionStore.ts`, `src/state/sessionStore.test.ts`, `src/state/useSession.ts`, `src/editor/SettingsPanel.tsx`

**Interfaces:**
- Consumes: `useDoc` (Task 3); `FrameControls` (Task 4); `WindowSettings` (Task 5); `Doc`, `TerminalWindow`, `Block`, `BlockType`, `FrameSettings`, `BLOCK_TYPES` from types; `emptyDoc`, `addBlock` from `docStore` (for tests); `BlockEditor`, `backdrops`, `exportPng`, `Terminal` unchanged internals.
- Produces: `Terminal({ win })`, `PreviewPane({ doc, captureRef })`, `EditorPane({ doc, addBlock, updateBlock, removeBlock, moveBlock, updateWindow, updateFrame, setActiveWindow })`, `App` on `useDoc`.

- [ ] **Step 1: Refactor Terminal** — replace `src/terminal/Terminal.tsx` body to take a window. Change the import at top from `Session` usage to `TerminalWindow`:
```tsx
import { TerminalWindow } from "../state/types";
import { permissionLabel, permissionColor } from "./theme";
import { BlockView } from "./blocks/BlockView";
import "./terminal.css";

export function Terminal({ win }: { win: TerminalWindow }) {
  const { blocks, permissionMode, cwd, model } = win;
  const label = permissionLabel(permissionMode);
  return (
    <div className="ccsg-terminal">
      <div className="ccsg-blocks">
        {blocks.length === 0 && (
          <div style={{ color: "#78716c" }}>Add a block to get started…</div>
        )}
        {blocks.map((b) => <BlockView key={b.id} block={b} />)}
      </div>
      <div
        className="ccsg-statusbar"
        style={{ display: "flex", justifyContent: "space-between", marginTop: 14, color: "#78716c", fontSize: 12 }}
      >
        <span style={{ color: permissionColor(permissionMode) }}>{label}</span>
        <span>{cwd} · {model}</span>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Rewrite PreviewPane** — `src/preview/PreviewPane.tsx`:
```tsx
import type { RefObject } from "react";
import type { Doc } from "../state/types";
import { Terminal } from "../terminal/Terminal";
import { backgroundFor, aspectRatioFor } from "./backdrops";

type Props = { doc: Doc; captureRef: RefObject<HTMLDivElement | null> };

export function PreviewPane({ doc, captureRef }: Props) {
  const { frame, windows } = doc;
  const aspect = aspectRatioFor(frame.aspect);
  const isSplit = frame.layout !== "single";
  const direction = frame.layout === "split-v" ? "column" : "row";
  const shown = isSplit ? windows : [windows[0]];
  return (
    <div className="ccsg-preview">
      <div
        ref={captureRef}
        style={{
          background: backgroundFor(frame.backdrop),
          padding: frame.padding,
          aspectRatio: aspect,
          display: "flex", alignItems: "center", justifyContent: "center",
          width: "100%", boxSizing: "border-box",
        }}
      >
        <div
          data-testid="window-container"
          style={{
            display: "flex", flexDirection: direction, gap: 24,
            width: "100%", justifyContent: "center",
            alignItems: isSplit ? "stretch" : "center",
          }}
        >
          {shown.map((w, i) => (
            <div key={i} style={{ flex: isSplit ? 1 : "0 1 720px", minWidth: 0, maxWidth: isSplit ? undefined : 720, width: "100%" }}>
              <Terminal win={w} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Add PreviewPane test** — `src/preview/PreviewPane.test.tsx`:
```tsx
import { render, screen } from "@testing-library/react";
import { createRef } from "react";
import { PreviewPane } from "./PreviewPane";
import { seedDoc, updateFrame, emptyDoc } from "../state/docStore";

test("single layout renders one terminal", () => {
  const doc = updateFrame(seedDoc(), { layout: "single" });
  const { container } = render(<PreviewPane doc={doc} captureRef={createRef()} />);
  expect(container.querySelectorAll(".ccsg-terminal").length).toBe(1);
});

test("split-h renders two terminals in a row", () => {
  const doc = updateFrame(seedDoc(), { layout: "split-h" });
  const { container } = render(<PreviewPane doc={doc} captureRef={createRef()} />);
  expect(container.querySelectorAll(".ccsg-terminal").length).toBe(2);
  expect(screen.getByTestId("window-container")).toHaveStyle({ flexDirection: "row" });
});

test("split-v renders two terminals in a column", () => {
  const doc = updateFrame(emptyDoc(), { layout: "split-v" });
  const { container } = render(<PreviewPane doc={doc} captureRef={createRef()} />);
  expect(container.querySelectorAll(".ccsg-terminal").length).toBe(2);
  expect(screen.getByTestId("window-container")).toHaveStyle({ flexDirection: "column" });
});
```

- [ ] **Step 4: Rewrite EditorPane** — `src/editor/EditorPane.tsx`:
```tsx
import type { Block, BlockType, Doc, FrameSettings, TerminalWindow } from "../state/types";
import { BLOCK_TYPES } from "../state/types";
import { BlockEditor } from "./blockEditors/BlockEditor";
import { FrameControls } from "./FrameControls";
import { WindowSettings } from "./WindowSettings";

type Props = {
  doc: Doc;
  addBlock: (w: 0 | 1, t: BlockType) => void;
  updateBlock: (w: 0 | 1, id: string, patch: Partial<Block>) => void;
  removeBlock: (w: 0 | 1, id: string) => void;
  moveBlock: (w: 0 | 1, id: string, dir: "up" | "down") => void;
  updateWindow: (w: 0 | 1, patch: Partial<TerminalWindow>) => void;
  updateFrame: (patch: Partial<FrameSettings>) => void;
  setActiveWindow: (w: 0 | 1) => void;
};

export function EditorPane(props: Props) {
  const { doc, addBlock, updateBlock, removeBlock, moveBlock, updateWindow, updateFrame, setActiveWindow } = props;
  const isSplit = doc.frame.layout !== "single";
  const active: 0 | 1 = isSplit ? doc.activeWindow : 0;
  const win = doc.windows[active];
  return (
    <div className="ccsg-editor">
      <FrameControls frame={doc.frame} updateFrame={updateFrame} />
      {isSplit && (
        <div className="ccsg-tabs">
          {[0, 1].map((i) => (
            <button
              key={i}
              className={active === i ? "active" : ""}
              aria-pressed={active === i}
              onClick={() => setActiveWindow(i as 0 | 1)}
            >
              Window {i + 1}
            </button>
          ))}
        </div>
      )}
      <WindowSettings win={win} onChange={(patch) => updateWindow(active, patch)} />
      <div className="ccsg-add-row">
        {BLOCK_TYPES.map((t) => (
          <button key={t} onClick={() => addBlock(active, t)}>{t}</button>
        ))}
      </div>
      <div className="ccsg-block-list">
        {win.blocks.map((b) => (
          <div key={b.id} className="ccsg-block-row">
            <div className="ccsg-block-head">
              <span>{b.type}</span>
              <span>
                <button aria-label="↑" onClick={() => moveBlock(active, b.id, "up")}>↑</button>
                <button aria-label="↓" onClick={() => moveBlock(active, b.id, "down")}>↓</button>
                <button aria-label="✕" onClick={() => removeBlock(active, b.id)}>✕</button>
              </span>
            </div>
            <BlockEditor block={b} onChange={(patch) => updateBlock(active, b.id, patch)} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Rewrite EditorPane test** — replace `src/editor/EditorPane.test.tsx`:
```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { EditorPane } from "./EditorPane";
import { emptyDoc, addBlock, updateFrame } from "../state/docStore";

function noop() {}
const actions = { addBlock: noop, updateBlock: noop, removeBlock: noop, moveBlock: noop, updateWindow: noop, updateFrame: noop, setActiveWindow: noop };

test("add button calls addBlock with active window and type", () => {
  const addBlockFn = vi.fn();
  const doc = updateFrame(emptyDoc(), { layout: "split-h" });
  doc.activeWindow = 1;
  render(<EditorPane {...actions} addBlock={addBlockFn} doc={doc} />);
  fireEvent.click(screen.getByRole("button", { name: "bash" }));
  expect(addBlockFn).toHaveBeenCalledWith(1, "bash");
});

test("tab bar hidden in single layout", () => {
  render(<EditorPane {...actions} doc={emptyDoc()} />);
  expect(screen.queryByRole("button", { name: /window 2/i })).toBeNull();
});

test("tab bar shown in split layout and click sets active window", () => {
  const setActiveWindow = vi.fn();
  const doc = updateFrame(emptyDoc(), { layout: "split-h" });
  render(<EditorPane {...actions} setActiveWindow={setActiveWindow} doc={doc} />);
  fireEvent.click(screen.getByRole("button", { name: /window 2/i }));
  expect(setActiveWindow).toHaveBeenCalledWith(1);
});

test("remove button targets the active window's block", () => {
  const removeBlock = vi.fn();
  const doc = addBlock(emptyDoc(), 0, "read", "b1");
  render(<EditorPane {...actions} removeBlock={removeBlock} doc={doc} />);
  fireEvent.click(screen.getByRole("button", { name: "✕" }));
  expect(removeBlock).toHaveBeenCalledWith(0, "b1");
});
```

- [ ] **Step 6: Rewrite App** — `src/App.tsx`:
```tsx
import { useRef } from "react";
import { useDoc } from "./state/useDoc";
import { EditorPane } from "./editor/EditorPane";
import { PreviewPane } from "./preview/PreviewPane";
import { exportPng } from "./export/exportPng";
import "./app.css";

export default function App() {
  const { doc, addBlock, updateBlock, removeBlock, moveBlock, updateWindow, updateFrame, setActiveWindow } = useDoc();
  const captureRef = useRef<HTMLDivElement>(null);

  return (
    <div className="ccsg-app">
      <EditorPane
        doc={doc}
        addBlock={addBlock} updateBlock={updateBlock} removeBlock={removeBlock}
        moveBlock={moveBlock} updateWindow={updateWindow} updateFrame={updateFrame}
        setActiveWindow={setActiveWindow}
      />
      <div className="ccsg-preview-wrap" style={{ position: "relative", overflow: "auto" }}>
        <button
          className="ccsg-export-btn"
          onClick={() => captureRef.current && exportPng(captureRef.current)}
        >
          Export PNG
        </button>
        <PreviewPane doc={doc} captureRef={captureRef} />
      </div>
    </div>
  );
}
```

- [ ] **Step 7: App test stays valid** — `src/App.test.tsx` already asserts a "userPrompt" add button and an "Export PNG" button render; both still render. Leave it unless it fails; if it fails, the assertions are unchanged in intent — keep them exactly:
```tsx
import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders editor add buttons and an export control", () => {
  render(<App />);
  expect(screen.getByRole("button", { name: "userPrompt" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /export png/i })).toBeInTheDocument();
});
```
(Note: `App` loads `seedDoc()` which has `layout: "split-h"`, so the tab bar renders too — harmless to the assertions.)

- [ ] **Step 8: Add editor CSS** — append to `src/app.css`:
```css
.ccsg-tabs { display: flex; gap: 6px; margin-bottom: 12px; }
.ccsg-tabs button {
  flex: 1; background: #171717; color: #a3a3a3; border: 1px solid #333;
  border-radius: 6px; padding: 6px 10px; cursor: pointer;
}
.ccsg-tabs button.active { background: #262626; color: #e7e5e4; border-color: #d97757; }
```

- [ ] **Step 9: Delete the superseded files and their tests**
```bash
git rm src/state/sessionStore.ts src/state/sessionStore.test.ts src/state/useSession.ts src/editor/SettingsPanel.tsx
```

- [ ] **Step 10: Remove now-dead types** — in `src/state/types.ts`, delete the now-unused `Session` interface, `SessionSettings` interface, and `defaultSettings()` function (grep the repo first: `grep -rn "Session\b\|SessionSettings\|defaultSettings" src` should return no references outside the definitions). Keep `newBlock`, `BLOCK_TYPES`, `newWindow`, `defaultFrame`, and all block/`Doc`/`Frame` types.

- [ ] **Step 11: Full verification** — run all three; ALL must pass:
```bash
npm test && npx tsc -b && npm run build
```
Diagnose and fix any breakage (import paths, a missed `session`→`win`/`doc` reference) until green. Note fixes in the report.

- [ ] **Step 12: Commit**
```bash
git add -A
git commit -m "feat: swap UI onto Doc — two independent windows with layout"
```

---

### Task 7: Manual verification

**Files:** none (verification only).

- [ ] **Step 1: Run the app** — `npm run dev`, open it. Confirm:
  - First load shows the seed as **split-h** (two terminals side by side), each faithful (prompt box, `●`, tool blocks, status bar). Window 1 shows `⏵⏵ accept edits`, Window 2 shows `⏵ plan mode`.
  - The **Layout** control switches between single (one terminal), split ↔ (row), split ↕ (stacked); the preview reframes live.
  - The **tab bar** appears only in split layouts; switching tabs changes which window the settings + block list edit; edits to Window 2 don't touch Window 1 and vice-versa.
  - Per-window **permission mode / cwd / model** are independent (set Window 2 to `bypass permissions` → only its status bar turns red).
  - **Export PNG** in split-h produces a crisp 2× image containing BOTH terminals on the backdrop. (Controller may verify the 2× ratio + non-blank via `html-to-image` in-page, as in the prior plan.)
- [ ] **Step 2: Report findings.** Any visual defect (overflow, cramped split, missing bullets) enters the fix loop; otherwise the feature is complete.

---

## Self-Review Notes

**Spec coverage:**
- `layout` single/split-h/split-v → Task 1 (`Layout`), Task 4 (control), Task 6 (PreviewPane render + EditorPane). ✓
- Two independent windows, own blocks + permission/cwd/model → Tasks 1-3 (model/store), Task 6 (Terminal per-window, EditorPane active-window routing). ✓
- Shared frame (backdrop/padding/aspect) around both; export unchanged → Task 6 PreviewPane keeps capture node styling; `exportPng` untouched. ✓
- Editor tabs above per-window settings; tabs hidden in single → Task 6 EditorPane. ✓
- New key `ccsg.doc.v2`, seed both windows, no v1 migration → Task 2. ✓
- Old files removed → Task 6 steps 9-10. ✓

**Type consistency:** `useDoc()` return shape (Task 3) is consumed identically by App (Task 6). Block/window actions take `w: 0 | 1` first arg consistently across docStore (Task 2), useDoc (Task 3), EditorPane props (Task 6). `Terminal({ win })`, `PreviewPane({ doc, captureRef })` signatures match their callers in Task 6. `captureRef: RefObject<HTMLDivElement | null>` matches the React 19 `useRef(null)` widening already applied in the codebase.

**Placeholder scan:** No placeholders — every code step is complete and runnable.

**Atomicity note:** Task 6 is deliberately one task because the model swap cannot leave the app runnable mid-way; its steps are granular and it ends with a full-suite + build gate.
