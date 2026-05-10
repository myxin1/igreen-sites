"""
gp_widget_css.py — Injects ALL site CSS + Bauernfest footer via GP footer widget.
Approach borrowed from guiaparquesaquaticos.com:
  - CSS lives in the footer block widget → always renders, never stripped by WP
  - Pages get clean content only (breadcrumb + article, no footer, no style blocks)
"""
import urllib.request, base64, json, re, time

WP   = 'https://bauernfest.org'
USER = 'ClaudeBot'
PASS = 'p8Np bMs8 Xnsh MfH2 cZ7u w5xy'

creds = base64.b64encode(f'{USER}:{PASS}'.encode()).decode()
HGET  = {'Authorization': f'Basic {creds}'}
HPOST = {'Authorization': f'Basic {creds}', 'Content-Type': 'application/json'}

YEAR   = 2026
DOMAIN = 'bauernfest.org'

WIDGET_MARKER = 'bf-global-widget'

# ── Page IDs to strip footer + style blocks from ──────────────────────────────
PAGE_IDS = [64, 69, 71, 91, 365, 371,
            579, 580, 581, 582, 583, 584, 585, 586, 587, 588, 589,
            860, 862, 864, 866, 868, 870]

# ══════════════════════════════════════════════════════════════════════════════
# GLOBAL CSS — injected once via footer widget, applies to entire site
# ══════════════════════════════════════════════════════════════════════════════
GLOBAL_CSS = """\
/* bf-global-widget */
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=Lora:wght@400;500;600&family=DM+Sans:wght@300;400;500&display=swap');

:root{
  --rot:#8B1A1A;--gold:#C8922A;--glt:#E8B84B;
  --dark:#1A1008;--cream:#F9F3E8;--text:#2C1A0E;--muted:#7A6048;--nav-h:64px
}

/* ── Reset ── */
*,*::before,*::after{box-sizing:border-box}
body{font-family:'DM Sans',sans-serif;color:var(--text);background:#fff;overflow-x:hidden}
a{text-decoration:none}
img{max-width:100%;height:auto;display:block}

/* ── GP Header ── */
.site-header{background:var(--dark)!important;border-bottom:1px solid rgba(200,146,42,.14)!important;padding:0!important;box-shadow:none!important}
.site-header .inside-header{display:flex;align-items:center;justify-content:space-between;padding:0 1.5rem;min-height:var(--nav-h);max-width:none!important;width:100%}
@media(min-width:1024px){.site-header .inside-header{padding:0 2.5rem}}

/* Site title as logo (text via pseudo-elements) */
.site-title,.site-title a{text-decoration:none!important}
.site-title a{font-size:0!important;display:inline-block}
.site-title a::before{font-family:'Playfair Display',serif;font-size:1.5rem;font-weight:900;letter-spacing:.04em;color:var(--glt);content:'Bauern'}
.site-title a::after{font-family:'Playfair Display',serif;font-size:1.5rem;font-weight:900;letter-spacing:.04em;color:#fff;content:'fest'}
.site-description{display:none!important}

/* GP Nav links */
.main-navigation .nav-menu>li>a,.main-navigation ul>li>a{
  font-family:'DM Sans',sans-serif!important;font-size:.8rem!important;font-weight:500!important;
  letter-spacing:.06em!important;text-transform:uppercase!important;
  color:rgba(255,255,255,.7)!important;transition:color .2s!important;
  min-height:44px;display:flex;align-items:center
}
.main-navigation .nav-menu>li>a:hover,.main-navigation ul>li>a:hover{color:var(--glt)!important}
.main-navigation .nav-menu>li:last-child>a{
  background:var(--gold);color:var(--dark)!important;
  padding:.44rem 1.1rem!important;border-radius:4px;font-weight:700!important
}
.main-navigation .nav-menu>li:last-child>a:hover{background:var(--glt)!important;color:var(--dark)!important}
.main-navigation .nav-menu,.main-navigation ul{background:transparent!important}

/* Mobile toggle */
button.menu-toggle{background:none!important;border:none!important;color:var(--glt)!important;padding:.6rem;min-width:44px;min-height:44px}
button.menu-toggle svg,.menu-toggle .bars,button.menu-toggle::before{fill:var(--glt)!important;color:var(--glt)!important}
.main-navigation.toggled .nav-menu,.main-navigation.toggled ul{background:#130c02!important;border-top:1px solid rgba(200,146,42,.14)!important}
.main-navigation.toggled .nav-menu li,.main-navigation.toggled ul li{border-bottom:1px solid rgba(255,255,255,.05)!important}
.main-navigation.toggled .nav-menu li a,.main-navigation.toggled ul li a{color:rgba(255,255,255,.75)!important;padding:1rem 1.5rem!important}

/* ── Content area full width ── */
.site-content{padding:0!important}
.content-area,.site-main{padding:0!important;margin:0!important;width:100%!important}
.inside-article,.entry-header,.entry-footer{padding:0!important;margin:0!important}
.entry-content{margin:0!important;padding:0!important;max-width:none!important}
.generate-columns-container{display:block!important}
#secondary,.sidebar-primary,.widget-area{display:none!important}

/* ── GP Footer ── */
.site-footer{background:#1A1008!important;padding:0!important;margin:0!important;border-top:2px solid rgba(200,146,42,.18)!important}
.footer-bar,.site-info,.powered-by{display:none!important}
.footer-widgets{padding:0!important;margin:0!important}
.footer-widget-1{width:100%!important;max-width:100%!important;flex:0 0 100%!important;padding:0!important;margin:0!important}
.footer-widget-2,.footer-widget-3,.footer-widget-4,.footer-widget-5{display:none!important}

/* ── Utility ── */
.bfc{max-width:1160px;margin:0 auto;padding:0 1.5rem;width:100%}
.btnp{display:inline-block;background:var(--gold);color:var(--dark);padding:.8rem 2rem;border-radius:4px;font-weight:700;font-size:.92rem;transition:background .2s,transform .15s;text-decoration:none}
.btnp:hover{background:var(--glt);transform:translateY(-2px);color:var(--dark)}

/* ── BREADCRUMB ── */
.bf-breadcrumb{background:var(--cream)!important;border-bottom:1px solid rgba(0,0,0,.06)!important;padding:.6rem 0!important}
.bf-breadcrumb nav{font-family:'DM Sans',sans-serif;font-size:.78rem;color:var(--muted);display:flex;flex-wrap:wrap;gap:.3rem;align-items:center}
.bf-breadcrumb a{color:var(--gold);transition:color .2s}.bf-breadcrumb a:hover{color:var(--rot)}
.bf-breadcrumb span{opacity:.5}
.bcr{background:#fff!important;border-bottom:1px solid rgba(0,0,0,.07)!important;padding:.75rem 1.5rem!important}
.bcr-in{max-width:1160px;margin:0 auto;display:flex;align-items:center;gap:.5rem;flex-wrap:wrap;font-size:.8rem;color:var(--muted)}
.bcr-in a{color:var(--gold);font-weight:500}.bcr-in a:hover{color:var(--rot)}
.bcr-sep{color:rgba(0,0,0,.25)}

/* ── FAQ ARTICLE LAYOUT ── */
.art-wrap{padding:3rem 1.5rem 4rem;background:#fff}
.art-grid{display:grid;grid-template-columns:2fr 1fr;gap:3rem;align-items:start;max-width:1160px;margin:0 auto}
@media(max-width:860px){.art-grid{grid-template-columns:1fr}}
.art-main h1{font-family:'Playfair Display',serif;font-size:clamp(1.8rem,4vw,2.6rem);font-weight:900;color:var(--dark);line-height:1.15;margin-bottom:1rem}
.art-main h2{font-family:'Playfair Display',serif;font-size:1.5rem;font-weight:700;color:var(--dark);margin:2rem 0 .8rem;line-height:1.25}
.art-main h3{font-family:'Playfair Display',serif;font-size:1.15rem;font-weight:700;color:var(--dark);margin:1.5rem 0 .6rem}
.art-main p{font-family:'Lora',serif;font-size:1rem;color:var(--text);line-height:1.88;margin-bottom:1rem}
.art-main strong{color:var(--dark)}
.art-main a{color:var(--gold)}.art-main a:hover{color:var(--rot)}
.art-main ul{margin:1rem 0 1.2rem;display:flex;flex-direction:column;gap:.5rem;list-style:none;padding:0}
.art-main ul li{font-family:'Lora',serif;font-size:.97rem;color:var(--text);line-height:1.7;padding-left:1.4rem;position:relative}
.art-main ul li::before{content:'\\2192';position:absolute;left:0;color:var(--gold);font-weight:700}
.art-img{width:100%;border-radius:8px;object-fit:cover;box-shadow:0 8px 32px rgba(0,0,0,.1);margin:0 0 1.8rem}
.info-box{background:rgba(200,146,42,.08);border-left:4px solid var(--gold);border-radius:0 8px 8px 0;padding:1.2rem 1.4rem;margin:1.5rem 0}
.info-box p{font-family:'Lora',serif;font-size:.96rem;color:var(--text);line-height:1.75;margin:0}
.back-link{display:inline-flex;align-items:center;gap:.4rem;font-family:'DM Sans',sans-serif;font-size:.85rem;color:var(--gold);font-weight:600;margin-top:2rem;transition:color .2s}
.back-link:hover{color:var(--rot)}

/* ── SIDEBAR (FAQ) ── */
.sb-card{background:var(--cream);border-radius:8px;padding:1.5rem;margin-bottom:1.5rem}
.sb-card h4{font-family:'Playfair Display',serif;font-size:1rem;font-weight:700;color:var(--dark);margin-bottom:1rem;border-bottom:1px solid rgba(0,0,0,.07);padding-bottom:.6rem}
.sb-links{display:flex;flex-direction:column;gap:.5rem}
.sb-links a{font-family:'DM Sans',sans-serif;font-size:.85rem;color:var(--muted);padding:.5rem .8rem;border-radius:4px;border-left:3px solid var(--gold);background:#fff;display:block;transition:color .2s,border-color .2s}
.sb-links a:hover{color:var(--rot);border-color:var(--rot)}

/* ── HUB PAGES ── */
.pg-hero{background:var(--dark);position:relative;overflow:hidden;padding:4.5rem 1.5rem 4rem;text-align:center}
.pg-hero::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 80% 60% at 50% 30%,rgba(200,146,42,.16) 0%,transparent 70%),linear-gradient(175deg,#0e0603 0%,#1a0d05 45%,#2a1508 100%)}
.pg-hero-in{position:relative;z-index:2;max-width:760px;margin:0 auto}
.pg-badge{display:inline-block;border:1px solid var(--gold);color:var(--glt);font-size:.7rem;letter-spacing:.15em;text-transform:uppercase;padding:.36rem 1.1rem;border-radius:2px;margin-bottom:1.4rem}
.pg-h1{font-family:'Playfair Display',serif;font-size:clamp(2rem,5vw,3.6rem);font-weight:900;line-height:1.1;color:#fff}
.pg-h1 em{font-style:italic;color:var(--glt);display:block}
.pg-hero-sub,.pg-sub{font-family:'Lora',serif;font-size:1.06rem;line-height:1.8;color:rgba(255,255,255,.65);margin-top:1.2rem}
.article-wrap{background:#fff;padding:3rem 1.5rem}
.article-grid{display:grid;grid-template-columns:2fr 1fr;gap:3rem;align-items:start;max-width:1160px;margin:0 auto}
@media(max-width:860px){.article-grid{grid-template-columns:1fr}}
.article-main h1{font-family:'Playfair Display',serif;font-size:clamp(1.8rem,4vw,2.6rem);font-weight:900;color:var(--dark);line-height:1.15;margin-bottom:1rem}
.article-main h2{font-family:'Playfair Display',serif;font-size:1.7rem;font-weight:700;color:var(--dark);margin:2.2rem 0 .9rem;line-height:1.25}
.article-main h3{font-family:'Playfair Display',serif;font-size:1.25rem;font-weight:700;color:var(--dark);margin:1.8rem 0 .7rem}
.article-main p{font-family:'Lora',serif;font-size:1rem;color:var(--text);line-height:1.88;margin-bottom:1rem}
.article-main ul{margin:1rem 0 1.2rem;display:flex;flex-direction:column;gap:.55rem;list-style:none;padding:0}
.article-main ul li{font-family:'Lora',serif;font-size:.97rem;color:var(--text);line-height:1.7;padding-left:1.4rem;position:relative}
.article-main ul li::before{content:'\\2192';position:absolute;left:0;color:var(--gold);font-weight:700}
.bf-intro{font-family:'Lora',serif;font-size:1.08rem;line-height:1.88;color:var(--text);margin-bottom:1.5rem}
.bf-sec{padding:3rem 1.5rem}
.lbl{display:block;font-size:.72rem;letter-spacing:.2em;text-transform:uppercase;color:var(--gold);font-weight:700;margin-bottom:.7rem}
.ttl{font-family:'Playfair Display',serif;font-size:clamp(1.75rem,4vw,2.8rem);font-weight:900;line-height:1.15;color:var(--dark)}
.ttl em{font-style:italic;color:var(--rot)}
.stxt{font-family:'Lora',serif;font-size:1rem;line-height:1.85;color:var(--muted);margin-top:1rem}

/* ── RECIPE PAGES ── */
.article-wrap.bfc-wrap{display:grid;grid-template-columns:1fr;gap:2rem;padding:2.5rem 0 4rem}
@media(min-width:900px){.article-wrap.bfc-wrap{grid-template-columns:1fr 320px;gap:3rem}}
.article-content h1{font-family:'Playfair Display',serif;font-size:clamp(1.7rem,5vw,2.8rem);font-weight:900;line-height:1.15;color:var(--dark);margin-bottom:1rem}
.article-content p{font-size:clamp(.93rem,2vw,1rem);line-height:1.9;color:var(--text);margin-bottom:1.1rem}
.article-content h2{font-family:'Playfair Display',serif;font-size:clamp(1.2rem,3vw,1.6rem);font-weight:900;color:var(--dark);margin:2rem 0 .8rem;padding-top:1rem;border-top:2px solid var(--cream)}
.article-content h3{font-family:'Playfair Display',serif;font-size:1.05rem;font-weight:700;color:var(--dark);margin:1.4rem 0 .5rem}
.article-content ul,.article-content ol{padding-left:1.4rem;margin-bottom:1.1rem}
.article-content ul{list-style:disc}.article-content ol{list-style:decimal}
.article-content li{font-size:clamp(.93rem,2vw,1rem);line-height:1.85;color:var(--text);margin-bottom:.35rem}
.article-content strong{color:var(--dark);font-weight:600}
.article-content a{color:var(--gold);text-decoration:underline}
.recipe-box{background:var(--cream);border-radius:8px;padding:1.5rem;margin:2rem 0;border-left:4px solid var(--gold)}
.recipe-box h3{font-family:'Playfair Display',serif;font-size:1.1rem;font-weight:900;color:var(--dark);margin-bottom:1rem}
.recipe-stats{display:grid;grid-template-columns:repeat(2,1fr);gap:.6rem;margin-bottom:1.2rem}
@media(min-width:480px){.recipe-stats{grid-template-columns:repeat(4,1fr)}}
.r-stat{text-align:center;background:#fff;border-radius:6px;padding:.7rem .5rem}
.r-stat-val{font-family:'Playfair Display',serif;font-size:1.1rem;font-weight:900;color:var(--gold)}
.r-stat-lbl{font-family:'DM Sans',sans-serif;font-size:.65rem;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-top:.2rem}
.ingredients-list{list-style:disc!important;padding-left:1.3rem!important}
.ingredients-list li{font-family:'DM Sans',sans-serif;font-size:.9rem;color:var(--text);padding:.2rem 0}
.steps-list{counter-reset:step;list-style:none!important;padding:0!important}
.steps-list li{counter-increment:step;display:flex;gap:1rem;margin-bottom:1.4rem;align-items:flex-start}
.steps-list li::before{content:counter(step);flex-shrink:0;width:32px;height:32px;background:var(--rot);color:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:'DM Sans',sans-serif;font-weight:700;font-size:.85rem;margin-top:.15rem}
.step-text{font-size:.95rem;line-height:1.75;color:var(--text)}
.sidebar-box{background:var(--cream);border-radius:8px;padding:1.3rem;margin-bottom:1.4rem}
.sidebar-box h4{font-family:'Playfair Display',serif;font-size:.95rem;font-weight:700;color:var(--dark);margin-bottom:.9rem;border-bottom:1px solid rgba(0,0,0,.08);padding-bottom:.6rem}
.sidebar-links li{margin-bottom:.4rem;list-style:none}
.sidebar-links li a{font-family:'DM Sans',sans-serif;font-size:.84rem;color:var(--gold);display:flex;align-items:center;gap:.4rem;min-height:36px;transition:color .2s}
.sidebar-links li a:hover{color:var(--rot)}
.tip-box{background:rgba(139,26,26,.06);border:1px solid rgba(139,26,26,.15);border-radius:8px;padding:1.1rem;margin-bottom:1.4rem}
.tip-box p{font-family:'DM Sans',sans-serif;font-size:.84rem;color:var(--text);line-height:1.65}
.tip-box strong{color:var(--rot)}
.sec-red{background:var(--rot);text-align:center;padding:3rem 1rem}
.sec-red h2{font-family:'Playfair Display',serif;font-size:clamp(1.3rem,4vw,2rem);font-weight:900;color:#fff}
.sec-red p{color:rgba(255,255,255,.78);font-family:'Lora',serif;font-size:.97rem;margin:.7rem auto 1.4rem;max-width:440px;line-height:1.7}

/* ── Social sharing — hide all plugins + custom bf-share block ── */
.addtoany_share_save_container,.addtoany_shortcode,.a2a_kit,
.sharedaddy,.sd-sharing,.sd-content,.sd-block,
.wp-block-social-links,.jetpack-sharing-buttons,
.sharing-buttons,.social-share,.share-this-block,
[class*="addtoany"],[id*="sharing"],[class*="sshare"],
.share-link-wrapper,.post-share,
.bf-share,.bf-share-btns,.bf-share-title,.bf-share-btn,.bf-share-copy{display:none!important}

/* ── BF Footer widget card (inside GP .site-footer) ── */
.bf-ftr{padding:28px 24px 20px;font-family:'DM Sans',sans-serif}
.bf-ftr-inner{max-width:1160px;margin:0 auto}
.bf-ftr-top{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:1rem;margin-bottom:18px;padding-bottom:18px;border-bottom:1px solid rgba(200,146,42,.18)}
.bf-ftr-logo{font-family:'Playfair Display',serif;font-size:1.4rem;font-weight:900;color:var(--glt);letter-spacing:.04em;text-decoration:none}
.bf-ftr-logo span{color:#fff}
.bf-ftr-nav-links{display:flex;flex-wrap:wrap;gap:0;list-style:none;padding:0;margin:0;align-items:center}
.bf-ftr-nav-links li{display:flex;align-items:center;white-space:nowrap}
.bf-ftr-sep{color:var(--gold);font-size:9px;padding:0 10px;opacity:.6}
.bf-ftr-nav-links a{font-size:.82rem;font-weight:500;color:rgba(255,255,255,.55);transition:color .2s;text-decoration:none}
.bf-ftr-nav-links a:hover{color:var(--glt)}
.bf-ftr-bottom{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:.6rem}
.bf-ftr-copy{font-size:.74rem;color:rgba(255,255,255,.22)}
.bf-ftr-legal{display:flex;flex-wrap:wrap;gap:.8rem;align-items:center}
.bf-ftr-legal li{display:flex;align-items:center;list-style:none}
.bf-ftr-legal a{font-size:.72rem;color:rgba(255,255,255,.32);transition:color .2s;text-decoration:none}
.bf-ftr-legal a:hover{color:var(--glt)}
.bf-ftr-legal .bf-ftr-sep{padding:0 6px}
@media(max-width:640px){.bf-ftr-top{flex-direction:column;align-items:flex-start}.bf-ftr-bottom{flex-direction:column;text-align:center}.bf-ftr-legal{justify-content:center}}

/* ── Back to top ── */
#bf-top{
  position:fixed;bottom:28px;right:24px;width:44px;height:44px;
  background:linear-gradient(135deg,var(--dark) 0%,#2a1508 100%);
  border:1px solid rgba(200,146,42,.4);color:var(--glt);
  border-radius:50%;display:flex;align-items:center;justify-content:center;
  font-size:18px;font-weight:700;cursor:pointer;
  box-shadow:0 4px 18px rgba(0,0,0,.35);
  opacity:0;transform:translateY(14px);
  transition:opacity .3s,transform .3s,background .25s;
  z-index:9999;text-decoration:none
}
#bf-top.on{opacity:1;transform:translateY(0)}
#bf-top:hover{background:linear-gradient(135deg,var(--gold) 0%,var(--glt) 100%);color:var(--dark);text-decoration:none}
@media(max-width:600px){#bf-top{bottom:18px;right:16px;width:40px;height:40px;font-size:16px}}"""

# ── Footer HTML card ─────────────────────────────────────────────────────────
def footer_html():
    nav = [
        ('/sobre/', 'A Festa'),
        ('/programacao/', 'Programação'),
        ('/gastronomia/', 'Gastronomia'),
        ('/turismo/', 'Turismo'),
        ('/receitas-alemas/', 'Receitas'),
        ('/faq/', 'FAQ'),
    ]
    legal = [
        ('/termos-de-uso/', 'Termos de Uso'),
        ('/politica-de-privacidade/', 'Política de Privacidade'),
        ('/contato/', 'Contato'),
    ]

    nav_items = ''
    for i, (href, label) in enumerate(nav):
        if i > 0:
            nav_items += '<li><span class="bf-ftr-sep">&#9733;</span></li>'
        nav_items += f'<li><a href="https://bauernfest.org{href}">{label}</a></li>'

    legal_items = ''
    for i, (href, label) in enumerate(legal):
        if i > 0:
            legal_items += '<li><span class="bf-ftr-sep">&#183;</span></li>'
        legal_items += f'<li><a href="https://bauernfest.org{href}">{label}</a></li>'

    return f"""\
<div class="bf-ftr">
  <div class="bf-ftr-inner">
    <div class="bf-ftr-top">
      <a href="https://bauernfest.org/" class="bf-ftr-logo">Bauern<span>fest</span></a>
      <ul class="bf-ftr-nav-links">{nav_items}</ul>
    </div>
    <div class="bf-ftr-bottom">
      <span class="bf-ftr-copy">&copy; {YEAR} {DOMAIN}</span>
      <ul class="bf-ftr-legal">{legal_items}</ul>
    </div>
  </div>
</div>
<a id="bf-top" href="#" role="button" aria-label="Voltar ao topo">&#8593;</a>
<script>
(function(){{
  var btn=document.getElementById('bf-top');
  if(!btn)return;
  window.addEventListener('scroll',function(){{btn.classList[window.scrollY>320?'add':'remove']('on')}},{{passive:true}});
  btn.addEventListener('click',function(e){{e.preventDefault();window.scrollTo({{top:0,behavior:'smooth'}});}});
}})();
</script>"""

def widget_block():
    return (
        '<!-- wp:html -->\n'
        '<style>\n' + GLOBAL_CSS + '\n</style>\n'
        + footer_html() + '\n'
        '<!-- /wp:html -->'
    )


# ── REST API helpers ──────────────────────────────────────────────────────────
def api(url, body=None, method=None):
    method = method or ('POST' if body is not None else 'GET')
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(
        url, data=data,
        headers=HPOST if data else HGET,
        method=method)
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())


# ── Find best footer sidebar ──────────────────────────────────────────────────
def find_footer_sidebar():
    sidebars = api(f'{WP}/wp-json/wp/v2/sidebars')
    preferred = ['footer-1', 'footer-bar', 'footer-2', 'footer-3']
    for pref in preferred:
        for sb in sidebars:
            if sb.get('id') == pref:
                return sb['id']
    for sb in sidebars:
        if sb.get('id', '').startswith('footer-'):
            return sb['id']
    return None


# ── Clear + inject footer widget ─────────────────────────────────────────────
def inject_footer_widget(sidebar_id):
    print(f'  Using sidebar: {sidebar_id}')

    # List all block widgets in this sidebar
    all_widgets = api(f'{WP}/wp-json/wp/v2/widgets?per_page=100&sidebar={sidebar_id}')
    for w in all_widgets:
        try:
            api(f'{WP}/wp-json/wp/v2/widgets/{w["id"]}?force=true', {}, method='DELETE')
            print(f'  Removed widget: {w["id"]}')
        except Exception as e:
            print(f'  WARN remove widget {w["id"]}: {e}')

    # Create new block widget
    content = widget_block()
    result = api(f'{WP}/wp-json/wp/v2/widgets', {
        'id_base': 'block',
        'sidebar': sidebar_id,
        'instance': {'raw': {'content': content}},
    })
    widget_id = result.get('id', '?')
    print(f'  Widget created: {widget_id} ({len(content)} chars)')
    return widget_id


# ── Strip style blocks + footer from page post_content ───────────────────────
def strip_page(page_id):
    pg = api(f'{WP}/wp-json/wp/v2/pages/{page_id}?context=edit')
    raw = (pg.get('content') or {}).get('raw', '') or ''
    if not raw:
        return False

    cleaned = raw

    # Remove all bf-* style blocks
    cleaned = re.sub(r'<style[^>]*id="bf-[^"]*"[^>]*>.*?</style>', '', cleaned, flags=re.DOTALL)

    # Remove everything from <footer onwards (our old post_content footer)
    footer_pos = cleaned.find('<footer')
    if footer_pos != -1:
        # include any preceding <!-- FOOTER --> comment
        cm = cleaned.rfind('<!--', max(0, footer_pos - 80), footer_pos)
        if cm != -1 and cleaned[cm:footer_pos].strip().startswith('<!--'):
            footer_pos = cm
        cleaned = cleaned[:footer_pos].rstrip()

    cleaned = cleaned.strip()
    if cleaned == raw.strip():
        return False  # no change needed

    payload = json.dumps({'content': cleaned, 'template': '', 'meta': {
        '_elementor_edit_mode': '', '_elementor_data': '[]',
        '_elementor_page_settings': {},
    }}).encode()
    req = urllib.request.Request(
        f'{WP}/wp-json/wp/v2/pages/{page_id}',
        data=payload, headers=HPOST, method='POST')
    with urllib.request.urlopen(req, timeout=30) as r:
        json.loads(r.read())
    return True


# ── MAIN ─────────────────────────────────────────────────────────────────────
print('\n======================================')
print(' GP Widget CSS -- bauernfest.org')
print('======================================')
print(' CSS + footer injected via footer widget (always renders)')
print(' Inspired by: guiaparquesaquaticos.com approach\n')

# Step 1: List available sidebars
print('[1] Available GP sidebars:')
try:
    all_sidebars = api(f'{WP}/wp-json/wp/v2/sidebars')
    for sb in all_sidebars:
        print(f'    {sb.get("id")} — {sb.get("name")} ({sb.get("status")})')
except Exception as e:
    print(f'  ERRO listing sidebars: {e}')
    all_sidebars = []

# Step 2: Find and inject footer widget
print('\n[2] Injecting footer widget...')
sidebar_id = find_footer_sidebar()
if not sidebar_id:
    print('  ERRO: No footer sidebar found! Check GP Widgets in WP Admin.')
    print('  Available sidebars:', [s.get('id') for s in all_sidebars])
else:
    try:
        inject_footer_widget(sidebar_id)
        print('  OK: Footer widget with CSS injected.')
    except Exception as e:
        print(f'  ERRO: {e}')

# Step 3: Strip old footer + style blocks from all pages
print('\n[3] Stripping old footer + style blocks from pages...')
ok = changed = skipped = erros = 0
for pid in PAGE_IDS:
    try:
        changed_flag = strip_page(pid)
        if changed_flag:
            print(f'  OK  [{pid}] cleaned')
            changed += 1
        else:
            print(f'  --  [{pid}] no change needed')
            skipped += 1
        ok += 1
        time.sleep(0.35)
    except Exception as e:
        print(f'  ERRO [{pid}]: {e}')
        erros += 1

print(f'\nConcluido: {ok} paginas ({changed} limpas, {skipped} sem alteracao) | {erros} erros')
print('\nPROXIMO PASSO:')
print('LiteSpeed Cache -> Purge All')
