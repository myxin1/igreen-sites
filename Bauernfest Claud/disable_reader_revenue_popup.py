import json
import urllib.error
import urllib.request

from sync_adsense_pages import auth_headers


ROOT_API = "https://bauernfest.org/wp-json"
PATH = "/google-site-kit/v1/modules/reader-revenue-manager/data/settings"


def request(method="GET", data=None):
    body = json.dumps(data).encode("utf-8") if data is not None else None
    req = urllib.request.Request(
        f"{ROOT_API}{PATH}",
        data=body,
        method=method,
        headers={**auth_headers(), "User-Agent": "Bauernfest-disable-reader-revenue-popup/1.0"},
    )
    with urllib.request.urlopen(req, timeout=45) as response:
        raw = response.read().decode("utf-8", errors="replace")
        return json.loads(raw) if raw else None


def main():
    before = request()
    print("before:", json.dumps(before, ensure_ascii=False))

    payload = dict(before)
    payload["snippetMode"] = "post_types"
    payload["postTypes"] = []

    try:
        after = request("POST", {"data": payload})
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        print(f"POST empty postTypes failed: HTTP {exc.code}: {detail[:500]}")
        payload = dict(before)
        payload["snippetMode"] = "disabled"
        after = request("POST", {"data": payload})

    print("after:", json.dumps(after, ensure_ascii=False))


if __name__ == "__main__":
    try:
        main()
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise SystemExit(f"HTTP {exc.code}: {detail[:500]}")
