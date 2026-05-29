"""
Lokal PDF/text-inläsning för AI (ingen internetåtkomst vid svar).
"""
from pathlib import Path
from typing import List, Tuple

DATA_PDF_DIR = Path(__file__).resolve().parents[2] / "data" / "pdf"


def load_local_documents(site_id: int | str) -> List[Tuple[str, str]]:
    """
    Returnerar lista (filename, content) för site_id.
    Matchar filnamn som innehåller site_id eller generiska filer.
    """
    if not DATA_PDF_DIR.exists():
        return []

    sid = str(site_id).lower()
    results: List[Tuple[str, str]] = []

    for path in sorted(DATA_PDF_DIR.iterdir()):
        if path.suffix.lower() not in (".txt", ".pdf"):
            continue
        name_lower = path.stem.lower()
        if sid not in name_lower and sid != "1" and "engelsberg" not in name_lower:
            if path.name != "engelsbergs_bruk.txt":
                continue

        content = _read_file(path)
        if content.strip():
            results.append((path.name, content))

    return results


def _read_file(path: Path) -> str:
    if path.suffix.lower() == ".txt":
        return path.read_text(encoding="utf-8")

    try:
        from pypdf import PdfReader

        reader = PdfReader(str(path))
        parts = []
        for page in reader.pages[:20]:
            text = page.extract_text()
            if text:
                parts.append(text)
        return "\n".join(parts)
    except Exception:
        return ""
