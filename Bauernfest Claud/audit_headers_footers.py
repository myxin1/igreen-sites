import base64
import json
import os
import re
import urllib.parse
import urllib.request

from new_post import WP_API_BASE, WP_PASS, WP_USER


ROOT = os.path.dirname(os.path.abspath(__file__))
SITE_ROOT = os.path.join(ROOT, "site-bauernfest")

REQUIRED_MENU = [
    "https://bauernfest.org/",
    "https://bauernfest.org/assuntos/",
    "https://bauernfest.org/sobre/",
    "https://bauernfest.org/transparencia/",
    "https://bauernfest.org/politica-de-privacidade/",
    "https://bauernfest.org/termos-de-uso/",
    "https://bauernfest.org/contato/",
]

REQUIRED_LABELS = [
    "Inicio",
    "Assuntos",
    "Sobre",
    "Transparencia",
    "Politica de privacidade",
    "Termos de Uso",
    "Contato",
]

OLD_TOP_MENU_LABELS = ["A Festa", "Agenda 2026"]


def auth_headers():
    token = base64.b64encode(f"{WP_USER}:{WP_PASS}".encode("utf-8")).decode("ascii")
    return {
        "Authorization": f"Basic {token}",
        "User-Agent": "Bauernfest-header-footer-audit/1.0",
    }


def wp_get(path):
    req = urllib.request.Request(f"{WP_API_BASE}{path}", headers=auth_headers())
    with urllib.request.urlopen(req, timeout=45) as response:
        return json.loads(response.read().decode("utf-8"))


def public_get(url):
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "Bauernfest-header-footer-audit/1.0", "Cache-Control": "no-cache"},
    )
    with urllib.request.urlopen(req, timeout=45) as response:
        return response.read().decode("utf-8", errors="replace")


def check_html(label, html, check_old_top=True):
    header_count = len(re.findall(r'<header\s+class="bf-header-shell"', html))
    footer_count = len(re.findall(r'<footer\s+class="bfftr"', html))
    menu_count = len(re.findall(r'id="bfMenu"', html))
    menu_match = re.search(r'<ul\s+class="bfnl"\s+id="bfMenu">.*?</ul>', html, flags=re.DOTALL)
    menu_html = menu_match.group(0) if menu_match else ""
    footer_match = re.search(r'<footer\s+class="bfftr".*?</footer>', html, flags=re.DOTALL)
    footer_html = footer_match.group(0) if footer_match else ""

    missing_links = [url for url in REQUIRED_MENU if url not in menu_html]
    missing_labels = [text for text in REQUIRED_LABELS if text not in menu_html]
    old_labels = [text for text in OLD_TOP_MENU_LABELS if check_old_top and text in menu_html]
    missing_footer_links = [
        url
        for url in [
            "https://bauernfest.org/transparencia/",
            "https://bauernfest.org/politica-de-privacidade/",
            "https://bauernfest.org/termos-de-uso/",
            "https://bauernfest.org/contato/",
        ]
        if url not in footer_html
    ]

    issues = []
    if header_count < 1:
        issues.append("missing bf-header-shell")
    if footer_count < 1:
        issues.append("missing bfftr")
    if menu_count < 1:
        issues.append("missing bfMenu")
    if header_count > 1:
        issues.append(f"duplicate bf-header-shell: {header_count}")
    if footer_count > 1:
        issues.append(f"duplicate bfftr: {footer_count}")
    if menu_count > 1:
        issues.append(f"duplicate bfMenu: {menu_count}")
    if missing_links:
        issues.append("missing links: " + ", ".join(missing_links))
    if missing_labels:
        issues.append("missing labels: " + ", ".join(missing_labels))
    if old_labels:
        issues.append("old top labels: " + ", ".join(old_labels))
    if missing_footer_links:
        issues.append("footer missing links: " + ", ".join(missing_footer_links))

    return {
        "label": label,
        "header_count": header_count,
        "footer_count": footer_count,
        "menu_count": menu_count,
        "issues": issues,
    }


def audit_local():
    results = []
    for dirpath, _, filenames in os.walk(SITE_ROOT):
        if os.path.basename(dirpath).lower() == "rodape":
            continue
        for filename in filenames:
            if not filename.endswith(".html"):
                continue
            path = os.path.join(dirpath, filename)
            with open(path, "r", encoding="utf-8") as handle:
                html = handle.read()
            rel = os.path.relpath(path, ROOT).replace("\\", "/")
            results.append(check_html(rel, html, check_old_top=False))
    return results


def list_posts():
    posts = []
    page = 1
    while True:
        query = urllib.parse.urlencode(
            {"per_page": 100, "page": page, "status": "publish", "_fields": "id,link,slug,title"}
        )
        batch = wp_get(f"/posts?{query}")
        if not batch:
            break
        posts.extend(batch)
        if len(batch) < 100:
            break
        page += 1
    return posts


def audit_posts(limit=None):
    results = []
    posts = list_posts()
    for post in posts[:limit]:
        html = public_get(post["link"])
        title = post.get("title", {}).get("rendered", post["slug"])
        results.append(check_html(f"{post['id']} {post['link']} {title}", html))
    return results


def print_results(title, results):
    failures = [item for item in results if item["issues"]]
    print(f"\n{title}: {len(results)} checked, {len(failures)} issue(s)")
    for item in failures:
        print(f"- {item['label']}")
        print(f"  counts: header={item['header_count']} footer={item['footer_count']} menu={item['menu_count']}")
        for issue in item["issues"]:
            print(f"  {issue}")


def main():
    print_results("LOCAL HTML", audit_local())
    print_results("PUBLIC POSTS", audit_posts())


if __name__ == "__main__":
    main()
