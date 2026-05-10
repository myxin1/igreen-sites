"""
Fix correto: busca _elementor_data existente, preserva IDs dos elementos,
atualiza APENAS o settings.html do widget HTML, republica.
Isso faz o Elementor reconhecer a mudança e regenerar seu cache interno.
"""
import urllib.request, base64, json, os, re

creds = base64.b64encode(b'ClaudeBot:p8Np bMs8 Xnsh MfH2 cZ7u w5xy').decode()
headers = {'Authorization': f'Basic {creds}', 'Content-Type': 'application/json'}
h_get = {'Authorization': f'Basic {creds}'}

BASE = 'site-bauernfest'

with open(os.path.join(BASE, 'Rodape', 'nav.html'), encoding='utf-8') as f:
    NEW_NAV = f.read().strip()
NAV_PATTERN = re.compile(r'<nav class="bfnav"[^>]*>.*?</nav>', re.DOTALL)

def get_page(page_id):
    req = urllib.request.Request(
        f'https://bauernfest.org/wp-json/wp/v2/pages/{page_id}?context=edit',
        headers=h_get
    )
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read())

def push_update(page_id, new_html, el_data_updated):
    payload = json.dumps({
        'content': new_html,
        'meta': {
            '_elementor_edit_mode': 'builder',
            '_elementor_template_type': 'wp-page',
            '_elementor_data': json.dumps(el_data_updated),
            '_elementor_page_settings': {'page_layout': 'elementor_canvas'},
        }
    }).encode()
    req = urllib.request.Request(
        f'https://bauernfest.org/wp-json/wp/v2/pages/{page_id}',
        data=payload, headers=headers, method='POST'
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())

def update_page(page_id, new_html=None, slug=None):
    """Fetch existing elementor data, preserve IDs, update only HTML widget content."""
    pg = get_page(page_id)
    el_data_raw = pg.get('meta', {}).get('_elementor_data', '') or ''

    if not el_data_raw:
        print(f'  [{page_id}] No elementor data — need to create from scratch')
        # Create fresh structure
        import uuid
        el_data = [{
            "id": uuid.uuid4().hex[:7],
            "elType": "section",
            "settings": {"layout": "full_width"},
            "elements": [{
                "id": uuid.uuid4().hex[:7],
                "elType": "column",
                "settings": {"_column_size": 100, "_inline_size": None},
                "elements": [{
                    "id": uuid.uuid4().hex[:7],
                    "elType": "widget",
                    "widgetType": "html",
                    "settings": {"html": new_html},
                    "elements": []
                }]
            }]
        }]
    else:
        el_data = json.loads(el_data_raw)
        # Navigate to the html widget and update ONLY the html content
        try:
            widget = el_data[0]['elements'][0]['elements'][0]
            if new_html is None:
                # Remote page: fetch current HTML and update nav
                current_html = widget['settings']['html']
                new_html = NAV_PATTERN.sub(NEW_NAV, current_html)
            widget['settings']['html'] = new_html
        except (IndexError, KeyError) as e:
            print(f'  [{page_id}] Structure error: {e} — rebuilding')
            import uuid
            el_data = [{
                "id": uuid.uuid4().hex[:7],
                "elType": "section",
                "settings": {"layout": "full_width"},
                "elements": [{
                    "id": uuid.uuid4().hex[:7],
                    "elType": "column",
                    "settings": {"_column_size": 100, "_inline_size": None},
                    "elements": [{
                        "id": uuid.uuid4().hex[:7],
                        "elType": "widget",
                        "widgetType": "html",
                        "settings": {"html": new_html},
                        "elements": []
                    }]
                }]
            }]

    push_update(page_id, new_html, el_data)
    nav_check = re.search(r'<ul[^>]*bfnl[^>]*>(.*?)</ul>', new_html, re.DOTALL)
    faq_ok = '/faq/' in (nav_check.group(0) if nav_check else '')
    print(f'  OK [{page_id}] {slug or ""} | FAQ={faq_ok} | el_id={el_data[0]["id"]}')

# ── Local pages ──────────────────────────────────────────────────────────────
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

print('=== Páginas locais ===')
for rel_path, pid in LOCAL_PAGES:
    full_path = os.path.join(BASE, rel_path)
    if not os.path.exists(full_path):
        print(f'  SKIP: {rel_path}')
        continue
    with open(full_path, encoding='utf-8') as f:
        html = f.read()
    try:
        update_page(pid, new_html=html, slug=rel_path)
    except Exception as e:
        print(f'  ERRO [{pid}]: {e}')

# ── Remote-only pages ────────────────────────────────────────────────────────
REMOTE_IDS = [77, 216, 73, 79, 89, 97, 95, 93, 103, 99, 105, 101, 81, 83, 85, 87]
print('\n=== Páginas remotas ===')
for pid in REMOTE_IDS:
    try:
        update_page(pid, new_html=None, slug=str(pid))
    except Exception as e:
        print(f'  ERRO [{pid}]: {e}')

print('\nConcluido.')
