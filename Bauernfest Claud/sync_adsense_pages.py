import base64
import json
import os
import re
import urllib.error
import urllib.parse
import urllib.request

from new_post import WP_API_BASE, WP_PASS, WP_USER


ROOT = os.path.dirname(os.path.abspath(__file__))
SITE_ROOT = os.path.join(ROOT, "site-bauernfest")
HOME_PAGE_ID = 1582
CSS_BLOCK_ID = 2348
NAV_BLOCK_ID = 2349
FOOTER_BLOCK_ID = 2350


MENU_HTML = """<ul class="bfnl" id="bfMenu">
      <li><a href="https://bauernfest.org/">Inicio</a></li>
      <li><a href="https://bauernfest.org/assuntos/">Assuntos</a></li>
      <li><a href="https://bauernfest.org/sobre/">Sobre N&oacute;s</a></li>
      <li><a href="https://bauernfest.org/transparencia/">Transparencia</a></li>
      <li><a href="https://bauernfest.org/politica-de-privacidade/">Politica de privacidade</a></li>
      <li><a href="https://bauernfest.org/termos-de-uso/">Termos de Uso</a></li>
      <li><a href="https://bauernfest.org/contato/">Contato</a></li>
    </ul>"""

DOC_STYLE = """<style>
.bf-breadcrumb{background:#f7efe2;border-bottom:1px solid rgba(44,26,14,.08)}
.bf-breadcrumb nav{display:flex;gap:.55rem;align-items:center;padding:.85rem 0;color:#7a6048;font-family:'DM Sans',sans-serif;font-size:.83rem}
.bf-breadcrumb a{color:#8B1A1A;text-decoration:none;font-weight:700}
.pg-hero{background:linear-gradient(135deg,#1A1008,#4d160d);color:#fff;padding:3.5rem 0 3rem}
.pg-badge{display:inline-flex;margin-bottom:.9rem;padding:.32rem .7rem;border:1px solid rgba(232,184,75,.42);border-radius:999px;color:#E8B84B;font-family:'DM Sans',sans-serif;font-size:.72rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase}
.pg-hero h1{margin:0 0 .75rem;font-family:'Playfair Display',serif;font-size:clamp(2rem,5vw,3.4rem);line-height:1.05}
.pg-hero-sub{max-width:720px;margin:0;color:rgba(255,248,236,.82);font-size:1.03rem;line-height:1.75}
.doc-wrap{max-width:780px;margin:0 auto;padding:3rem 1rem 4rem}
.doc-wrap h2{font-family:'Playfair Display',serif;font-size:clamp(1.15rem,2.5vw,1.45rem);font-weight:900;color:#1A1008;margin:2.5rem 0 .7rem;padding-top:.5rem;border-top:1px solid rgba(0,0,0,.07)}
.doc-wrap h2:first-child{border-top:none;margin-top:0}
.doc-wrap p{font-size:.97rem;line-height:1.88;color:#2C1A0E;margin-bottom:.9rem}
.doc-wrap ul{padding-left:1.4rem;margin-bottom:.9rem}
.doc-wrap li{list-style:disc;font-size:.97rem;line-height:1.88;color:#2C1A0E;margin-bottom:.3rem}
.doc-wrap a{color:#8B1A1A;text-decoration:underline}
.doc-meta{font-family:'DM Sans',sans-serif;font-size:.8rem;color:#7A6048;background:#F9F3E8;border-left:3px solid #C8922A;padding:.7rem 1rem;border-radius:0 4px 4px 0;margin-bottom:2rem}
</style>"""


PAGES = {
    "transparencia": {
        "title": "Transparencia Editorial",
        "badge": "Institucional",
        "heading": "Transparencia Editorial",
        "sub": "Como produzimos conteudo, corrigimos informacoes e mantemos independencia editorial",
        "body_path": os.path.join(SITE_ROOT, "transparencia", "index.html"),
        "description": "Politica de transparencia editorial do bauernfest.org.",
    },
    "assuntos": {
        "title": "Assuntos",
        "badge": "Guia editorial",
        "heading": "Assuntos",
        "sub": "Todas as editorias do bauernfest.org organizadas para voce navegar melhor",
        "body_path": os.path.join(SITE_ROOT, "assuntos", "index.html"),
        "description": "Principais editorias do bauernfest.org sobre Bauernfest, Petropolis, cultura alema e turismo.",
    },
}


def auth_headers():
    credentials = base64.b64encode(f"{WP_USER}:{WP_PASS}".encode("utf-8")).decode("ascii")
    return {
        "Authorization": f"Basic {credentials}",
        "Content-Type": "application/json",
        "User-Agent": "Bauernfest-editorial-sync/1.0",
    }


def wp_request(path, method="GET", data=None):
    body = None
    headers = auth_headers()
    if data is not None:
        body = json.dumps(data).encode("utf-8")
    req = urllib.request.Request(
        f"{WP_API_BASE}{path}",
        data=body,
        method=method,
        headers=headers,
    )
    with urllib.request.urlopen(req, timeout=45) as response:
        return json.loads(response.read().decode("utf-8"))


def extract_doc_body(filepath):
    with open(filepath, "r", encoding="utf-8") as handle:
        html = handle.read()
    match = re.search(
        r'(<div class="doc-wrap">.*?</div>\s*</div>)',
        html,
        flags=re.DOTALL,
    )
    if not match:
        raise RuntimeError(f"Could not extract doc body from {filepath}")
    return match.group(1)


def build_page_content(page):
    body = extract_doc_body(page["body_path"])
    return f"""<!-- wp:block {{"ref":{CSS_BLOCK_ID}}} /-->
<!-- wp:block {{"ref":{NAV_BLOCK_ID}}} /-->
<!-- wp:html -->
{DOC_STYLE}
<div class="bf-breadcrumb">
  <div class="bfc">
    <nav aria-label="Breadcrumb">
      <a href="https://bauernfest.org/">Home</a>
      <span>&rsaquo;</span>
      <span>{page["heading"]}</span>
    </nav>
  </div>
</div>
<div class="pg-hero">
  <div class="pg-hero-inner bfc">
    <div class="pg-badge">{page["badge"]}</div>
    <h1>{page["heading"]}</h1>
    <p class="pg-hero-sub">{page["sub"]}</p>
  </div>
</div>
<div class="bfc">
  {body}
</div>
<!-- /wp:html -->
<!-- wp:block {{"ref":{FOOTER_BLOCK_ID}}} /-->"""


def update_home_menu():
    nav_path = os.path.join(SITE_ROOT, "Rodape", "nav.html")
    with open(nav_path, "r", encoding="utf-8") as handle:
        nav_html = handle.read().strip()
    page = wp_request(f"/pages/{HOME_PAGE_ID}?context=edit")
    content = page.get("content", {}).get("raw") or page.get("content", {}).get("rendered", "")
    updated, count = re.subn(
        r'<header\s+class="bf-header-shell".*?</header>\s*(?:<style>.*?</style>\s*)?(?:<script>\s*\(function\(\).*?</script>\s*)?',
        nav_html,
        content,
        count=0,
        flags=re.DOTALL,
    )
    if count < 1:
        updated, count = re.subn(
            r'<ul\s+class="bfnl"\s+id="bfMenu">.*?</ul>',
            MENU_HTML,
            content,
            count=0,
            flags=re.DOTALL,
        )
    if count < 1:
        raise RuntimeError("Could not find a home header or menu to update")
    if updated == content:
        print("HOME unchanged")
        return
    wp_request(f"/pages/{HOME_PAGE_ID}", method="POST", data={"content": updated})
    print(f"HOME header updated ({count} occurrence(s))")


def find_page_by_slug(slug):
    query = urllib.parse.urlencode({"slug": slug, "per_page": 1, "context": "edit"})
    pages = wp_request(f"/pages?{query}")
    return pages[0] if pages else None


def upsert_page(slug, page):
    payload = {
        "title": page["title"],
        "slug": slug,
        "status": "publish",
        "content": build_page_content(page),
        "excerpt": page["description"],
    }
    existing = find_page_by_slug(slug)
    if existing:
        result = wp_request(f"/pages/{existing['id']}", method="POST", data=payload)
        print(f"PAGE updated /{slug}/ id={result['id']}")
    else:
        result = wp_request("/pages", method="POST", data=payload)
        print(f"PAGE created /{slug}/ id={result['id']}")


def main():
    update_home_menu()
    for slug, page in PAGES.items():
        upsert_page(slug, page)


if __name__ == "__main__":
    try:
        main()
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise SystemExit(f"HTTP {exc.code}: {detail[:500]}")
