"""
Server-side rendering helpers for SMS landningssidan (/sites/{id}).
"""
from __future__ import annotations

import html
import json
import re
from functools import lru_cache
from pathlib import Path

from fastapi import Request
from fastapi.responses import HTMLResponse, RedirectResponse

_PROJECT_ROOT = Path(__file__).resolve().parents[2]
_LANDING_HTML_PATH = _PROJECT_ROOT / "site-landing.html"
_LANDING_UI_JSON = _PROJECT_ROOT / "data" / "landing-ui.json"
_LANG_COOKIE = "heritage_connect_reader_lang"


@lru_cache
def _load_landing_ui() -> dict[str, dict[str, str]]:
    raw = _LANDING_UI_JSON.read_text(encoding="utf-8")
    return json.loads(raw)


def normalize_landing_lang(code: str | None) -> str:
    return (code or "sv").strip().lower()[:2] or "sv"


def landing_ui_pack(lang: str) -> dict[str, str]:
    data = _load_landing_ui()
    code = normalize_landing_lang(lang)
    return data.get(code) or data.get("en") or data["sv"]


def resolve_landing_lang_from_request(request: Request) -> str:
    query_lang = request.query_params.get("lang")
    if query_lang:
        return normalize_landing_lang(query_lang)

    cookie_lang = request.cookies.get(_LANG_COOKIE)
    if cookie_lang:
        return normalize_landing_lang(cookie_lang)

    accept = request.headers.get("accept-language", "")
    for part in accept.split(","):
        token = part.split(";")[0].strip().lower()
        if not token:
            continue
        code = token.split("-")[0][:2]
        data = _load_landing_ui()
        if code in data:
            return code

    return "sv"


def _replace_i18n_text(page: str, pack: dict[str, str]) -> str:
    for key, value in pack.items():
        escaped = html.escape(value, quote=False)
        page = re.sub(
            rf'(<[^>]+data-i18n="{re.escape(key)}"[^>]*>)([^<]*)(</)',
            rf"\1{escaped}\3",
            page,
            count=1,
        )
        page = re.sub(
            rf'(<[^>]+data-i18n-placeholder="{re.escape(key)}"[^>]*placeholder=")[^"]*(")',
            rf"\1{html.escape(value, quote=True)}\2",
            page,
            count=1,
        )
    return page


def render_landing_html(lang: str) -> str:
    code = normalize_landing_lang(lang)
    pack = landing_ui_pack(code)
    page = _LANDING_HTML_PATH.read_text(encoding="utf-8")
    page = re.sub(
        r"<html([^>]*)lang=\"[^\"]*\"",
        rf'<html\1lang="{code}"',
        page,
        count=1,
    )
    page = _sub_script_version(page)
    page = _replace_i18n_text(page, pack)
    bootstrap = (
        "<script>"
        f"window.__LANDING_LANG__={json.dumps(code)};"
        f"window.__LANDING_UI_PACK__={json.dumps(pack, ensure_ascii=False)};"
        "</script>"
    )
    return page.replace("</head>", f"{bootstrap}\n</head>", 1)


def _sub_script_version(page: str) -> str:
    return re.sub(r"/js/landing\.js\?v=\d+", "/js/landing.js?v=15", page)


def serve_site_landing_response(site_ref: str, request: Request):
    """Return redirect, or HTML with language applied server-side."""
    query_lang = request.query_params.get("lang")
    if not query_lang:
        cookie_lang = request.cookies.get(_LANG_COOKIE)
        if cookie_lang and normalize_landing_lang(cookie_lang) != "sv":
            code = normalize_landing_lang(cookie_lang)
            return RedirectResponse(
                url=f"/sites/{site_ref}?lang={code}",
                status_code=302,
            )

    lang = resolve_landing_lang_from_request(request)
    body = render_landing_html(lang)
    return HTMLResponse(
        content=body,
        headers={
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
        },
    )
