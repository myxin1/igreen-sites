import json
import os
import re
import urllib.error
import urllib.parse
import urllib.request

from new_post import WP_API_BASE
from sync_article_shells import auth_headers, canonicalize


ROOT = os.path.dirname(os.path.abspath(__file__))
SOURCE = os.path.join(ROOT, "site-bauernfest", "sobre", "index.html")


def wp_request(path, method="GET", payload=None):
    body = json.dumps(payload).encode("utf-8") if payload is not None else None
    req = urllib.request.Request(
        f"{WP_API_BASE}{path}",
        data=body,
        method=method,
        headers=auth_headers(),
    )
    with urllib.request.urlopen(req, timeout=60) as response:
        return json.loads(response.read().decode("utf-8"))


def find_page(slug):
    query = urllib.parse.urlencode({"slug": slug, "per_page": 1, "context": "edit"})
    pages = wp_request(f"/pages?{query}")
    return pages[0] if pages else None


def source_body():
    with open(SOURCE, "r", encoding="utf-8") as handle:
        html = handle.read()
    match = re.search(r"<body[^>]*>(.*?)</body>", html, flags=re.DOTALL | re.IGNORECASE)
    if not match:
        raise RuntimeError("Could not find body in local sobre page")
    body = match.group(1).strip()
    body = re.sub(r"<nav class=\"bf-breadcrumb\"><nav>", '<nav class="bf-breadcrumb">', body)
    body = re.sub(r"</nav></nav>", "</nav>", body)
    return canonicalize(body)


def main():
    page = find_page("sobre")
    if not page:
        raise RuntimeError("Could not find /sobre/ page")
    payload = {
        "title": "Sobre Nós",
        "slug": "sobre",
        "status": "publish",
        "content": source_body(),
        "template": "elementor_canvas",
        "excerpt": "Conheça o bauernfest.org e a cobertura editorial sobre a Bauernfest de Petrópolis.",
    }
    updated = wp_request(f"/pages/{page['id']}", method="POST", payload=payload)
    print(f"updated /sobre/ id={updated['id']} template={updated.get('template')}")


if __name__ == "__main__":
    try:
        main()
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise SystemExit(f"HTTP {exc.code}: {detail[:500]}")
