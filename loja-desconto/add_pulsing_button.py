#!/usr/bin/env python3
"""Add a pulsing effect to the last CTA button on loja-desconto.com page 15.

Usage:
  python add_pulsing_button.py
  python add_pulsing_button.py --apply

Environment variables used for --apply:
  WP_BASE_URL      default: https://loja-desconto.com
  WP_PAGE_ID       default: 15
  WP_USERNAME      required for --apply
  WP_APP_PASSWORD  required for --apply
"""

from __future__ import annotations

import argparse
import base64
import json
import os
import random
import sys
import urllib.error
import urllib.request


DEFAULT_BASE_URL = "https://loja-desconto.com"
DEFAULT_PAGE_ID = 15
TARGET_WIDGET_ID = "1bb61fd5"
STYLE_ID = "pulse-cta-last-style"
STYLE_WIDGET_MARKER = "pulse-cta-last-style-widget"
BUTTON_ATTR_MARKER = "data-pulse-test|1,id|pulse-last-cta"

PULSE_STYLE = f"""
<style id="{STYLE_ID}">
.elementor-element-{TARGET_WIDGET_ID} .elementor-button {{
  animation: pulseCtaLast 1.8s ease-in-out infinite;
  box-shadow: 0 0 0 0 rgba(9, 199, 237, 0.55);
  transform: translateZ(0);
  border-radius: 18px;
}}
.elementor-element-{TARGET_WIDGET_ID} .elementor-button:hover,
.elementor-element-{TARGET_WIDGET_ID} .elementor-button:focus {{
  animation-play-state: paused;
}}
@keyframes pulseCtaLast {{
  0% {{
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(9, 199, 237, 0.55);
  }}
  50% {{
    transform: scale(1.04);
    box-shadow: 0 0 0 16px rgba(9, 199, 237, 0);
  }}
  100% {{
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(9, 199, 237, 0);
  }}
}}
</style>
""".strip()

PAGE_CUSTOM_CSS = f"""
.elementor-15 .elementor-element.elementor-element-{TARGET_WIDGET_ID} .elementor-button {{
  animation: pulseCtaLast 1.8s ease-in-out infinite;
  box-shadow: 0 0 0 0 rgba(9, 199, 237, 0.55);
  transform: translateZ(0);
  border-radius: 18px;
}}
.elementor-15 .elementor-element.elementor-element-{TARGET_WIDGET_ID} .elementor-button:hover,
.elementor-15 .elementor-element.elementor-element-{TARGET_WIDGET_ID} .elementor-button:focus {{
  animation-play-state: paused;
}}
@keyframes pulseCtaLast {{
  0% {{
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(9, 199, 237, 0.55);
  }}
  50% {{
    transform: scale(1.04);
    box-shadow: 0 0 0 16px rgba(9, 199, 237, 0);
  }}
  100% {{
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(9, 199, 237, 0);
  }}
}}
""".strip()


def build_auth(username: str, app_password: str) -> str:
    token = base64.b64encode(f"{username}:{app_password}".encode("utf-8")).decode("ascii")
    return f"Basic {token}"


def request_json(url: str, *, auth: str | None = None, method: str = "GET", data: dict | None = None) -> dict:
    headers = {"Content-Type": "application/json"}
    if auth:
        headers["Authorization"] = auth
    payload = json.dumps(data).encode("utf-8") if data is not None else None
    req = urllib.request.Request(url, headers=headers, data=payload, method=method)
    with urllib.request.urlopen(req, timeout=30) as response:
        return json.loads(response.read().decode("utf-8"))


def rand_id() -> str:
    alphabet = "0123456789abcdef"
    return "".join(random.choice(alphabet) for _ in range(8))


def make_style_widget() -> dict:
    return {
        "id": rand_id(),
        "elType": "widget",
        "widgetType": "html",
        "settings": {
            "html": PULSE_STYLE,
            "css_classes": STYLE_WIDGET_MARKER,
        },
        "elements": [],
    }


def has_style_widget(element) -> bool:
    if isinstance(element, dict):
        settings = element.get("settings") or {}
        if STYLE_WIDGET_MARKER in str(settings.get("css_classes") or ""):
            return True
        if STYLE_ID in str(settings.get("html") or ""):
            return True
        for child in element.get("elements") or []:
            if has_style_widget(child):
                return True
    elif isinstance(element, list):
        for item in element:
            if has_style_widget(item):
                return True
    return False


def find_widget(element):
    if isinstance(element, dict):
        if element.get("id") == TARGET_WIDGET_ID:
            return element
        for child in element.get("elements") or []:
            found = find_widget(child)
            if found is not None:
                return found
    elif isinstance(element, list):
        for item in element:
            found = find_widget(item)
            if found is not None:
                return found
    return None


def insert_style_widget(elements: list[dict]) -> bool:
    for idx, element in enumerate(elements):
        if not isinstance(element, dict):
            continue
        if element.get("id") == TARGET_WIDGET_ID:
            elements.insert(idx, make_style_widget())
            return True
        children = element.get("elements") or []
        if insert_style_widget(children):
            return True
    return False


def patch_content(html: str) -> tuple[str, bool]:
    changed = False
    if STYLE_ID not in html:
        html = PULSE_STYLE + "\n" + html
        changed = True
    return html, changed


def patch_elementor_data(raw_data: str) -> tuple[str, bool]:
    parsed = json.loads(raw_data or "[]")
    if not isinstance(parsed, list):
        raise RuntimeError("Unexpected _elementor_data format.")
    target_widget = find_widget(parsed)
    if target_widget is None:
        raise RuntimeError(f"Target widget {TARGET_WIDGET_ID} not found in _elementor_data.")
    changed = False

    settings = target_widget.setdefault("settings", {})
    link = settings.setdefault("link", {})
    current_attrs = str(link.get("custom_attributes") or "")
    if BUTTON_ATTR_MARKER not in current_attrs:
        link["custom_attributes"] = (current_attrs + "," + BUTTON_ATTR_MARKER).strip(",")
        changed = True

    if not has_style_widget(parsed):
        if not insert_style_widget(parsed):
            raise RuntimeError(f"Target widget {TARGET_WIDGET_ID} not found in _elementor_data.")
        changed = True

    return json.dumps(parsed, ensure_ascii=False), changed


def fetch_page(base_url: str, page_id: int, auth: str | None = None) -> dict:
    url = f"{base_url.rstrip('/')}/wp-json/wp/v2/pages/{page_id}"
    if auth:
        url += "?context=edit"
    return request_json(url, auth=auth)


def get_html_source(page_data: dict) -> str:
    content = page_data.get("content") or {}
    return content.get("raw") or content.get("rendered") or ""


def apply_update(base_url: str, page_id: int, auth: str, html: str, page_settings: dict, elementor_data: str) -> dict:
    url = f"{base_url.rstrip('/')}/wp-json/wp/v2/pages/{page_id}"
    payload = {
        "content": html,
        "meta": {
            "_elementor_edit_mode": "builder",
            "_elementor_template_type": "wp-page",
            "_elementor_data": elementor_data,
            "_elementor_page_settings": page_settings,
        },
    }
    return request_json(url, auth=auth, method="POST", data=payload)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true", help="Publish the update to WordPress via REST.")
    args = parser.parse_args()

    base_url = os.getenv("WP_BASE_URL", DEFAULT_BASE_URL).strip() or DEFAULT_BASE_URL
    page_id = int(os.getenv("WP_PAGE_ID", str(DEFAULT_PAGE_ID)))
    username = os.getenv("WP_USERNAME", "").strip()
    app_password = os.getenv("WP_APP_PASSWORD", "").strip()
    auth = build_auth(username, app_password) if username and app_password else None

    try:
        page_data = fetch_page(base_url, page_id, auth)
        original_html = get_html_source(page_data)
        page_meta = page_data.get("meta") or {}
        original_elementor_data = page_meta.get("_elementor_data") or "[]"

        patched_html, changed_html = patch_content(original_html)
        patched_elementor_data, changed_elementor = patch_elementor_data(original_elementor_data)
        patched_page_settings = dict(page_meta.get("_elementor_page_settings") or {})
        existing_custom_css = str(patched_page_settings.get("custom_css") or "")
        changed_page_settings = False
        if PAGE_CUSTOM_CSS not in existing_custom_css:
            patched_page_settings["custom_css"] = (existing_custom_css + "\n" + PAGE_CUSTOM_CSS).strip()
            changed_page_settings = True

        changed = changed_html or changed_elementor or changed_page_settings

        if not changed:
            print("No change needed. The pulse style appears to be present already.")
            return 0

        print(f"Page: {page_data.get('link') or base_url}")
        print(f"Title: {(page_data.get('title') or {}).get('rendered', '')}")
        print(f"Widget: {TARGET_WIDGET_ID}")
        print(f"Before modified: {page_data.get('modified') or 'unknown'}")

        if not args.apply:
            print("Dry run complete. Re-run with --apply and valid WP credentials to publish.")
            return 0

        if not auth:
            print("Missing WP_USERNAME or WP_APP_PASSWORD for --apply.", file=sys.stderr)
            return 2

        updated = apply_update(
            base_url,
            page_id,
            auth,
            patched_html,
            patched_page_settings,
            patched_elementor_data,
        )
        print(f"Updated page id: {updated.get('id')}")
        print(f"After modified: {updated.get('modified') or 'unknown'}")
        print("Pulse button published successfully.")
        return 0
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        print(f"HTTP {exc.code}: {body}", file=sys.stderr)
        return 1
    except Exception as exc:
        print(str(exc), file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
