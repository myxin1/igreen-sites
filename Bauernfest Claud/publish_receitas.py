"""
Publica as 6 páginas de receitas-alemas no WordPress.
Cria a hierarquia: receitas-alemas (hub) → 5 filhos
Seta Elementor Canvas + Rank Math SEO via XML-RPC.
"""

import urllib.request, base64, json, uuid, xmlrpc.client, os, re

BASE_URL  = "https://bauernfest.org"
WP_USER   = "ClaudeBot"
WP_PASS   = "p8Np bMs8 Xnsh MfH2 cZ7u w5xy"
LOCAL_DIR = "c:/Users/User/Downloads/Projeto Claude Code/Bauernfest Claud/site-bauernfest"

creds   = base64.b64encode(f"{WP_USER}:{WP_PASS}".encode()).decode()
headers = {"Authorization": f"Basic {creds}", "Content-Type": "application/json"}

def rand_id():
    return uuid.uuid4().hex[:7]

def make_elementor_data(html):
    return json.dumps([{
        "id": rand_id(), "elType": "section",
        "settings": {"layout": "full_width"},
        "elements": [{
            "id": rand_id(), "elType": "column",
            "settings": {"_column_size": 100, "_inline_size": None},
            "elements": [{
                "id": rand_id(), "elType": "widget",
                "widgetType": "html",
                "settings": {"html": html},
                "elements": []
            }]
        }]
    }])

def wp_request(method, endpoint, data=None):
    url  = f"{BASE_URL}/wp-json/wp/v2/{endpoint}"
    body = json.dumps(data).encode() if data else None
    req  = urllib.request.Request(url, data=body, headers=headers, method=method)
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())

def read_html(rel_path):
    path = os.path.join(LOCAL_DIR, rel_path)
    with open(path, encoding="utf-8") as f:
        return f.read()

def extract_meta(html):
    title = re.search(r'<title>(.*?)</title>', html)
    desc  = re.search(r'name="description"\s+content="([^"]+)"', html)
    kw    = re.search(r'name="keywords"\s+content="([^"]+)"', html)
    # Extract first keyword from keywords meta as focus keyword
    kws = kw.group(1).split(",") if kw else []
    focus = kws[0].strip() if kws else ""
    return (
        title.group(1).strip() if title else "",
        desc.group(1).strip()  if desc  else "",
        focus
    )

def create_page(title, slug, html, parent_id=0):
    el_data = make_elementor_data(html)
    payload = {
        "title":  title,
        "slug":   slug,
        "status": "publish",
        "parent": parent_id,
        "content": html,
        "meta": {
            "_elementor_edit_mode":     "builder",
            "_elementor_template_type": "wp-page",
            "_elementor_data":          el_data,
            "_elementor_page_settings": {"page_layout": "elementor_canvas"},
        }
    }
    return wp_request("POST", "pages", payload)

def set_rank_math(page_id, rm_title, rm_desc, focus_kw):
    client = xmlrpc.client.ServerProxy(f"{BASE_URL}/xmlrpc.php")
    fields = [
        {"key": "rank_math_title",         "value": rm_title},
        {"key": "rank_math_description",   "value": rm_desc},
        {"key": "rank_math_focus_keyword", "value": focus_kw},
    ]
    try:
        client.wp.editPost(1, WP_USER, WP_PASS, page_id, {"custom_fields": fields})
        return True
    except Exception as e:
        print(f"    Rank Math XML-RPC erro: {e}")
        return False

# ─────────────────────────────────────────────
# 1. Criar hub: receitas-alemas
# ─────────────────────────────────────────────
print("\n[1/6] Criando hub: receitas-alemas")
hub_html  = read_html("receitas-alemas/index.html")
hub_title, hub_desc, hub_kw = extract_meta(hub_html)
hub_page  = create_page("Receitas Alemãs", "receitas-alemas", hub_html, parent_id=0)
hub_id    = hub_page["id"]
hub_link  = hub_page["link"]
print(f"  OK  id={hub_id}  url={hub_link}")
set_rank_math(hub_id, hub_title, hub_desc, hub_kw)
print(f"  Rank Math: {hub_title[:60]}")

# ─────────────────────────────────────────────
# 2. Criar filhos
# ─────────────────────────────────────────────
children = [
    ("receitas-alemas/pretzel-receita/index.html",     "pretzel-receita",    "Pretzel Alemão Tradicional"),
    ("receitas-alemas/sauerkraut-receita/index.html",  "sauerkraut-receita", "Sauerkraut (Chucrute Alemão)"),
    ("receitas-alemas/bratwurst-receita/index.html",   "bratwurst-receita",  "Bratwurst Caseiro"),
    ("receitas-alemas/selva-negra-receita/index.html", "selva-negra-receita","Bolo Selva Negra"),
    ("receitas-alemas/kassler-receita/index.html",     "kassler-receita",    "Kassler (Carré Defumado)"),
]

for i, (rel_path, slug, fallback_title) in enumerate(children, 2):
    print(f"\n[{i}/6] Criando: {slug}")
    html = read_html(rel_path)
    rm_title, rm_desc, rm_kw = extract_meta(html)
    page = create_page(rm_title or fallback_title, slug, html, parent_id=hub_id)
    page_id   = page["id"]
    page_link = page["link"]
    print(f"  OK  id={page_id}  url={page_link}")
    set_rank_math(page_id, rm_title, rm_desc, rm_kw)
    print(f"  Rank Math: {rm_title[:60]}")

print("\n✓ Concluído. 6 páginas publicadas.\n")
