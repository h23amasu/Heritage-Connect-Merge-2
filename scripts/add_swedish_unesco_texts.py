"""
Lägger till name_sv och desc_sv för svenska världsarv i data/heritage-sites.json.
Kör: python scripts/add_swedish_unesco_texts.py
"""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HERITAGE_FILE = ROOT / "data" / "heritage-sites.json"

# Officiella svenska namn och sammanfattningar (UNESCO / Riksantikvarieämbetet).
SWEDISH_SITES: dict[str, dict[str, str]] = {
    "1027": {
        "name_sv": "Gruvorna i Falun",
        "desc_sv": (
            "Den enorma gruvutgrävningen Stora stöten i Falun är det mest slående inslaget "
            "i ett landskap som berättar om kopparbrytning i regionen sedan minst 1300-talet. "
            "Gruvorna, bruken och boningshusen runt omkring har vuxit fram kring Falun och "
            "påverkat svensk ekonomi, teknik och samhällsliv i århundraden."
        ),
    },
    "556": {
        "name_sv": "Engelsbergs bruk",
        "desc_sv": (
            "Engelsbergs bruk är ett av de bäst bevarade exempelen på en svensk järnbruk "
            "från 1600- till 1800-talen. Här finns unik industri- och bruksbebyggelse som "
            "visar hur järnproduktionen organiserades och utvecklades i Sverige."
        ),
    },
    "731": {
        "name_sv": "Hansastaden Visby",
        "desc_sv": (
            "Visby är det bäst bevarade hansastaden i Norden. Den medeltida ringmuren, "
            "kyrkoruinerna och stadskärnan vittnar om Visbys roll som viktig handelsplats "
            "i Östersjöområdet."
        ),
    },
    "558": {
        "name_sv": "Skogskyrkogården",
        "desc_sv": (
            "Skogskyrkogården i Stockholm är ett mästerverk inom modern landskapsarkitektur "
            "där natur och begravningskonst smälter samman. Anläggningen har haft stor "
            "internationell betydelse för hur kyrkogårdar formgivits i skogsmiljö."
        ),
    },
    "559": {
        "name_sv": "Drottningholms slott med teater",
        "desc_sv": (
            "Det kungliga Drottningholms slottet med slottsteater, park och omgivande "
            "miljöer utgör en enastående representant för den europeiska arkitekturen "
            "från 1600- och 1700-talen och är fortfarande Sveriges representativa residens."
        ),
    },
    "555": {
        "name_sv": "Birka och Hovgården",
        "desc_sv": (
            "Birka och Hovgården är arkeologiska lämningar som belyser vikingatidens handel "
            "och urbanisering. Birka på Björkö var en av Skandinaviens viktigaste handelsplatser, "
            "medan Hovgården på Adelsö var ett kungligt maktcentrum."
        ),
    },
    "871": {
        "name_sv": "Örlogsstaden Karlskrona",
        "desc_sv": (
            "Karlskrona grundades som örlogsstad på 1600-talet och har en unikt bevarad "
            "stadsplan och bebyggelse anpassad för marin verksamhet. Varvsområdet och "
            "befästningarna utgör en viktig del av Sveriges maritima arv."
        ),
    },
    "968": {
        "name_sv": "Södra Ölands jordbrukslandskap",
        "desc_sv": (
            "Södra Ölands jordbrukslandskap präglas av stenmurar, jordkvarnar och "
            "gårdar som formats av långvarigt jordbruk på kalkstensön. Landskapet "
            "visar hur människor anpassat sig till en utmanande miljö över tusentals år."
        ),
    },
    "557": {
        "name_sv": "Hällristningar i Tanum",
        "desc_sv": (
            "Hällristningarna i Tanums kommun är en av Nordeuropas rikaste koncentrationer "
            "av bronsåldershällristningar. Motiven av båtar, människor och djur ger unik "
            "inblick i religiösa och sociala uttryck från förhistorisk tid."
        ),
    },
    "774": {
        "name_sv": "Lapplands världsarvsområde",
        "desc_sv": (
            "Laponia omfattar nationalparker och naturreservat i svenska Lappland och "
            "vittnar om en uråldrig natur och det samiska nomadlivets långa historia. "
            "Området kombinerar höga berg, glaciärer och urskog i ett av Europas sista "
            "stora vildmarksområden."
        ),
    },
    "762": {
        "name_sv": "Gammelstads kyrkstad",
        "desc_sv": (
            "Gammelstads kyrkstad i Luleå är det största och bäst bevarade exemplet på "
            "en traditionell kyrkstad i Norrland. De många kyrkstugorna visar hur "
            "sockenborna tidigare bodde nära kyrkan under helgdagar och marknader."
        ),
    },
    "1134": {
        "name_sv": "Radiostationen i Grimeton",
        "desc_sv": (
            "Radiostationen i Grimeton med dess alternatorhall och antenner är det enda "
            "kvarvarande storskaliga anläggningen för trådlös telegrafi baserad på "
            "originalteknik från början av 1900-talet. Den symboliserar en vändpunkt "
            "i global kommunikation."
        ),
    },
    "1282": {
        "name_sv": "Hälsingegårdar",
        "desc_sv": (
            "Hälsingegårdarna är praktfullt dekorerade bondgårdar från 1700- och 1800-talen "
            "som visar en unik byggnadstradition i Hälsingland. Gårdarna vittnar om "
            "välstånd, hantverk och festkultur i den agrara historien."
        ),
    },
    # Demopositioner i UI (Berlin / Paris)
    "896": {
        "name_sv": "Museumsön i Berlin",
        "desc_sv": (
            "Museet som socialt fenomen har sina rötter i upplysningstiden på 1700-talet. "
            "De fem museerna på Museumsinsel i Berlin, uppförda mellan 1824 och 1930, "
            "är förverkligandet av ett visionärt projekt och visar hur museers utformning "
            "utvecklats under 1900-talet. Varje museum designades för att skapa en organisk "
            "koppling till den konst det hyser."
        ),
    },
    "868": {
        "name_sv": "Santiago de Compostelas vägar i Frankrike",
        "desc_sv": (
            "Santiago de Compostela var det främsta målet för otaliga fromma pilgrimer som "
            "vandrade dit från hela Europa under medeltiden. För att nå Spanien måste "
            "pilgrimer passera genom Frankrike, och de viktiga historiska monument som "
            "ingår i världsarvet markerar de fyra pilgrimsvägarna genom landet."
        ),
    },
    "600": {
        "name_sv": "Paris, Seine-flodens stränder",
        "desc_sv": (
            "Från Louvren till Eiffeltornet, från Place de la Concorde till Grand och "
            "Petit Palais kan París utveckling och historia skådas längs Seine. "
            "Notre-Dame-katedralen och Sainte-Chapelle är arkitektoniska mästerverk, "
            "medan Haussmanns vida torg och boulevarder påverkat stadsplanering världen "
            "över sedan slutet av 1800-talet."
        ),
    },
}


def main() -> None:
    with HERITAGE_FILE.open(encoding="utf-8") as f:
        sites = json.load(f)

    updated = 0
    for site in sites:
        uid = str(site.get("unesco_id") or "")
        if uid not in SWEDISH_SITES:
            continue
        patch = SWEDISH_SITES[uid]
        site["name_sv"] = patch["name_sv"]
        site["desc_sv"] = patch["desc_sv"]
        updated += 1

    with HERITAGE_FILE.open("w", encoding="utf-8") as f:
        json.dump(sites, f, ensure_ascii=False, separators=(",", ":"))

    print(f"Uppdaterade {updated} svenska världsarv i {HERITAGE_FILE.name}")


if __name__ == "__main__":
    main()
