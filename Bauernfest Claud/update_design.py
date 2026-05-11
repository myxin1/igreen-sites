#!/usr/bin/env python3
"""
BauerUP v2 - Propaga o novo design (bf-main.css) para todas as páginas
"""
import os
import re
from pathlib import Path

ROOT = Path("site-bauernfest")

# ── NOVO HEADER HTML ──────────────────────────────────────────────────────────
NEW_HEADER = """<header class="bf-header-shell">
  <div class="bf-topbar">
    <div class="bf-topbar-inner">
      <p class="bf-topbar-copy">37&ordf; edi&ccedil;&atilde;o &bull; 19 Jun a 5 Jul 2026 &bull; Pal&aacute;cio de Cristal &bull; Entrada gratuita</p>
      <a href="https://bauernfest.org/programacao/" class="bf-topbar-link">Ver programa&ccedil;&atilde;o &rarr;</a>
    </div>
  </div>
  <nav class="bfnav" aria-label="Principal">
    <div class="bf-brand-wrap">
      <a href="https://bauernfest.org/" class="bflogo">Bauern<span>fest</span></a>
      <span class="bf-brand-meta">Guia da festa alem&atilde; de Petr&oacute;polis</span>
    </div>
    <button class="bfburg" id="bfBurger" aria-label="Abrir menu" aria-expanded="false">
      <span></span><span></span><span></span>
    </button>
    <ul class="bfnl" id="bfMenu">
      <li><a href="https://bauernfest.org/sobre/">A Festa</a></li>
      <li><a href="https://bauernfest.org/programacao/">Programa&ccedil;&atilde;o</a></li>
      <li><a href="https://bauernfest.org/gastronomia/">Gastronomia</a></li>
      <li><a href="https://bauernfest.org/turismo/">Turismo</a></li>
      <li><a href="https://bauernfest.org/receitas-alemas/">Receitas</a></li>
      <li><a href="https://bauernfest.org/faq/">FAQ</a></li>
      <li><a href="https://bauernfest.org/programacao/" class="ncta">Agenda 2026</a></li>
    </ul>
  </nav>
</header>"""

# ── NOVO FOOTER HTML ──────────────────────────────────────────────────────────
NEW_FOOTER = """
<footer class="bfftr">
  <div class="bfc">
    <div class="ftr-top">
      <div class="ftr-brand">
        <a href="https://bauernfest.org/" class="ftr-logo">Bauern<span>fest</span></a>
        <p>Um guia editorial para planejar a experi&ecirc;ncia completa da Bauernfest em Petr&oacute;polis, da agenda cultural ao roteiro gastron&ocirc;mico.</p>
        <div class="ftr-tags">
          <span>37&ordf; edi&ccedil;&atilde;o</span>
          <span>19 Jun a 5 Jul 2026</span>
          <span>Petr&oacute;polis, RJ</span>
        </div>
      </div>
      <div class="ftr-event-card">
        <span class="ftr-label">Planeje sua visita</span>
        <strong>17 dias de cultura alem&atilde;, chopp artesanal e programa&ccedil;&atilde;o gratuita.</strong>
        <p>Monte seu roteiro com os conte&uacute;dos de programa&ccedil;&atilde;o, turismo, gastronomia e perguntas frequentes.</p>
        <a href="https://bauernfest.org/programacao/" class="ftr-event-link">Ver agenda 2026</a>
      </div>
    </div>
    <div class="ftrgrid">
      <div class="ftrcol">
        <h4>A Festa</h4>
        <ul>
          <li><a href="https://bauernfest.org/sobre/">Vis&atilde;o geral</a></li>
          <li><a href="https://bauernfest.org/sobre/historia-bauernfest-petropolis/">Hist&oacute;ria da Bauernfest</a></li>
          <li><a href="https://bauernfest.org/sobre/palacio-de-cristal-petropolis/">Pal&aacute;cio de Cristal</a></li>
          <li><a href="https://bauernfest.org/sobre/dancas-folcloricas-alemas-petropolis/">Dan&ccedil;as folcl&oacute;ricas</a></li>
        </ul>
      </div>
      <div class="ftrcol">
        <h4>Programa&ccedil;&atilde;o</h4>
        <ul>
          <li><a href="https://bauernfest.org/programacao/">Agenda principal</a></li>
          <li><a href="https://bauernfest.org/programacao/bauernfest-2026-datas/">Datas 2026</a></li>
          <li><a href="https://bauernfest.org/programacao/shows-musica-ao-vivo-bauernfest/">Shows e m&uacute;sica</a></li>
          <li><a href="https://bauernfest.org/programacao/vale-germanico-bauernfest/">Vale Germ&acirc;nico</a></li>
        </ul>
      </div>
      <div class="ftrcol">
        <h4>Sabores</h4>
        <ul>
          <li><a href="https://bauernfest.org/gastronomia/">Gastronomia alem&atilde;</a></li>
          <li><a href="https://bauernfest.org/gastronomia/pratos-tipicos-bauernfest/">Pratos t&iacute;picos</a></li>
          <li><a href="https://bauernfest.org/gastronomia/chopp-artesanal-petropolis/">Chopp artesanal</a></li>
          <li><a href="https://bauernfest.org/receitas-alemas/">Receitas alem&atilde;s</a></li>
        </ul>
      </div>
      <div class="ftrcol">
        <h4>Turismo</h4>
        <ul>
          <li><a href="https://bauernfest.org/turismo/">Planejar viagem</a></li>
          <li><a href="https://bauernfest.org/turismo/como-chegar-bauernfest-rio-de-janeiro/">Como chegar</a></li>
          <li><a href="https://bauernfest.org/turismo/hoteis-perto-bauernfest-petropolis/">Hot&eacute;is</a></li>
          <li><a href="https://bauernfest.org/turismo/o-que-fazer-petropolis/">O que fazer</a></li>
        </ul>
      </div>
      <div class="ftrcol">
        <h4>Institucional</h4>
        <ul>
          <li><a href="https://bauernfest.org/faq/">FAQ</a></li>
          <li><a href="https://bauernfest.org/contato/">Contato</a></li>
          <li><a href="https://bauernfest.org/anuncie/">Anuncie</a></li>
          <li><a href="https://bauernfest.org/politica-de-privacidade/">Privacidade</a></li>
          <li><a href="https://bauernfest.org/termos-de-uso/">Termos de uso</a></li>
        </ul>
      </div>
    </div>
    <hr class="ftr-divider"/>
    <div class="ftrbtm">
      <span>&copy; 2026 Bauernfest.org &mdash; Conte&uacute;do editorial sobre a festa alem&atilde; de Petr&oacute;polis.</span>
      <div class="ftr-legal">
        <a href="https://bauernfest.org/politica-de-privacidade/">Privacidade</a>
        <a href="https://bauernfest.org/termos-de-uso/">Termos</a>
        <a href="https://bauernfest.org/anuncie/">Anuncie</a>
        <a href="https://bauernfest.org/contato/">Contato</a>
      </div>
    </div>
  </div>
</footer>

<script>
(function(){
  var btn=document.getElementById('bfBurger');
  var menu=document.getElementById('bfMenu');
  if(!btn||!menu)return;
  btn.addEventListener('click',function(){
    var open=menu.classList.toggle('bfopen');
    btn.classList.toggle('open',open);
    btn.setAttribute('aria-expanded',open);
  });
  document.addEventListener('click',function(e){
    if(menu.classList.contains('bfopen')&&!e.target.closest('.bfnav')){
      menu.classList.remove('bfopen');
      btn.classList.remove('open');
      btn.setAttribute('aria-expanded','false');
    }
  });
})();
</script>
"""

# ── HELPERS ──────────────────────────────────────────────────────────────────
def depth_prefix(filepath: Path) -> str:
    """Retorna '../' repetido pela profundidade relativa a ROOT."""
    rel = filepath.relative_to(ROOT)
    depth = len(rel.parts) - 1
    return "../" * depth if depth > 0 else ""

def fix_css_link(content: str, prefix: str) -> str:
    """
    Adiciona/move link bf-main.css para DEPOIS do último </style> no <head>.
    Isso garante que bf-main.css sobrescreva CSS inline de mesma especificidade.
    """
    link_tag = f'<link rel="stylesheet" href="{prefix}assets/bf-main.css"/>'

    # Remove qualquer link bf-main.css existente (será re-inserido na posição correta)
    content = re.sub(r'\n?<link[^>]+bf-main\.css[^>]*/?>[ \t]*\n?', '\n', content)

    # Encontra a posição do último </style> ANTES de </head>
    head_end = content.find('</head>')
    if head_end < 0:
        head_end = len(content)

    head_section = content[:head_end]
    last_style_close = head_section.rfind('</style>')

    if last_style_close >= 0:
        insert_pos = last_style_close + len('</style>')
        content = content[:insert_pos] + '\n' + link_tag + content[insert_pos:]
    elif '</head>' in content:
        content = content.replace('</head>', link_tag + '\n</head>', 1)

    return content

def fix_fonts_link(content: str) -> str:
    """Garante que o font DM Sans 700;800 está carregado."""
    old_font = "family=DM+Sans:wght@300;400;500&"
    new_font = "family=DM+Sans:wght@300;400;500;700;800&"
    return content.replace(old_font, new_font)

def strip_old_nav_css(content: str) -> str:
    """
    Remove blocos CSS inline que são do nav/footer antigo.
    Identifica pelo comentário '/* NAV */' ou '/* ── NAV ──' até '/* ── HERO' ou similar.
    Também remove o bloco '/* NEWSLETTER */' até fim do </style>.
    """
    # Padrão 1: bloco de CSS nav-breadcrumb colado inline
    # começa em /* NAV */ ou variações e vai até o fim do <style> que o contém
    # Estratégia: encontrar blocos <style>...</style> que contenham '.bf-header-shell'
    # e removê-los completamente (eram o nav-breadcrumb.css colado)

    # Remove blocos <style> separados que contenham APENAS CSS de nav/footer global
    # (identificados por conter '.bf-header-shell{' ou '.bf-footer-shell{' mas NÃO
    #  conter CSS de conteúdo da página como '.pg-hero' ou '.article-grid')
    def is_global_only_block(css_text):
        has_global = ('.bf-header-shell' in css_text or
                      '.bf-footer-shell' in css_text or
                      '.bf-newsletter' in css_text)
        has_page_specific = ('.pg-hero' in css_text or
                             '.article-grid' in css_text or
                             '.cards-grid' in css_text or
                             '.pg-h1' in css_text or
                             'article-wrap' in css_text)
        return has_global and not has_page_specific

    # Encontra todos os blocos <style>...</style>
    style_blocks = list(re.finditer(r'<style[^>]*>(.*?)</style>', content, re.DOTALL))

    for match in reversed(style_blocks):  # reversed para não deslocar índices
        css = match.group(1)
        if is_global_only_block(css):
            content = content[:match.start()] + content[match.end():]

    return content

def replace_header(content: str) -> tuple[str, bool]:
    """Substitui o bloco <header class="bf-header-shell">...</header> pelo novo."""
    pattern = r'<header[^>]*class="bf-header-shell"[^>]*>[\s\S]*?</header>'
    new_content, count = re.subn(pattern, NEW_HEADER, content, count=1)
    return new_content, count > 0

def replace_footer(content: str) -> tuple[str, bool]:
    """
    Substitui tudo desde o bloco de newsletter/footer até </html> pelo novo footer.
    Suporta os três formatos históricos das páginas.
    """
    replacement = NEW_FOOTER + '\n</body>\n</html>'

    # Padrão 1: começa no div.bf-footer-shell (formato muito antigo)
    pattern = r'<div[^>]*class="bf-footer-shell"[\s\S]*?</html>'
    new_content, count = re.subn(pattern, replacement, content, count=1, flags=re.DOTALL)
    if count > 0:
        return new_content, True

    # Padrão 2: começa na section.bf-nl-section (newsletter + footer — v2)
    pattern2 = r'<section[^>]*class="bf-nl-section"[\s\S]*?</html>'
    new_content, count = re.subn(pattern2, replacement, content, count=1, flags=re.DOTALL)
    if count > 0:
        return new_content, True

    # Padrão 3: começa no footer.bfftr direto (sem newsletter)
    pattern3 = r'<!-- FOOTER -->\s*<footer[^>]*class="bfftr"[\s\S]*?</html>'
    new_content, count = re.subn(pattern3, replacement, content, count=1, flags=re.DOTALL)
    if count > 0:
        return new_content, True

    pattern4 = r'<footer[^>]*class="bfftr"[\s\S]*?</html>'
    new_content, count = re.subn(pattern4, replacement, content, count=1, flags=re.DOTALL)
    return new_content, count > 0

def remove_conflicting_css(content: str) -> str:
    """
    Remove/limpa regras CSS inline que conflitam com bf-main.css.
    Opera dentro dos blocos <style>...</style>.
    """
    # 1. Remove a regra simples .bfftr{...} que conflita com o nosso .bfftr em bf-main.css
    #    (o old bfftr usa background:var(--dark) e padding errado)
    content = re.sub(r'\.bfftr\s*\{[^}]*\}', '', content)

    # 2. Remove .bfnl{display:flex;...} simples (não scoped) que conflita
    #    Mantém .bf-header-shell .bfnl que tem mesma especificidade que o nosso
    content = re.sub(r'(?<!-shell )\.bfnl\s*\{[^}]*display\s*:\s*(?:flex|none)[^}]*\}', '', content)

    # 3. Remove regra .bfnav simples sem parent (padding/background antigo)
    content = re.sub(r'(?<!\.)bfnav\s*\{[^}]*padding[^}]*\}', '', content)

    return content

def fix_bfsite_wrapper(content: str) -> str:
    return content

def upgrade_breadcrumb(content: str) -> str:
    """
    Atualiza breadcrumbs antigos (classe .bcr / .bcr-in) para a nova classe bf-breadcrumb.
    Preserva o conteúdo dos links.
    """
    # Padrão antigo: <div class="bcr"><div class="bcr-in">...</div></div>
    def replace_bcr(m):
        inner = m.group(1)
        # Converte span.bcr-sep para span >
        inner = inner.replace('<span class="bcr-sep">›</span>', '<span>›</span>')
        return f'<nav class="bf-breadcrumb"><nav>{inner}</nav></nav>'

    content = re.sub(
        r'<div[^>]*class="bcr"[^>]*><div[^>]*class="bcr-in"[^>]*>([\s\S]*?)</div></div>',
        replace_bcr,
        content
    )

    # Breadcrumb já no formato .bf-breadcrumb mas sem o <nav> duplo — deixa como está
    return content

def process_file(filepath: Path) -> str:
    """Processa um arquivo HTML e retorna status."""
    try:
        content = filepath.read_text(encoding='utf-8')
    except Exception as e:
        return f"ERRO leitura: {e}"

    original = content
    prefix = depth_prefix(filepath)

    # 1. Garante link para bf-main.css
    content = fix_css_link(content, prefix)

    # 2. Garante DM Sans 700;800 no Google Fonts
    content = fix_fonts_link(content)

    # 3. Remove blocos <style> que são apenas CSS de nav/footer global
    content = strip_old_nav_css(content)

    # 3b. Remove regras CSS individuais que conflitam com bf-main.css
    content = remove_conflicting_css(content)

    # 4. Substitui header
    content, header_ok = replace_header(content)

    # 5. Substitui footer
    content, footer_ok = replace_footer(content)

    # 6. Atualiza breadcrumbs antigos
    content = upgrade_breadcrumb(content)

    if content == original:
        return "SKIPPED (sem alterações)"

    try:
        filepath.write_text(content, encoding='utf-8')
    except Exception as e:
        return f"ERRO escrita: {e}"

    flags = []
    if header_ok:
        flags.append("header")
    if footer_ok:
        flags.append("footer")
    if "bf-main.css" in content and "bf-main.css" not in original:
        flags.append("CSS link")
    return f"UPDATED [{', '.join(flags) if flags else 'CSS/breadcrumb'}]"


def main():
    os.chdir(Path(__file__).parent)

    html_files = sorted(ROOT.rglob("*.html"))

    # Exclui homepage (já reescrita manualmente)
    skip = {ROOT / "index.html"}
    to_process = [f for f in html_files if f not in skip]

    print(f"\n=== BauerUP v2 — {len(to_process)} páginas para processar ===\n")

    updated = []
    skipped = []

    for f in to_process:
        status = process_file(f)
        rel = str(f.relative_to(ROOT))
        if "UPDATED" in status:
            updated.append(rel)
            print(f"  OK  {rel:55s} {status}")
        elif "ERRO" in status:
            print(f"  XX  {rel:55s} {status}")
        else:
            skipped.append(rel)
            print(f"  --  {rel:55s} {status}")

    print(f"\n=== Resumo ===")
    print(f"  Updated : {len(updated)}")
    print(f"  Skipped : {len(skipped)}")
    print(f"\nPróximo passo:")
    print('  cd "c:/Users/User/Downloads/Projeto Claude Code"')
    print('  git add -A && git commit -m "design: BauerUP v2 – novo CSS, nav com topbar, footer limpo"')


if __name__ == "__main__":
    main()
