#!/usr/bin/env python3
"""Encode a nitrogen ``Doc`` (JSON on stdin) into a shareable link.

nitrogen (https://nitrogen.cite-met.dev) stores a whole session in the URL hash:
``#s=<base64url(zlib(JSON))>``. This script takes a Doc as JSON on stdin, normalizes
it to the exact shape nitrogen's decoder expects (so you can hand it a lean, partial
Doc and it fills in ids, defaults, and the required second window), compresses it the
same way the app's ``pako.inflate`` reads (zlib / RFC 1950), base64url-encodes it, and
prints the full clickable URL.

The link is produced *deterministically by this script* — never hand-written. Claude's
job is only to emit good Doc content as JSON.

Usage:
    python3 encode.py < doc.json
    echo '<doc json>' | python3 encode.py
    python3 encode.py --check < doc.json      # also print the normalized Doc to stderr
"""
import argparse
import base64
import json
import sys
import zlib

BASE_URL = "https://nitrogen.cite-met.dev/#s="

DEFAULT_MODEL = {
    "claude-code": "opus-4-8",
    "codex": "gpt-5-codex",
    "gemini": "gemini-2.5-pro",
}
AGENTS = set(DEFAULT_MODEL)
PERMISSION_MODES = {"normal", "acceptEdits", "plan", "bypassPermissions"}
BACKDROPS = {"transparent", "slate", "coral", "indigo", "black"}
ASPECTS = {"auto", "16:9", "square", "twitter", "linkedin"}
LAYOUTS = {"single", "split-h", "split-v"}
BLOCK_TYPES = {"userPrompt", "assistant", "bash", "edit", "read", "bare"}


def normalize_block(block, idx):
    b = dict(block)
    b.setdefault("id", f"b{idx}")
    t = b.get("type")
    if t not in BLOCK_TYPES:
        raise ValueError(
            f"block {idx}: invalid type {t!r}; expected one of {sorted(BLOCK_TYPES)}"
        )
    if t in ("userPrompt", "bare"):
        b.setdefault("text", "")
    elif t == "assistant":
        b.setdefault("markdown", "")
    elif t == "bash":
        b.setdefault("command", "")
        b.setdefault("output", "")
    elif t == "read":
        b.setdefault("filepath", "")
        b.setdefault("summary", "")
    elif t == "edit":
        b.setdefault("filepath", "")
        lines = []
        for line in b.get("lines", []):
            kind = line.get("kind", "context")
            if kind not in ("add", "remove", "context"):
                kind = "context"
            lines.append({"kind": kind, "text": line.get("text", "")})
        b["lines"] = lines
    # keep only the fields this block type uses, so a stray field can't bloat the URL
    keep = {"id", "type"}
    keep |= {
        "userPrompt": {"text"},
        "bare": {"text"},
        "assistant": {"markdown"},
        "bash": {"command", "output"},
        "read": {"filepath", "summary"},
        "edit": {"filepath", "lines"},
    }[t]
    return {k: v for k, v in b.items() if k in keep}


def normalize_window(window):
    w = dict(window or {})
    agent = w.get("agent", "claude-code")
    if agent not in AGENTS:
        agent = "claude-code"
    pm = w.get("permissionMode", "normal")
    blocks = [normalize_block(b, i) for i, b in enumerate(w.get("blocks", []))]
    return {
        "agent": agent,
        "permissionMode": pm if pm in PERMISSION_MODES else "normal",
        "cwd": w.get("cwd") or "~/project",
        "model": w.get("model") or DEFAULT_MODEL[agent],
        "blocks": blocks,
    }


def normalize_doc(doc):
    d = dict(doc or {})
    windows = d.get("windows")
    if not isinstance(windows, list):
        windows = []
    windows = [normalize_window(w) for w in windows[:2]]
    while len(windows) < 2:  # nitrogen's decoder requires exactly two windows
        windows.append(normalize_window({}))

    frame = dict(d.get("frame") or {})
    backdrop = frame.get("backdrop", "coral")
    aspect = frame.get("aspect", "auto")
    layout = frame.get("layout", "single")
    try:
        padding = max(0, min(160, int(frame.get("padding", 48))))
    except (TypeError, ValueError):
        padding = 48

    active = 1 if d.get("activeWindow") == 1 else 0
    return {
        "windows": windows,
        "frame": {
            "backdrop": backdrop if backdrop in BACKDROPS else "coral",
            "padding": padding,
            "aspect": aspect if aspect in ASPECTS else "auto",
            "layout": layout if layout in LAYOUTS else "single",
        },
        "activeWindow": active,
    }


def encode(doc, base_url=BASE_URL):
    raw = json.dumps(doc, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
    compressed = zlib.compress(raw, 9)
    b64 = base64.urlsafe_b64encode(compressed).decode("ascii").rstrip("=")
    return base_url + b64


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--base-url", default=BASE_URL, help="override the target base URL")
    parser.add_argument(
        "--check",
        action="store_true",
        help="print the normalized Doc to stderr (sanity check what was encoded)",
    )
    args = parser.parse_args()

    try:
        doc = json.load(sys.stdin)
    except json.JSONDecodeError as exc:
        print(f"error: stdin is not valid JSON: {exc}", file=sys.stderr)
        sys.exit(1)

    try:
        normalized = normalize_doc(doc)
    except ValueError as exc:
        print(f"error: {exc}", file=sys.stderr)
        sys.exit(1)

    if args.check:
        print(json.dumps(normalized, indent=2, ensure_ascii=False), file=sys.stderr)
    print(encode(normalized, args.base_url))


if __name__ == "__main__":
    main()
