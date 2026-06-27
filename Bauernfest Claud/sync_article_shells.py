import base64
import json
import re
import urllib.parse
import urllib.request

from new_post import WP_API_BASE, WP_PASS, WP_USER


BF_CSS_BLOCK = 2348
BF_NAV_BLOCK = 2349
BF_FOOTER_BLOCK = 2350

PREFIX = (
    f'<!-- wp:block {{"ref":{BF_CSS_BLOCK}}} --><!-- /wp:block -->\n\n'
    f'<!-- wp:block {{"ref":{BF_NAV_BLOCK}}} --><!-- /wp:block -->\n\n'
)
SUFFIX = f'\n\n<!-- wp:block {{"ref":{BF_FOOTER_BLOCK}}} --><!-- /wp:block -->'


def auth_headers():
    token = base64.b64encode(f"{WP_USER}:{WP_PASS}".encode("utf-8")).decode("ascii")
    return {
        "Authorization": f"Basic {token}",
        "Content-Type": "application/json",
        "User-Agent": "Bauernfest-article-shell-sync/1.0",
    }


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


def list_posts():
    posts = []
    page = 1
    while True:
        query = urllib.parse.urlencode(
            {"per_page": 100, "page": page, "status": "publish", "_fields": "id,slug,title"}
        )
        batch = wp_request(f"/posts?{query}")
        if not batch:
            break
        posts.extend(batch)
        if len(batch) < 100:
            break
        page += 1
    return posts


def remove_global_block_refs(content):
    refs = "|".join(str(ref) for ref in [BF_CSS_BLOCK, BF_NAV_BLOCK, BF_FOOTER_BLOCK])
    content = re.sub(
        rf'<!--\s*wp:block\s+\{{\s*"ref"\s*:\s*(?:{refs})\s*\}}\s*-->\s*<!--\s*/wp:block\s*-->\s*',
        "",
        content,
        flags=re.IGNORECASE,
    )
    content = re.sub(
        rf'<!--\s*wp:block\s+\{{\s*"ref"\s*:\s*(?:{refs})\s*\}}\s*/-->\s*',
        "",
        content,
        flags=re.IGNORECASE,
    )
    return content


def remove_old_shell(content):
    # Remove every old inline editorial header/footer while preserving the article body.
    content = re.sub(
        r'<!--\s*NAV\s*-->\s*',
        "",
        content,
        flags=re.IGNORECASE,
    )
    content = re.sub(
        r'<!--\s*FOOTER\s*-->\s*',
        "",
        content,
        flags=re.IGNORECASE,
    )
    content = re.sub(
        r'<header\s+class="bf-header-shell".*?</header>',
        "",
        content,
        flags=re.DOTALL | re.IGNORECASE,
    )
    content = re.sub(
        r'<header\\?\s+class=\\?"bf-header-shell\\?".*?</header\\?>',
        "",
        content,
        flags=re.DOTALL | re.IGNORECASE,
    )
    content = re.sub(
        r'<footer\s+class="bfftr".*?</footer>',
        "",
        content,
        flags=re.DOTALL | re.IGNORECASE,
    )
    content = re.sub(
        r'<footer\\?\s+class=\\?"bfftr\\?".*?</footer\\?>',
        "",
        content,
        flags=re.DOTALL | re.IGNORECASE,
    )
    content = re.sub(
        r'<script>\s*\(function\(\)\{(?:(?!</script>).)*(?:bfBurger|bfMenu)(?:(?!</script>).)*</script>\s*',
        "",
        content,
        flags=re.DOTALL | re.IGNORECASE,
    )
    return content


def normalize_spacing(content):
    content = re.sub(r'(?:\s*<!--\s*/wp:html\s*-->\s*){2,}', '\n<!-- /wp:html -->\n', content)
    content = re.sub(r'\n{4,}', '\n\n\n', content)
    return content.strip()


def canonicalize(content):
    body = remove_global_block_refs(content)
    body = remove_old_shell(body)
    body = normalize_spacing(body)
    return PREFIX + body + SUFFIX


def sync_post(post_id):
    post = wp_request(f"/posts/{post_id}?context=edit")
    raw = post.get("content", {}).get("raw", "")
    updated = canonicalize(raw)
    title = post.get("title", {}).get("raw") or post.get("slug", str(post_id))
    if updated == raw:
        wp_request(f"/posts/{post_id}", method="POST", payload={"content": raw})
        print(f"TOUCHED {post_id}: {title}")
        return "touched"
    wp_request(f"/posts/{post_id}", method="POST", payload={"content": updated})
    print(f"UPDATED {post_id}: {title}")
    return "updated"


def main():
    counts = {"updated": 0, "touched": 0}
    for post in list_posts():
        status = sync_post(post["id"])
        counts[status] += 1
    print(f"\nDone: {counts['updated']} updated, {counts['touched']} touched.")


if __name__ == "__main__":
    main()
