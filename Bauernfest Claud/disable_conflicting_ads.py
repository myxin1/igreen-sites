import json
import urllib.error
import urllib.request

from sync_adsense_pages import auth_headers


PLUGIN = "header-footer-code-manager/99robots-header-footer-code-manager"
ROOT_API = "https://bauernfest.org/wp-json"


def wp_request(path, method="GET", data=None):
    body = json.dumps(data).encode("utf-8") if data is not None else None
    req = urllib.request.Request(
        f"{ROOT_API}{path}",
        data=body,
        method=method,
        headers={**auth_headers(), "User-Agent": "Bauernfest-ad-conflict-fix/1.0"},
    )
    with urllib.request.urlopen(req, timeout=45) as response:
        return json.loads(response.read().decode("utf-8"))


def main():
    plugin_path = f"/wp/v2/plugins/{PLUGIN}"
    before = wp_request(plugin_path)
    print(f"before: {before.get('plugin')} status={before.get('status')}")
    if before.get("status") != "inactive":
        after = wp_request(plugin_path, method="POST", data={"status": "inactive"})
        print(f"after: {after.get('plugin')} status={after.get('status')}")
    else:
        print("already inactive")


if __name__ == "__main__":
    try:
        main()
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise SystemExit(f"HTTP {exc.code}: {detail[:500]}")
