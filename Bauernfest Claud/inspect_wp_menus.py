import base64
import json
import urllib.request

from new_post import WP_API_BASE, WP_PASS, WP_USER


def headers():
    token = base64.b64encode(f"{WP_USER}:{WP_PASS}".encode("utf-8")).decode("ascii")
    return {
        "Authorization": f"Basic {token}",
        "User-Agent": "Bauernfest-menu-inspector/1.0",
    }


def get(path):
    req = urllib.request.Request(f"{WP_API_BASE}{path}", headers=headers())
    with urllib.request.urlopen(req, timeout=45) as response:
        return json.loads(response.read().decode("utf-8"))


def main():
    print("LOCATIONS")
    locations = get("/menu-locations?context=edit")
    print(json.dumps(locations, ensure_ascii=False, indent=2)[:4000])

    print("\nMENUS")
    menus = get("/menus?context=edit&per_page=100")
    print(json.dumps(menus, ensure_ascii=False, indent=2)[:4000])

    print("\nITEMS")
    items = get("/menu-items?context=edit&per_page=100")
    slim = [
        {
            "id": item.get("id"),
            "title": item.get("title", {}).get("raw") or item.get("title", {}).get("rendered"),
            "url": item.get("url"),
            "menus": item.get("menus"),
            "parent": item.get("parent"),
            "menu_order": item.get("menu_order"),
        }
        for item in items
    ]
    print(json.dumps(slim, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
