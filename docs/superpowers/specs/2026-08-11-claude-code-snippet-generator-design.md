# Claude Code Snippet Generator — Design

**Date:** 2026-08-11
**Status:** Approved (pending spec review)

## Summary

A "Carbon.now.sh for AI conversations": a pure client-side web app that turns a
multi-turn AI prompting session into a beautiful, shareable image. The rendered
card is a faithful, stylized homage to the **Claude Code terminal UI** — prompt
box, `●` assistant lines, tool-use blocks, and the bottom permission-mode status
bar — framed inside a configurable backdrop and exported as a high-resolution PNG
for social media.

## Goals

- Compose a multi-turn Claude Code session from typed, editable blocks.
- Render it as an instantly-recognizable Claude Code TUI screenshot.
- Frame it attractively (backdrop, padding, aspect presets) and export a crisp 2× PNG.
- Everything runs in the browser. No backend, no accounts, no sharing service.

## Non-goals

- No auto-parsing of pasted conversations (blocks are entered manually).
- No accounts, saved gallery, or shareable links.
- No clipboard-image copy in v1 (PNG download only).
- No pixel-perfect cloning of Claude Code — a recognizable stylized homage is the bar.
- No custom terminal color themes in v1 (terminal stays Claude-Code default; variety
  comes from the backdrop).

## Tech Approach

- **Vite + React + TypeScript + Tailwind**, deployed as a static site.
- **Structured block editor**: session state is an ordered list of typed blocks.
- **Export** via `html-to-image`: render the live preview DOM node to a 2× PNG with
  embedded fonts, then trigger a download.
- **Persistence**: current session auto-saved to `localStorage`.

Rejected alternatives: a markdown/DSL source box (fuzzy, can't render tool blocks
precisely) and a canvas/SVG renderer (would require rebuilding text layout, wrapping,
and markdown by hand). The DOM approach gives real markdown + CSS for far less effort.

## Data Model

### Session

```ts
type PermissionMode = "normal" | "acceptEdits" | "plan";

interface SessionSettings {
  permissionMode: PermissionMode;
  cwd: string;            // shown on the status bar right side (optional display)
  model: string;          // label shown on status bar (e.g. "claude-opus-4-8")
  backdrop: BackdropId;   // gradient | solid | transparent preset
  padding: number;        // px between backdrop edge and terminal
  aspect: AspectId;       // "auto" | "16:9" | "square" | "twitter" | "linkedin"
}

interface Session {
  blocks: Block[];
  settings: SessionSettings;
}
```

### Blocks

A discriminated union on `type`. Ordered; each has a stable `id`.

| Type | Fields | Renders as |
|---|---|---|
| `userPrompt` | `text: string` | Bordered `>` input box containing the text |
| `assistant` | `markdown: string` | `●` bullet + rendered markdown |
| `bash` | `command: string`, `output?: string` | `● Bash(command)` then `⎿` indented output |
| `edit` | `filepath: string`, `lines: DiffLine[]` | `● Update(filepath)` then `⎿` colored diff |
| `read` | `filepath: string`, `summary: string` | `● Read(filepath)` then `⎿` summary line |
| `bare` | `text: string` | Dim system/comment line (catch-all) |

```ts
interface DiffLine { kind: "add" | "remove" | "context"; text: string; }
```

The tool-block set is intentionally limited to Bash / Edit / Read — the three most
recognizable. More types can be added later without changing the architecture.

## Faux-Terminal Rendering

The `terminal/` module renders a `Session` into the Claude Code TUI look.

- **Font:** an embedded monospace (crisp, e.g. JetBrains Mono) bundled with the app so
  the export matches on any machine. Everything is monospace.
- **Palette (Claude Code default theme):**
  - near-black background, off-white body text
  - **Claude coral/orange** for the `●` marker on assistant + tool blocks
  - dim gray for secondary text and the `⎿` tree connector
  - green for `+` diff adds, red for `-` diff removes
  - muted accent for the prompt-box border
- **User prompt:** rounded-border box with a `>` glyph and the text inside.
- **Assistant / tool blocks:** left-aligned with the `●` marker; tool output indented
  under the `⎿` connector. Edit blocks show real diff coloring.
- **Bottom status bar:** left side shows the permission-mode indicator
  (`⏵⏵ accept edits on (shift+tab to cycle)`, `⏵ plan mode on`, or nothing for normal);
  right side optionally shows `cwd` and model name.
- **Markdown** in assistant blocks renders bold, lists, headings, inline `code`, and
  fenced code blocks with subtle syntax tinting.

Fidelity call: match the layout and color language closely; do not chase exact pixel
spacing.

## UI Layout

Two-pane layout.

- **Left — editor:**
  - Scrollable stack of block cards, each showing its fields with reorder (↑/↓) and
    delete controls.
  - An "+ Add block" menu listing the block types.
  - A settings panel: permission mode, cwd, model, backdrop, padding, aspect.
- **Right — live preview:**
  - The backdrop + terminal, updating live as fields change.
  - A floating **Export PNG** button.

### Framing controls

- **Backdrop:** presets — gradients (warm coral, cool indigo, slate), solid colors, and
  **transparent**.
- **Padding:** slider controlling space between backdrop edge and terminal.
- **Aspect presets:** `Auto` (fits content), `16:9`, `Square`, `X/Twitter`, `LinkedIn`;
  these set the export canvas while the terminal stays centered.

## Export

- `html-to-image` renders the preview node to a **2× PNG**.
- Fonts embedded so text renders identically to the preview.
- Triggers a download named e.g. `claude-session.png`.
- Transparent backdrop produces a PNG with transparency.

## Persistence

- The current `Session` is serialized to `localStorage` on change and restored on load,
  so a refresh does not lose work. Single implicit session; no named saves in v1.

## Project Structure

```
src/
  blocks/     # block type defs + per-block editor & renderer components
  terminal/   # faux-TUI renderer (prompt box, ● lines, ⎿ connector, diff, status bar)
  editor/     # left pane: block list, add menu, settings panel
  preview/    # right pane: backdrop + terminal + export button
  export/     # html-to-image wrapper (2x PNG, font embedding)
  state/      # session store (blocks + settings) + localStorage
  markdown/   # markdown renderer for assistant blocks
```

## Testing

- Unit-test the state store: add/edit/reorder/delete blocks, settings updates,
  localStorage round-trip.
- Unit-test the markdown renderer and the diff-line rendering logic.
- Component-test each block renderer produces the expected structure (marker, connector,
  diff colors, prompt box).
- Manual/visual verification of the export path (2× PNG, transparent backdrop, aspect
  presets) since pixel output is inherently visual.

## Risks / Open Questions

- **Font embedding in `html-to-image`:** must ensure the bundled monospace is embedded
  in the exported PNG so remote/first-load exports aren't missing glyphs. Verify early.
- **Glyph availability:** `●`, `⎿`, `⏵⏵`, `>` must render in the chosen font; fall back
  to styled elements if a glyph is missing.
