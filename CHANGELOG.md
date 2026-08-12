# Changelog

All notable changes to this project are documented here. The format is loosely based on
[Keep a Changelog](https://keepachangelog.com/). This is a rolling project — changes land on
`main`.

## [Unreleased]

### Added

- **Core generator** — compose a Claude Code terminal session from typed blocks (user prompt,
  assistant markdown, and Bash / Edit / Read tool blocks) and export a 2× PNG.
- **Two independent windows** — `single`, `split ↔` (left/right), or `split ↕` (top/bottom),
  each with its own blocks and settings.
- **Per-window agent themes** — render each window as **Claude Code**, **Codex CLI**, or
  **Gemini CLI**, with matching colors, prompt style, markers, tool labels, and status bar.
- **Framing** — gradient / solid / transparent backdrops, padding, and aspect presets.
- **Shareable links** — the session is compressed into the URL hash (`#s=…`) and restored on
  load; a **Copy link** button copies the URL.
- **Brand** — the nitrogen header, favicons, and social meta tags (Open Graph / Twitter).
- **`nitrogen-link` skill** — turn a coding-agent session into a ready-to-edit link.
- **CI** — lint + type-check/build + tests on every push and PR.

### Security

- Markdown from shared links is sanitized with DOMPurify to prevent XSS.
- Shared-link payloads are decoded as UTF-8, fixing corruption of non-ASCII content.
