"""
remove_ad.py — Remove o banner apycdn de todas as páginas e restaura o estado original.
"""
import urllib.request, base64, json, uuid, re, os

BASE  = 'site-bauernfest'
creds = base64.b64encode(b'ClaudeBot:p8Np bMs8 Xnsh MfH2 cZ7u w5xy').decode()
HGET  = {'Authorization': f'Basic {creds}'}
HPOST = {'Authorization': f'Basic {creds}', 'Content-Type': 'application/json'}

def strip_all_ad(html):
    # Remove bf-ad div
    html = re.sub(r'\n?<div class="bf-ad".*?</div>\n?', '', html, flags=re.DOTALL)
    # Remove loose apycdn scripts
    html = re.sub(
        r'\n?<script[^>]*>\s*var link_id=.{0,600}?</script>\s*'
        r'<script[^>]*apycdn[^>]*></script>\n?',
        '', html, flags=re.DOTALL
    )
    # Remove mgwidget remnants
    html = re.sub(r'\n?<div[^>]*data-type="_mgwidget"[^>]*>.*?</div>\n?', '', html, flags=re.DOTALL)
    html = re.sub(r'\(function\(w,q\)\{w\[q\]=.*?"_mgq"\]\);?\s*</script>', '', html, flags=re.DOTALL)
    html = re.sub(r'<center>\s*</center>', '', html)
    return html

def rand_id():
    return uuid.uuid4().hex[:7]

def push(page_id, html, bypass=False):
    el_data = json.dumps([{
        'id': rand_id(), 'elType': 'section',
        'settings': {'layout': 'full_width'},
        'elements': [{'id': rand_id(), 'elType': 'column',
            'settings': {'_column_size': 100, '_inline_size': None},
            'elements': [{'id': rand_id(), 'elType': 'widget',
                'widgetType': 'html',
                'settings': {'html': html},
                'elements': []}]}]
    }])
    payload = json.dumps({
        'content': html,
        'meta': {
            '_elementor_edit_mode':     '' if bypass else 'builder',
            '_elementor_template_type': 'wp-page',
            '_elementor_data':          el_data,
            '_elementor_page_settings': {'page_layout': 'elementor_canvas'},
        }
    }).encode()
    req = urllib.request.Request(
        f'https://bauernfest.org/wp-json/wp/v2/pages/{page_id}',
        data=payload, headers=HPOST, method='POST'
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read()).get('id')

# Todas as páginas locais (incluindo home, anuncie, contato, politica, termos)
LOCAL_ALL = [
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
    ('receitas-alemas/index.html',                         860),
    ('receitas-alemas/pretzel-receita/index.html',         862),
    ('receitas-alemas/sauerkraut-receita/index.html',      864),
    ('receitas-alemas/bratwurst-receita/index.html',       866),
    ('receitas-alemas/selva-negra-receita/index.html',     868),
    ('receitas-alemas/kassler-receita/index.html',         870),
]

REMOTE_IDS = [77, 216, 73, 79, 89, 97, 95, 93, 103, 99, 105, 101, 81, 83, 85, 87]

ok = erros = 0

print('\n=== Removendo ad das paginas locais ===')
for rel, pid in LOCAL_ALL:
    path = os.path.join(BASE, rel)
    if not os.path.exists(path):
        print(f'  SKIP (nao encontrado): {rel}')
        continue
    with open(path, encoding='utf-8') as f:
        html = f.read()

    cleaned = strip_all_ad(html)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(cleaned)

    try:
        push(pid, cleaned, bypass=False)
        changed = 'removido' if cleaned != html else 'sem alteracao'
        print(f'  OK  [{pid}] {rel} ({changed})')
        ok += 1
    except Exception as e:
        print(f'  ERRO [{pid}]: {e}')
        erros += 1

print('\n=== Removendo ad das paginas remotas ===')
for pid in REMOTE_IDS:
    try:
        req = urllib.request.Request(
            f'https://bauernfest.org/wp-json/wp/v2/pages/{pid}?context=edit',
            headers=HGET
        )
        with urllib.request.urlopen(req, timeout=15) as r:
            pg = json.loads(r.read())
    except Exception as e:
        print(f'  ERRO fetch [{pid}]: {e}')
        erros += 1
        continue

    slug = pg.get('slug', str(pid))
    el_raw = (pg.get('meta') or {}).get('_elementor_data', '') or ''
    html = ''
    if el_raw:
        try:
            html = json.loads(el_raw)[0]['elements'][0]['elements'][0]['settings']['html']
        except Exception:
            pass
    if not html:
        html = (pg.get('content') or {}).get('raw', '') or ''
    if not html:
        print(f'  SKIP [{pid}] {slug}: sem conteudo')
        continue

    cleaned = strip_all_ad(html)
    try:
        push(pid, cleaned, bypass=True)
        changed = 'removido' if cleaned != html else 'sem alteracao'
        print(f'  OK  [{pid}] {slug} ({changed})')
        ok += 1
    except Exception as e:
        print(f'  ERRO [{pid}] {slug}: {e}')
        erros += 1

print(f'\nConcluido: {ok} OK | {erros} erros\n')
