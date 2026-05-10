import urllib.request, base64, json, os, uuid, re

creds = base64.b64encode(b'ClaudeBot:p8Np bMs8 Xnsh MfH2 cZ7u w5xy').decode()
headers = {'Authorization': f'Basic {creds}', 'Content-Type': 'application/json'}

BASE = 'site-bauernfest/FAQ'

pages = [
    {'id': 580, 'slug': 'quando-e-a-bauernfest-petropolis'},
    {'id': 581, 'slug': 'o-que-e-a-bauernfest'},
    {'id': 582, 'slug': 'quantos-dias-dura-a-bauernfest'},
    {'id': 583, 'slug': 'quem-a-bauernfest-homenageia'},
    {'id': 584, 'slug': 'o-que-fazer-na-bauernfest'},
    {'id': 585, 'slug': 'significado-de-bauernfest'},
    {'id': 586, 'slug': 'como-funciona-a-bauernfest'},
    {'id': 587, 'slug': 'bauernfest-2026'},
    {'id': 588, 'slug': 'datas-da-bauernfest'},
    {'id': 589, 'slug': 'horario-bauernfest-petropolis'},
]

# Also update hub FAQ page (id=579)
hub_path = 'site-bauernfest/FAQ/index.html'

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

def update_page_elementor(page_id, html_content):
    el_data = make_elementor_data(html_content)
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
    with urllib.request.urlopen(req, timeout=30) as r:
        result = json.loads(r.read())
    return result.get('id')

# Update hub FAQ page
if os.path.exists(hub_path):
    with open(hub_path, encoding='utf-8') as f:
        html = f.read()
    try:
        update_page_elementor(579, html)
        print(f'OK hub FAQ (id=579)')
    except Exception as e:
        print(f'ERRO hub FAQ: {e}')

# Update article pages
for page in pages:
    html_path = f'{BASE}/{page["slug"]}/index.html'
    if not os.path.exists(html_path):
        print(f'SKIP (not found): {html_path}')
        continue
    with open(html_path, encoding='utf-8') as f:
        html = f.read()
    try:
        update_page_elementor(page['id'], html)
        print(f'OK page {page["id"]}: {page["slug"]}')
    except urllib.error.HTTPError as e:
        print(f'ERRO page {page["id"]}: {e.code} — {e.read().decode()[:100]}')
    except Exception as e:
        print(f'ERRO page {page["id"]}: {e}')

print('\nElementor data atualizado em todas as paginas FAQ.')
