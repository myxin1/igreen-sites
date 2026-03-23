"""
BauerUP — Propagador global de mudanças para todas as páginas.
Lê os arquivos fonte em Rodape/ e aplica em cada index.html do site.

Seções gerenciadas:
  CSS topo    → Rodape/nav-breadcrumb.css   (/* NAV */ … .bf-breadcrumb span{opacity:.5})
  CSS base    → Rodape/shared-bottom.css    (/* NEWSLETTER */ … /* FOOTER */ … fim do </style>)
  Nav HTML    → Rodape/nav.html             (<!-- NAV --> … <!-- BREADCRUMB -->)
  Footer HTML → Rodape/footer.html          (<!-- NEWSLETTER --> … </html>)

Como usar: python update_footer.py
"""

import os, re, glob

BASE   = "c:/Users/User/Downloads/Projeto Claude Code/Bauernfest Claud/site-bauernfest"
RODAPE = os.path.join(BASE, "Rodape")

NAV_SCRIPT = """<script>
(function(){
  var burger=document.getElementById('bfBurger'),menu=document.getElementById('bfMenu');
  if(burger&&menu){
    burger.addEventListener('click',function(){
      var open=menu.classList.toggle('bfopen');
      burger.classList.toggle('open',open);
      burger.setAttribute('aria-expanded',String(open));
    });
    document.addEventListener('click',function(e){
      if(!burger.contains(e.target)&&!menu.contains(e.target)){
        menu.classList.remove('bfopen');
        burger.classList.remove('open');
        burger.setAttribute('aria-expanded','false');
      }
    });
  }
})();
</script>
</body>
</html>"""

def read(filename):
    path = os.path.join(RODAPE, filename)
    with open(path, 'r', encoding='utf-8') as f:
        return f.read().strip()

# ── Carrega arquivos fonte ──────────────────────────────────────────────
nav_css    = read('nav-breadcrumb.css')
bottom_css = read('shared-bottom.css')
nav_html   = read('nav.html')
footer_html = read('footer.html')

# ── Processa cada página ────────────────────────────────────────────────
def process(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    original = content

    # 1. CSS do nav+breadcrumb: de /* NAV */ até .bf-breadcrumb span{opacity:.5}
    p_nav_css = re.compile(
        r'/\* NAV \*/.*?\.bf-breadcrumb span\{opacity:\.5\}',
        re.DOTALL
    )
    if re.search(p_nav_css, content):
        content = re.sub(p_nav_css, nav_css, content)

    # 2. CSS da base (newsletter+footer): de /* NEWSLETTER */ até </style>
    #    Remove duplicatas de /* NEWSLETTER */ antes de substituir
    p_bottom_css = re.compile(r'/\* NEWSLETTER \*/.*?(?=</style>)', re.DOTALL)
    if re.search(p_bottom_css, content):
        content = re.sub(p_bottom_css, bottom_css + '\n', content)

    # 3. Nav HTML: de <!-- NAV --> até <!-- BREADCRUMB -->
    p_nav_html = re.compile(r'<!-- NAV -->.*?(?=<!-- BREADCRUMB -->)', re.DOTALL)
    if re.search(p_nav_html, content):
        replacement = '<!-- NAV -->\n' + nav_html + '\n\n'
        content = re.sub(p_nav_html, replacement, content)

    # 4. Footer+Newsletter HTML: de <!-- NEWSLETTER --> até </html>
    p_footer = re.compile(r'(?:<!-- NEWSLETTER -->.*)?<!-- FOOTER -->.*', re.DOTALL)
    if re.search(p_footer, content):
        content = re.sub(p_footer, footer_html + '\n\n' + NAV_SCRIPT, content)

    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        label = filepath.replace(BASE, '').replace('\\', '/')
        print(f"  UPDATED  {label}")
        return True
    else:
        label = filepath.replace(BASE, '').replace('\\', '/')
        print(f"  skipped  {label}")
        return False

# ── Varre todas as páginas (exceto a própria pasta Rodape) ──────────────
files = [
    f for f in glob.glob(os.path.join(BASE, '**', 'index.html'), recursive=True)
    if 'Rodape' not in f
]

print(f"\nBauerUP — {len(files)} páginas encontradas\n")
updated = sum(process(f) for f in sorted(files))
print(f"\nOK: {updated} atualizada(s), {len(files)-updated} sem alteracao.\n")
