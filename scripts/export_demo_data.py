"""Export ESPN snapshot for GitHub Pages demo."""
from __future__ import annotations

import asyncio
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from server import fetch_all_data  # noqa: E402


async def main() -> None:
    data = await fetch_all_data()
    data["exported_at"] = datetime.now(timezone.utc).isoformat()
    out = ROOT / "docs" / "data" / "demo.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {out} ({len(data.get('matches', []))} matches)")


if __name__ == "__main__":
    asyncio.run(main())
