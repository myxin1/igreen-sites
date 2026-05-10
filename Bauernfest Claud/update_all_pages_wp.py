"""
Republica todas as páginas locais no WordPress com Elementor HTML widget.
Garante que o nav/footer com FAQ esteja em todas as páginas.
"""
import urllib.request, base64, json, os, uuid

creds = base64.b64encode(b'ClaudeBot:p8Np bMs8 Xnsh MfH2 cZ7u w5xy').decode()
headers = {'Authorization': f'Basic {creds}', 'Content-Type': 'application/json'}

BASE = 'site-bauernfest'

# Mapeamento: arquivo local → ID WordPress
# Formato: (caminho_relativo_ao_BASE, page_id)
PAGE_MAP = [
    # Home
    ('index.html',                                                    56),
    # Anuncie / Contato / Legal
    ('anuncie/index.html',                                           365),
    ('contato/index.html',                                           371),
    # Gastronomia
    ('gastronomia/index.html',                                        69),
    ('gastronomia/chopp-artesanal-petropolis/index.html',             77),
    ('gastronomia/eisbein-bauernfest/index.html',                    216),
    ('gastronomia/pratos-tipicos-bauernfest/index.html',              73),
    ('gastronomia/strudel-receita-alema/index.html',                  79),
    # Programacao
    ('programacao/index.html',                                        91),
    ('programacao/bauernfest-2026-datas/index.html',                  89),
    ('programacao/concursos-jogos-germanicos/index.html',             97),
    ('programacao/shows-musica-ao-vivo-bauernfest/index.html',        95),
    ('programacao/vale-germanico-bauernfest/index.html',              93),
    # Sobre
    ('sobre/index.html',                                              64),
    ('sobre/dancas-folcloricas-alemas-petropolis/index.html',        103),
    ('sobre/historia-bauernfest-petropolis/index.html',               99),
    ('sobre/imigracao-alema-petropolis/index.html',                  105),
    ('sobre/palacio-de-cristal-petropolis/index.html',               101),
    # Turismo
    ('turismo/index.html',                                            71),
    ('turismo/como-chegar-bauernfest-rio-de-janeiro/index.html',      81),
    ('turismo/hoteis-perto-bauernfest-petropolis/index.html',         83),
    ('turismo/o-que-fazer-petropolis/index.html',                     85),
    ('turismo/petropolis-fim-de-semana/index.html',                   87),
    # FAQ hub + artigos
    ('FAQ/index.html',                                               579),
    ('FAQ/quando-e-a-bauernfest-petropolis/index.html',              580),
    ('FAQ/o-que-e-a-bauernfest/index.html',                          581),
    ('FAQ/quantos-dias-dura-a-bauernfest/index.html',                582),
    ('FAQ/quem-a-bauernfest-homenageia/index.html',                  583),
    ('FAQ/o-que-fazer-na-bauernfest/index.html',                     584),
    ('FAQ/significado-de-bauernfest/index.html',                     585),
    ('FAQ/como-funciona-a-bauernfest/index.html',                    586),
    ('FAQ/bauernfest-2026/index.html',                               587),
    ('FAQ/datas-da-bauernfest/index.html',                           588),
    ('FAQ/horario-bauernfest-petropolis/index.html',                 589),
]

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

def update_page(page_id, html_content):
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
        return json.loads(r.read())['id']

ok, skip, err = 0, 0, 0
for rel_path, page_id in PAGE_MAP:
    full_path = os.path.join(BASE, rel_path)
    if not os.path.exists(full_path):
        print(f'  SKIP (not found): {rel_path}')
        skip += 1
        continue
    with open(full_path, encoding='utf-8') as f:
        html = f.read()
    # Verify FAQ is in nav
    if '/faq/' not in html:
        print(f'  WARN: /faq/ not in nav of {rel_path}')
    try:
        update_page(page_id, html)
        print(f'  OK  [{page_id}] {rel_path}')
        ok += 1
    except urllib.error.HTTPError as e:
        print(f'  ERRO [{page_id}] {rel_path}: {e.code} — {e.read().decode()[:80]}')
        err += 1
    except Exception as e:
        print(f'  ERRO [{page_id}] {rel_path}: {e}')
        err += 1

print(f'\nOK: {ok}  SKIP: {skip}  ERRO: {err}')
