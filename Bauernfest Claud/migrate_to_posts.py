#!/usr/bin/env python3
"""
migrate_to_posts.py
Migra bauernfest.org: apaga Pages, cria categorias SILO, sobe Posts limpos.
"""
import re, json, time, base64, urllib.request, urllib.error, urllib.parse, sys
from pathlib import Path

AUTH = "Basic " + base64.b64encode(b"ClaudeBot:p8Np bMs8 Xnsh MfH2 cZ7u w5xy").decode()
WP   = "https://bauernfest.org/wp-json/wp/v2"
ART  = Path("artigos")
SITE = Path("site-bauernfest")

GFONTS = (
    '<link rel="preconnect" href="https://fonts.googleapis.com">'
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
    '<link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,600;0,9..40,700;1,9..40,400&family=Playfair+Display:ital,wght@0,700;0,900;1,700;1,900&family=Lora:ital@0;1&display=swap" rel="stylesheet">'
)

def load_assets():
    css_main  = (SITE / "assets" / "bf-main.css").read_text(encoding="utf-8")
    css_nav   = (SITE / "Rodape" / "nav-breadcrumb.css").read_text(encoding="utf-8")
    nav_html  = (SITE / "Rodape" / "nav.html").read_text(encoding="utf-8")
    foot_html = (SITE / "Rodape" / "footer.html").read_text(encoding="utf-8")
    return css_main, css_nav, nav_html, foot_html

# ── Pages a MANTER (não deletar) ─────────────────────────────────────────────
KEEP_PAGES = {365, 371, 1582}   # anuncie, contato, homepage
KEEP_PAGE_SLUGS = {
    "homepage",
    "contato",
    "anuncie",
    "sobre",
    "programacao",
    "gastronomia",
    "turismo",
    "receitas-alemas",
    "faq",
    "politica-de-privacidade",
    "termos-de-uso",
}

# ── Mapa de URLs antigas → novas (para reescrever links internos) ─────────────
OLD_TO_NEW = {
    "/sobre/historia-bauernfest-petropolis/":        "/historia/",
    "/sobre/palacio-de-cristal-petropolis/":         "/palacio/",
    "/sobre/dancas-folcloricas-alemas-petropolis/":  "/dancas/",
    "/sobre/imigracao-alema-petropolis/":            "/imigracao/",
    "/programacao/bauernfest-2026-datas/":           "/datas/",
    "/programacao/vale-germanico-bauernfest/":       "/vale/",
    "/programacao/shows-musica-ao-vivo-bauernfest/": "/shows/",
    "/programacao/concursos-jogos-germanicos/":      "/concursos/",
    "/gastronomia/pratos-tipicos-bauernfest/":       "/pratos-tipicos/",
    "/gastronomia/chopp-artesanal-petropolis/":      "/chopp/",
    "/gastronomia/strudel-receita-alema/":           "/strudel/",
    "/gastronomia/eisbein-bauernfest/":              "/eisbein/",
    "/turismo/como-chegar-bauernfest-rio-de-janeiro/": "/como-chegar/",
    "/turismo/hoteis-perto-bauernfest-petropolis/":  "/hoteis/",
    "/turismo/o-que-fazer-petropolis/":              "/o-que-fazer/",
    "/turismo/petropolis-fim-de-semana/":            "/fim-de-semana/",
    "/receitas-alemas/pretzel-receita/":             "/pretzel/",
    "/receitas-alemas/sauerkraut-receita/":          "/sauerkraut/",
    "/receitas-alemas/bratwurst-receita/":           "/bratwurst/",
    "/receitas-alemas/selva-negra-receita/":         "/selva-negra/",
    "/receitas-alemas/kassler-receita/":             "/kassler/",
    "/faq/quando-e-a-bauernfest-petropolis/":        "/quando/",
    "/faq/o-que-e-a-bauernfest/":                   "/o-que-e/",
    "/faq/quantos-dias-dura-a-bauernfest/":          "/quantos-dias/",
    "/faq/quem-a-bauernfest-homenageia/":            "/quem/",
    "/faq/o-que-fazer-na-bauernfest/":               "/o-que-fazer-bauernfest/",
    "/faq/significado-de-bauernfest/":               "/faq/significado/",
    "/faq/como-funciona-a-bauernfest/":              "/como-funciona/",
    "/faq/bauernfest-2026/":                         "/2026/",
    "/faq/datas-da-bauernfest/":                     "/datas-bauernfest/",
    "/faq/horario-bauernfest-petropolis/":           "/horario/",
}

# ── Estrutura SILO ────────────────────────────────────────────────────────────
SILOS = [
    ("sobre", "Sobre a Bauernfest", [
        ("sobre-historia",  "historia",     "História da Bauernfest"),
        ("sobre-palacio",   "palacio",      "Palácio de Cristal"),
        ("sobre-dancas",    "dancas",       "Danças Folclóricas Alemãs"),
        ("sobre-imigracao", "imigracao",    "Imigração Alemã em Petrópolis"),
    ]),
    ("programacao", "Programação Bauernfest", [
        ("programacao-datas",     "datas",      "Bauernfest 2026: Datas"),
        ("programacao-vale",      "vale",       "Vale Germânico"),
        ("programacao-shows",     "shows",      "Shows e Música ao Vivo"),
        ("programacao-concursos", "concursos",  "Concursos e Jogos Germânicos"),
    ]),
    ("gastronomia", "Gastronomia Alemã", [
        ("gastronomia-pratos",   "pratos-tipicos", "Pratos Típicos da Bauernfest"),
        ("gastronomia-chopp",    "chopp",          "Chopp Artesanal em Petrópolis"),
        ("gastronomia-strudel",  "strudel",        "Strudel de Maçã"),
        ("gastronomia-eisbein",  "eisbein",        "Eisbein na Bauernfest"),
    ]),
    ("turismo", "Turismo em Petrópolis", [
        ("turismo-como-chegar",   "como-chegar",   "Como Chegar à Bauernfest"),
        ("turismo-hoteis",        "hoteis",        "Hotéis perto da Bauernfest"),
        ("turismo-o-que-fazer",   "o-que-fazer",   "O que fazer em Petrópolis"),
        ("turismo-fim-de-semana", "fim-de-semana", "Petrópolis no Fim de Semana"),
    ]),
    ("receitas-alemas", "Receitas Alemãs", [
        ("receitas-pretzel",     "pretzel",     "Pretzel Alemão"),
        ("receitas-sauerkraut",  "sauerkraut",  "Sauerkraut Tradicional"),
        ("receitas-bratwurst",   "bratwurst",   "Bratwurst Caseiro"),
        ("receitas-selva-negra", "selva-negra", "Bolo Selva Negra"),
        ("receitas-kassler",     "kassler",     "Kassler Defumado"),
    ]),
    ("faq", "FAQ – Bauernfest", [
        ("faq-quando",        "quando",                 "Quando é a Bauernfest?"),
        ("faq-o-que-e",       "o-que-e",               "O que é a Bauernfest?"),
        ("faq-quantos-dias",  "quantos-dias",           "Quantos dias dura a Bauernfest?"),
        ("faq-quem",          "quem",                   "Quem a Bauernfest homenageia?"),
        ("faq-o-que-fazer",   "o-que-fazer-bauernfest", "O que fazer na Bauernfest?"),
        ("faq-significado",   "significado",            "Significado de Bauernfest"),
        ("faq-como-funciona", "como-funciona",          "Como funciona a Bauernfest?"),
        ("faq-2026",          "2026",                   "Bauernfest 2026"),
        ("faq-datas",         "datas-bauernfest",       "Datas da Bauernfest"),
        ("faq-horario",       "horario",                "Horário da Bauernfest"),
    ]),
]

DELETE_PAGE_SLUGS = {
    path.strip("/").split("/")[-1]
    for path in OLD_TO_NEW
}

HUB_PAGE_META = {
    "sobre": {
        "title": "Sobre a Bauernfest",
        "badge": "A Festa · Petrópolis, RJ",
        "hero": "Sobre a Bauernfest<em>história, tradição e memória</em>",
        "sub": "Conheça a origem da festa, os personagens centrais da tradição alemã em Petrópolis e os lugares que dão identidade ao evento.",
        "section_label": "Explore a seção",
        "section_title": "Artigos para entender a essência da festa",
        "section_text": "Comece pelos guias abaixo para conhecer a história, a imigração e os símbolos culturais que fazem a Bauernfest ser única.",
        "cta_title": "Quer começar pela base da história?",
        "cta_text": "Abra o guia principal e siga a leitura para montar uma visão completa sobre a festa e sua herança cultural.",
        "cta_href": "/historia/",
        "cta_label": "Ler história da Bauernfest",
        "tag": "Sobre",
    },
    "programacao": {
        "title": "Programação Bauernfest",
        "badge": "Agenda 2026 · 17 dias de festa",
        "hero": "Programação Bauernfest<em>datas, shows e atrações</em>",
        "sub": "Veja o que acontece ao longo da edição 2026 e use os guias abaixo para montar o melhor dia de visita conforme o seu perfil.",
        "section_label": "Monte o roteiro",
        "section_title": "Guias para planejar a experiência",
        "section_text": "Use estes conteúdos para escolher datas, atrações, horários e novidades da edição atual antes de sair para Petrópolis.",
        "cta_title": "Quer ir direto ao planejamento?",
        "cta_text": "Comece pelo calendário da edição 2026 e depois aprofunde nas atrações que mais combinam com a sua visita.",
        "cta_href": "/datas/",
        "cta_label": "Ver datas da edição 2026",
        "tag": "Programação",
    },
    "gastronomia": {
        "title": "Gastronomia Alemã",
        "badge": "Sabores da festa · tradição germânica",
        "hero": "Gastronomia Alemã<em>os sabores mais marcantes da festa</em>",
        "sub": "Descubra os pratos e bebidas que definem a experiência gastronômica da Bauernfest e escolha o que vale provar primeiro.",
        "section_label": "Prove o melhor",
        "section_title": "Guias para montar o roteiro gastronômico",
        "section_text": "Os artigos abaixo ajudam a entender os pratos clássicos, os destaques da festa e o que cada sabor representa.",
        "cta_title": "Quer começar pelo prato mais buscado?",
        "cta_text": "Veja primeiro o guia dos pratos típicos e depois escolha as leituras complementares para fechar o seu roteiro de sabores.",
        "cta_href": "/pratos-tipicos/",
        "cta_label": "Ver pratos típicos",
        "tag": "Gastronomia",
    },
    "turismo": {
        "title": "Turismo em Petrópolis",
        "badge": "Viagem e logística · Serra Fluminense",
        "hero": "Turismo em Petrópolis<em>como chegar, onde ficar e o que fazer</em>",
        "sub": "Organize transporte, hospedagem e passeios para aproveitar a Bauernfest com menos improviso e mais conforto.",
        "section_label": "Planeje a viagem",
        "section_title": "Guias para aproveitar melhor a cidade",
        "section_text": "Use estes artigos para montar um roteiro completo, desde a chegada até os passeios e a escolha da hospedagem.",
        "cta_title": "Quer começar pelo essencial?",
        "cta_text": "Abra primeiro o guia de acesso ao evento e siga para hospedagem e passeios conforme o tipo de viagem que você quer fazer.",
        "cta_href": "/como-chegar/",
        "cta_label": "Ver como chegar",
        "tag": "Turismo",
    },
    "receitas-alemas": {
        "title": "Receitas Alemãs",
        "badge": "Cozinha alemã · faça em casa",
        "hero": "Receitas Alemãs<em>sabores da festa na sua cozinha</em>",
        "sub": "Leve o clima da Bauernfest para casa com receitas clássicas, combinações tradicionais e preparos que fazem parte do imaginário alemão.",
        "section_label": "Na cozinha",
        "section_title": "Receitas para continuar a experiência",
        "section_text": "Os guias abaixo mostram receitas populares, ingredientes marcantes e ideias para montar um cardápio inspirado na festa.",
        "cta_title": "Quer começar por uma receita clássica?",
        "cta_text": "O pretzel é uma ótima porta de entrada para entrar no clima da culinária alemã antes de explorar os outros pratos.",
        "cta_href": "/pretzel/",
        "cta_label": "Ver receita de pretzel",
        "tag": "Receitas",
    },
    "faq": {
        "title": "FAQ Bauernfest",
        "badge": "Dúvidas rápidas · respostas diretas",
        "hero": "FAQ Bauernfest<em>respostas para as perguntas mais buscadas</em>",
        "sub": "Encontre respostas objetivas sobre datas, funcionamento, horários, duração da festa e o que esperar da edição 2026.",
        "section_label": "Tire dúvidas",
        "section_title": "Perguntas principais para começar",
        "section_text": "Se você está planejando a visita ou tentando entender melhor a festa, estes artigos resolvem as dúvidas mais comuns.",
        "cta_title": "Quer resolver a principal dúvida primeiro?",
        "cta_text": "Comece pelo guia que explica o que é a Bauernfest e continue pelos artigos de datas, horário e funcionamento.",
        "cta_href": "/o-que-e/",
        "cta_label": "Ver o que é a Bauernfest",
        "tag": "FAQ",
    },
}

HUB_CARD_FALLBACKS = {
    "sobre": "https://bauernfest.org/wp-content/uploads/2026/03/Bauernest-2026.jpg",
    "programacao": "https://bauernfest.org/wp-content/uploads/2026/03/Quando-acontece-a-bauernfest-em-2026.jpg",
    "gastronomia": "https://bauernfest.org/wp-content/uploads/2026/03/A-gastronomia-alema-na-Bauernfest.webp",
    "turismo": "https://bauernfest.org/wp-content/uploads/2026/03/Turismo-em-Petropolis.jpeg",
    "receitas-alemas": "https://bauernfest.org/wp-content/uploads/2026/03/Pratos-tipicos-alemaes.jpg",
    "faq": "https://bauernfest.org/wp-content/uploads/2026/03/Quando-acontece-a-bauernfest-em-2026.jpg",
}

POST_IMAGE_OVERRIDES = {
    "pretzel": "https://bauernfest.org/wp-content/uploads/2026/03/Pratos-tipicos-alemaes.jpg",
    "sauerkraut": "https://bauernfest.org/wp-content/uploads/2026/03/Pratos-tipicos-alemaes.jpg",
    "bratwurst": "https://bauernfest.org/wp-content/uploads/2026/03/Pratos-tipicos-alemaes.jpg",
    "selva-negra": "https://bauernfest.org/wp-content/uploads/2026/03/Receita-do-strudel-de-maca.jpg",
    "kassler": "https://bauernfest.org/wp-content/uploads/2026/03/Eisbein-na-Bauernfest.jpg",
    "2026": "https://bauernfest.org/wp-content/uploads/2026/04/bauernfest-2026.jpg",
}

MAP_CONFIG = {
    "palacio": {
        "heading": "Mapa do Palácio de Cristal",
        "query": "Palácio de Cristal, Petrópolis, RJ",
        "note": "Use o mapa para ver a localização do principal cenário da festa no centro histórico de Petrópolis.",
    },
    "vale": {
        "heading": "Mapa da área da festa",
        "query": "Palácio de Cristal, Petrópolis, RJ",
        "note": "O Vale Germânico fica no entorno do Palácio de Cristal, então este mapa ajuda a visualizar a área principal do evento.",
    },
    "como-chegar": {
        "heading": "Mapa para chegar ao evento",
        "query": "Palácio de Cristal, Petrópolis, RJ",
        "note": "Abra a rota para o Palácio de Cristal e ajuste o trajeto a partir da sua cidade.",
    },
    "hoteis": {
        "heading": "Mapa da região mais prática para se hospedar",
        "query": "Palácio de Cristal, Petrópolis, RJ",
        "note": "A região central ao redor do Palácio de Cristal costuma ser a mais conveniente para quem quer fazer tudo a pé.",
    },
    "o-que-fazer": {
        "heading": "Mapa do centro histórico",
        "query": "Centro Histórico de Petrópolis, RJ",
        "note": "Este mapa ajuda a montar um roteiro com os principais pontos turísticos da região central.",
    },
    "fim-de-semana": {
        "heading": "Mapa para montar o roteiro do fim de semana",
        "query": "Centro Histórico de Petrópolis, RJ",
        "note": "Use este ponto de partida para organizar hospedagem, passeios e deslocamentos pela região central.",
    },
    "2026": {
        "heading": "Mapa da edição 2026",
        "query": "Palácio de Cristal, Petrópolis, RJ",
        "note": "A edição 2026 acontece no entorno do Palácio de Cristal, no centro de Petrópolis.",
    },
}

# ── API helpers ───────────────────────────────────────────────────────────────
def api(method, path, data=None):
    url = f"{WP}/{path}"
    body = json.dumps(data).encode("utf-8") if data else None
    req  = urllib.request.Request(url, data=body, method=method, headers={
        "Authorization": AUTH,
        "Content-Type": "application/json; charset=utf-8",
    })
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return True, json.loads(r.read())
    except urllib.error.HTTPError as e:
        return False, {"error": e.read().decode("utf-8", errors="ignore")[:300], "code": e.code}
    except Exception as e:
        return False, {"error": str(e)}

def find_existing_post(post_slug, post_title):
    ok, existing = api("GET", f"posts?slug={post_slug}&per_page=1")
    if ok and existing:
        return existing[0]
    if post_slug.isdigit():
        ok2, matches = api("GET", f"posts?search={urllib.parse.quote(post_title)}&per_page=20")
        if ok2:
            for post in matches:
                title = ((post.get("title") or {}).get("rendered") or "").strip()
                if re.sub(r"<[^>]+>", "", title) == post_title:
                    return post
    return None

def find_existing_page(page_slug):
    ok, existing = api("GET", f"pages?slug={page_slug}&per_page=1&status=publish")
    if ok and existing:
        return existing[0]
    return None

MEDIA_SEARCH_TERMS = {
    "quando": "quando-e-a-bauernfest-petropolis",
    "o-que-e": "o-que-e-a-bauernfest",
    "quantos-dias": "quantos-dias-dura-a-bauernfest",
    "quem": "quem-a-bauernfest-homenageia",
    "o-que-fazer-bauernfest": "o-que-fazer-na-bauernfest",
    "significado": "significado-de-bauernfest",
    "como-funciona": "como-funciona-a-bauernfest",
    "2026": "bauernfest-2026",
    "datas-bauernfest": "datas-da-bauernfest",
    "horario": "horario-bauernfest-petropolis",
    "pretzel": "pretzel",
    "sauerkraut": "sauerkraut",
    "bratwurst": "bratwurst",
    "selva-negra": "selva-negra",
    "kassler": "kassler",
}
MEDIA_CACHE = {}

def lookup_media_image(search_term):
    search_term = (search_term or "").strip()
    if not search_term:
        return ""
    if search_term in MEDIA_CACHE:
        return MEDIA_CACHE[search_term]
    ok, items = api("GET", f"media?search={urllib.parse.quote(search_term)}&per_page=10&_fields=source_url,slug,media_type,mime_type")
    if not ok or not items:
        MEDIA_CACHE[search_term] = ""
        return ""
    preferred = []
    fallback = []
    for item in items:
        url = (item.get("source_url") or "").strip()
        mime = (item.get("mime_type") or "").lower()
        if not url:
            continue
        if any(ext in mime for ext in ("jpeg", "jpg", "png", "webp")):
            preferred.append(url)
        else:
            fallback.append(url)
    picked = preferred[0] if preferred else (fallback[0] if fallback else "")
    MEDIA_CACHE[search_term] = picked
    return picked

def log(msg):
    import sys
    sys.stdout.buffer.write((msg + "\n").encode("utf-8", "replace"))
    sys.stdout.buffer.flush()

# ── 1. Permalink ──────────────────────────────────────────────────────────────
def step_permalink():
    log("\n=== 1. Permalink ===")
    ok, res = api("POST", "../settings",
                  {"permalink_structure": "/%postname%/"})
    if ok and res.get("permalink_structure"):
        log(f"  OK  permalink = {res['permalink_structure']}")
    else:
        log(f"  AVISO: nao foi possivel alterar via API.")
        log(f"  ACAO MANUAL: WP Admin > Configuracoes > Links Permanentes")
        log(f"  Selecione 'Nome do post' ou Personalizado: /%postname%/")
        log(f"  Depois salve e continue.")
    # Mantém a homepage publicada como página inicial
    api("POST", "../settings", {"show_on_front": "page", "page_on_front": 1582})

# ── 2. Deletar pages ──────────────────────────────────────────────────────────
def step_delete_pages():
    log("\n=== 2. Deletando Pages ===")
    ok, pages = api("GET", "pages?per_page=100&status=publish")
    if not ok:
        log("  ERRO ao listar pages"); return
    deleted = skipped = 0
    for p in pages:
        pid = p["id"]
        slug = p["slug"]
        if pid in KEEP_PAGES or slug in KEEP_PAGE_SLUGS:
            log(f"  KEEP  ID={pid}  {p['slug']}"); skipped += 1; continue
        if slug not in DELETE_PAGE_SLUGS:
            log(f"  KEEP  ID={pid}  {p['slug']}"); skipped += 1; continue
        ok2, _ = api("DELETE", f"pages/{pid}?force=true")
        if ok2:
            log(f"  DEL   ID={pid}  {p['slug']}"); deleted += 1
        else:
            log(f"  ERRO  ID={pid}  {p['slug']}")
        time.sleep(0.2)
    log(f"  Deletadas: {deleted}  |  Mantidas: {skipped}")

# ── 3. Criar categorias ───────────────────────────────────────────────────────
def step_create_categories():
    log("\n=== 3. Criando Categorias SILO ===")
    cat_ids = {}
    for silo_slug, silo_name, _ in SILOS:
        ok, existing = api("GET", f"categories?slug={silo_slug}&per_page=1")
        if ok and existing:
            cid = existing[0]["id"]
            log(f"  EXISTS  /{silo_slug}/  ID={cid}")
        else:
            ok2, res = api("POST", "categories", {"name": silo_name, "slug": silo_slug})
            if ok2:
                cid = res["id"]
                log(f"  CREATE  /{silo_slug}/  ID={cid}")
            else:
                log(f"  ERRO    /{silo_slug}/  {res}")
                cid = None
        cat_ids[silo_slug] = cid
        time.sleep(0.2)
    return cat_ids

# ── 4. Preparar conteúdo ──────────────────────────────────────────────────────
def fix_links(content):
    """Reescreve URLs antigas para novas dentro do conteúdo."""
    for old, new in OLD_TO_NEW.items():
        content = content.replace(f'href="https://bauernfest.org{old}"', f'href="{new}"')
        content = content.replace(f"href='https://bauernfest.org{old}'", f"href='{new}'")
        content = content.replace(f'href="{old}"', f'href="{new}"')
    return content

def build_breadcrumb_html(silo_name, post_title):
    return (
        '<div class="bf-breadcrumb">'
        '<nav class="bfc" aria-label="Breadcrumb">'
        '<a href="/">Bauernfest</a>'
        '<span>›</span>'
        f'<span>{silo_name}</span>'
        '<span>›</span>'
        f'<span>{post_title}</span>'
        '</nav>'
        '</div>'
    )

def build_breadcrumb_block(silo_name, post_title):
    return wrap_html_block(build_breadcrumb_html(silo_name, post_title))

def build_article_meta_block():
    html = (
        '<div class="bf-article-meta">'
        '<span>Por <strong>Equipe Bauernfest</strong></span>'
        '<span class="bf-meta-sep">●</span>'
        '<span><time datetime="2026-05-01">Maio 2026</time></span>'
        '</div>'
    )
    return wrap_html_block(html)

def build_post_style_block():
    css = (
        "<style>"
        # Layout do artigo
        ".bfp-wrap{max-width:960px;margin:0 auto;padding:2rem 1.25rem 3rem}"
        ".bfp-grid{display:grid;gap:2.5rem;align-items:start}"
        "@media(min-width:900px){.bfp-grid{grid-template-columns:1fr 260px}}"
        ".bfp-main{min-width:0}"
        "@media(min-width:900px){.bfp-side{position:sticky;top:5.5rem}}"
        # Sidebar card
        ".bfp-sb{background:#fff;border:1px solid #ede3d4;border-radius:10px;padding:1.25rem;font-family:'DM Sans',sans-serif}"
        ".bfp-sb .bfp-sb-label{display:block;font-size:.72rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#8b1a1a;margin-bottom:.9rem}"
        ".bfp-sb ul{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:.45rem}"
        ".bfp-sb ul li a{font-size:.87rem;color:#2c1a0e;text-decoration:none;display:flex;align-items:center;gap:.4rem;padding:.2rem 0;border-bottom:1px solid #f5ede0;transition:color .15s}"
        ".bfp-sb ul li:last-child a{border-bottom:none}"
        ".bfp-sb ul li a::before{content:'›';color:#c8922a;font-weight:700}"
        ".bfp-sb ul li a:hover{color:#8b1a1a}"
        # Breadcrumb
        ".bf-breadcrumb{background:#f8f1e6;border-bottom:1px solid rgba(0,0,0,.06);padding:.55rem 0}"
        ".bf-breadcrumb nav{font-family:'DM Sans',sans-serif;font-size:.77rem;color:#7a6048;display:flex;flex-wrap:wrap;gap:.3rem;align-items:center;max-width:960px;margin:0 auto;padding:0 1.25rem}"
        ".bf-breadcrumb a{color:#c8922a;text-decoration:none}.bf-breadcrumb a:hover{color:#8b1a1a}"
        ".bf-breadcrumb span{opacity:.55}"
        # Meta autor/data
        ".bf-article-meta{display:flex;align-items:center;flex-wrap:wrap;gap:.45rem .75rem;font-family:'DM Sans',sans-serif;font-size:.78rem;color:#7a6048;padding:.8rem 0 1.3rem;border-bottom:1px solid #ede3d4;margin-bottom:1.5rem}"
        ".bf-article-meta strong{color:#2c1a0e;font-weight:600}"
        ".bf-meta-sep{color:#c8922a;opacity:.5;font-size:.7rem}"
        # Imagem — mais espaço após o título
        ".bfp-main .wp-block-image,.bfp-main figure.wp-block-image{margin:2.2rem 0 1.8rem!important}"
        ".bfp-main .wp-block-image img{border-radius:8px;width:100%;display:block}"
        # Post nav
        ".bfp-postnav{display:flex;gap:1rem;border-top:2px solid #f0e8d8;padding-top:1.75rem;margin-top:2rem}"
        ".bfp-postnav a{flex:1;display:flex;flex-direction:column;gap:.25rem;padding:.75rem 1rem;border:1px solid #ede3d4;border-radius:8px;text-decoration:none;transition:border-color .2s}"
        ".bfp-postnav a:hover{border-color:#c8922a}"
        ".postnav-eyebrow{font-family:'DM Sans',sans-serif;font-size:.68rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#c8922a}"
        ".postnav-title{font-family:'DM Sans',sans-serif;font-size:.88rem;font-weight:600;color:#130803}"
        # Fix borda nav GeneratePress/bf-header
        ".bfnl{border:none!important;box-shadow:none!important;background:transparent!important}"
        ".bf-header-shell .bfnl{border:none!important}"
        ".site-header{border-bottom:none!important}"
        "#masthead{border-bottom:none!important;box-shadow:none!important}"
        "</style>"
    )
    return wrap_html_block(css)

def build_sidebar_html(silo_slug, silo_name, silo_posts, current_slug):
    items = [f'<li><a href="/{silo_slug}/"><strong>Página principal:</strong> {silo_name}</a></li>']
    for _, post_slug, post_title in silo_posts:
        if post_slug == current_slug:
            continue
        items.append(f'<li><a href="/{post_slug}/">{post_title}</a></li>')
    lis = ''.join(items)
    return (
        f'<div class="wp-block-group sidebar-box">'
        f'<h4 class="wp-block-heading">Nesta seção: {silo_name}</h4>'
        f'<ul class="wp-block-list sidebar-links">{lis}</ul>'
        f'</div>'
    )

def build_faq_related_html(silo_posts, current_slug):
    lis = ''
    for article_slug, post_slug, post_title in silo_posts:
        if post_slug == current_slug:
            continue
        answer = get_first_paragraph(article_slug)
        label = f'<a href="/{post_slug}/"><strong>{post_title}</strong></a>'
        content = f'{label}<br>{answer}' if answer else label
        lis += f'<li>{content}</li>'
    if not lis:
        return ''
    return (
        f'<div class="wp-block-group sidebar-box">'
        f'<h2 class="wp-block-heading">Mais perguntas sobre a Bauernfest</h2>'
        f'<ul class="wp-block-list">{lis}</ul>'
        f'</div>'
    )

def build_opening_html_block(assets, silo_name, post_title):
    css_main, css_nav, nav_html, _ = assets
    style = f'<style>{minify_css(css_main)}\n{minify_css(css_nav)}</style>'
    breadcrumb = build_breadcrumb_html(silo_name, post_title)
    html = (
        f'{GFONTS}\n'
        f'{style}\n'
        f'{nav_html}\n'
        f'{breadcrumb}\n'
        '<div class="wp-block-group article-wrap">'
        '<div class="wp-block-group article-grid">'
        '<article class="wp-block-group article-main">'
    )
    return wrap_html_block(html)

def build_closing_html_block(assets, silo_slug, silo_name, silo_posts, current_slug):
    _, _, _, foot_html = assets
    sidebar = build_sidebar_html(silo_slug, silo_name, silo_posts, current_slug)
    faq_rel = build_faq_related_html(silo_posts, current_slug) if silo_slug == 'faq' else ''
    aside_inner = sidebar + ('\n' + faq_rel if faq_rel else '')
    html = (
        f'</article>'
        f'<aside class="wp-block-group article-sidebar">{aside_inner}</aside>'
        f'</div>'
        f'</div>'
        f'\n{foot_html}'
    )
    return wrap_html_block(html)

def build_sidebar_block(silo_slug, silo_name, silo_posts, current_slug):
    links = [f'<a href="/{silo_slug}/"><strong>Página principal:</strong> {silo_name}</a>']
    for _, post_slug, post_title in silo_posts:
        if post_slug == current_slug:
            continue
        links.append(f'<a href="/{post_slug}/">{post_title}</a>')
    if not links:
        return ""
    return wrap_group_block(
        "\n\n".join([
            wrap_heading_block(f"Nesta seção: {silo_name}", level=4),
            wrap_list_block(links, class_name="sidebar-links"),
        ]),
        class_name="sidebar-box",
    )

def build_postnav_html(silo_posts, current_slug):
    """Retorna o HTML interno do postnav (sem wrapper de bloco)."""
    slugs = [s for _, s, _ in silo_posts]
    titles = {s: t for _, s, t in silo_posts}
    try:
        idx = slugs.index(current_slug)
    except ValueError:
        return ""
    items = []
    if idx > 0:
        ps = slugs[idx - 1]
        items.append(
            f'<a href="/{ps}/">'
            f'<span class="postnav-eyebrow">← Anterior</span>'
            f'<span class="postnav-title">{titles[ps]}</span>'
            f'</a>'
        )
    if idx < len(slugs) - 1:
        ns = slugs[idx + 1]
        items.append(
            f'<a href="/{ns}/" style="text-align:right">'
            f'<span class="postnav-eyebrow">Próximo →</span>'
            f'<span class="postnav-title">{titles[ns]}</span>'
            f'</a>'
        )
    return "".join(items)

def build_postnav_block(silo_posts, current_slug):
    slugs = [s for _, s, _ in silo_posts]
    titles = {s: t for _, s, t in silo_posts}
    try:
        idx = slugs.index(current_slug)
    except ValueError:
        return ""
    items = []
    if idx > 0:
        ps = slugs[idx - 1]
        items.append(
            f'<a href="/{ps}/" class="postnav-btn prev">'
            f'<span class="postnav-eyebrow">Anterior</span>'
            f'<span class="postnav-title">{titles[ps]}</span>'
            '</a>'
        )
    if idx < len(slugs) - 1:
        ns = slugs[idx + 1]
        items.append(
            f'<a href="/{ns}/" class="postnav-btn next">'
            f'<span class="postnav-eyebrow">Próximo</span>'
            f'<span class="postnav-title">{titles[ns]}</span>'
            '</a>'
        )
    if not items:
        return ""
    return wrap_group_block(
        wrap_group_block(
            "\n\n".join(
                wrap_paragraph_block(item, class_name="article-postnav-item")
                for item in items
            ),
            class_name="article-postnav-links",
        ),
        class_name="article-postnav",
        tag_name="nav",
    )

def get_first_paragraph(article_slug):
    f = ART / f"{article_slug}.html"
    if not f.exists():
        return ""
    txt = f.read_text(encoding="utf-8", errors="ignore")
    txt = re.sub(r'<img[^>]+\.svg[^>]*/?>[\s]*', '', txt)
    m = re.search(r'<p>(.*?)</p>', txt, re.DOTALL)
    if not m:
        return ""
    plain = re.sub(r'<[^>]+>', '', m.group(1)).strip()
    return plain[:220].rsplit(' ', 1)[0] + '…' if len(plain) > 220 else plain

def get_article_card_image(article_slug, silo_slug, post_slug=""):
    override = POST_IMAGE_OVERRIDES.get(post_slug, "")
    if override:
        return override
    f = ART / f"{article_slug}.html"
    if f.exists():
        txt = f.read_text(encoding="utf-8", errors="ignore")
        m = re.search(r'<img[^>]+src=["\']([^"\']+)["\']', txt, re.I)
        if m:
            src = m.group(1).strip()
            if src.startswith("http://") or src.startswith("https://"):
                return src
    media_url = lookup_media_image(MEDIA_SEARCH_TERMS.get(post_slug, ""))
    if media_url:
        return media_url
    return HUB_CARD_FALLBACKS.get(silo_slug, "")

def build_hub_card_block(article_slug, post_slug, post_title, tag_label, silo_slug):
    excerpt = get_first_paragraph(article_slug) or "Abra este guia para entender melhor este tema e seguir navegando pelos conteúdos da seção."
    image_block = wrap_image_block(
        get_article_card_image(article_slug, silo_slug, post_slug),
        alt=post_title,
        class_name="hub-card-media",
    )
    return wrap_group_block(
        "\n\n".join([
            image_block,
            wrap_paragraph_block(tag_label, class_name="hub-card-tag"),
            wrap_heading_block(f'<a href="/{post_slug}/">{post_title}</a>', level=3, class_name="hub-card-title"),
            wrap_paragraph_block(excerpt, class_name="hub-card-text"),
            wrap_paragraph_block(f'<a href="/{post_slug}/">Abrir artigo →</a>', class_name="hub-card-link"),
        ]),
        class_name="hub-card",
    )

def build_hub_page_content(silo_slug, silo_name, silo_posts):
    meta = HUB_PAGE_META[silo_slug]
    hero_block = wrap_group_block(
        wrap_group_block(
            "\n\n".join([
                wrap_paragraph_block(meta["badge"], class_name="pg-badge"),
                wrap_heading_block(meta["hero"], level=1, class_name="pg-h1"),
                wrap_paragraph_block(meta["sub"], class_name="pg-sub"),
            ]),
            class_name="pg-hero-in",
        ),
        class_name="pg-hero hub-hero",
        tag_name="section",
    )
    cards = [
        build_hub_card_block(article_slug, post_slug, post_title, meta["tag"], silo_slug)
        for article_slug, post_slug, post_title in silo_posts
    ]
    links_section = wrap_group_block(
        wrap_group_block(
            "\n\n".join([
                wrap_paragraph_block(meta["section_label"], class_name="lbl"),
                wrap_heading_block(meta["section_title"], level=2, class_name="ttl"),
                wrap_paragraph_block(meta["section_text"], class_name="stxt"),
                wrap_group_block("\n\n".join(cards), class_name="hub-grid"),
            ]),
            class_name="hub-shell",
        ),
        class_name="hub-section hub-section-links",
        tag_name="section",
    )
    cta_block = wrap_group_block(
        wrap_group_block(
            "\n\n".join([
                wrap_heading_block(meta["cta_title"], level=2),
                wrap_paragraph_block(meta["cta_text"]),
                wrap_paragraph_block(f'<a href="{meta["cta_href"]}" class="btnp">{meta["cta_label"]}</a>'),
            ]),
            class_name="hub-shell",
        ),
        class_name="sec-red hub-cta",
        tag_name="section",
    )
    return wrap_group_block(
        "\n\n".join([hero_block, links_section, cta_block]),
        class_name="hub-page-wrap",
    )

def build_faq_related_block(silo_posts, current_slug):
    items = []
    for article_slug, post_slug, post_title in silo_posts:
        if post_slug == current_slug:
            continue
        answer = get_first_paragraph(article_slug)
        label = f'<a href="/{post_slug}/"><strong>{post_title}</strong></a>'
        items.append(f'{label}<br>{answer}' if answer else label)
    if not items:
        return ""
    return wrap_group_block(
        "\n\n".join([
            wrap_heading_block("Mais perguntas sobre a Bauernfest", level=2),
            wrap_list_block(items),
        ]),
        class_name="sidebar-box",
    )

def wrap_details_block(question, answer_html, class_name=""):
    question = (question or "").strip()
    answer_html = (answer_html or "").strip()
    if not question or not answer_html:
        return ""
    attrs = {"className": class_name} if class_name else {}
    attrs_json = _serialize_block_attrs(attrs)
    classes = "wp-block-details" + (f" {class_name}" if class_name else "")
    return (
        f"<!-- wp:details{attrs_json} -->\n"
        f"<details class=\"{classes}\">\n"
        f"<summary>{question}</summary>\n"
        f"<p>{answer_html}</p>\n"
        f"</details>\n"
        f"<!-- /wp:details -->"
    )

def related_post_links(silo_posts, current_slug, limit=2):
    links = []
    for _, post_slug, post_title in silo_posts:
        if post_slug == current_slug:
            continue
        links.append(f'<a href="/{post_slug}/">{post_title}</a>')
        if len(links) >= limit:
            break
    return links

def build_article_faq_items(silo_slug, post_slug, post_title, silo_posts):
    clean_title = post_title.rstrip(" ?")
    related = related_post_links(silo_posts, post_slug, limit=2)
    related_html = " e ".join(related) if related else "os outros guias desta seção"

    if silo_slug == "sobre":
        return [
            (
                f"Por que {clean_title.lower()} ajuda a entender melhor a festa?",
                f"Porque esse tema explica uma parte da identidade cultural da Bauernfest e deixa a visita mais rica, especialmente quando você combina a leitura com {related_html}.",
            ),
            (
                f"Vale ler sobre {clean_title.lower()} antes da viagem?",
                "Sim. Esse contexto ajuda a enxergar melhor os detalhes históricos, arquitetônicos e culturais que fazem a experiência em Petrópolis ficar mais completa.",
            ),
            (
                "Qual leitura complementar faz sentido agora?",
                f"Se você quer continuar o roteiro editorial, vale abrir {related_html} para aprofundar a história, os personagens e os lugares centrais da festa.",
            ),
        ]

    if silo_slug == "programacao":
        return [
            (
                f"{clean_title} costuma ser uma atração para qualquer perfil de visitante?",
                "Na prática, sim. A programação da Bauernfest costuma agradar tanto quem vai pela primeira vez quanto quem já conhece o evento e quer escolher melhor os dias da visita.",
            ),
            (
                "Precisa comprar ingresso para aproveitar essa parte da festa?",
                "Não. A Bauernfest tem entrada gratuita, então o mais importante é organizar horário, deslocamento e o resto do roteiro no mesmo dia.",
            ),
            (
                "O que combinar com esse guia no mesmo planejamento?",
                f"Normalmente faz sentido juntar esta leitura com {related_html} para montar um plano mais completo antes de sair para Petrópolis.",
            ),
        ]

    if silo_slug == "gastronomia":
        return [
            (
                f"{clean_title} vale entrar no roteiro gastronômico da festa?",
                "Vale sim. Esse tipo de prato ou experiência ajuda a montar um percurso mais autêntico pela culinária alemã que aparece durante a Bauernfest.",
            ),
            (
                "É melhor provar isso na festa ou conhecer antes pelo conteúdo?",
                "Os dois funcionam bem: o artigo ajuda a entender o contexto e os ingredientes, e a experiência presencial deixa mais fácil escolher o que pedir quando você chegar.",
            ),
            (
                "Qual leitura combina com este tema?",
                f"Para continuar no clima gastronômico, vale abrir {related_html} e ampliar a sua lista de comidas e bebidas para provar na viagem.",
            ),
        ]

    if silo_slug == "turismo":
        return [
            (
                f"{clean_title} ajuda mesmo no planejamento da viagem?",
                "Sim. Esse tipo de informação costuma economizar tempo na logística e ajuda a decidir onde ficar, como circular e o que priorizar no roteiro.",
            ),
            (
                "Dá para combinar a festa com outros passeios de Petrópolis?",
                "Dá sim. A região central concentra muitos pontos interessantes, então a melhor estratégia costuma ser unir a Bauernfest com atrações próximas no mesmo dia ou fim de semana.",
            ),
            (
                "Qual guia ver depois deste?",
                f"Se você quiser fechar o planejamento, o próximo passo natural é ler {related_html}.",
            ),
        ]

    if silo_slug == "receitas-alemas":
        return [
            (
                f"{clean_title} é uma boa receita para fazer em casa?",
                "Sim. Essas receitas funcionam bem para entrar no clima da cultura alemã mesmo fora da festa e ajudam a prolongar a experiência depois da viagem.",
            ),
            (
                "Essa receita combina com a Bauernfest mesmo?",
                "Combina bastante, porque faz parte do imaginário gastronômico associado à culinária alemã e costuma despertar curiosidade em quem visita o evento.",
            ),
            (
                "Qual receita conhecer depois?",
                f"Se você quiser continuar na cozinha, vale seguir com {related_html} e montar um repertório alemão mais completo.",
            ),
        ]

    return [
        (
            f"Essa informação sobre {clean_title.lower()} continua útil para planejar a visita?",
            "Sim. Este conteúdo ajuda a responder uma dúvida central e serve como base para organizar datas, horários, deslocamento e o que fazer no evento.",
        ),
        (
            "Qual é a melhor forma de complementar esta resposta?",
            f"O ideal é combinar esta leitura com {related_html}, porque isso transforma uma resposta isolada em um planejamento mais prático.",
        ),
        (
            "Essa dúvida costuma aparecer junto com quais outras?",
            f"Normalmente ela vem acompanhada de perguntas sobre programação, acesso e experiência no local, então vale continuar pelos links desta seção e por {related_html}.",
        ),
    ]

def build_article_faq_block(silo_slug, post_slug, post_title, silo_posts):
    items = build_article_faq_items(silo_slug, post_slug, post_title, silo_posts)
    detail_blocks = [
        wrap_details_block(question, answer, class_name="article-faq-item")
        for question, answer in items
    ]
    details_html = "\n\n".join(block for block in detail_blocks if block)
    if not details_html:
        return ""
    return wrap_group_block(
        "\n\n".join([
            wrap_heading_block(f"Perguntas rápidas sobre {post_title.rstrip(' ?')}", level=2),
            wrap_paragraph_block("Abra as respostas abaixo para tirar dúvidas comuns antes de continuar a leitura ou planejar a visita.", class_name="article-faq-lead"),
            details_html,
        ]),
        class_name="article-faq-section",
        tag_name="section",
    )

def build_map_block(post_slug):
    cfg = MAP_CONFIG.get(post_slug)
    if not cfg:
        return ""
    query = urllib.parse.quote_plus(cfg["query"])
    map_url = f"https://www.google.com/maps?q={query}&z=15&output=embed"
    open_url = f"https://www.google.com/maps/search/?api=1&query={query}"
    iframe = (
        '<div class="article-map-frame">'
        f'<iframe src="{map_url}" loading="lazy" allowfullscreen '
        'referrerpolicy="no-referrer-when-downgrade"></iframe>'
        "</div>"
    )
    return wrap_group_block(
        "\n\n".join([
            wrap_heading_block(cfg["heading"], level=2),
            wrap_paragraph_block(cfg["note"], class_name="article-map-lead"),
            wrap_html_block(iframe),
            wrap_paragraph_block(
                f'<a href="{open_url}" target="_blank" rel="noopener nofollow">Abrir no Google Maps</a>',
                class_name="article-map-link",
            ),
        ]),
        class_name="article-map-section",
        tag_name="section",
    )

def maybe_prepend_post_image(gutenberg, article_slug, silo_slug, post_slug, post_title):
    gutenberg = (gutenberg or "").strip()
    if "<!-- wp:image" in gutenberg:
        return gutenberg
    src = get_article_card_image(article_slug, silo_slug, post_slug)
    if not src:
        return gutenberg
    image_block = wrap_image_block(src, alt=post_title, class_name="article-cover-image")
    return "\n\n".join(part for part in [image_block, gutenberg] if part)

def minify_css(css):
    import re as _re
    css = _re.sub(r'/\*.*?\*/', '', css, flags=_re.DOTALL)
    css = _re.sub(r'\n{2,}', '\n', css)
    return css.strip()

def _serialize_block_attrs(attrs):
    attrs = {k: v for k, v in (attrs or {}).items() if v not in (None, "", [], {})}
    if not attrs:
        return ""
    return " " + json.dumps(attrs, ensure_ascii=False, separators=(",", ":"))

def wrap_html_block(html):
    html = (html or "").strip()
    if not html:
        return ""
    return f"<!-- wp:html -->\n{html}\n<!-- /wp:html -->"

def wrap_group_block(inner_blocks, class_name="", tag_name="div"):
    inner_blocks = (inner_blocks or "").strip()
    if not inner_blocks:
        return ""
    attrs = {}
    if class_name:
        attrs["className"] = class_name
    if tag_name != "div":
        attrs["tagName"] = tag_name
    attrs_json = _serialize_block_attrs(attrs)
    classes = "wp-block-group" + (f" {class_name}" if class_name else "")
    return (
        f"<!-- wp:group{attrs_json} -->\n"
        f"<{tag_name} class=\"{classes}\">\n"
        f"{inner_blocks}\n"
        f"</{tag_name}>\n"
        f"<!-- /wp:group -->"
    )

def wrap_heading_block(text, level=2, class_name=""):
    text = (text or "").strip()
    if not text:
        return ""
    attrs = {"level": level}
    if class_name:
        attrs["className"] = class_name
    attrs_json = _serialize_block_attrs(attrs)
    classes = "wp-block-heading" + (f" {class_name}" if class_name else "")
    return (
        f"<!-- wp:heading{attrs_json} -->\n"
        f"<h{level} class=\"{classes}\">{text}</h{level}>\n"
        f"<!-- /wp:heading -->"
    )

def wrap_paragraph_block(html, class_name=""):
    html = (html or "").strip()
    if not html:
        return ""
    attrs = {"className": class_name} if class_name else {}
    attrs_json = _serialize_block_attrs(attrs)
    classes = f' class="{class_name}"' if class_name else ""
    return f"<!-- wp:paragraph{attrs_json} -->\n<p{classes}>{html}</p>\n<!-- /wp:paragraph -->"

def wrap_list_block(items, ordered=False, class_name=""):
    items = [item.strip() for item in (items or []) if item and item.strip()]
    if not items:
        return ""
    attrs = {"ordered": True} if ordered else {}
    if class_name:
        attrs["className"] = class_name
    attrs_json = _serialize_block_attrs(attrs)
    tag = "ol" if ordered else "ul"
    classes = "wp-block-list" + (f" {class_name}" if class_name else "")
    lis = "\n".join(f"<li>{item}</li>" for item in items)
    return f"<!-- wp:list{attrs_json} -->\n<{tag} class=\"{classes}\">\n{lis}\n</{tag}>\n<!-- /wp:list -->"

def wrap_image_block(src, alt="", class_name=""):
    src = (src or "").strip()
    if not src:
        return ""
    attrs = {"className": class_name} if class_name else {}
    attrs_json = _serialize_block_attrs(attrs)
    fig_class = "wp-block-image" + (f" {class_name}" if class_name else "")
    alt_attr = (alt or "").replace('"', "&quot;")
    return (
        f"<!-- wp:image{attrs_json} -->\n"
        f"<figure class=\"{fig_class}\"><img src=\"{src}\" alt=\"{alt_attr}\"/></figure>\n"
        f"<!-- /wp:image -->"
    )

# ── HTML → Gutenberg blocks ───────────────────────────────────────────────────

def extract_article_body(html):
    """Remove share buttons, sidebar junk and back-links from article HTML."""
    truncate_markers = [
        '← Voltar', 'facebook.com/sharer', 'api.whatsapp.com',
        'Gostou? Compartilhe', '✅ Link copiado', 'Anuncie-Aqui.png',
    ]
    for marker in truncate_markers:
        idx = html.find(marker)
        if idx > 0:
            cut = html.rfind('<', 0, idx)
            html = html[:cut if cut > 0 else idx]
            break
    return html

def normalize_article_h1(inner):
    """Flatten decorative <em> text inside article H1s into plain readable text."""
    inner = (inner or "").strip()
    if not inner:
        return inner
    if not re.search(r'<em\b', inner, re.IGNORECASE):
        return inner
    plain = re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', '', inner)).strip()
    parts = []
    base_match = re.match(r'^(.*?)<em\b[^>]*>(.*?)</em>(.*)$', inner, re.IGNORECASE | re.DOTALL)
    if base_match:
        before = re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', '', base_match.group(1))).strip(" :-")
        emphasis = re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', '', base_match.group(2))).strip(" :-")
        after = re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', '', base_match.group(3))).strip(" :-")
        if before and emphasis:
            sep = " " if ":" in before else ": "
            text = before + sep + emphasis
            if after:
                text += f" {after}"
            return text.strip()
        if before:
            parts.append(before)
        if emphasis:
            parts.append(emphasis)
        if after:
            parts.append(after)
        if parts:
            return " ".join(parts)
    return plain

def make_gutenberg_block(tag, html):
    """Convert a single HTML element to a Gutenberg block string."""
    m = re.match(rf'<{tag}[^>]*>(.*)</{tag}>', html, re.DOTALL | re.IGNORECASE)
    inner = m.group(1).strip() if m else html.strip()
    if not inner:
        return None
    if tag in ('h1', 'h2', 'h3', 'h4'):
        lv = int(tag[1])
        if tag == 'h1':
            inner = normalize_article_h1(inner)
        return (f'<!-- wp:heading {{"level":{lv}}} -->\n'
                f'<h{lv} class="wp-block-heading">{inner}</h{lv}>\n'
                f'<!-- /wp:heading -->')
    if tag == 'p':
        plain = re.sub(r'<[^>]+>', '', inner).strip()
        if not plain or re.match(r'^(Gostou|Compartilhe|✅|🏛|←)', plain):
            return None
        return f'<!-- wp:paragraph -->\n<p>{inner}</p>\n<!-- /wp:paragraph -->'
    if tag == 'ul':
        return f'<!-- wp:list -->\n<ul class="wp-block-list">{inner}</ul>\n<!-- /wp:list -->'
    if tag == 'ol':
        return (f'<!-- wp:list {{"ordered":true}} -->\n'
                f'<ol class="wp-block-list">{inner}</ol>\n<!-- /wp:list -->')
    if tag == 'figure':
        return (f'<!-- wp:image -->\n'
                f'<figure class="wp-block-image size-large">{inner}</figure>\n'
                f'<!-- /wp:image -->')
    if tag == 'blockquote':
        return (f'<!-- wp:quote -->\n'
                f'<blockquote class="wp-block-quote">{inner}</blockquote>\n'
                f'<!-- /wp:quote -->')
    if tag == 'table':
        return (f'<!-- wp:table -->\n'
                f'<figure class="wp-block-table"><table>{inner}</table></figure>\n'
                f'<!-- /wp:table -->')
    return None

def replace_local_images_with_media_urls(html, post_slug):
    media_url = lookup_media_image(MEDIA_SEARCH_TERMS.get(post_slug, ""))
    if not media_url:
        return html
    def _swap(match):
        src = match.group(2).strip()
        if src.startswith("http://") or src.startswith("https://"):
            return match.group(0)
        return match.group(0).replace(src, media_url, 1)
    return re.sub(r'<img([^>]+)src=["\']([^"\']+)["\']', lambda m: _swap(m), html, flags=re.I)

def html_to_gutenberg_blocks(html, post_slug=""):
    """Parse article HTML and return concatenated Gutenberg block markup."""
    html = extract_article_body(html)
    html = replace_local_images_with_media_urls(html, post_slug)
    BLOCK_TAGS = ['h1', 'h2', 'h3', 'h4', 'p', 'ul', 'ol', 'figure', 'blockquote', 'table']
    blocks = []
    pos = 0
    n = len(html)
    while pos < n:
        best_tag, best_start, best_m = None, n, None
        for tag in BLOCK_TAGS:
            m = re.search(rf'<{tag}(?:\s[^>]*)?>', html[pos:], re.IGNORECASE)
            if m:
                abs_s = pos + m.start()
                if abs_s < best_start:
                    best_start, best_tag, best_m = abs_s, tag, m
        m_img = re.search(r'<img[^>]+/?>', html[pos:], re.IGNORECASE)
        if m_img and pos + m_img.start() < best_start:
            best_start, best_tag, best_m = pos + m_img.start(), 'img', m_img
        if best_tag is None:
            break
        if best_tag == 'img':
            block = (f'<!-- wp:image -->\n'
                     f'<figure class="wp-block-image">{best_m.group(0)}</figure>\n'
                     f'<!-- /wp:image -->')
            blocks.append(block)
            pos = best_start + len(best_m.group(0))
        else:
            tag_end = best_start + len(best_m.group(0))
            depth, sp = 1, tag_end
            while depth > 0 and sp < n:
                mo = re.search(rf'<{best_tag}(?:\s[^>]*)?>', html[sp:], re.IGNORECASE)
                mc = re.search(rf'</{best_tag}>', html[sp:], re.IGNORECASE)
                oa = sp + mo.start() if mo else n
                ca = sp + mc.start() if mc else n
                if ca <= oa:
                    sp = sp + mc.end() if mc else n; depth -= 1
                else:
                    sp = sp + mo.end() if mo else n; depth += 1
            element_html = html[best_start:sp]
            block = make_gutenberg_block(best_tag, element_html)
            if block:
                blocks.append(block)
            pos = sp
    return '\n\n'.join(blocks)

def prepare_content(article_slug, silo_slug, silo_name, post_slug, post_title, silo_posts, assets):
    f = ART / f"{article_slug}.html"
    if not f.exists():
        return None
    article = f.read_text(encoding="utf-8", errors="ignore")
    article = fix_links(article)
    map_block = build_map_block(post_slug)
    article_faq_block = build_article_faq_block(silo_slug, post_slug, post_title, silo_posts)
    postnav_block = build_postnav_block(silo_posts, post_slug)

    gutenberg = html_to_gutenberg_blocks(article, post_slug)
    gutenberg = maybe_prepend_post_image(gutenberg, article_slug, silo_slug, post_slug, post_title)

    meta_block = build_article_meta_block()
    gutenberg = re.sub(
        r'(<!-- /wp:heading -->)',
        rf'\1\n\n{meta_block}',
        gutenberg,
        count=1,
    )

    content_blocks = "\n\n".join(p for p in [gutenberg, map_block, article_faq_block, postnav_block] if p)
    opening = build_opening_html_block(assets, silo_name, post_title)
    closing = build_closing_html_block(assets, silo_slug, silo_name, silo_posts, post_slug)
    return f"{opening}\n\n{content_blocks}\n\n{closing}"

# ── 5. Criar posts ────────────────────────────────────────────────────────────
def step_create_posts(cat_ids):
    log("\n=== 4. Criando Posts ===")
    assets = load_assets()
    created = errors = 0
    for silo_slug, silo_name, silo_posts in SILOS:
        cid = cat_ids.get(silo_slug)
        if not cid:
            log(f"  SKIP SILO {silo_slug} (sem categoria)"); continue
        log(f"\n  SILO: {silo_slug}")
        for article_slug, post_slug, post_title in silo_posts:
            content = prepare_content(article_slug, silo_slug, silo_name, post_slug, post_title, silo_posts, assets)
            if content is None:
                log(f"    SKIP  {article_slug}.html (nao encontrado)"); continue
            post_data = {
                "title": post_title, "slug": post_slug,
                "content": content, "status": "publish",
                "categories": [cid],
                "template": "elementor_canvas",
                "meta": {
                    "_elementor_data": "[]",
                    "_elementor_edit_mode": "",
                    "_elementor_page_settings": {},
                },
            }
            existing = find_existing_post(post_slug, post_title)
            if existing:
                pid = existing["id"]
                ok2, res = api("POST", f"posts/{pid}", post_data)
                tag = "UPDATE"
            else:
                ok2, res = api("POST", "posts", post_data)
                pid = res.get("id") if ok2 else None
                tag = "CREATE"
            if ok2:
                log(f"    OK  [{tag}]  /{post_slug}/  ({len(content)} chars)")
                created += 1
            else:
                log(f"    ERRO  {post_slug}  {res if not ok2 else ''}")
                errors += 1
            time.sleep(0.3)
    log(f"\n  Posts criados/atualizados: {created}  |  Erros: {errors}")

def step_create_hub_pages():
    log("\n=== 5. Criando páginas principais ===")
    created = errors = 0
    for silo_slug, silo_name, silo_posts in SILOS:
        meta = HUB_PAGE_META.get(silo_slug)
        if not meta:
            continue
        content = build_hub_page_content(silo_slug, silo_name, silo_posts)
        page_data = {
            "title": meta["title"],
            "slug": silo_slug,
            "content": content,
            "excerpt": meta["sub"],
            "status": "publish",
            "template": "",
            "meta": {
                "_elementor_data": "[]",
                "_elementor_edit_mode": "",
                "_elementor_page_settings": {},
            },
        }
        existing = find_existing_page(silo_slug)
        if existing:
            pid = existing["id"]
            ok, res = api("POST", f"pages/{pid}", page_data)
            tag = "UPDATE"
        else:
            ok, res = api("POST", "pages", page_data)
            pid = res.get("id") if ok else None
            tag = "CREATE"
        if ok:
            log(f"  OK  [{tag}]  /{silo_slug}/  (ID={pid})")
            created += 1
        else:
            log(f"  ERRO  /{silo_slug}/  {res}")
            errors += 1
        time.sleep(0.3)
    log(f"\n  Páginas criadas/atualizadas: {created}  |  Erros: {errors}")

# ── Main ──────────────────────────────────────────────────────────────────────
def main():
    log("=== MIGRACAO BAUERNFEST: Pages → Posts SILO ===")
    step_permalink()
    step_delete_pages()
    cat_ids = step_create_categories()
    step_create_posts(cat_ids)
    step_create_hub_pages()
    log("\n=== CONCLUIDO ===")
    log("Se o permalink nao foi alterado via API:")
    log("  WP Admin > Configuracoes > Links Permanentes > Nome do post (/%postname%/)")

if __name__ == "__main__":
    main()
