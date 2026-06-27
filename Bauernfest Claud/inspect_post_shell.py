import base64
import json
import re
import urllib.request

from new_post import WP_API_BASE, WP_PASS, WP_USER


POST_IDS = [1395, 1423, 1579, 2335, 2418]


def headers():
    token = base64.b64encode(f"{WP_USER}:{WP_PASS}".encode("utf-8")).decode("ascii")
    return {
        "Authorization": f"Basic {token}",
        "User-Agent": "Bauernfest-post-shell-inspector/1.0",
    }


def get_post(post_id):
    req = urllib.request.Request(f"{WP_API_BASE}/posts/{post_id}?context=edit", headers=headers())
    with urllib.request.urlopen(req, timeout=45) as response:
        return json.loads(response.read().decode("utf-8"))


def snippet(html, pattern):
    match = re.search(pattern, html, flags=re.DOTALL | re.IGNORECASE)
    if not match:
        return "NOT FOUND"
    start = max(0, match.start() - 120)
    end = min(len(html), match.end() + 220)
    return html[start:end]


def main():
    for post_id in POST_IDS:
        post = get_post(post_id)
        html = post.get("content", {}).get("raw", "")
        title = post.get("title", {}).get("raw", "")
        print(f"\nPOST {post_id}: {title}")
        print(
            f"raw chars={len(html)} header={html.count('bf-header-shell')} "
            f"footer={html.count('bfftr')} block-nav={html.count('2349')}"
        )
        print("START SNIP:")
        print(html[:1200].encode("ascii", errors="backslashreplace").decode("ascii"))
        print("HEADER SNIP:")
        print(snippet(html, r'<header\s+class="bf-header-shell".*?</header>').encode("ascii", errors="backslashreplace").decode("ascii"))
        print("FOOTER SNIP:")
        print(snippet(html, r'<footer\s+class="bfftr".*?</footer>').encode("ascii", errors="backslashreplace").decode("ascii"))


if __name__ == "__main__":
    main()
