"""
Hämtar UNESCO-bilder till data/images/ (site_<unesco_id>.jpg).
Kör: python scripts/download_site_images.py
     python scripts/download_site_images.py --sweden   # bara svenska världsarv
"""
from __future__ import annotations

import argparse
import json
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HERITAGE_FILE = ROOT / "data" / "heritage-sites.json"
OUT_DIR = ROOT / "data" / "images"

SWEDISH_IDS = {
    "1027", "556", "731", "558", "559", "555", "871", "968",
    "557", "774", "762", "1134", "1282",
}


def download(unesco_id: str) -> bool:
    url = f"https://whc.unesco.org/uploads/sites/site_{unesco_id}.jpg"
    target = OUT_DIR / f"site_{unesco_id}.jpg"
    try:
        with urllib.request.urlopen(url, timeout=30) as resp:
            target.write_bytes(resp.read())
        return True
    except Exception as exc:
        print(f"  misslyckades {unesco_id}: {exc}")
        return False


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--sweden", action="store_true", help="Ladda bara svenska platser")
    args = parser.parse_args()

    with HERITAGE_FILE.open(encoding="utf-8") as f:
        sites = json.load(f)

    ids = sorted(
        {
            str(site.get("unesco_id"))
            for site in sites
            if site.get("unesco_id") and (not args.sweden or str(site.get("unesco_id")) in SWEDISH_IDS)
        }
    )

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    ok = 0
    for uid in ids:
        if download(uid):
            ok += 1
            print(f"  ok {uid}")
    print(f"Klart: {ok}/{len(ids)} bilder i {OUT_DIR}")


if __name__ == "__main__":
    main()
