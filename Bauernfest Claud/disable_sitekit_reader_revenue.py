import json
import urllib.error
import urllib.request

from sync_adsense_pages import auth_headers


ROOT_API = "https://bauernfest.org/wp-json"
ACTIVATION_PATH = "/google-site-kit/v1/core/modules/data/activation"
MODULES_PATH = "/google-site-kit/v1/core/modules/data/list"
SLUG = "reader-revenue-manager"


def request(path, method="GET", data=None):
    body = json.dumps(data).encode("utf-8") if data is not None else None
    req = urllib.request.Request(
        f"{ROOT_API}{path}",
        data=body,
        method=method,
        headers={**auth_headers(), "User-Agent": "Bauernfest-disable-reader-revenue/1.0"},
    )
    with urllib.request.urlopen(req, timeout=45) as response:
        raw = response.read().decode("utf-8", errors="replace")
        return json.loads(raw) if raw else None


def module_status():
    modules = request(MODULES_PATH)
    for module in modules:
        if module.get("slug") == SLUG:
            return module
    return None


def main():
    before = module_status()
    print("before:", json.dumps(before, ensure_ascii=False))
    payloads = [
        {"slug": SLUG, "active": False},
        {"slug": SLUG, "activate": False},
        {"moduleSlug": SLUG, "active": False},
        {"data": {"slug": SLUG, "active": False}},
    ]
    last_error = None
    for payload in payloads:
        try:
            result = request(ACTIVATION_PATH, method="POST", data=payload)
            print("payload:", json.dumps(payload), "result:", json.dumps(result, ensure_ascii=False))
            after = module_status()
            print("after:", json.dumps(after, ensure_ascii=False))
            if after and after.get("active") is False:
                return
        except urllib.error.HTTPError as exc:
            last_error = f"HTTP {exc.code}: {exc.read().decode('utf-8', errors='replace')[:300]}"
            print("failed:", json.dumps(payload), last_error)
    raise SystemExit(last_error or "Could not deactivate reader revenue module")


if __name__ == "__main__":
    main()
