#!/usr/bin/env python3
"""Guard against stale CSP sha256 hashes (run after every build).

Why this exists: netlify.toml pins a Content-Security-Policy whose script-src
allows the inline scripts in index.html by hash. Whenever the inline theme
boot script or the JSON-LD block changes, the old hash no longer matches and the
browser silently refuses to run it. Real consequence found live 2026-09-11: the
boot-time theme script was blocked, so `prefers-color-scheme: dark` users got the
wrong theme on first paint, and the WebApplication JSON-LD never executed.

Usage:  python3 scripts/check_csp_hashes.py       (exit 1 if anything is blocked)
"""
import base64
import hashlib
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
HTML = ROOT / "dist" / "spa" / "index.html"
TOML = ROOT / "netlify.toml"

if not HTML.exists():
    print(f"SKIP: {HTML} not found — run the build first")
    sys.exit(0)

html = HTML.read_text(encoding="utf-8")
toml = TOML.read_text(encoding="utf-8")
allowed = set(re.findall(r"'sha256-([A-Za-z0-9+/=]+)'", toml))

inline = re.findall(r"<script(?![^>]*\bsrc=)[^>]*>(.*?)</script>", html, re.S)
blocked = []
for i, body in enumerate(inline):
    digest = base64.b64encode(hashlib.sha256(body.encode("utf-8")).digest()).decode()
    if digest in allowed:
        print(f"  OK       inline script[{i}] (len {len(body)})")
    else:
        print(f"  BLOCKED  inline script[{i}] (len {len(body)}) -> add 'sha256-{digest}'")
        blocked.append(digest)

if blocked:
    print("\nStale CSP hash(es). Update script-src in netlify.toml with the above.")
    sys.exit(1)
print("\nAll inline scripts are covered by the CSP.")
