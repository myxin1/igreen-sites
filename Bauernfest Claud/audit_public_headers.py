import base64
import json
import re
import urllib.parse
import urllib.request

from new_post import WP_API_BASE, WP_PASS, WP_USER


URLS = [
    "https://bauernfest.org/",
    "https://bauernfest.org/assuntos/",
    "https://bauernfest.org/sobre/",
    "https://bauernfest.org/transparencia/",
    "https://bauernfest.org/politica-de-privacidade/",
    "https://bauernfest.org/termos-de-uso/",
    "https://bauernfest.org/contato/",
]


def auth_headers():
    token = base64.b64encode(f"{WP_USER}:{WP_PASS}".encode("utf-8")).decode("ascii")
    return {"Authorization": f"Basic {token}", "User-Agent": "Bauernfest-public-header-audit/1.0"}


def wp_get(path):
    req = urllib.request.Request(f"{WP_API_BASE}{path}", headers=auth_headers())
    with urllib.request.urlopen(req, timeout=45) as response:
        return json.loads(response.read().decode("utf-8"))


def public_get(url):
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "Bauernfest-public-header-audit/1.0", "Cache-Control": "no-cache"},
    )
    with urllib.request.urlopen(req, timeout=45) as response:
        return response.read().decode("utf-8", errors="replace")


def list_posts():
    posts = []
    page = 1
    while True:
        query = urllib.parse.urlencode({"per_page": 100, "page": page, "status": "publish", "_fields": "link"})
        batch = wp_get(f"/posts?{query}")
        if not batch:
            break
        posts.extend(batch)
        if len(batch) < 100:
            break
        page += 1
    return [post["link"] for post in posts]


def count_headers(html):
    return {
        "bf": len(re.findall(r'<header\s+class="bf-header-shell"', html)),
        "theme": len(re.findall(r'<header\s+[^>]*id="masthead"|<header\s+[^>]*class="[^"]*site-header', html)),
        "nav": len(re.findall(r'id="bfMenu"', html)),
        "footer": len(re.findall(r'<footer\s+class="bfftr"', html)),
    }


def main():
    urls = URLS + list_posts()
    issues = []
    for url in urls:
        html = public_get(url)
        counts = count_headers(html)
        # Home is intentionally custom and should only expose the editorial shell.
        duplicate = counts["bf"] != 1 or counts["nav"] != 1 or counts["footer"] != 1
        theme_and_editorial = counts["theme"] > 0 and counts["bf"] > 0
        if duplicate or theme_and_editorial:
            issues.append((url, counts, "theme+editorial" if theme_and_editorial else "duplicate/missing"))
    print(f"Checked {len(urls)} URLs, {len(issues)} issue(s)")
    for url, counts, reason in issues:
        print(f"- {url} [{reason}] bf={counts['bf']} theme={counts['theme']} nav={counts['nav']} footer={counts['footer']}")


if __name__ == "__main__":
    main()
