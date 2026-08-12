# Dual Independent Windows — Design

**Date:** 2026-08-12
**Status:** Approved (pending spec review)
**Builds on:** 2026-08-11-claude-code-snippet-generator-design.md

## Summary

Extend the Claude Code Snippet Generator to compose **two independent terminal
windows** in a single exported image, arranged **left↔right** or **top↕bottom**
(or a single window as before). Each window is a fully independent Claude Code
terminal — its own blocks and its own permission mode / cwd / model — while the
backdrop, padding, aspect, and layout frame the whole image. This turns the tool
into an A/B comparison-image maker (e.g. two prompt variants side by side).

## Goals

- A `layout` control: `single` · `split-h` (left↔right) · `split-v` (top↕bottom).
- Two independent windows, each with the full existing feature set (all block
  types, markdown, tool blocks, per-window permission mode / cwd / model).
- Shared frame (backdrop, padding, aspect) around both windows; export stays a
  single 2× PNG of the framed layout.
- Editor pane edits one window at a time via a tab switcher; frame controls sit
  above the tabs.

## Non-goals

- No more than two windows.
- No per-window backdrop/padding/aspect (those are image-level).
- No migration of the old `ccsg.session.v1` localStorage data — the shape
  changed and the tool has no saved work worth preserving; the new key supersedes it.
- No cross-window linking/mirroring of content.

## Data Model

The single `Session` (blocks + `SessionSettings`) is replaced by a `Doc` that
separates per-window content from the image-level frame.

```ts
// Per-window content — the "same features" unit. Was: Session + the
// permission/cwd/model portion of SessionSettings.
interface TerminalWindow {
  blocks: Block[];
  permissionMode: PermissionMode;   // incl. bypassPermissions
  cwd: string;
  model: string;
}

type Layout = "single" | "split-h" | "split-v";  // split-h = left↔right, split-v = top↕bottom

// Image-level frame. Was: the backdrop/padding/aspect portion of SessionSettings.
interface FrameSettings {
  backdrop: BackdropId;
  padding: number;
  aspect: AspectId;
  layout: Layout;
}

interface Doc {
  windows: [TerminalWindow, TerminalWindow];  // always two; layout decides how many render
  frame: FrameSettings;
  activeWindow: 0 | 1;                          // which tab the editor is editing
}
```

`Block`, `BlockType`, `PermissionMode`, `BackdropId`, `AspectId` are unchanged.
`newWindow(): TerminalWindow` and `defaultFrame(): FrameSettings` replace the
window/frame halves of the old `newBlock`/`defaultSettings` split (`newBlock`
stays as-is).

## Store & Reducers

Pure reducers operate on `Doc` and return a new `Doc`. Block reducers take a
window index `w: 0 | 1`:

- `addBlock(doc, w, type, id)`
- `updateBlock(doc, w, id, patch)`
- `removeBlock(doc, w, id)`
- `moveBlock(doc, w, id, dir)`
- `updateWindow(doc, w, patch: Partial<TerminalWindow>)` — permission/cwd/model
- `updateFrame(doc, patch: Partial<FrameSettings>)` — backdrop/padding/aspect/layout
- `setActiveWindow(doc, w)`

Persistence:
- `STORAGE_KEY = "ccsg.doc.v2"`.
- `emptyDoc()` (two empty windows, default frame), `seedDoc()` (two demo windows).
- `loadDoc()` returns `seedDoc()` on missing key; `emptyDoc()` on invalid JSON or
  failed shape guard (guard checks `Array.isArray(doc.windows) && doc.windows.length === 2 && doc.frame`).
- `saveDoc(doc)` swallows errors.
- `useDoc()` hook exposes `{ doc, addBlock, updateBlock, removeBlock, moveBlock,
  updateWindow, updateFrame, setActiveWindow }`, auto-saving on change. Block and
  window actions target an explicit window index; the editor passes `doc.activeWindow`.

## Rendering

- `Terminal` is refactored to take `{ win: TerminalWindow }` (was `{ session: Session }`),
  reading `win.blocks` and `win.permissionMode/cwd/model` for the status bar. No
  visual change to a single terminal.
- `PreviewPane({ doc, captureRef })`: the capture node keeps the backdrop
  background + `frame.padding` + aspect ratio (so `exportPng` is unchanged). Inside
  it, a flex container:
  - `single` → one `Terminal` (window 0), centered, max-width 720.
  - `split-h` → `flex-direction: row`, gap, both terminals, each `flex: 1` (min-width 0).
  - `split-v` → `flex-direction: column`, gap, both terminals.
- `backdrops.ts` and `exportPng.ts` are unchanged.

## Editor

`EditorPane({ doc, addBlock, updateBlock, removeBlock, moveBlock, updateWindow,
updateFrame, setActiveWindow })`. Layout top-to-bottom:

1. **FrameControls** (new component, split from `SettingsPanel`): a Layout
   `<select>` (single / split ↔ / split ↕), backdrop, padding, aspect — all wired
   to `updateFrame`.
2. **Tab bar**: buttons `Window 1` / `Window 2`, shown only when
   `frame.layout !== "single"`; clicking calls `setActiveWindow`. The active tab
   is visually marked.
3. **WindowSettings** (new component, split from `SettingsPanel`): permission
   mode / cwd / model for `doc.windows[doc.activeWindow]`, wired to
   `updateWindow(activeWindow, …)`.
4. **Add-block row + block list** for the active window, wired to the block
   reducers with `doc.activeWindow`. Reuses the existing `BlockEditor` unchanged.

When `layout === "single"`, `activeWindow` is forced to 0 for editing (the tab
bar is hidden); switching back to a split restores the tab bar with both windows'
preserved content.

## Component/File Changes

```
src/state/types.ts        # add TerminalWindow, Layout, FrameSettings, Doc, newWindow, defaultFrame
src/state/docStore.ts     # renamed/rewritten from sessionStore.ts: Doc reducers + persistence + seedDoc
src/state/useDoc.ts        # renamed/rewritten from useSession.ts
src/terminal/Terminal.tsx  # prop session -> win: TerminalWindow
src/preview/PreviewPane.tsx# doc + layout-aware flex of 1-2 Terminals
src/editor/FrameControls.tsx  # new (layout + backdrop/padding/aspect)
src/editor/WindowSettings.tsx # new (permission/cwd/model for active window)
src/editor/EditorPane.tsx  # frame controls + tabs + window settings + block list
src/App.tsx                # useDoc wiring
```
`sessionStore.ts`/`useSession.ts`/`SettingsPanel.tsx` are removed/replaced. Block
renderers, block editors, markdown, theme, backdrops, and export are untouched.

## Testing

- Store: block reducers target the correct window and leave the other untouched;
  `updateWindow`/`updateFrame`/`setActiveWindow`; `loadDoc` seed / invalid-JSON /
  shape-guard paths; save↔load round-trip.
- `newWindow`/`defaultFrame`/`seedDoc` shape.
- FrameControls: layout select fires `updateFrame({ layout })`.
- EditorPane: add/remove/settings target the active window; tab click fires
  `setActiveWindow`; tab bar hidden in single layout.
- PreviewPane: renders one terminal in single, two in split-h/split-v (assert
  count + flex-direction).
- Terminal: still renders a window's blocks + status bar (updated prop).

## Risks / Open Questions

- **Refactor breadth:** renaming `Session`→`Doc`/`TerminalWindow` touches every
  consumer. Mitigated by doing it as an early, well-tested store task before the
  UI tasks, and by the full green suite + build gate.
- **Two terminals overflow in split-h on narrow aspects:** each terminal is
  `flex: 1; min-width: 0` with `overflow-wrap`/`break-word` already on
  `.ccsg-terminal`, so long lines wrap rather than blow out the layout. Verify in
  the manual pass.
