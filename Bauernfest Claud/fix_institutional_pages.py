#!/usr/bin/env python3
"""
fix_institutional_pages.py
Restaura as páginas institucionais: anuncie, politica-de-privacidade, termos-de-uso
"""
import re, json, time, base64, urllib.request, urllib.error
from pathlib import Path

AUTH = "Basic " + base64.b64encode(b"ClaudeBot:p8Np bMs8 Xnsh MfH2 cZ7u w5xy").decode()
WP   = "https://bauernfest.org/wp-json/wp/v2"
SITE = Path("site-bauernfest")

def api(method, path, data=None):
    url = f"{WP}/{path}"
    body = json.dumps(data).encode("utf-8") if data else None
    req = urllib.request.Request(url, data=body, method=method, headers={
        "Authorization": AUTH,
        "Content-Type": "application/json; charset=utf-8",
    })
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return True, json.loads(r.read())
    except urllib.error.HTTPError as e:
        return False, {"error": e.read().decode("utf-8", errors="ignore")[:400], "code": e.code}
    except Exception as e:
        return False, {"error": str(e)}

def log(msg):
    import sys
    sys.stdout.buffer.write((msg + "\n").encode("utf-8", "replace"))
    sys.stdout.buffer.flush()

def minify_css(css):
    css = re.sub(r'/\*.*?\*/', '', css, flags=re.DOTALL)
    css = re.sub(r'\n{2,}', '\n', css)
    return css.strip()

def load_assets():
    css_main  = (SITE / "assets" / "bf-main.css").read_text(encoding="utf-8")
    css_nav   = (SITE / "Rodape" / "nav-breadcrumb.css").read_text(encoding="utf-8")
    nav_html  = (SITE / "Rodape" / "nav.html").read_text(encoding="utf-8")
    foot_html = (SITE / "Rodape" / "footer.html").read_text(encoding="utf-8")
    return css_main, css_nav, nav_html, foot_html

GFONTS = (
    '<link rel="preconnect" href="https://fonts.googleapis.com">'
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
    '<link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,600;0,9..40,700;1,9..40,400&family=Playfair+Display:ital,wght@0,700;0,900;1,700;1,900&family=Lora:ital@0;1&display=swap" rel="stylesheet">'
)

PAGES = [
    {
        "slug": "anuncie",
        "id": 365,
        "title": "Anuncie na Bauernfest.org",
        "local": "site-bauernfest/anuncie/index.html",
    },
    {
        "slug": "contato",
        "id": 371,
        "title": "Contato",
        "local": "site-bauernfest/contato/index.html",
    },
    {
        "slug": "politica-de-privacidade",
        "id": None,
        "title": "Política de Privacidade",
        "local": "site-bauernfest/politica-de-privacidade/index.html",
    },
    {
        "slug": "termos-de-uso",
        "id": None,
        "title": "Termos de Uso",
        "local": "site-bauernfest/termos-de-uso/index.html",
    },
]

def extract_body_content(html):
    """Extrai o conteúdo entre <!-- BREADCRUMB --> e <!-- FOOTER -->."""
    start_marker = "<!-- BREADCRUMB -->"
    end_marker   = "<!-- FOOTER -->"
    s = html.find(start_marker)
    e = html.find(end_marker)
    if s >= 0 and e > s:
        return html[s + len(start_marker):e].strip()
    # fallback: tudo depois do nav até o footer
    s2 = html.find("</header>")
    if s2 >= 0 and e > s2:
        return html[s2 + len("</header>"):e].strip()
    return ""

def build_page_content(local_path, assets):
    css_main, css_nav, nav_html, foot_html = assets
    html = Path(local_path).read_text(encoding="utf-8", errors="ignore")
    body_content = extract_body_content(html)

    extra = (
        ".pg-hero{padding:2.5rem 0 2rem;}"
        ".pg-hero-inner{display:flex;flex-direction:column;gap:1rem;}"
        ".doc-wrap{padding:2.5rem 0 3rem;max-width:780px;}"
        ".doc-wrap h2{margin:2rem 0 .75rem;padding-bottom:.4rem;border-bottom:2px solid var(--sand);}"
        ".doc-wrap p,.doc-wrap li{font-family:'Lora',serif;font-size:1rem;line-height:1.8;color:var(--text);}"
        ".doc-wrap ul{list-style:disc;padding-left:1.4rem;margin-bottom:1.2rem;}"
        ".doc-meta{font-size:.8rem;color:var(--muted);margin-bottom:2rem;}"
    )
    style = f"<style>{minify_css(css_main)}\n{minify_css(css_nav)}\n{extra}</style>"

    full_html = (
        f"{GFONTS}\n"
        f"{style}\n"
        f"{nav_html}\n"
        f"{body_content}\n"
        f"{foot_html}"
    )
    return f"<!-- wp:html -->\n{full_html}\n<!-- /wp:html -->"

def find_page(slug):
    ok, data = api("GET", f"pages?slug={slug}&per_page=1&status=publish")
    if ok and data:
        return data[0]["id"]
    # Also check draft/any status
    ok2, data2 = api("GET", f"pages?slug={slug}&per_page=1")
    if ok2 and data2:
        return data2[0]["id"]
    return None

def main():
    log("=== FIX: Páginas Institucionais ===")
    assets = load_assets()

    for page in PAGES:
        slug = page["slug"]
        title = page["title"]
        local = page["local"]

        if not Path(local).exists():
            log(f"  SKIP {slug} — arquivo local não encontrado"); continue

        content = build_page_content(local, assets)
        log(f"  Conteúdo extraído: {len(content)} chars")

        page_data = {
            "title": title,
            "slug": slug,
            "content": content,
            "status": "publish",
            "template": "elementor_canvas",
            "meta": {
                "_elementor_data": "[]",
                "_elementor_edit_mode": "",
                "_elementor_page_settings": {},
            },
        }

        # Verifica se já existe
        existing_id = page.get("id") or find_page(slug)

        if existing_id:
            ok, res = api("POST", f"pages/{existing_id}", page_data)
            tag = f"UPDATE ID={existing_id}"
        else:
            ok, res = api("POST", "pages", page_data)
            existing_id = res.get("id") if ok else None
            tag = f"CREATE ID={existing_id}"

        if ok:
            log(f"  OK  [{tag}]  /{slug}/")
        else:
            log(f"  ERRO  /{slug}/  {res}")

        time.sleep(0.3)

    log("\n=== CONCLUIDO ===")

if __name__ == "__main__":
    main()
