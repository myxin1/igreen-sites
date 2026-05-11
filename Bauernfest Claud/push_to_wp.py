#!/usr/bin/env python3
"""
Push das páginas locais para o WordPress bauernfest.org via REST API.
Usa elementor_canvas (suprime header/footer do tema) + conteúdo completo
(CSS inline + nav + conteúdo + sidebar + footer).
"""
import re
import time
import base64
import urllib.request
import json
from pathlib import Path

# ── Configuração ──────────────────────────────────────────────────────────────
WP_BASE  = "https://bauernfest.org/wp-json/wp/v2/pages"
USER     = "ClaudeBot"
APP_PASS = "p8Np bMs8 Xnsh MfH2 cZ7u w5xy"
AUTH     = "Basic " + base64.b64encode(f"{USER}:{APP_PASS}".encode()).decode()
ROOT     = Path("site-bauernfest")
CSS_FILE = ROOT / "assets" / "bf-main.css"

# ── Mapeamento arquivo local → ID da página no WordPress ─────────────────────
PAGE_MAP = {
    "index.html":                                                     56,
    "sobre/index.html":                                               64,
    "sobre/historia-bauernfest-petropolis.html":                      99,
    "sobre/palacio-de-cristal-petropolis.html":                      101,
    "sobre/dancas-folcloricas-alemas-petropolis.html":               103,
    "sobre/imigracao-alema-petropolis.html":                         105,
    "turismo/index.html":                                             71,
    "turismo/como-chegar-bauernfest-rio-de-janeiro.html":             81,
    "turismo/hoteis-perto-bauernfest-petropolis.html":                83,
    "turismo/o-que-fazer-petropolis.html":                            85,
    "turismo/petropolis-fim-de-semana.html":                          87,
    "programacao/index.html":                                         91,
    "programacao/bauernfest-2026-datas.html":                         89,
    "programacao/vale-germanico-bauernfest.html":                     93,
    "programacao/shows-musica-ao-vivo-bauernfest.html":               95,
    "programacao/concursos-jogos-germanicos.html":                    97,
    "gastronomia/index.html":                                         69,
    "gastronomia/pratos-tipicos-bauernfest.html":                     73,
    "gastronomia/chopp-artesanal-petropolis.html":                    77,
    "gastronomia/strudel-receita-alema.html":                         79,
    "gastronomia/eisbein-bauernfest.html":                           216,
    "receitas-alemas/index.html":                                    860,
    "receitas-alemas/pretzel-receita/index.html":                    862,
    "receitas-alemas/sauerkraut-receita/index.html":                 864,
    "receitas-alemas/bratwurst-receita/index.html":                  866,
    "receitas-alemas/selva-negra-receita/index.html":                868,
    "receitas-alemas/kassler-receita/index.html":                    870,
    "FAQ/index.html":                                                579,
    "FAQ/quando-e-a-bauernfest-petropolis/index.html":               580,
    "FAQ/o-que-e-a-bauernfest/index.html":                           581,
    "FAQ/quantos-dias-dura-a-bauernfest/index.html":                 582,
    "FAQ/quem-a-bauernfest-homenageia/index.html":                   583,
    "FAQ/o-que-fazer-na-bauernfest/index.html":                      584,
    "FAQ/significado-de-bauernfest/index.html":                      585,
    "FAQ/como-funciona-a-bauernfest/index.html":                     586,
    "FAQ/bauernfest-2026/index.html":                                587,
    "FAQ/datas-da-bauernfest/index.html":                            588,
    "FAQ/horario-bauernfest-petropolis/index.html":                  589,
    "contato/index.html":                                            371,
    "anuncie/index.html":                                            365,
}

# ── Preparação de conteúdo ────────────────────────────────────────────────────
def extract_content(html: str) -> str:
    """
    Prepara o HTML completo para elementor_canvas:
    - Inline do bf-main.css + CSS específico da página
    - Corpo completo: nav + hero + artigo + sidebar + footer
    - Remove apenas o wrapper <html>/<head>/<body> e o link externo ao CSS
    """
    # CSS global
    css_main = CSS_FILE.read_text(encoding="utf-8")
    style_main = f"<style>\n/* bf-main.css */\n{css_main}\n</style>"

    # CSS específico da página (blocos <style> no <head>)
    head_end = html.find("</head>")
    head_section = html[:head_end] if head_end > 0 else html[:6000]
    page_styles = re.findall(r"<style[^>]*>[\s\S]*?</style>", head_section, re.DOTALL)

    # Corpo completo
    body_match = re.search(r"<body[^>]*>([\s\S]*?)</body>", html, re.IGNORECASE | re.DOTALL)
    body = body_match.group(1) if body_match else html

    # Remove link para bf-main.css (já inline acima)
    body = re.sub(r"\n?<link[^>]+bf-main\.css[^>]*/?>[ \t]*\n?", "\n", body)

    page_css = "\n".join(page_styles)
    return (style_main + "\n" + page_css + "\n" + body.strip()).strip()

def wp_put(page_id: int, content: str) -> dict:
    """Envia conteúdo completo para o WordPress com template elementor_canvas."""
    url = f"{WP_BASE}/{page_id}"
    payload = json.dumps({
        "content": content,
        "template": "elementor_canvas",
        "meta": {
            "_elementor_data": "[]",
            "_elementor_edit_mode": "",
        }
    }).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=payload,
        method="POST",
        headers={
            "Authorization": AUTH,
            "Content-Type": "application/json; charset=utf-8",
            "X-HTTP-Method-Override": "PUT",
        }
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return {"ok": True, "status": resp.status}
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="ignore")[:200]
        return {"ok": False, "status": e.code, "error": body}
    except Exception as e:
        return {"ok": False, "status": 0, "error": str(e)}

# ── Main ─────────────────────────────────────────────────────────────────────
def main():
    ok_count = 0
    fail_count = 0

    for rel_path, page_id in PAGE_MAP.items():
        local_file = ROOT / rel_path
        if not local_file.exists():
            print(f"  SKIP  {rel_path} (arquivo não encontrado)")
            continue

        html = local_file.read_text(encoding="utf-8")
        html_ready = extract_content(html)

        result = wp_put(page_id, html_ready)
        status_str = f"ID={page_id} HTTP={result['status']}"

        if result["ok"]:
            ok_count += 1
            print(f"  OK    {rel_path} ({status_str})")
        else:
            fail_count += 1
            print(f"  FAIL  {rel_path} ({status_str}) → {result.get('error','')}")

        time.sleep(0.3)  # Não sobrecarrega o servidor

    print(f"\n=== Resultado ===")
    print(f"  Enviados : {ok_count}")
    print(f"  Falhas   : {fail_count}")

if __name__ == "__main__":
    main()
