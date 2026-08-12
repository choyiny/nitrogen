# Contributing to nitrogen

Thanks for your interest! nitrogen is a small, fully client-side app, so getting started is quick.

## Development setup

```bash
npm install
npm run dev        # http://localhost:5173
```

Requires **Node 22** (see `.nvmrc`).

## Before you open a PR

Run the same checks CI does — all three must pass:

```bash
npm run lint       # ESLint (flat config)
npm run build      # tsc -b + vite build (type-check)
npm test           # Vitest
```

Formatting is handled by Prettier:

```bash
npm run format         # write
npm run format:check   # verify (also runs in CI)
```

## Workflow

- Work on a **feature branch**, not `main`.
- Keep changes focused; prefer small, reviewable PRs.
- Add or update tests for behavior changes — the suite is colocated (`*.test.ts(x)` next to the code).
- Open a PR against `main`. CI (lint + build + test + format check) runs automatically.

## Project layout

See the **How it works** section of the [README](./README.md#-how-it-works) for the `src/` map:
`state/` (Doc model, reducers, persistence, share links), `themes/` (per-agent themes),
`terminal/` (renderers), `editor/`, `preview/`, `export/`, `markdown/`.

## Style

- TypeScript strict mode; no `any` in app code (tests may use it for partial-patch casts).
- Match the surrounding code — Prettier + ESLint enforce the rest.

## Reporting bugs / requesting features

Use the issue templates. For security issues, follow [SECURITY.md](./SECURITY.md) instead.
