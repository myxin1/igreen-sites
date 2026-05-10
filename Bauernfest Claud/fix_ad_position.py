"""
fix_ad_position.py — Reposiciona o banner apycdn:
  - Remove o banner da posição errada (hero/subtitle)
  - Insere APÓS o 1º parágrafo dentro do conteúdo do artigo
  - Centralizado com max-width
Cobre: locais (21) + remotos (16) = 37 páginas.
"""
import urllib.request, base64, json, uuid, re, os

BASE  = 'site-bauernfest'
creds = base64.b64encode(b'ClaudeBot:p8Np bMs8 Xnsh MfH2 cZ7u w5xy').decode()
HGET  = {'Authorization': f'Basic {creds}'}
HPOST = {'Authorization': f'Basic {creds}', 'Content-Type': 'application/json'}

AD_CODE = (
    '\n<div class="bf-ad" style="text-align:center;margin:2rem auto;clear:both;max-width:360px;">'
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

def strip_ad(html):
    """Remove qualquer banner bf-ad existente."""
    return re.sub(r'\n?<div class="bf-ad".*?</div>\n?', '', html, flags=re.DOTALL)

def insert_ad(html):
    """
    Insere AD_CODE após o 1º </p> dentro do conteúdo do artigo.
    Ordem de prioridade do âncora:
      1. article-content  → artigos FAQ, receitas, gastronomia filhos, etc.
      2. bf-intro         → hub pages (gastronomia, turismo, sobre, programacao)
      3. Após </section> do hero (pg-hero) → páginas remotas com hero
      4. Fallback: 2º </p> no documento (pula o do hero/subtitle)
    """
    # 1. article-content
    anchor = html.find('class="article-content"')
    # 2. bf-intro
    if anchor == -1:
        anchor = html.find('class="bf-intro"')
    # 3. Após a section do hero
    if anchor == -1:
        hero = html.find('pg-hero')
        if hero != -1:
            sec_end = html.find('</section>', hero)
            anchor = sec_end if sec_end != -1 else -1
    # 4. Fallback: pula o primeiro </p> e usa o segundo
    if anchor == -1:
        first_p = html.find('</p>')
        anchor = first_p + 4 if first_p != -1 else 0

    if anchor == -1:
        return html, False

    p_end = html.find('</p>', anchor)
    if p_end == -1:
        return html, False

    pos = p_end + len('</p>')
    return html[:pos] + AD_CODE + html[pos:], True

def rand_id():
    return uuid.uuid4().hex[:7]

def push(page_id, html, bypass_elementor=False):
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
            '_elementor_edit_mode':     '' if bypass_elementor else 'builder',
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

# ── Locais ────────────────────────────────────────────────────────────────────
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

REMOTE_IDS = [77, 216, 73, 79, 89, 97, 95, 93, 103, 99, 105, 101, 81, 83, 85, 87]

ok = erros = 0

print('\n=== Locais ===')
for rel, pid in LOCAL_ARTICLES:
    path = os.path.join(BASE, rel)
    if not os.path.exists(path):
        print(f'  SKIP (nao encontrado): {rel}')
        continue
    with open(path, encoding='utf-8') as f:
        html = f.read()

    html = strip_ad(html)
    html, inserted = insert_ad(html)
    if not inserted:
        print(f'  SKIP (sem <p>): {rel}')
        continue

    with open(path, 'w', encoding='utf-8') as f:
        f.write(html)
    try:
        push(pid, html, bypass_elementor=False)
        print(f'  OK  [{pid}] {rel}')
        ok += 1
    except Exception as e:
        print(f'  ERRO [{pid}]: {e}')
        erros += 1

print('\n=== Remotos ===')
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

    html = strip_ad(html)
    html, inserted = insert_ad(html)
    if not inserted:
        print(f'  SKIP [{pid}] {slug}: sem <p>')
        continue

    try:
        push(pid, html, bypass_elementor=True)
        print(f'  OK  [{pid}] {slug}')
        ok += 1
    except Exception as e:
        print(f'  ERRO [{pid}] {slug}: {e}')
        erros += 1

print(f'\nConcluido: {ok} OK | {erros} erros\n')
