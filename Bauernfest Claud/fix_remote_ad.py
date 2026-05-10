"""
fix_remote_ad.py — Corrige páginas remotas:
1. Remove mgwidget embutido no HTML
2. Garante apycdn após 1º parágrafo
3. Usa _elementor_edit_mode='' para bypass do cache Elementor
"""
import urllib.request, base64, json, uuid, re

creds = base64.b64encode(b'ClaudeBot:p8Np bMs8 Xnsh MfH2 cZ7u w5xy').decode()
HGET  = {'Authorization': f'Basic {creds}'}
HPOST = {'Authorization': f'Basic {creds}', 'Content-Type': 'application/json'}

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

def clean_html(html):
    # Remove mgwidget
    html = re.sub(
        r"<div[^>]*class=['\"]code-block[^>]*>.*?</div>\s*",
        '', html, flags=re.DOTALL
    )
    html = re.sub(
        r'\(function\(w,q\)\{w\[q\]=.*?"_mgq"\]\);?\s*</script>',
        '', html, flags=re.DOTALL
    )
    html = re.sub(
        r'<div[^>]*data-type="_mgwidget"[^>]*>.*?</div>',
        '', html, flags=re.DOTALL
    )
    html = re.sub(r'<center>\s*</center>', '', html)
    # Remove any existing bf-ad
    html = re.sub(r'<div class="bf-ad".*?</div>\s*', '', html, flags=re.DOTALL)
    # Remove loose apycdn scripts
    html = re.sub(
        r'<script[^>]*>\s*var link_id=.{0,600}?</script>\s*'
        r'<script[^>]*apycdn[^>]*></script>',
        '', html, flags=re.DOTALL
    )
    return html

def insert_ad(html):
    anchor = html.find('<!-- BREADCRUMB -->')
    if anchor == -1:
        anchor = html.find('<body')
    if anchor == -1:
        anchor = 0
    pos = html.find('</p>', anchor)
    if pos == -1:
        return html, False
    pos += len('</p>')
    return html[:pos] + AD_CODE + html[pos:], True

def rand_id():
    return uuid.uuid4().hex[:7]

def push(page_id, html):
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
            '_elementor_edit_mode':     '',   # bypass Elementor cache → serve post_content
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

REMOTE_IDS = [77, 216, 73, 79, 89, 97, 95, 93, 103, 99, 105, 101, 81, 83, 85, 87]

print('\n=== Corrigindo páginas remotas ===')
ok = erros = 0

for page_id in REMOTE_IDS:
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

    # Get HTML — prefer elementor data
    el_raw = (pg.get('meta') or {}).get('_elementor_data', '') or ''
    if el_raw:
        try:
            el = json.loads(el_raw)
            html = el[0]['elements'][0]['elements'][0]['settings']['html']
        except Exception:
            html = (pg.get('content') or {}).get('raw', '') or ''
    else:
        html = (pg.get('content') or {}).get('raw', '') or ''

    if not html:
        print(f'  SKIP [{page_id}] {slug}: sem conteudo')
        continue

    html = clean_html(html)
    html, inserted = insert_ad(html)

    if not inserted:
        print(f'  SKIP [{page_id}] {slug}: sem </p> encontrado')
        continue

    try:
        push(page_id, html)
        print(f'  OK  [{page_id}] {slug}')
        ok += 1
    except Exception as e:
        print(f'  ERRO [{page_id}] {slug}: {e}')
        erros += 1

print(f'\nConcluido: {ok} OK | {erros} erros\n')
