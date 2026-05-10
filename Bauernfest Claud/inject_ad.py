"""
inject_ad.py — Insere o banner apycdn após o 1º parágrafo de todos os artigos.
Remove qualquer apycdn existente antes de inserir (evita duplicatas).
Atualiza arquivos locais + publica no WordPress (local + remoto).
"""
import urllib.request, base64, json, os, uuid, re

BASE   = 'site-bauernfest'
creds  = base64.b64encode(b'ClaudeBot:p8Np bMs8 Xnsh MfH2 cZ7u w5xy').decode()
HGET   = {'Authorization': f'Basic {creds}'}
HPOST  = {'Authorization': f'Basic {creds}', 'Content-Type': 'application/json'}

# ── Código do banner ──────────────────────────────────────────────────────────
AD_CODE = (
    '\n<div class="bf-ad" style="text-align:center;margin:1.5rem auto;clear:both;">'
    '\n<script language="JavaScript" type="text/javascript">'
    '\nvar link_id=\'158448\';'
    '\nvar charset=\'utf-8\';'
    '\nvar sa=\'subaccount\';'
    '\nvar sid=\'358872\';'
    '\nvar cid=\'2038460\';'
    '\nvar banner_id=\'488466\';'
    '\nvar banner_size=\'336x280\';'
    '\n</script>'
    '\n<script language="JavaScript" charset="utf-8" type="text/javascript"'
    ' src="https://apycdn.com/js/adv_out.js"></script>'
    '\n</div>\n'
)

# ── Padrão para remover qualquer apycdn já presente no HTML ──────────────────
AD_PATTERN = re.compile(
    r'<div class="bf-ad".*?</div>\s*',
    re.DOTALL
)
AD_PATTERN_LOOSE = re.compile(
    r'<script[^>]*apycdn[^>]*>.*?</script>\s*',
    re.DOTALL
)

def strip_existing_ad(html):
    html = AD_PATTERN.sub('', html)
    # Also remove loose script blocks referencing apycdn
    def _strip_block(h):
        # Remove var link_id + adv_out script block
        return re.sub(
            r'<script[^>]*>\s*var link_id=.{0,500}?</script>\s*'
            r'<script[^>]*apycdn[^>]*></script>',
            '', h, flags=re.DOTALL
        )
    return _strip_block(html)

def insert_ad_after_first_p(html):
    """Insere AD_CODE após o primeiro </p> que aparece após <!-- BREADCRUMB -->."""
    # Find start anchor: after breadcrumb or after <body
    anchor = html.find('<!-- BREADCRUMB -->')
    if anchor == -1:
        anchor = html.find('<body')
    if anchor == -1:
        anchor = 0

    first_p_end = html.find('</p>', anchor)
    if first_p_end == -1:
        return html, False

    pos = first_p_end + len('</p>')
    return html[:pos] + AD_CODE + html[pos:], True

def rand_id():
    return uuid.uuid4().hex[:7]

def make_el_data(html):
    return json.dumps([{
        'id': rand_id(), 'elType': 'section',
        'settings': {'layout': 'full_width'},
        'elements': [{'id': rand_id(), 'elType': 'column',
            'settings': {'_column_size': 100, '_inline_size': None},
            'elements': [{'id': rand_id(), 'elType': 'widget',
                'widgetType': 'html',
                'settings': {'html': html},
                'elements': []}]}]
    }])

def push(page_id, html):
    payload = json.dumps({
        'content': html,
        'meta': {
            '_elementor_edit_mode':     'builder',
            '_elementor_template_type': 'wp-page',
            '_elementor_data':          make_el_data(html),
            '_elementor_page_settings': {'page_layout': 'elementor_canvas'},
        }
    }).encode()
    req = urllib.request.Request(
        f'https://bauernfest.org/wp-json/wp/v2/pages/{page_id}',
        data=payload, headers=HPOST, method='POST'
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read()).get('id')

# ── Artigos locais (excluindo home, anuncie, contato, politica, termos) ───────
LOCAL_ARTICLES = [
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

# ── Artigos remotos (sem arquivo local) ──────────────────────────────────────
REMOTE_IDS = [77, 216, 73, 79, 89, 97, 95, 93, 103, 99, 105, 101, 81, 83, 85, 87]

ok = 0
skip = 0
erros = 0

print('\n=== Artigos locais ===')
for rel_path, page_id in LOCAL_ARTICLES:
    full_path = os.path.join(BASE, rel_path)
    if not os.path.exists(full_path):
        print(f'  SKIP (arquivo nao encontrado): {rel_path}')
        skip += 1
        continue

    with open(full_path, encoding='utf-8') as f:
        html = f.read()

    # Remove any existing ad, then insert fresh
    html = strip_existing_ad(html)
    html, inserted = insert_ad_after_first_p(html)

    if not inserted:
        print(f'  SKIP (sem <p> encontrado): {rel_path}')
        skip += 1
        continue

    # Save local file
    with open(full_path, 'w', encoding='utf-8') as f:
        f.write(html)

    # Push to WordPress
    try:
        push(page_id, html)
        print(f'  OK  [{page_id}] {rel_path}')
        ok += 1
    except Exception as e:
        print(f'  ERRO [{page_id}] {rel_path}: {e}')
        erros += 1

print('\n=== Artigos remotos ===')
for page_id in REMOTE_IDS:
    # Fetch current HTML from WP
    try:
        req = urllib.request.Request(
            f'https://bauernfest.org/wp-json/wp/v2/pages/{page_id}?context=edit',
            headers=HGET
        )
        with urllib.request.urlopen(req, timeout=15) as r:
            pg = json.loads(r.read())
    except Exception as e:
        print(f'  ERRO fetch [{page_id}]: {e}')
        erros += 1
        continue

    slug = pg.get('slug', str(page_id))

    # Get HTML from elementor data
    el_raw = (pg.get('meta') or {}).get('_elementor_data', '') or ''
    if el_raw:
        try:
            el = json.loads(el_raw)
            html = el[0]['elements'][0]['elements'][0]['settings']['html']
        except Exception:
            # Fallback to post_content
            html = (pg.get('content') or {}).get('raw', '') or ''
    else:
        html = (pg.get('content') or {}).get('raw', '') or ''

    if not html:
        print(f'  SKIP [{page_id}] {slug}: sem conteudo')
        skip += 1
        continue

    # Remove any existing ad, then insert fresh
    html = strip_existing_ad(html)
    html, inserted = insert_ad_after_first_p(html)

    if not inserted:
        print(f'  SKIP [{page_id}] {slug}: sem <p> encontrado')
        skip += 1
        continue

    try:
        push(page_id, html)
        print(f'  OK  [{page_id}] {slug}')
        ok += 1
    except Exception as e:
        print(f'  ERRO [{page_id}] {slug}: {e}')
        erros += 1

print(f'\nConcluido: {ok} OK | {skip} skipped | {erros} erros\n')
