"""
Corrige o nav nos arquivos locais que não têm marcadores BauerUP,
adicionando o item FAQ, e depois republica no WordPress.
"""
import re, os, urllib.request, base64, json, uuid

BASE = 'c:/Users/User/Downloads/Projeto Claude Code/Bauernfest Claud/site-bauernfest'
creds = base64.b64encode(b'ClaudeBot:p8Np bMs8 Xnsh MfH2 cZ7u w5xy').decode()
headers = {'Authorization': f'Basic {creds}', 'Content-Type': 'application/json'}

# Páginas locais sem marcadores BauerUP que precisam de atualização
LOCAL_PAGES = [
    ('gastronomia/index.html',   69),
    ('programacao/index.html',   91),
    ('sobre/index.html',         64),
    ('turismo/index.html',       71),
]

# Ler nav.html atual
with open(os.path.join(BASE, 'Rodape', 'nav.html'), encoding='utf-8') as f:
    NEW_NAV = f.read().strip()

NAV_PATTERN = re.compile(r'<nav class="bfnav"[^>]*>.*?</nav>', re.DOTALL)

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

for rel_path, page_id in LOCAL_PAGES:
    full_path = os.path.join(BASE, rel_path)
    with open(full_path, encoding='utf-8') as f:
        html = f.read()

    if not NAV_PATTERN.search(html):
        print(f'SKIP {rel_path}: no nav pattern')
        continue

    updated = NAV_PATTERN.sub(NEW_NAV, html)

    # Verify FAQ is now in nav
    nav_block = NAV_PATTERN.search(updated)
    if not nav_block or '/faq/' not in nav_block.group(0):
        print(f'WARN {rel_path}: FAQ still not in nav after replacement')
        continue

    # Save local file
    with open(full_path, 'w', encoding='utf-8') as f:
        f.write(updated)
    print(f'LOCAL UPDATED: {rel_path}')

    # Push to WordPress
    el_data = make_elementor_data(updated)
    payload = json.dumps({
        'meta': {
            '_elementor_edit_mode': 'builder',
            '_elementor_template_type': 'wp-page',
            '_elementor_data': el_data,
        }
    }).encode()
    req = urllib.request.Request(
        f'https://bauernfest.org/wp-json/wp/v2/pages/{page_id}',
        data=payload, headers=headers, method='POST'
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            json.loads(r.read())
        print(f'  WP OK [{page_id}]')
    except urllib.error.HTTPError as e:
        print(f'  WP ERRO [{page_id}]: {e.code} — {e.read().decode()[:80]}')

print('\nConcluido.')
