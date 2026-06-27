import base64
import json
import urllib.parse
import urllib.request

from new_post import WP_API_BASE, WP_PASS, WP_USER


PAGE_SLUGS = ["assuntos", "transparencia"]
POST_SLUGS = ["2026-3", "2026-2"]
TEMPLATE = "elementor_canvas"


def headers():
    token = base64.b64encode(f"{WP_USER}:{WP_PASS}".encode("utf-8")).decode("ascii")
    return {
        "Authorization": f"Basic {token}",
        "Content-Type": "application/json",
        "User-Agent": "Bauernfest-duplicate-header-fix/1.0",
    }


def request(path, method="GET", data=None):
    body = json.dumps(data).encode("utf-8") if data is not None else None
    req = urllib.request.Request(
        f"{WP_API_BASE}{path}",
        data=body,
        method=method,
        headers=headers(),
    )
    with urllib.request.urlopen(req, timeout=45) as response:
        return json.loads(response.read().decode("utf-8"))


def find_one(kind, slug):
    query = urllib.parse.urlencode({"slug": slug, "context": "edit", "per_page": 1})
    items = request(f"/{kind}?{query}")
    if not items:
        raise RuntimeError(f"Could not find {kind} slug={slug}")
    return items[0]


def set_template(kind, slug):
    item = find_one(kind, slug)
    payload = {"template": TEMPLATE}
    result = request(f"/{kind}/{item['id']}", method="POST", data=payload)
    print(f"UPDATED {kind}/{item['id']} /{slug}/ template={result.get('template')}")


def main():
    for slug in PAGE_SLUGS:
        set_template("pages", slug)
    for slug in POST_SLUGS:
        set_template("posts", slug)


if __name__ == "__main__":
    main()
