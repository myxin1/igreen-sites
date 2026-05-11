#!/usr/bin/env python3
"""
create_homepage.py — Cria a homepage Bauernfest no WordPress.
"""
import json, re, base64, urllib.request, urllib.error
from pathlib import Path

AUTH = "Basic " + base64.b64encode(b"ClaudeBot:p8Np bMs8 Xnsh MfH2 cZ7u w5xy").decode()
WP   = "https://bauernfest.org/wp-json/wp/v2"
SITE = Path("site-bauernfest")

GFONTS = (
    '<link rel="preconnect" href="https://fonts.googleapis.com">'
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
    '<link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,600;0,9..40,700;1,9..40,400'
    '&family=Playfair+Display:ital,wght@0,700;0,900;1,700;1,900'
    '&family=Lora:ital@0;1&display=swap" rel="stylesheet">'
)

UP = "https://bauernfest.org/wp-content/uploads/2026/03"


# ── helpers ──────────────────────────────────────────────────────────────────
def api(method, path, data=None):
    url = f"{WP}/{path}"
    body = json.dumps(data).encode("utf-8") if data else None
    req = urllib.request.Request(url, data=body, method=method, headers={
        "Authorization": AUTH, "Content-Type": "application/json; charset=utf-8",
    })
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return True, json.loads(r.read())
    except urllib.error.HTTPError as e:
        return False, {"error": e.read().decode("utf-8", errors="ignore")[:300], "code": e.code}
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


# ── homepage body HTML ────────────────────────────────────────────────────────
def build_homepage():
    return f"""
<!-- ═══ HERO ═══ -->
<section class="bf-hero">
  <div class="bf-hero-body bfc">
    <span class="pg-badge">&#10022; 37&ordf; Edi&ccedil;&atilde;o &middot; Petr&oacute;polis, RJ &middot; 2026</span>
    <h1>Bauernfest<em>a festa alem&atilde; de Petr&oacute;polis</em></h1>
    <p class="bf-hero-sub">
      O guia completo da maior celebra&ccedil;&atilde;o da cultura germ&acirc;nica no Brasil
      &mdash; <strong>gastronomia, programa&ccedil;&atilde;o, turismo e receitas alem&atilde;s</strong>
      para planejar sua visita ao Pal&aacute;cio de Cristal.
    </p>
    <div class="bf-hero-btns">
      <a href="/datas/" class="btnp">Ver Programa&ccedil;&atilde;o 2026 &rarr;</a>
      <a href="/o-que-e/" class="btno">O que &eacute; a Bauernfest?</a>
    </div>
  </div>
  <div class="bf-stats">
    <div class="bf-stat">
      <div class="bf-stat-num">37&ordf;</div>
      <div class="bf-stat-lbl">Edi&ccedil;&atilde;o 2026</div>
    </div>
    <div class="bf-stat">
      <div class="bf-stat-num">17</div>
      <div class="bf-stat-lbl">Dias de festa</div>
    </div>
    <div class="bf-stat">
      <div class="bf-stat-num">Jun&ndash;Jul</div>
      <div class="bf-stat-lbl">Petr&oacute;polis, RJ</div>
    </div>
    <div class="bf-stat">
      <div class="bf-stat-num">Gr&aacute;tis</div>
      <div class="bf-stat-lbl">Entrada gratuita</div>
    </div>
  </div>
</section>

<!-- ═══ SILOS ═══ -->
<section class="bf-silos">
  <div class="bfc">
    <div style="margin-bottom:2.5rem">
      <span class="lbl">Explore o Guia</span>
      <h2 class="ttl">Tudo sobre a Bauernfest</h2>
    </div>
    <div class="cards-grid">

      <a href="/historia/" class="card" style="text-decoration:none;color:inherit">
        <div class="card-img-wrap">
          <img src="{UP}/Historia-da-bauernfest-em-Petropolis.jpg"
               alt="Hist&oacute;ria da Bauernfest em Petr&oacute;polis" loading="lazy">
        </div>
        <div class="card-body">
          <span class="ctag">A Festa</span>
          <h3>Sobre a Bauernfest</h3>
          <p>Hist&oacute;ria, tradi&ccedil;&atilde;o e cultura alem&atilde; preservadas por gera&ccedil;&otilde;es de imigrantes na Serra Fluminense.</p>
          <span class="card-link">Ver guia &rarr;</span>
        </div>
      </a>

      <a href="/datas/" class="card" style="text-decoration:none;color:inherit">
        <div class="card-img-wrap">
          <img src="{UP}/Programacao-Bauernfest-2026.webp"
               alt="Programa&ccedil;&atilde;o Bauernfest 2026" loading="lazy">
        </div>
        <div class="card-body">
          <span class="ctag">Programa&ccedil;&atilde;o</span>
          <h3>Agenda 2026</h3>
          <p>Datas, shows, concursos e atra&ccedil;&otilde;es dos 17 dias de festa gratuita no Pal&aacute;cio de Cristal.</p>
          <span class="card-link">Ver programa&ccedil;&atilde;o &rarr;</span>
        </div>
      </a>

      <a href="/pratos-tipicos/" class="card" style="text-decoration:none;color:inherit">
        <div class="card-img-wrap">
          <img src="{UP}/A-gastronomia-alema-na-Bauernfest.webp"
               alt="Gastronomia alem&atilde; na Bauernfest" loading="lazy">
        </div>
        <div class="card-body">
          <span class="ctag">Gastronomia</span>
          <h3>Gastronomia Alem&atilde;</h3>
          <p>Eisbein, bratwurst, strudel e chopp artesanal &mdash; o melhor da culin&aacute;ria germ&acirc;nica reunida.</p>
          <span class="card-link">Ver sabores &rarr;</span>
        </div>
      </a>

      <a href="/como-chegar/" class="card" style="text-decoration:none;color:inherit">
        <div class="card-img-wrap">
          <img src="{UP}/Turismo-em-Petropolis.jpeg"
               alt="Turismo em Petr&oacute;polis" loading="lazy">
        </div>
        <div class="card-body">
          <span class="ctag">Turismo</span>
          <h3>Turismo em Petr&oacute;polis</h3>
          <p>Como chegar, onde ficar e o que fazer al&eacute;m da Bauernfest na Serra Fluminense.</p>
          <span class="card-link">Planejar viagem &rarr;</span>
        </div>
      </a>

      <a href="/pretzel/" class="card" style="text-decoration:none;color:inherit">
        <div class="card-img-wrap">
          <img src="{UP}/Pratos-tipicos-alemaes.jpg"
               alt="Receitas alem&atilde;s" loading="lazy">
        </div>
        <div class="card-body">
          <span class="ctag">Receitas</span>
          <h3>Receitas Alem&atilde;s</h3>
          <p>Pretzel, sauerkraut, bratwurst e bolo selva negra &mdash; fa&ccedil;a em casa os sabores da festa.</p>
          <span class="card-link">Ver receitas &rarr;</span>
        </div>
      </a>

      <a href="/o-que-e/" class="card" style="text-decoration:none;color:inherit">
        <div class="card-img-wrap">
          <img src="{UP}/Quando-acontece-a-bauernfest-em-2026.jpg"
               alt="FAQ Bauernfest" loading="lazy">
        </div>
        <div class="card-body">
          <span class="ctag">FAQ</span>
          <h3>Perguntas Frequentes</h3>
          <p>O que &eacute;, quando &eacute;, quanto custa, quem pode ir &mdash; as d&uacute;vidas mais comuns respondidas.</p>
          <span class="card-link">Ver respostas &rarr;</span>
        </div>
      </a>

    </div>
  </div>
</section>

<!-- ═══ INTRO ═══ -->
<section class="bf-intro">
  <div class="bfc">
    <img class="bf-intro-img"
         src="{UP}/Palacio-de-Cristal-na-Bauernfest.jpg"
         alt="Pal&aacute;cio de Cristal na Bauernfest Petr&oacute;polis">
    <h2>O maior festival alem&atilde;o do Brasil</h2>
    <p>A Bauernfest acontece todo ano em Petr&oacute;polis, RJ, no hist&oacute;rico Pal&aacute;cio de Cristal. Durante <strong>17 dias</strong>, a cidade se transforma na capital da cultura germ&acirc;nica do Brasil &mdash; com m&uacute;sica folcl&oacute;rica, gastronomia t&iacute;pica, dan&ccedil;as tradicionais e uma atmosfera &uacute;nica que mistura o charme da Serra Fluminense com a heran&ccedil;a dos imigrantes alem&atilde;es do s&eacute;culo XIX.</p>
    <p>Fundada em 1989, a festa j&aacute; est&aacute; em sua <strong>37&ordf; edi&ccedil;&atilde;o em 2026</strong>, com entrada gratuita em toda a programa&ccedil;&atilde;o cultural. Os pratos e bebidas s&atilde;o pagos nas barracas e restaurantes do evento, com op&ccedil;&otilde;es para todos os gostos &mdash; do Eisbein ao strudel de ma&ccedil;&atilde;.</p>
    <p><a href="/historia/" class="card-link">Conhecer a hist&oacute;ria completa &rarr;</a></p>
  </div>
</section>

<!-- ═══ DESTAQUES ═══ -->
<section class="bf-section" style="background:#fff">
  <div class="bfc">
    <div style="margin-bottom:2.5rem">
      <span class="lbl">Artigos em destaque</span>
      <h2 class="ttl">N&atilde;o perca estes conte&uacute;dos</h2>
    </div>
    <div class="cards-grid">

      <a href="/eisbein/" class="card" style="text-decoration:none;color:inherit">
        <div class="card-img-wrap">
          <img src="{UP}/Eisbein-na-Bauernfest.jpg"
               alt="Eisbein na Bauernfest" loading="lazy">
        </div>
        <div class="card-body">
          <span class="ctag">Gastronomia</span>
          <h3>Eisbein &mdash; O prato s&iacute;mbolo da festa</h3>
          <p>Joelho de porco defumado e assado com pele crocante, servido com chucrute e mostarda alem&atilde;.</p>
          <span class="card-link">Ler artigo &rarr;</span>
        </div>
      </a>

      <a href="/palacio/" class="card" style="text-decoration:none;color:inherit">
        <div class="card-img-wrap">
          <img src="{UP}/Palacio-de-Cristal-em-Petropolis.webp"
               alt="Pal&aacute;cio de Cristal Petr&oacute;polis" loading="lazy">
        </div>
        <div class="card-body">
          <span class="ctag">Sobre</span>
          <h3>Pal&aacute;cio de Cristal &mdash; O palco da festa</h3>
          <p>Constru&iacute;do em 1884 por ordem de D. Pedro II, o Pal&aacute;cio de Cristal &eacute; o cora&ccedil;&atilde;o da Bauernfest.</p>
          <span class="card-link">Ler artigo &rarr;</span>
        </div>
      </a>

      <a href="/dancas/" class="card" style="text-decoration:none;color:inherit">
        <div class="card-img-wrap">
          <img src="{UP}/As-dancas-folcloricas-alemas-na-Bauernfest.jpeg"
               alt="Dan&ccedil;as folcl&oacute;ricas alem&atilde;s na Bauernfest" loading="lazy">
        </div>
        <div class="card-body">
          <span class="ctag">Cultura</span>
          <h3>Dan&ccedil;as Folcl&oacute;ricas Alem&atilde;s</h3>
          <p>Schuhplattler, Walzer e Polka &mdash; os grupos de dan&ccedil;a folcl&oacute;rica que animam a Bauernfest a cada edi&ccedil;&atilde;o.</p>
          <span class="card-link">Ler artigo &rarr;</span>
        </div>
      </a>

    </div>
  </div>
</section>

<!-- ═══ CTA ═══ -->
<section class="sec-red">
  <div class="bfc">
    <h2>Bauernfest 2026 &mdash; 19 de junho a 5 de julho</h2>
    <p>
      17 dias de cultura alem&atilde;, gastronomia e m&uacute;sica no
      <strong>Pal&aacute;cio de Cristal, Petr&oacute;polis, RJ</strong>.
      Programa&ccedil;&atilde;o cultural inteiramente gratuita.
    </p>
    <a href="/datas/" class="btnp">Ver programa&ccedil;&atilde;o completa</a>
  </div>
</section>
"""


# ── main ─────────────────────────────────────────────────────────────────────
def main():
    log("=== HOMEPAGE BAUERNFEST ===")
    css_main, css_nav, nav_html, foot_html = load_assets()

    body   = build_homepage()
    inner  = f"{GFONTS}\n<style>{minify_css(css_main)}</style>\n<style>{minify_css(css_nav)}</style>\n{nav_html}\n{body}\n{foot_html}"
    content = f"<!-- wp:html -->\n{inner}\n<!-- /wp:html -->"
    log(f"Content: {len(content):,} chars")

    # Upsert page slug=homepage
    ok, existing = api("GET", "pages?slug=homepage&per_page=1")
    page_data = {
        "slug": "homepage",
        "title": "Bauernfest — Guia completo da festa alemã de Petrópolis",
        "content": content,
        "status": "publish",
        "template": "elementor_canvas",
        "meta": {"_elementor_data": "[]", "_elementor_edit_mode": ""},
    }
    if ok and existing:
        pid = existing[0]["id"]
        ok2, _ = api("POST", f"pages/{pid}", page_data)
        tag = "UPDATE"
    else:
        ok2, res = api("POST", "pages", page_data)
        pid = res.get("id") if ok2 else None
        tag = "CREATE"
        if not ok2:
            log(f"  ERRO ao criar page: {res}"); return

    log(f"  {tag}  ID={pid}  OK={ok2}")

    # Set as WordPress front page
    log("\n  Definindo como front page...")
    ok3, r3 = api("POST", "../settings", {"page_on_front": pid, "show_on_front": "page"})
    if ok3 and r3.get("show_on_front") == "page":
        log(f"  OK  front page = ID {pid}")
    else:
        log(f"  AVISO: configurar manualmente:")
        log(f"  WP Admin > Configuracoes > Leitura > Pagina inicial: selecionar 'homepage'")

    log(f"\n=== FEITO: https://bauernfest.org/ ===")

if __name__ == "__main__":
    main()
