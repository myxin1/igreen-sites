import os
import re
import glob

BASE = "c:/Users/User/Downloads/Projeto Claude Code/Bauernfest Claud/site-bauernfest"

NL_CSS = """
/* NEWSLETTER */
.bf-newsletter{background:linear-gradient(135deg,#1a0d05 0%,#2a1508 100%);border-top:2px solid var(--gold);padding:3rem 1rem;text-align:center}
.bf-newsletter .nl-inner{max-width:560px;margin:0 auto}
.bf-newsletter .nl-badge{display:inline-block;border:1px solid var(--gold);color:var(--glt);font-size:.65rem;letter-spacing:.15em;text-transform:uppercase;padding:.28rem .8rem;border-radius:2px;margin-bottom:.9rem;font-family:'DM Sans',sans-serif}
.bf-newsletter h2{font-family:'Playfair Display',serif;font-size:clamp(1.3rem,3.5vw,1.9rem);font-weight:900;color:#fff;line-height:1.2;margin-bottom:.55rem}
.bf-newsletter h2 em{font-style:italic;color:var(--glt)}
.bf-newsletter p{font-family:'Lora',serif;font-size:.92rem;color:rgba(255,255,255,.6);line-height:1.75;margin-bottom:1.4rem}
.nl-form{display:flex;flex-direction:column;gap:.7rem}
@media(min-width:480px){.nl-form{flex-direction:row}}
.nl-form input[type=email]{flex:1;background:rgba(255,255,255,.08);border:1px solid rgba(200,146,42,.35);border-radius:4px;padding:.82rem 1.1rem;font-family:'DM Sans',sans-serif;font-size:.9rem;color:#fff;outline:none;transition:border-color .2s,background .2s;min-height:48px}
.nl-form input[type=email]::placeholder{color:rgba(255,255,255,.35)}
.nl-form input[type=email]:focus{border-color:var(--gold);background:rgba(255,255,255,.12)}
.nl-form button{background:var(--gold);color:var(--dark);border:none;border-radius:4px;padding:.82rem 1.6rem;font-family:'DM Sans',sans-serif;font-weight:700;font-size:.88rem;cursor:pointer;min-height:48px;white-space:nowrap;transition:background .2s,transform .15s;flex-shrink:0}
.nl-form button:hover{background:var(--glt);transform:translateY(-2px)}
.nl-note{font-family:'DM Sans',sans-serif;font-size:.72rem;color:rgba(255,255,255,.3);margin-top:.7rem}
.nl-note a{color:rgba(255,255,255,.4);text-decoration:underline}"""

FTR_CSS = """
/* FOOTER */
.bfftr{background:var(--dark);padding:3.5rem 1rem 0;color:rgba(255,255,255,.42);width:100vw;position:relative;left:50%;margin-left:-50vw}
@media(min-width:640px){.bfftr{padding:4rem 1.5rem 0}}
.ftrgrid{display:grid;grid-template-columns:1fr 1fr;gap:2rem 1.5rem;max-width:1160px;margin:0 auto 2.5rem}
@media(min-width:640px){.ftrgrid{grid-template-columns:repeat(3,1fr)}}
@media(min-width:1024px){.ftrgrid{grid-template-columns:2fr 1fr 1fr 1fr 1fr;gap:2rem 2.5rem}}
.ftrbrand{grid-column:1/-1}
@media(min-width:1024px){.ftrbrand{grid-column:auto}}
.ftrbrand p{font-family:'DM Sans',sans-serif;font-size:.83rem;line-height:1.7;margin-top:.7rem;color:rgba(255,255,255,.38);max-width:220px}
.ftr-social{display:flex;gap:.6rem;margin-top:1.1rem}
.ftr-social a{display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:50%;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);font-size:1rem;transition:background .2s,border-color .2s;text-decoration:none}
.ftr-social a:hover{background:rgba(200,146,42,.18);border-color:var(--gold)}
.ftrcol h4{font-family:'DM Sans',sans-serif;font-weight:700;font-size:.72rem;color:rgba(255,255,255,.9);margin-bottom:1rem;letter-spacing:.12em;text-transform:uppercase}
.ftrcol ul{display:flex;flex-direction:column;gap:.35rem}
.ftrcol ul li a{font-family:'DM Sans',sans-serif;font-size:.82rem;color:rgba(255,255,255,.36);transition:color .2s;display:inline-block;min-height:30px;line-height:30px}
.ftrcol ul li a:hover{color:var(--glt)}
.ftr-divider{max-width:1160px;margin:0 auto;border:none;border-top:1px solid rgba(255,255,255,.07)}
.ftrbtm{max-width:1160px;margin:0 auto;padding:1.2rem 0;display:flex;flex-direction:column;gap:.5rem;font-family:'DM Sans',sans-serif;font-size:.74rem;text-align:center;color:rgba(255,255,255,.25)}
@media(min-width:640px){.ftrbtm{flex-direction:row;justify-content:space-between;align-items:center;text-align:left}}
.ftrbtm a{color:rgba(255,255,255,.22);text-decoration:none}
.ftrbtm a:hover{color:var(--glt)}
.ftr-legal{display:flex;flex-wrap:wrap;gap:1rem;justify-content:center}
@media(min-width:640px){.ftr-legal{justify-content:flex-end}}
.ftr-legal a{color:rgba(255,255,255,.28);font-family:'DM Sans',sans-serif;font-size:.72rem;transition:color .2s;text-decoration:none}
.ftr-legal a:hover{color:var(--glt)}"""

NEW_FOOTER_HTML = """<!-- NEWSLETTER -->
<section class="bf-newsletter">
  <div class="nl-inner">
    <span class="nl-badge">\U0001f4ec Fique por dentro</span>
    <h2>Novidades da <em>Bauernfest</em></h2>
    <p>Receba programa\u00e7\u00e3o, receitas alem\u00e3s e dicas de turismo em Petr\u00f3polis direto no seu e-mail. Sem spam \u2014 s\u00f3 o melhor da cultura germ\u00e2nica.</p>
    <form class="nl-form" action="#" method="post" novalidate>
      <input type="email" name="email" placeholder="seu@email.com" required autocomplete="email" aria-label="Seu e-mail"/>
      <button type="submit">Quero receber</button>
    </form>
    <p class="nl-note">
      Ao se inscrever, voc\u00ea concorda com nossa
      <a href="https://bauernfest.org/politica-de-privacidade/">Pol\u00edtica de Privacidade</a>.
      Cancele a qualquer momento.
    </p>
  </div>
</section>

<!-- FOOTER -->
<footer class="bfftr">
  <div class="ftrgrid bfc">

    <div class="ftrbrand">
      <a href="https://bauernfest.org/" class="bflogo">Bauern<span>fest</span></a>
      <p>A segunda maior festa germ\u00e2nica do Brasil, no Pal\u00e1cio de Cristal em Petr\u00f3polis, RJ \u2014 desde 1989.</p>
      <div class="ftr-social">
        <a href="https://www.facebook.com/bauernfest" target="_blank" rel="noopener" aria-label="Facebook" title="Facebook">\U0001f4d8</a>
        <a href="https://www.instagram.com/bauernfest" target="_blank" rel="noopener" aria-label="Instagram" title="Instagram">\U0001f4f7</a>
        <a href="https://www.youtube.com/@bauernfest" target="_blank" rel="noopener" aria-label="YouTube" title="YouTube">\u25b6\ufe0f</a>
      </div>
    </div>

    <div class="ftrcol">
      <h4>A Festa</h4>
      <ul>
        <li><a href="https://bauernfest.org/sobre/">Nossa Hist\u00f3ria</a></li>
        <li><a href="https://bauernfest.org/palacio-de-cristal/">Pal\u00e1cio de Cristal</a></li>
        <li><a href="https://bauernfest.org/dancas-folcloricas/">Dan\u00e7as Folcl\u00f3ricas</a></li>
        <li><a href="https://bauernfest.org/como-chegar/">Como Chegar</a></li>
      </ul>
    </div>

    <div class="ftrcol">
      <h4>Explore</h4>
      <ul>
        <li><a href="https://bauernfest.org/programacao/">Programa\u00e7\u00e3o 2026</a></li>
        <li><a href="https://bauernfest.org/vale-germanico/">Vale Germ\u00e2nico</a></li>
        <li><a href="https://bauernfest.org/gastronomia/">Gastronomia Alem\u00e3</a></li>
        <li><a href="https://bauernfest.org/gastronomia/pratos-tipicos/">Pratos T\u00edpicos</a></li>
      </ul>
    </div>

    <div class="ftrcol">
      <h4>Turismo</h4>
      <ul>
        <li><a href="https://bauernfest.org/turismo/hoteis-petropolis/">Hot\u00e9is em Petr\u00f3polis</a></li>
        <li><a href="https://bauernfest.org/turismo/o-que-fazer-em-petropolis/">O que fazer</a></li>
        <li><a href="https://bauernfest.org/turismo/petropolis-fim-de-semana/">Fim de semana</a></li>
      </ul>
    </div>

    <div class="ftrcol">
      <h4>Receitas</h4>
      <ul>
        <li><a href="https://bauernfest.org/receitas-alemas/pretzel-receita/">Pretzel</a></li>
        <li><a href="https://bauernfest.org/receitas-alemas/sauerkraut-receita/">Sauerkraut</a></li>
        <li><a href="https://bauernfest.org/receitas-alemas/bratwurst-receita/">Bratwurst</a></li>
        <li><a href="https://bauernfest.org/receitas-alemas/kassler-receita/">Kassler</a></li>
        <li><a href="https://bauernfest.org/receitas-alemas/selva-negra-receita/">Selva Negra</a></li>
      </ul>
    </div>

  </div>

  <hr class="ftr-divider"/>

  <div class="bfc">
    <div class="ftrbtm">
      <span>\u00a9 2026 Bauernfest Petr\u00f3polis. Todos os direitos reservados.</span>
      <div class="ftr-legal">
        <a href="https://bauernfest.org/politica-de-privacidade/">Pol\u00edtica de Privacidade</a>
        <a href="https://bauernfest.org/termos-de-uso/">Termos de Uso</a>
        <a href="https://bauernfest.org/anuncie/">Anuncie</a>
        <a href="https://bauernfest.org/contato/">Contato</a>
      </div>
    </div>
  </div>

</footer>"""

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

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    original = content

    # 1. Replace old footer CSS
    old_ftr_css = re.compile(r'/\* FOOTER \*/.*?(?=</style>)', re.DOTALL)
    if re.search(old_ftr_css, content):
        content = re.sub(old_ftr_css, NL_CSS + FTR_CSS + '\n', content)
    else:
        # Insert before closing </style>
        content = re.sub(r'(</style>)', NL_CSS + FTR_CSS + r'\n\1', content, count=1)

    # 2. Replace footer HTML: from <!-- NEWSLETTER --> or <!-- FOOTER --> to </html>
    tail = re.compile(r'(?:<!-- NEWSLETTER -->.*?)?<!-- FOOTER -->.*', re.DOTALL)
    if re.search(tail, content):
        content = re.sub(tail, NEW_FOOTER_HTML + '\n\n' + NAV_SCRIPT, content)
    else:
        # fallback: from <footer class="bfftr"> to </html>
        tail2 = re.compile(r'<footer class="bfftr">.*', re.DOTALL)
        if re.search(tail2, content):
            content = re.sub(tail2, NEW_FOOTER_HTML.lstrip('\n') + '\n\n' + NAV_SCRIPT, content)

    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print("UPDATED: " + filepath.replace(BASE, ''))
    else:
        print("SKIPPED : " + filepath.replace(BASE, ''))

files = glob.glob(os.path.join(BASE, '**', 'index.html'), recursive=True)
for f in sorted(files):
    process_file(f)

print("\nAll done.")
