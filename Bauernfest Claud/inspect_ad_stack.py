import json
import urllib.error
import urllib.request

from sync_adsense_pages import auth_headers


ROOT_API = "https://bauernfest.org/wp-json"


def request(path):
    req = urllib.request.Request(
        f"{ROOT_API}{path}",
        headers={**auth_headers(), "User-Agent": "Bauernfest-ad-stack-inspector/1.0"},
    )
    with urllib.request.urlopen(req, timeout=45) as response:
        return json.loads(response.read().decode("utf-8"))


def main():
    index = request("/")
    routes = sorted(index.get("routes", {}).keys())
    interesting = [
        route
        for route in routes
        if any(token in route.lower() for token in ("plugin", "hfcm", "hfc", "site-kit", "ads", "ad-inserter", "ad"))
    ]
    print("INTERESTING ROUTES")
    for route in interesting:
        print(route)

    for path in ("/wp/v2/plugins", "/wp/v2/settings"):
        print(f"\nFETCH {path}")
        try:
            data = request(path)
        except urllib.error.HTTPError as exc:
            print(f"HTTP {exc.code}: {exc.read().decode('utf-8', errors='replace')[:300]}")
            continue
        if path.endswith("/plugins"):
            for plugin in data:
                print(
                    f"{plugin.get('plugin')} | status={plugin.get('status')} | "
                    f"name={plugin.get('name')}"
                )
        else:
            for key in sorted(data):
                if any(token in key.lower() for token in ("ad", "ads", "site", "plugin")):
                    value = data[key]
                    if isinstance(value, (dict, list)):
                        value = json.dumps(value)[:180]
                    print(f"{key}: {value}")

    print("\nFETCH /ad-inserter/v1/settings")
    try:
        data = request("/ad-inserter/v1/settings")
    except urllib.error.HTTPError as exc:
        print(f"HTTP {exc.code}: {exc.read().decode('utf-8', errors='replace')[:300]}")
        return
    except Exception as exc:
        print(exc)
        return

    if isinstance(data, dict):
        print(f"top-level keys: {', '.join(sorted(data.keys())[:40])}")
        text = json.dumps(data, ensure_ascii=True)
        for token in ("adsbygoogle", "pagead2", "tcf", "__tcfapi", "consent", "overlay", "fixed"):
            print(f"contains {token}: {token in text.lower()}")
        print(f"settings chars: {len(text)}")
    else:
        print(type(data).__name__)


if __name__ == "__main__":
    main()
