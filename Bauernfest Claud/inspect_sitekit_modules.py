import json
import urllib.error
import urllib.request

from sync_adsense_pages import auth_headers


ROOT_API = "https://bauernfest.org/wp-json"


def request(path, method="GET", data=None):
    body = json.dumps(data).encode("utf-8") if data is not None else None
    headers = {**auth_headers(), "User-Agent": "Bauernfest-sitekit-inspector/1.0"}
    req = urllib.request.Request(f"{ROOT_API}{path}", data=body, method=method, headers=headers)
    with urllib.request.urlopen(req, timeout=45) as response:
        raw = response.read().decode("utf-8", errors="replace")
        return json.loads(raw) if raw else None


def options(path):
    headers = {**auth_headers(), "User-Agent": "Bauernfest-sitekit-inspector/1.0"}
    req = urllib.request.Request(f"{ROOT_API}{path}", method="OPTIONS", headers=headers)
    with urllib.request.urlopen(req, timeout=45) as response:
        raw = response.read().decode("utf-8", errors="replace")
        return json.loads(raw) if raw else None


def show(path):
    print(f"\nGET {path}")
    try:
        data = request(path)
    except urllib.error.HTTPError as exc:
        print(f"HTTP {exc.code}: {exc.read().decode('utf-8', errors='replace')[:500]}")
        return
    print(json.dumps(data, ensure_ascii=False, indent=2)[:4000])


def main():
    show("/google-site-kit/v1/core/modules/data/list")
    for slug in ("reader-revenue-manager", "adsense", "analytics-4", "search-console"):
        show(f"/google-site-kit/v1/modules/{slug}/data/settings")
        show(f"/google-site-kit/v1/modules/{slug}/data/data-available")
    print("\nOPTIONS reader-revenue-manager settings")
    try:
        print(json.dumps(options("/google-site-kit/v1/modules/reader-revenue-manager/data/settings"), ensure_ascii=False, indent=2)[:5000])
    except Exception as exc:
        print(exc)


if __name__ == "__main__":
    main()
