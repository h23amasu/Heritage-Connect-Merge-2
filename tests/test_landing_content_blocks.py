"""UNESCO-landning: alla avsnitt ska kunna delas upp för visning."""
import json
import re
from pathlib import Path

WHC_FILE = Path(__file__).resolve().parents[1] / "data" / "whc001.json"
SECTION_SPLIT = re.compile(
    r"(?=(?:Brief synthesis|Criterion\s*\([ivx]+\)|Integrity|Authenticity|Protection and management requirements))",
    re.I,
)
MAX_BLOCK_CHARS = 5500


def _semantic_blocks(justification: str) -> list[str]:
    raw = justification.strip()
    if not raw:
        return []
    parts = SECTION_SPLIT.split(raw)
    return [p.strip() for p in parts if len(p.strip()) > 20]


def _split_oversized(blocks: list[str]) -> list[str]:
    result = []
    for block in blocks:
        if len(block) <= MAX_BLOCK_CHARS:
            result.append(block)
            continue
        sentences = re.findall(r"[^.!?]+[.!?]+(?:\s|$)|[^.!?]+", block) or [block]
        chunk = ""
        for sentence in sentences:
            if len(chunk) + len(sentence) > MAX_BLOCK_CHARS and chunk:
                result.append(chunk.strip())
                chunk = sentence
            else:
                chunk += sentence
        if chunk.strip():
            result.append(chunk.strip())
    return result


def test_longest_sites_split_under_translate_limit():
    data = json.loads(WHC_FILE.read_text(encoding="utf-8"))
    rows = []
    for item in data:
        if not isinstance(item, dict):
            continue
        uid = str(item.get("id_no") or "")
        desc = (item.get("description_en") or "").strip()
        just = (item.get("justification_en") or "").strip()
        blocks = []
        if desc:
            blocks.append(desc)
        blocks.extend(_semantic_blocks(just))
        blocks = _split_oversized(blocks)
        if blocks:
            rows.append((len(desc) + len(just), uid, max(len(b) for b in blocks), len(blocks)))

    rows.sort(reverse=True)
    assert rows, "whc001 should contain UNESCO texts"
    _total, uid, max_block, count = rows[0]
    assert max_block <= MAX_BLOCK_CHARS, f"site {uid} block too large: {max_block}"
    assert count <= 80, f"site {uid} has too many blocks for batch API: {count}"
