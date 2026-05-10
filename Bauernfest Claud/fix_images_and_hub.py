"""
1. Corrige img src nos 10 artigos FAQ (SVG relativo → JPG absoluto WP)
2. Corrige hero image do hub FAQ (PNG relativo → PNG absoluto WP)
3. Adiciona miniatura de cada artigo nos cards do hub FAQ
"""
import urllib.request, base64, json, re, uuid

creds = base64.b64encode(b'ClaudeBot:p8Np bMs8 Xnsh MfH2 cZ7u w5xy').decode()
headers = {'Authorization': f'Basic {creds}', 'Content-Type': 'application/json'}

WP_BASE = 'https://bauernfest.org/wp-content/uploads/2026/04'

# Mapeamento: page_id -> (slug, media_url, alt_text)
ARTICLES = [
    (580, 'quando-e-a-bauernfest-petropolis',
     f'{WP_BASE}/quando-e-a-bauernfest-petropolis.jpg',
     'Quando é a Bauernfest Petropolis 2026 — Festival germanico de 19 de junho a 5 de julho no Palacio de Cristal'),
    (581, 'o-que-e-a-bauernfest',
     f'{WP_BASE}/o-que-e-a-bauernfest.jpg',
     'O que é a Bauernfest — Festa dos imigrantes alemaes em Petropolis Rio de Janeiro'),
    (582, 'quantos-dias-dura-a-bauernfest',
     f'{WP_BASE}/quantos-dias-dura-a-bauernfest.jpg',
     'Quantos dias dura a Bauernfest — 17 dias de festival germanico em Petropolis de 19 junho a 5 julho'),
    (583, 'quem-a-bauernfest-homenageia',
     f'{WP_BASE}/quem-a-bauernfest-homenageia.jpg',
     'Quem a Bauernfest homenageia — Imigrantes alemaes e a historia germanica de Petropolis desde 1845'),
    (584, 'o-que-fazer-na-bauernfest',
     f'{WP_BASE}/o-que-fazer-na-bauernfest.jpg',
     'O que fazer na Bauernfest Petropolis — Gastronomia alema dancas folcloricas shows ao vivo e artesanato'),
    (585, 'significado-de-bauernfest',
     f'{WP_BASE}/significado-de-bauernfest.jpg',
     'Significado de Bauernfest — Bauer lavrador mais Fest festa em alemao Festa dos Lavradores em Petropolis'),
    (586, 'como-funciona-a-bauernfest',
     f'{WP_BASE}/como-funciona-a-bauernfest.jpg',
     'Como funciona a Bauernfest Petropolis — Entrada gratuita zonas de gastronomia palco principal e Palacio de Cristal'),
    (587, 'bauernfest-2026',
     f'{WP_BASE}/bauernfest-2026.jpg',
     'Bauernfest 2026 Petropolis — Datas horarios e programacao completa do festival alemao no Palacio de Cristal'),
    (588, 'datas-da-bauernfest',
     f'{WP_BASE}/datas-da-bauernfest.jpg',
     'Datas da Bauernfest 2026 — 19 de junho a 5 de julho no Palacio de Cristal em Petropolis RJ'),
    (589, 'horario-bauernfest-petropolis',
     f'{WP_BASE}/horario-bauernfest-petropolis.jpg',
     'Horario da Bauernfest Petropolis 2026 — Sexta e sabado das 12h as 22h domingo e feriado das 11h as 21h'),
]

HUB_HERO_URL = 'https://bauernfest.org/wp-content/uploads/2026/04/bauernfest-faq-hero.png'

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

def push_page(page_id, html):
    el_data = make_elementor_data(html)
    payload = json.dumps({
        'meta': {
            '_elementor_edit_mode': 'builder',
            '_elementor_template_type': 'wp-page',
            '_elementor_data': el_data,
            '_elementor_page_settings': {'page_layout': 'elementor_canvas'},
        }
    }).encode()
    req = urllib.request.Request(
        f'https://bauernfest.org/wp-json/wp/v2/pages/{page_id}',
        data=payload, headers=headers, method='POST'
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())['id']

def get_page_html(page_id):
    req = urllib.request.Request(
        f'https://bauernfest.org/wp-json/wp/v2/pages/{page_id}?context=edit',
        headers={'Authorization': f'Basic {creds}'}
    )
    with urllib.request.urlopen(req, timeout=15) as r:
        pg = json.loads(r.read())
    el = json.loads(pg['meta']['_elementor_data'])
    return el[0]['elements'][0]['elements'][0]['settings']['html']

# ─── 1. Fix img src in each article ────────────────────────────────────────
print('=== Corrigindo imagens nos artigos ===')
for pid, slug, img_url, alt in ARTICLES:
    html = get_page_html(pid)
    # Replace relative SVG src with absolute JPG URL
    # Pattern: src="slug.svg" or src="slug.jpg" (relative)
    old_svg = f'{slug}.svg'
    old_jpg = f'{slug}.jpg'
    updated = html
    for old_src in [old_svg, old_jpg, old_svg.replace('-', '_'), old_jpg.replace('-', '_')]:
        if old_src in updated:
            updated = updated.replace(f'src="{old_src}"', f'src="{img_url}"')
            updated = updated.replace(f"src='{old_src}'", f'src="{img_url}"')
    # Also fix alt if empty or has wrong text
    if img_url in updated:
        # Fix width/height to match JPG dimensions
        updated = re.sub(
            r'(<img[^>]+src="' + re.escape(img_url) + r'"[^>]*)width="\d+"([^>]*)height="\d+"',
            r'\g<1>width="1200"\g<2>height="480"',
            updated
        )
        push_page(pid, updated)
        print(f'  OK [{pid}] {slug}: src -> {img_url}')
    else:
        print(f'  WARN [{pid}] {slug}: src not found/replaced in HTML')

# ─── 2. Fix hub hero + add thumbnails to cards ──────────────────────────────
print('\n=== Corrigindo hub FAQ (hero + miniaturas dos cards) ===')
hub_html = get_page_html(579)

# Fix hero image
hub_html = hub_html.replace('src="Bauernfest 2026.png"', f'src="{HUB_HERO_URL}"')
hub_html = hub_html.replace("src='Bauernfest 2026.png'", f'src="{HUB_HERO_URL}"')

# Build slug->url map for thumbnails
slug_to_url = {slug: img_url for _, slug, img_url, _ in ARTICLES}
slug_to_alt = {slug: alt for _, slug, img_url, alt in ARTICLES}
slug_to_link = {
    'quando-e-a-bauernfest-petropolis': 'https://bauernfest.org/faq/quando-e-a-bauernfest-petropolis/',
    'o-que-e-a-bauernfest': 'https://bauernfest.org/faq/o-que-e-a-bauernfest/',
    'quantos-dias-dura-a-bauernfest': 'https://bauernfest.org/faq/quantos-dias-dura-a-bauernfest/',
    'quem-a-bauernfest-homenageia': 'https://bauernfest.org/faq/quem-a-bauernfest-homenageia/',
    'o-que-fazer-na-bauernfest': 'https://bauernfest.org/faq/o-que-fazer-na-bauernfest/',
    'significado-de-bauernfest': 'https://bauernfest.org/faq/significado-de-bauernfest/',
    'como-funciona-a-bauernfest': 'https://bauernfest.org/faq/como-funciona-a-bauernfest/',
    'bauernfest-2026': 'https://bauernfest.org/faq/bauernfest-2026/',
    'datas-da-bauernfest': 'https://bauernfest.org/faq/datas-da-bauernfest/',
    'horario-bauernfest-petropolis': 'https://bauernfest.org/faq/horario-bauernfest-petropolis/',
}

# Add thumbnail inside each faq-card
# Pattern: <div class="faq-card"> ... <h3>...</h3>
def add_thumb_to_card(m):
    card_html = m.group(0)
    # Find the link href to determine which article this is
    link_match = re.search(r'href="(https://bauernfest\.org/faq/([^/"]+)/)"', card_html)
    if not link_match:
        return card_html
    slug = link_match.group(2)
    if slug not in slug_to_url:
        return card_html
    img_url = slug_to_url[slug]
    alt = slug_to_alt[slug]
    # If card already has an img, skip
    if '<img' in card_html:
        return card_html
    # Insert thumbnail after opening div, before span/h3
    thumb_html = f'<a href="{slug_to_link[slug]}" class="faq-card-thumb"><img src="{img_url}" alt="{alt}" width="400" height="160" loading="lazy"/></a>\n        '
    card_html = card_html.replace('<span class="faq-card-num">', thumb_html + '<span class="faq-card-num">', 1)
    return card_html

hub_html = re.sub(
    r'<div class="faq-card">.*?</div>',
    add_thumb_to_card,
    hub_html,
    flags=re.DOTALL
)

push_page(579, hub_html)
print('  OK [579] hub: hero + miniaturas adicionadas')

print('\nConcluido.')
