"""
Uppdaterar heritage-sites.json med långa UNESCO-texter från data/whc001.json
(description_en + justification_en) – samma nodstruktur som Joakim beskrev.

Kör från projektroten:
  python scripts/refresh_heritage_descriptions.py
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from app.services.whc_descriptions import get_whc_extended_texts

HERITAGE_FILE = ROOT / "data" / "heritage-sites.json"


def main() -> None:
    if not HERITAGE_FILE.is_file():
        print(f"Saknar {HERITAGE_FILE}")
        sys.exit(1)

    with HERITAGE_FILE.open(encoding="utf-8") as f:
        sites = json.load(f)

    updated = 0
    for site in sites:
        uid = str(site.get("unesco_id") or site.get("id") or "").strip()
        if not uid:
            continue
        extended = get_whc_extended_texts(uid)
        if not extended:
            continue

        desc = (extended.get("description_en") or "").strip()
        just = (extended.get("justification_en") or "").strip()
        old = (site.get("desc_en") or site.get("description") or "").strip()
        changed = False

        if desc and len(desc) >= len(old):
            site["description_en"] = desc
            site["desc_en"] = desc
            site["description"] = desc
            changed = True
        if just:
            site["justification_en"] = just
            changed = True

        if changed:
            updated += 1

    with HERITAGE_FILE.open("w", encoding="utf-8") as f:
        json.dump(sites, f, ensure_ascii=False, indent=2)
        f.write("\n")

    print(f"Klart: {updated} platser uppdaterade från whc001.json (av {len(sites)} totalt).")


if __name__ == "__main__":
    main()
