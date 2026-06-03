"""
Uppdaterar desc_en i data/heritage-sites.json från UNESCO WHC-listan (längsta beskrivning).

Kör från projektroten:
  python scripts/refresh_heritage_descriptions.py

Kräver nätverk (whc.unesco.org). Vid fel ändras inget.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from app.services.unesco_service import _extract_whc_description, fetch_unesco_remote

HERITAGE_FILE = ROOT / "data" / "heritage-sites.json"


def main() -> None:
    if not HERITAGE_FILE.is_file():
        print(f"Saknar {HERITAGE_FILE}")
        sys.exit(1)

    with HERITAGE_FILE.open(encoding="utf-8") as f:
        sites = json.load(f)

    remote = fetch_unesco_remote()
    by_id = {
        str(s.get("unesco_id") or ""): s
        for s in remote
        if s.get("unesco_id")
    }

    updated = 0
    for site in sites:
        uid = str(site.get("unesco_id") or "")
        whc = by_id.get(uid)
        if not whc:
            continue
        new_desc = (whc.get("desc_en") or whc.get("description") or "").strip()
        if not new_desc:
            continue
        old = (site.get("desc_en") or site.get("description") or "").strip()
        if len(new_desc) > len(old):
            site["desc_en"] = new_desc
            site["description"] = new_desc
            updated += 1

    with HERITAGE_FILE.open("w", encoding="utf-8") as f:
        json.dump(sites, f, ensure_ascii=False, indent=2)
        f.write("\n")

    print(f"Klart: {updated} platser fick längre desc_en (av {len(sites)} totalt).")


if __name__ == "__main__":
    main()
