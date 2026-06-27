import glob
import json
import os
import urllib.parse
import urllib.request

from new_post import WP_API_BASE
from sync_article_shells import auth_headers


ROOT = os.path.dirname(os.path.abspath(__file__))
OLD = "https://bauernfest.org/turismo/hoteis-perto-bauernfest-petropolis/"
NEW = "https://bauernfest.org/hoteis/"


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


def replace_local():
    changed = 0
    for path in glob.glob(os.path.join(ROOT, "site-bauernfest", "**", "*.html"), recursive=True):
        with open(path, "r", encoding="utf-8") as handle:
            content = handle.read()
        updated = content.replace(OLD, NEW)
        if updated != content:
            with open(path, "w", encoding="utf-8") as handle:
                handle.write(updated)
            changed += 1
            print("LOCAL", os.path.relpath(path, ROOT))
    return changed


def list_items(kind):
    items = []
    page = 1
    while True:
        query = urllib.parse.urlencode(
            {"per_page": 100, "page": page, "status": "publish", "context": "edit"}
        )
        batch = wp_request(f"/{kind}?{query}")
        if not batch:
            break
        items.extend(batch)
        if len(batch) < 100:
            break
        page += 1
    return items


def replace_wp(kind):
    changed = 0
    for item in list_items(kind):
        raw = item.get("content", {}).get("raw", "")
        if OLD not in raw:
            continue
        updated = raw.replace(OLD, NEW)
        wp_request(f"/{kind}/{item['id']}", method="POST", payload={"content": updated})
        changed += 1
        title = item.get("title", {}).get("raw") or item.get("slug")
        print(f"WP {kind} {item['id']}: {title}")
    return changed


def main():
    local = replace_local()
    posts = replace_wp("posts")
    pages = replace_wp("pages")
    print(f"Done: {local} local file(s), {posts} post(s), {pages} page(s)")


if __name__ == "__main__":
    main()
