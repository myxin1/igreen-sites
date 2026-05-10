"""
gp_migrate_content.py — Migrates all internal pages to GP native template.

For each page:
- Fetches HTML stored in WP (Elementor data) or reads from local file
- Extracts body: breadcrumb + article + newsletter + footer (strips nav/scripts)
- Updates WP page: content in post_content, removes elementor_canvas template
- GP provides the site header (styled via gp_setup.py CSS)
"""
import urllib.request, base64, json, re, os, time

WP   = 'https://bauernfest.org'
USER = 'ClaudeBot'
PASS = 'p8Np bMs8 Xnsh MfH2 cZ7u w5xy'
BASE = 'site-bauernfest'

creds = base64.b64encode(f'{USER}:{PASS}'.encode()).decode()
HGET  = {'Authorization': f'Basic {creds}'}
HPOST = {'Authorization': f'Basic {creds}', 'Content-Type': 'application/json'}

HOME_ID = 56  # Keep HOME as-is

# ─── Page map: (local_path_or_None, wp_id) ───────────────────────────────────
# None → fetch stored HTML from WP REST API
# str  → read from local file (clean custom HTML)
PAGES = [
    # Hub pages (local files are WP-rendered snapshots — fetch from API)
    (None, 64),   # sobre
    (None, 69),   # gastronomia
    (None, 71),   # turismo
    (None, 91),   # programacao
    (None, 365),  # anuncie
    (None, 371),  # contato
    # FAQ hub + articles (clean local HTML files)
    ('FAQ/index.html',                                   579),
    ('FAQ/quando-e-a-bauernfest-petropolis/index.html',  580),
    ('FAQ/o-que-e-a-bauernfest/index.html',              581),
    ('FAQ/quantos-dias-dura-a-bauernfest/index.html',    582),
    ('FAQ/quem-a-bauernfest-homenageia/index.html',      583),
    ('FAQ/o-que-fazer-na-bauernfest/index.html',         584),
    ('FAQ/significado-de-bauernfest/index.html',         585),
    ('FAQ/como-funciona-a-bauernfest/index.html',        586),
    ('FAQ/bauernfest-2026/index.html',                   587),
    ('FAQ/datas-da-bauernfest/index.html',               588),
    ('FAQ/horario-bauernfest-petropolis/index.html',     589),
    # Receitas (clean local HTML)
    ('receitas-alemas/index.html',                       860),
    ('receitas-alemas/pretzel-receita/index.html',       862),
    ('receitas-alemas/sauerkraut-receita/index.html',    864),
    ('receitas-alemas/bratwurst-receita/index.html',     866),
    ('receitas-alemas/selva-negra-receita/index.html',   868),
    ('receitas-alemas/kassler-receita/index.html',       870),
]


# ─── Fetch HTML from WP API ──────────────────────────────────────────────────
def fetch_wp_html(page_id):
    req = urllib.request.Request(
        f'{WP}/wp-json/wp/v2/pages/{page_id}?context=edit', headers=HGET)
    with urllib.request.urlopen(req, timeout=20) as r:
        pg = json.loads(r.read())

    # Try elementor data first (nested: section > column > widget > settings.html)
    el_raw = (pg.get('meta') or {}).get('_elementor_data', '') or ''
    if el_raw and el_raw != '[]':
        try:
            el = json.loads(el_raw)
            return el[0]['elements'][0]['elements'][0]['settings']['html']
        except Exception:
            pass

    # Fallback to post_content
    return (pg.get('content') or {}).get('raw', '') or ''


# ─── Extract body from full HTML page ────────────────────────────────────────
def extract_body(html):
    """
    Strip the custom <nav> header and burger JS.
    Returns: breadcrumb + hero (if any) + article/content + newsletter + footer.
    GP provides the theme header; our footer HTML stays in post_content.
    """
    # If embedded in Elementor widget (WP snapshot), jump inside the widget
    widget_marker = 'class="elementor-widget-container">'
    wm = html.find(widget_marker)
    if wm != -1:
        html = html[wm + len(widget_marker):]
        # Skip nested <!DOCTYPE html><html>...<body>
        body_open = html.find('<body')
        if body_open != -1:
            body_end = html.find('>', body_open)
            html = html[body_end + 1:]

    # Skip our custom <nav class="bfnav"> block (use first </nav>, not rfind — the
    # breadcrumb section contains its own inner <nav aria-label="Breadcrumb">)
    bfnav_pos = html.find('class="bfnav"')
    if bfnav_pos != -1:
        nav_end = html.find('</nav>', bfnav_pos)
    else:
        nav_end = html.find('</nav>')
    if nav_end != -1:
        html = html[nav_end + 6:]

    # Find footer position to determine where to cut burger JS
    footer_pos = -1
    for marker in ['<footer class="bfftr"', '<footer ', 'class="bfftr"']:
        footer_pos = html.find(marker)
        if footer_pos != -1:
            break

    # Cut at first <script> that appears AFTER the footer (burger menu JS)
    search_from = footer_pos if footer_pos > 0 else 0
    script_pos = html.find('<script', search_from)
    if script_pos != -1:
        html = html[:script_pos]

    # Remove trailing </body></html>
    html = re.sub(r'\s*</body>\s*</html>\s*$', '', html.strip())

    return html.strip()


# ─── Update WP page (native GP template) ─────────────────────────────────────
def update_page(page_id, content):
    """
    Store content in post_content, remove elementor_canvas.
    _elementor_edit_mode='' → WP serves post_content directly.
    template='' → GP's default full-content template.
    """
    payload = json.dumps({
        'content': content,
        'template': '',
        'meta': {
            '_elementor_edit_mode': '',
            '_elementor_data': '[]',
            '_elementor_page_settings': {},
        },
    }).encode()
    req = urllib.request.Request(
        f'{WP}/wp-json/wp/v2/pages/{page_id}',
        data=payload, headers=HPOST, method='POST')
    with urllib.request.urlopen(req, timeout=30) as r:
        result = json.loads(r.read())
    return result.get('id')


# ─── MAIN ────────────────────────────────────────────────────────────────────
print('\n==============================================')
print(' GP Content Migration -- bauernfest.org')
print('==============================================')
print(f' HOME (id={HOME_ID}) -> mantido como esta (Elementor Canvas)\n')

ok = erros = skipped = 0

for local_path, page_id in PAGES:
    try:
        # Get raw HTML
        if local_path:
            path = os.path.join(BASE, local_path)
            if not os.path.exists(path):
                print(f'  SKIP (arquivo nao encontrado): {local_path}')
                skipped += 1
                continue
            with open(path, encoding='utf-8') as f:
                raw = f.read()
            label = local_path
        else:
            raw = fetch_wp_html(page_id)
            label = f'wp:{page_id}'

        if not raw:
            print(f'  SKIP (sem conteudo): [{page_id}]')
            skipped += 1
            continue

        content = extract_body(raw)
        if len(content) < 200:
            print(f'  SKIP (conteudo muito curto {len(content)}c): [{page_id}] {label}')
            skipped += 1
            continue

        update_page(page_id, content)
        print(f'  OK  [{page_id}] {label}  ({len(content)} chars)')
        ok += 1
        time.sleep(0.4)

    except Exception as e:
        print(f'  ERRO [{page_id}]: {e}')
        erros += 1

print(f'\nConcluído: {ok} OK | {skipped} pulados | {erros} erros')
print('\nPROXIMOS PASSOS:')
print('1. WP Admin -> Aparencia -> Menus -> Atribuir "Menu Principal" a "Primary Menu"')
print('2. LiteSpeed Cache -> Purge All')
print('3. Verificar paginas no navegador')
