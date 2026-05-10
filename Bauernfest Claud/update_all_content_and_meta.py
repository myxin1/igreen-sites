"""
Atualiza CONTENT + META (_elementor_data) em todas as páginas.
O post_content precisa estar em sync para o WordPress renderizar correto.
"""
import urllib.request, base64, json, os, uuid, re

creds = base64.b64encode(b'ClaudeBot:p8Np bMs8 Xnsh MfH2 cZ7u w5xy').decode()
headers = {'Authorization': f'Basic {creds}', 'Content-Type': 'application/json'}

BASE = 'site-bauernfest'

# Páginas com arquivo local
LOCAL_PAGES = [
    ('index.html',                                          56),
    ('anuncie/index.html',                                 365),
    ('contato/index.html',                                 371),
    ('gastronomia/index.html',                              69),
    ('programacao/index.html',                              91),
    ('sobre/index.html',                                    64),
    ('turismo/index.html',                                  71),
    ('FAQ/index.html',                                     579),
    ('FAQ/quando-e-a-bauernfest-petropolis/index.html',    580),
    ('FAQ/o-que-e-a-bauernfest/index.html',                581),
    ('FAQ/quantos-dias-dura-a-bauernfest/index.html',      582),
    ('FAQ/quem-a-bauernfest-homenageia/index.html',        583),
    ('FAQ/o-que-fazer-na-bauernfest/index.html',           584),
    ('FAQ/significado-de-bauernfest/index.html',           585),
    ('FAQ/como-funciona-a-bauernfest/index.html',          586),
    ('FAQ/bauernfest-2026/index.html',                     587),
    ('FAQ/datas-da-bauernfest/index.html',                 588),
    ('FAQ/horario-bauernfest-petropolis/index.html',       589),
]

# Páginas remotas sem arquivo local
REMOTE_ONLY_IDS = [77, 216, 73, 79, 89, 97, 95, 93, 103, 99, 105, 101, 81, 83, 85, 87]

def rand_id():
    return uuid.uuid4().hex[:7]

def make_elementor_data(html_content):
    return json.dumps([{
        "id": rand_id(),
        "elType": "section",
        "settings": {"layout": "full_width"},
        "elements": [{
            "id": rand_id(),
            "elType": "column",
            "settings": {"_column_size": 100, "_inline_size": None},
            "elements": [{
                "id": rand_id(),
                "elType": "widget",
                "widgetType": "html",
                "settings": {"html": html_content},
                "elements": []
            }]
        }]
    }])

def push_page(page_id, html, is_faq=False):
    el_data = make_elementor_data(html)
    meta = {
        '_elementor_edit_mode': 'builder',
        '_elementor_template_type': 'wp-page',
        '_elementor_data': el_data,
        '_elementor_page_settings': {'page_layout': 'elementor_canvas'},
    }
    payload = json.dumps({
        'content': html,  # <-- Update post_content too
        'meta': meta,
    }).encode()
    req = urllib.request.Request(
        f'https://bauernfest.org/wp-json/wp/v2/pages/{page_id}',
        data=payload, headers=headers, method='POST'
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        result = json.loads(r.read())
    return result.get('id')

# ── Local pages ─────────────────────────────────────────────────────────────
print('=== Páginas locais ===')
for rel_path, page_id in LOCAL_PAGES:
    full_path = os.path.join(BASE, rel_path)
    if not os.path.exists(full_path):
        print(f'  SKIP (not found): {rel_path}')
        continue
    with open(full_path, encoding='utf-8') as f:
        html = f.read()
    faq_in_nav = '/faq/' in re.search(r'<ul class="bfnl".*?</ul>', html, re.DOTALL).group(0) if re.search(r'<ul class="bfnl".*?</ul>', html, re.DOTALL) else False
    try:
        push_page(page_id, html)
        print(f'  OK [{page_id}] {rel_path} | FAQ in nav: {faq_in_nav}')
    except urllib.error.HTTPError as e:
        print(f'  ERRO [{page_id}]: {e.code} — {e.read().decode()[:80]}')
    except Exception as e:
        print(f'  ERRO [{page_id}]: {e}')

# ── Remote-only pages ────────────────────────────────────────────────────────
print('\n=== Páginas remotas (sem arquivo local) ===')
h_get = {'Authorization': f'Basic {creds}'}

# Load nav from Rodape
with open(os.path.join(BASE, 'Rodape', 'nav.html'), encoding='utf-8') as f:
    NEW_NAV = f.read().strip()
NAV_PATTERN = re.compile(r'<nav class="bfnav"[^>]*>.*?</nav>', re.DOTALL)

for page_id in REMOTE_ONLY_IDS:
    req = urllib.request.Request(
        f'https://bauernfest.org/wp-json/wp/v2/pages/{page_id}?context=edit',
        headers=h_get
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            pg = json.loads(r.read())
    except Exception as e:
        print(f'  ERRO fetch [{page_id}]: {e}')
        continue

    el_data_raw = pg.get('meta', {}).get('_elementor_data', '') or ''
    if not el_data_raw:
        print(f'  SKIP [{page_id}]: no elementor data')
        continue

    try:
        el_data = json.loads(el_data_raw)
        html = el_data[0]['elements'][0]['elements'][0]['settings']['html']
    except Exception as e:
        print(f'  SKIP [{page_id}]: parse error: {e}')
        continue

    # Update nav
    updated_html = NAV_PATTERN.sub(NEW_NAV, html)
    faq_in_nav = '/faq/' in updated_html

    try:
        push_page(page_id, updated_html)
        print(f'  OK [{page_id}] {pg.get("slug","")} | FAQ in nav: {faq_in_nav}')
    except urllib.error.HTTPError as e:
        print(f'  ERRO [{page_id}]: {e.code} — {e.read().decode()[:80]}')
    except Exception as e:
        print(f'  ERRO [{page_id}]: {e}')

print('\nConcluido.')
