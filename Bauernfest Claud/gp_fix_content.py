"""
gp_fix_content.py — Fix content on all migrated pages:
- Remove newsletter (email capture)
- Remove Anuncie Aqui image
- Remove social sharing icons (CSS + HTML)
- Replace footer: brown bg + clean menu (Termos, Privacidade, Contato)
- Inject CSS variables so colors always work
"""
import urllib.request, base64, json, re, os, time

WP   = 'https://bauernfest.org'
USER = 'ClaudeBot'
PASS = 'p8Np bMs8 Xnsh MfH2 cZ7u w5xy'
BASE = 'site-bauernfest'

creds = base64.b64encode(f'{USER}:{PASS}'.encode()).decode()
HGET  = {'Authorization': f'Basic {creds}'}
HPOST = {'Authorization': f'Basic {creds}', 'Content-Type': 'application/json'}

# ── Minimal critical CSS injected into every page ──────────────────────────────
# Defines variables + hides sharing icons. Small so WP keeps it.
PAGE_CSS = """\
<style id="bf-vars">
:root{--rot:#8B1A1A;--gold:#C8922A;--glt:#E8B84B;--dark:#1A1008;--cream:#F9F3E8;--text:#2C1A0E;--muted:#7A6048}
/* Hide social sharing plugins */
.addtoany_share_save_container,.addtoany_shortcode,.a2a_kit,
.sharedaddy,.sd-sharing,.sd-content,.sd-block,
.wp-block-social-links,.jetpack-sharing-buttons,
.sharing-buttons,.social-share,.share-this-block,
[class*="addtoany"],[id*="sharing"],[class*="sshare"],
.share-link-wrapper,.post-share{display:none!important}
/* Breadcrumb fallback */
.bf-breadcrumb{background:#F9F3E8!important;border-bottom:1px solid rgba(0,0,0,.06)!important;padding:.6rem 0!important}
.bcr{background:#fff!important;border-bottom:1px solid rgba(0,0,0,.07)!important;padding:.75rem 1.5rem!important}
/* Footer fallback */
.bfftr{background:#1A1008!important;color:rgba(255,255,255,.42)!important}
.ftrcol h4{color:rgba(255,255,255,.9)!important}
.ftrcol ul li a,.bflogo,.ftrbrand p,.ftrbtm,.ftr-legal a{color:rgba(255,255,255,.4)!important}
</style>"""

# ── New footer HTML (inline styles guarantee brown bg regardless of CSS) ────────
NEW_FOOTER = """\
<!-- FOOTER -->
<footer class="bfftr" style="background:#1A1008;color:rgba(255,255,255,.42);padding:3rem 1rem 0;margin-top:0">
  <div class="ftrgrid bfc">

    <!-- BRAND -->
    <div class="ftrbrand">
      <a href="https://bauernfest.org/" class="bflogo" style="font-family:'Playfair Display',serif;font-size:1.5rem;font-weight:900;color:#E8B84B;text-decoration:none;letter-spacing:.04em">Bauern<span style="color:#fff">fest</span></a>
      <p style="font-family:sans-serif;font-size:.83rem;line-height:1.7;margin-top:.7rem;color:rgba(255,255,255,.38);max-width:220px">A segunda maior festa germânica do Brasil, realizada no Palácio de Cristal em Petrópolis, RJ — desde 1989.</p>
    </div>

    <!-- A FESTA -->
    <div class="ftrcol">
      <h4 style="font-family:sans-serif;font-weight:700;font-size:.72rem;color:rgba(255,255,255,.9);margin-bottom:1rem;letter-spacing:.12em;text-transform:uppercase">A Festa</h4>
      <ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:.35rem">
        <li><a href="https://bauernfest.org/sobre/" style="font-family:sans-serif;font-size:.82rem;color:rgba(255,255,255,.4);text-decoration:none">Nossa História</a></li>
        <li><a href="https://bauernfest.org/programacao/" style="font-family:sans-serif;font-size:.82rem;color:rgba(255,255,255,.4);text-decoration:none">Programação 2026</a></li>
        <li><a href="https://bauernfest.org/gastronomia/" style="font-family:sans-serif;font-size:.82rem;color:rgba(255,255,255,.4);text-decoration:none">Gastronomia</a></li>
        <li><a href="https://bauernfest.org/turismo/" style="font-family:sans-serif;font-size:.82rem;color:rgba(255,255,255,.4);text-decoration:none">Turismo</a></li>
      </ul>
    </div>

    <!-- RECEITAS -->
    <div class="ftrcol">
      <h4 style="font-family:sans-serif;font-weight:700;font-size:.72rem;color:rgba(255,255,255,.9);margin-bottom:1rem;letter-spacing:.12em;text-transform:uppercase">Receitas Alemãs</h4>
      <ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:.35rem">
        <li><a href="https://bauernfest.org/receitas-alemas/" style="font-family:sans-serif;font-size:.82rem;color:rgba(255,255,255,.4);text-decoration:none">Ver todas</a></li>
        <li><a href="https://bauernfest.org/receitas-alemas/pretzel-receita/" style="font-family:sans-serif;font-size:.82rem;color:rgba(255,255,255,.4);text-decoration:none">Pretzel</a></li>
        <li><a href="https://bauernfest.org/receitas-alemas/sauerkraut-receita/" style="font-family:sans-serif;font-size:.82rem;color:rgba(255,255,255,.4);text-decoration:none">Sauerkraut</a></li>
        <li><a href="https://bauernfest.org/receitas-alemas/bratwurst-receita/" style="font-family:sans-serif;font-size:.82rem;color:rgba(255,255,255,.4);text-decoration:none">Bratwurst</a></li>
        <li><a href="https://bauernfest.org/receitas-alemas/kassler-receita/" style="font-family:sans-serif;font-size:.82rem;color:rgba(255,255,255,.4);text-decoration:none">Kassler</a></li>
        <li><a href="https://bauernfest.org/receitas-alemas/selva-negra-receita/" style="font-family:sans-serif;font-size:.82rem;color:rgba(255,255,255,.4);text-decoration:none">Selva Negra</a></li>
      </ul>
    </div>

    <!-- FAQ -->
    <div class="ftrcol">
      <h4 style="font-family:sans-serif;font-weight:700;font-size:.72rem;color:rgba(255,255,255,.9);margin-bottom:1rem;letter-spacing:.12em;text-transform:uppercase">FAQ</h4>
      <ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:.35rem">
        <li><a href="https://bauernfest.org/faq/" style="font-family:sans-serif;font-size:.82rem;color:rgba(255,255,255,.4);text-decoration:none">Perguntas Frequentes</a></li>
        <li><a href="https://bauernfest.org/faq/quando-e-a-bauernfest-petropolis/" style="font-family:sans-serif;font-size:.82rem;color:rgba(255,255,255,.4);text-decoration:none">Quando é a Bauernfest?</a></li>
        <li><a href="https://bauernfest.org/faq/o-que-e-a-bauernfest/" style="font-family:sans-serif;font-size:.82rem;color:rgba(255,255,255,.4);text-decoration:none">O que é a Bauernfest?</a></li>
        <li><a href="https://bauernfest.org/faq/bauernfest-2026/" style="font-family:sans-serif;font-size:.82rem;color:rgba(255,255,255,.4);text-decoration:none">Bauernfest 2026</a></li>
        <li><a href="https://bauernfest.org/faq/horario-bauernfest-petropolis/" style="font-family:sans-serif;font-size:.82rem;color:rgba(255,255,255,.4);text-decoration:none">Horários</a></li>
      </ul>
    </div>

    <!-- INSTITUCIONAL -->
    <div class="ftrcol">
      <h4 style="font-family:sans-serif;font-weight:700;font-size:.72rem;color:rgba(255,255,255,.9);margin-bottom:1rem;letter-spacing:.12em;text-transform:uppercase">Institucional</h4>
      <ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:.35rem">
        <li><a href="https://bauernfest.org/contato/" style="font-family:sans-serif;font-size:.82rem;color:rgba(255,255,255,.4);text-decoration:none">Contato</a></li>
        <li><a href="https://bauernfest.org/politica-de-privacidade/" style="font-family:sans-serif;font-size:.82rem;color:rgba(255,255,255,.4);text-decoration:none">Política de Privacidade</a></li>
        <li><a href="https://bauernfest.org/termos-de-uso/" style="font-family:sans-serif;font-size:.82rem;color:rgba(255,255,255,.4);text-decoration:none">Termos de Uso</a></li>
      </ul>
    </div>

  </div>

  <hr style="max-width:1160px;margin:0 auto;border:none;border-top:1px solid rgba(255,255,255,.07)"/>

  <div class="bfc" style="padding:1.2rem 0">
    <div style="display:flex;flex-direction:column;gap:.7rem;font-family:sans-serif;font-size:.74rem;text-align:center;color:rgba(255,255,255,.25)">
      <span>© 2026 Bauernfest Petrópolis. Todos os direitos reservados.</span>
      <div style="display:flex;flex-wrap:wrap;gap:1.2rem;justify-content:center">
        <a href="https://bauernfest.org/termos-de-uso/" style="color:rgba(255,255,255,.4);text-decoration:none;font-family:sans-serif;font-size:.72rem">Termos de Uso</a>
        <a href="https://bauernfest.org/politica-de-privacidade/" style="color:rgba(255,255,255,.4);text-decoration:none;font-family:sans-serif;font-size:.72rem">Política de Privacidade</a>
        <a href="https://bauernfest.org/contato/" style="color:rgba(255,255,255,.4);text-decoration:none;font-family:sans-serif;font-size:.72rem">Contato</a>
      </div>
    </div>
  </div>

</footer>"""

# ── Page map ───────────────────────────────────────────────────────────────────
PAGES = [
    (None, 64),   # sobre
    (None, 69),   # gastronomia
    (None, 71),   # turismo
    (None, 91),   # programacao
    (None, 365),  # anuncie
    (None, 371),  # contato
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
    ('receitas-alemas/index.html',                       860),
    ('receitas-alemas/pretzel-receita/index.html',       862),
    ('receitas-alemas/sauerkraut-receita/index.html',    864),
    ('receitas-alemas/bratwurst-receita/index.html',     866),
    ('receitas-alemas/selva-negra-receita/index.html',   868),
    ('receitas-alemas/kassler-receita/index.html',       870),
]


# ── Fetch current WP post_content (already extracted from Elementor) ──────────
def fetch_wp_content(page_id):
    req = urllib.request.Request(
        f'{WP}/wp-json/wp/v2/pages/{page_id}?context=edit', headers=HGET)
    with urllib.request.urlopen(req, timeout=20) as r:
        pg = json.loads(r.read())
    return (pg.get('content') or {}).get('raw', '') or ''


# ── Extract body from full local HTML (strips nav + scripts) ──────────────────
def extract_body(html):
    # Elementor widget path (WP snapshots)
    wm = html.find('class="elementor-widget-container">')
    if wm != -1:
        html = html[wm + len('class="elementor-widget-container">'):]
        bo = html.find('<body')
        if bo != -1:
            be = html.find('>', bo)
            html = html[be + 1:]

    # Strip bfnav (first </nav> after bfnav, not rfind — breadcrumb has inner nav)
    bfnav_pos = html.find('class="bfnav"')
    if bfnav_pos != -1:
        nav_end = html.find('</nav>', bfnav_pos)
    else:
        nav_end = html.find('</nav>')
    if nav_end != -1:
        html = html[nav_end + 6:]

    # Cut burger JS after footer
    footer_pos = -1
    for m in ['<footer class="bfftr"', '<footer ', 'class="bfftr"']:
        footer_pos = html.find(m)
        if footer_pos != -1:
            break
    search_from = footer_pos if footer_pos > 0 else 0
    script_pos = html.find('<script', search_from)
    if script_pos != -1:
        html = html[:script_pos]

    html = re.sub(r'\s*</body>\s*</html>\s*$', '', html.strip())
    return html.strip()


# ── Apply all content fixes ───────────────────────────────────────────────────
def fix_content(html):
    # 1. Strip old bf-gc / bf-vars style blocks
    html = re.sub(r'<style\s+id="bf-[^"]*"[^>]*>.*?</style>', '', html, flags=re.DOTALL)

    # 2. Remove newsletter section (with or without HTML comment)
    html = re.sub(
        r'(<!--\s*NEWSLETTER\s*-->\s*)?<section[^>]+class="[^"]*bf-newsletter[^"]*"[^>]*>.*?</section>',
        '', html, flags=re.DOTALL | re.IGNORECASE)

    # 3. Remove Anuncie Aqui image (with optional wrapping <a>)
    html = re.sub(
        r'<a[^>]*>\s*<img[^>]*Anuncie-Aqui[^>]*/?\s*>\s*</a>',
        '', html, flags=re.DOTALL | re.IGNORECASE)
    html = re.sub(
        r'<img[^>]*Anuncie-Aqui[^>]*/?\s*>',
        '', html, flags=re.IGNORECASE)

    # 4. Remove sharing icon divs (AddToAny, Jetpack, generic share)
    html = re.sub(
        r'<div[^>]+class="[^"]*(?:addtoany|sharedaddy|sd-sharing|share-buttons|social-share)[^"]*"[^>]*>.*?</div>',
        '', html, flags=re.DOTALL | re.IGNORECASE)

    # 5. Replace entire footer
    footer_pos = html.find('<footer')
    if footer_pos != -1:
        # Include the <!-- FOOTER --> comment before footer tag if present
        comment_search_start = max(0, footer_pos - 80)
        comment_pos = html.rfind('<!--', comment_search_start, footer_pos)
        if comment_pos != -1 and html[comment_pos:footer_pos].strip().startswith('<!--'):
            footer_pos = comment_pos
        html = html[:footer_pos].rstrip() + '\n\n' + NEW_FOOTER
    else:
        # No footer found, append one
        html = html.rstrip() + '\n\n' + NEW_FOOTER

    return html.strip()


# ── Update WP page ─────────────────────────────────────────────────────────────
def update_page(page_id, content):
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


# ── MAIN ───────────────────────────────────────────────────────────────────────
print('\n======================================')
print(' GP Fix Content -- bauernfest.org')
print('======================================')
print(' Remove: newsletter, sharing icons, Anuncie image')
print(' Fix: footer (brown bg + Termos/Privacidade/Contato)\n')

ok = erros = skipped = 0

for local_path, page_id in PAGES:
    try:
        if local_path:
            path = os.path.join(BASE, local_path)
            if not os.path.exists(path):
                print(f'  SKIP (not found): {local_path}')
                skipped += 1
                continue
            with open(path, encoding='utf-8') as f:
                raw = f.read()
            # Extract body (strips nav, head CSS, burger JS)
            body = extract_body(raw)
            label = local_path
        else:
            # Hub pages: fetch current WP post_content
            body = fetch_wp_content(page_id)
            label = f'wp:{page_id}'

        if not body:
            print(f'  SKIP (empty): [{page_id}] {label}')
            skipped += 1
            continue

        # Apply all fixes
        fixed = fix_content(body)

        # Prepend CSS vars + sharing hide
        content = PAGE_CSS + '\n' + fixed

        if len(content) < 200:
            print(f'  SKIP (too short {len(content)}c): [{page_id}] {label}')
            skipped += 1
            continue

        update_page(page_id, content)
        print(f'  OK  [{page_id}] {label} ({len(content)} chars)')
        ok += 1
        time.sleep(0.4)

    except Exception as e:
        print(f'  ERRO [{page_id}]: {e}')
        erros += 1

print(f'\nConcluido: {ok} OK | {skipped} pulados | {erros} erros')
print('\nPROXIMO PASSO:')
print('LiteSpeed Cache -> Purge All')
