"""Build static site into docs/ for GitHub Pages."""
from __future__ import annotations

import re
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
STATIC = ROOT / "static"
DOCS = ROOT / "docs"
DEMO_JSON = DOCS / "data" / "demo.json"


def main() -> None:
    if not DEMO_JSON.is_file():
        raise SystemExit(f"Missing {DEMO_JSON} — run scripts/export_demo_data.py first")

    dest_static = DOCS / "static"
    if dest_static.exists():
        shutil.rmtree(dest_static)
    shutil.copytree(STATIC, dest_static)

    html = (STATIC / "index.html").read_text(encoding="utf-8")
    html = html.replace('href="/static/', 'href="static/')
    html = html.replace('src="/static/', 'src="static/')
    (DOCS / "index.html").write_text(html, encoding="utf-8")
    print(f"Built {DOCS / 'index.html'} and {dest_static}")


if __name__ == "__main__":
    main()
