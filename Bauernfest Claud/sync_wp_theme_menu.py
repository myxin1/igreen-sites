import base64
import json
import urllib.parse
import urllib.request

from new_post import WP_API_BASE, WP_PASS, WP_USER


MENU_ID = 7

TOP_ITEMS = [
    ("Inicio", "https://bauernfest.org/"),
    ("Assuntos", "https://bauernfest.org/assuntos/"),
    ("Sobre Nós", "https://bauernfest.org/sobre/"),
    ("Transparencia", "https://bauernfest.org/transparencia/"),
    ("Politica de privacidade", "https://bauernfest.org/politica-de-privacidade/"),
    ("Termos de Uso", "https://bauernfest.org/termos-de-uso/"),
    ("Contato", "https://bauernfest.org/contato/"),
]

SUBJECT_ITEMS = [
    ("Programação", "https://bauernfest.org/programacao/"),
    ("Gastronomia", "https://bauernfest.org/gastronomia/"),
    ("Turismo", "https://bauernfest.org/turismo/"),
    ("Receitas alemãs", "https://bauernfest.org/receitas-alemas/"),
    ("Sobre a festa", "https://bauernfest.org/sobre/"),
    ("FAQ", "https://bauernfest.org/faq/"),
    ("Curiosidades", "https://bauernfest.org/curiosidades/"),
]


def headers():
    token = base64.b64encode(f"{WP_USER}:{WP_PASS}".encode("utf-8")).decode("ascii")
    return {
        "Authorization": f"Basic {token}",
        "Content-Type": "application/json",
        "User-Agent": "Bauernfest-theme-menu-sync/1.0",
    }


def request(path, method="GET", data=None):
    body = json.dumps(data).encode("utf-8") if data is not None else None
    req = urllib.request.Request(
        f"{WP_API_BASE}{path}",
        data=body,
        method=method,
        headers=headers(),
    )
    with urllib.request.urlopen(req, timeout=45) as response:
        return json.loads(response.read().decode("utf-8"))


def get_menu_items():
    query = urllib.parse.urlencode(
        {"context": "edit", "menus": MENU_ID, "per_page": 100, "orderby": "menu_order", "order": "asc"}
    )
    return request(f"/menu-items?{query}")


def save_item(item_id, title, url, order, parent=0):
    payload = {
        "title": title,
        "url": url,
        "type": "custom",
        "menus": MENU_ID,
        "parent": parent,
        "menu_order": order,
        "status": "publish",
    }
    if item_id:
        request(f"/menu-items/{item_id}", method="POST", data=payload)
        print(f"UPDATED {item_id}: {title} -> {url}")
        return item_id
    result = request("/menu-items", method="POST", data=payload)
    print(f"CREATED {result['id']}: {title} -> {url}")
    return result["id"]


def delete_item(item_id):
    request(f"/menu-items/{item_id}?force=true", method="DELETE")
    print(f"DELETED {item_id}")


def main():
    existing = get_menu_items()
    top_existing = [item for item in existing if item.get("parent", 0) == 0]
    keep_ids = set()
    assuntos_id = None

    for index, (title, url) in enumerate(TOP_ITEMS, start=1):
        item_id = top_existing[index - 1]["id"] if index <= len(top_existing) else None
        item_id = save_item(item_id, title, url, index, 0)
        keep_ids.add(item_id)
        if title == "Assuntos":
            assuntos_id = item_id

    subject_existing = [item for item in existing if item.get("parent") == assuntos_id]
    for index, (title, url) in enumerate(SUBJECT_ITEMS, start=1):
        item_id = subject_existing[index - 1]["id"] if index <= len(subject_existing) else None
        item_id = save_item(item_id, title, url, index, assuntos_id)
        keep_ids.add(item_id)

    for item in existing:
        if item["id"] not in keep_ids:
            delete_item(item["id"])


if __name__ == "__main__":
    main()
