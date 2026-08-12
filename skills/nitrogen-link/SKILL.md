---
name: nitrogen-link
description: >-
  Generate a shareable nitrogen link (https://nitrogen.cite-met.dev/#s=...) that opens a
  coding-agent terminal snippet in the nitrogen editor, pre-filled from content the user
  provides. Use this whenever the user wants to turn an AI coding session, a
  prompt-and-response, or a description of what a coding agent did into a nitrogen
  snippet, shareable card, or terminal image starting point — including phrases like
  "make a nitrogen link", "turn this into a nitrogen snippet/card", "nitrogen link for
  this", or when they paste a Claude Code / Codex / Gemini CLI session and want to
  visualize or share it. The skill drafts a concise summary (NOT a verbatim transcript)
  as a nitrogen Doc, and a bundled script encodes it into the link so the user can make
  final edits in the UI. Prefer this skill over hand-building any nitrogen URL.
---

# nitrogen-link

nitrogen (https://nitrogen.cite-met.dev) is a Carbon-style tool that renders a faux
coding-agent terminal session as a shareable image. A whole session lives in the URL
hash (`#s=<compressed>`); opening such a link loads that session into the editor.

This skill produces one of those links from content the user gives you, so they land in
the nitrogen editor with a good starting point and only need to make minor tweaks before
exporting.

## What you do vs. what the script does

- **You** (Claude) read the user's content and write a nitrogen **Doc** as JSON — a
  concise, tasteful *summary*, not a copy-paste of the whole conversation.
- **The bundled `encode.py`** turns that JSON into the final `https://nitrogen.cite-met.dev/#s=...`
  link. Never hand-write the encoded part of the URL — it is compressed binary; only the
  script produces a valid one.

## The most important idea: summarize, don't transcribe

nitrogen cards are for sharing, so they work like a **tl;dr of a session**, not a full
log. Real prompts and responses are long; a good card shows the *shape* of what happened:

- The user's ask, tightened to one or two sentences.
- The agent's answer, distilled to a few lines of markdown (a short intro + a bullet or
  numbered list is ideal). Trim anything that wouldn't fit on a slide.
- A handful of **representative tool blocks** — one or two `Read`/`Edit`/`Bash` lines that
  convey "it read this, changed that, ran the tests" — not every tool call. Two to five
  blocks per window usually reads best.

If the user says "keep it exact" or pastes something short, follow their lead — but the
default is a punchy summary they can refine in the UI.

## Workflow

1. Understand the content. What was asked, what the agent did, which agent it was.
2. Decide the frame: usually a **single** window. Use **split-h** (left/right) only when
   the content is a genuine comparison (e.g. two agents, or two approaches) — then fill
   both windows.
3. Write the Doc JSON (see schema below). You only need to include what you want to set;
   the script fills ids, default models, the required second window, and frame defaults.
4. Run the encoder and give the user the link (plus a one-line note on what you assumed,
   so they know what to tweak).

Run the encoder by piping your JSON into the bundled script (it lives in this skill's
directory — use its absolute path):

```bash
python3 /path/to/skills/nitrogen-link/encode.py <<'JSON'
{ ...your Doc JSON... }
JSON
```

Add `--check` to also print the normalized Doc to stderr if you want to sanity-check what
was encoded. The script prints the full clickable link on stdout.

## The Doc: building blocks (every variable is settable)

A Doc has a shared **frame**, exactly **two windows**, and an active-window index. You may
omit anything and the script fills a sensible default; set what you care about.

```jsonc
{
  "frame": {
    "backdrop": "coral",   // transparent | slate | coral | indigo | black
    "padding": 48,         // 0–160, space around the terminal(s)
    "aspect": "auto",      // auto | 16:9 | square | twitter | linkedin
    "layout": "single"     // single | split-h (left/right) | split-v (top/bottom)
  },
  "activeWindow": 0,        // 0 or 1 — which window the editor opens on
  "windows": [
    {
      "agent": "claude-code",       // claude-code | codex | gemini  (drives the whole theme)
      "permissionMode": "acceptEdits", // normal | acceptEdits | plan | bypassPermissions
      "cwd": "~/project",
      "model": "opus-4-8",          // omit to use the agent's default
      "blocks": [ /* see block types */ ]
    }
    // a second window is added automatically for "single"; provide it yourself for a split
  ]
}
```

### Agents

Pick the `agent` that matches whose session it is; it sets the colors, prompt style,
marker, tool-label wording, and status bar. Default model per agent (used if you omit
`model`):

| agent          | looks like                                   | default model     |
|----------------|----------------------------------------------|-------------------|
| `claude-code`  | coral `●`, `Bash`/`Update`/`Read` labels     | `opus-4-8`        |
| `codex`        | teal `•`, plain `›` prompt, `apply_patch`    | `gpt-5-codex`     |
| `gemini`       | blue `✦`, `Shell`/`Edit`/`ReadFile` labels   | `gemini-2.5-pro`  |

`permissionMode` renders as the status-bar mode (Claude shows `accept edits`/`plan
mode`/`bypass permissions`; other agents show their own wording).

### Block types

Blocks are the lines in the terminal, in order. Each needs a `type`; `id` is added for you.

| type         | fields                                                        | renders as                          |
|--------------|--------------------------------------------------------------|-------------------------------------|
| `userPrompt` | `text`                                                       | the `>` input box with the prompt   |
| `assistant`  | `markdown`                                                   | `●` + rendered markdown             |
| `bash`       | `command`, `output`                                          | `● Bash(command)` then `⎿ output`   |
| `edit`       | `filepath`, `lines: [{ kind, text }]`                        | `● Update(filepath)` + colored diff |
| `read`       | `filepath`, `summary`                                        | `● Read(filepath)` then `⎿ summary` |
| `bare`       | `text`                                                       | a dim standalone line               |

For `edit`, each line's `kind` is `add` (green `+`), `remove` (red `-`), or `context`
(plain). Keep diffs to the few lines that matter.

`markdown` supports the usual: `**bold**`, `` `inline code` ``, bullet/numbered lists,
fenced code blocks, headings. Keep it short — it's a card, not a doc.

## Example

**User provides:** "Here's a Codex session — I asked it to make the CLI read config from
env vars, it patched config.rs and cli.rs and the tests passed."

**You write:**

```bash
python3 /path/to/skills/nitrogen-link/encode.py <<'JSON'
{
  "frame": { "backdrop": "black", "layout": "single" },
  "windows": [
    {
      "agent": "codex",
      "permissionMode": "acceptEdits",
      "cwd": "~/mycli",
      "blocks": [
        { "type": "userPrompt", "text": "Read config from environment variables, not just the config file" },
        { "type": "assistant", "markdown": "I'll layer **env vars over the file** so `MYCLI_*` wins:\n\n- parse env in `config.rs`\n- fall back to the file, then defaults" },
        { "type": "edit", "filepath": "src/config.rs", "lines": [
          { "kind": "context", "text": "let cfg = load_file()?;" },
          { "kind": "add", "text": "let cfg = apply_env_overrides(cfg);" }
        ] },
        { "type": "edit", "filepath": "src/cli.rs", "lines": [
          { "kind": "add", "text": "// env vars now take precedence" }
        ] },
        { "type": "bash", "command": "cargo test", "output": "test result: ok. 24 passed" }
      ]
    }
  ]
}
JSON
```

Then hand the user the printed link and note what you assumed (agent, backdrop, which
tool calls you kept), so they can adjust in the editor.

## Tips

- The script guarantees a valid, decodable Doc (it always emits two windows, fills ids,
  clamps padding, and defaults unknown/missing fields), so you can pass a lean Doc.
- Longer sessions make longer URLs. That's fine, but it's another reason to summarize.
- If a link ever fails to open, re-run with `--check` and confirm the normalized Doc is
  the shape you intended.
