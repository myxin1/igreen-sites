import base64
import json
import urllib.error
import urllib.request

from new_post import WP_API_BASE, WP_PASS, WP_USER


HOME_PAGE_ID = 1582
ROOT_API = WP_API_BASE.rsplit("/wp/v2", 1)[0]


def headers():
    token = base64.b64encode(f"{WP_USER}:{WP_PASS}".encode("utf-8")).decode("ascii")
    return {
        "Authorization": f"Basic {token}",
        "User-Agent": "Bauernfest-source-inspector/1.0",
    }


def fetch(url):
    req = urllib.request.Request(url, headers=headers())
    with urllib.request.urlopen(req, timeout=45) as response:
        return response.read().decode("utf-8", errors="replace")


def summarize(label, url):
    try:
        text = fetch(url)
    except urllib.error.HTTPError as exc:
        print(f"{label}: HTTP {exc.code}")
        return
    except Exception as exc:
        print(f"{label}: {exc}")
        return

    print(f"\n{label}: {len(text)} chars")
    print(f"  has old menu labels: {'A Festa' in text and 'Agenda 2026' in text}")
    print(f"  has new menu labels: {'Assuntos' in text and 'Transparencia' in text}")
    for marker in ["bfMenu", "_elementor_data", "elements", "post_content", "content"]:
        print(f"  {marker}: {text.find(marker)}")
    idx = text.find("bfMenu")
    if idx != -1:
        print(text[max(0, idx - 250):idx + 900])


def main():
    summarize("wp page edit", f"{WP_API_BASE}/pages/{HOME_PAGE_ID}?context=edit")
    summarize("elementor document", f"{ROOT_API}/elementor/v1/documents/{HOME_PAGE_ID}")
    summarize("elementor document data", f"{ROOT_API}/elementor/v1/documents/{HOME_PAGE_ID}/data")
    summarize("elementor document elements", f"{ROOT_API}/elementor/v1/documents/{HOME_PAGE_ID}/elements")


if __name__ == "__main__":
    main()
