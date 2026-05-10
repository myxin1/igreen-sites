"""
gp_setup.py — GeneratePress setup:
1. Injects global CSS via WordPress custom_css post (XML-RPC)
2. Creates navigation menu via REST API
"""
import urllib.request, base64, json, re, xmlrpc.client

WP   = 'https://bauernfest.org'
RPC  = WP + '/xmlrpc.php'
USER = 'ClaudeBot'
PASS = 'p8Np bMs8 Xnsh MfH2 cZ7u w5xy'

creds = base64.b64encode(f'{USER}:{PASS}'.encode()).decode()
HGET  = {'Authorization': f'Basic {creds}'}
HPOST = {'Authorization': f'Basic {creds}', 'Content-Type': 'application/json'}
rpc   = xmlrpc.client.ServerProxy(RPC)

# ─── GLOBAL CSS ───────────────────────────────────────────────────────────────
GLOBAL_CSS = """\
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=Lora:wght@400;500;600&family=DM+Sans:wght@300;400;500&display=swap');

:root{--rot:#8B1A1A;--gold:#C8922A;--glt:#E8B84B;--dark:#1A1008;--cream:#F9F3E8;--text:#2C1A0E;--muted:#7A6048;--nav-h:64px}

/* ── Reset body ── */
body{font-family:'DM Sans',sans-serif;color:var(--text);background:#fff;margin:0;overflow-x:hidden}
*,*::before,*::after{box-sizing:border-box}
a{text-decoration:none}
img{max-width:100%;height:auto;display:block}
ul{list-style:none;padding:0;margin:0}

/* ── GP: Header override ── */
.site-header{background:var(--dark)!important;border-bottom:1px solid rgba(200,146,42,.14)!important;padding:0!important;box-shadow:none!important}
.site-header .inside-header{display:flex;align-items:center;justify-content:space-between;padding:0 1rem;min-height:var(--nav-h);max-width:none!important;width:100%}
@media(min-width:640px){.site-header .inside-header{padding:0 1.5rem}}
@media(min-width:1024px){.site-header .inside-header{padding:0 2.5rem}}

/* Site title as logo */
.site-title,.site-title a{text-decoration:none!important}
.site-title a{font-size:0!important;display:inline-block}
.site-title a::before{font-family:'Playfair Display',serif;font-size:1.5rem;font-weight:900;letter-spacing:.04em;color:var(--glt);content:'Bauern'}
.site-title a::after{font-family:'Playfair Display',serif;font-size:1.5rem;font-weight:900;letter-spacing:.04em;color:#fff;content:'fest'}
.site-description{display:none!important}

/* GP nav links */
.main-navigation .nav-menu,.main-navigation ul{background:transparent!important}
.main-navigation .nav-menu>li>a,.main-navigation ul>li>a{font-family:'DM Sans',sans-serif!important;font-size:.8rem!important;font-weight:500!important;letter-spacing:.06em!important;text-transform:uppercase!important;color:rgba(255,255,255,.7)!important;transition:color .2s!important;min-height:44px;display:flex;align-items:center}
.main-navigation .nav-menu>li>a:hover,.main-navigation ul>li>a:hover{color:var(--glt)!important}

/* Last nav item (FAQ) styled as CTA */
.main-navigation .nav-menu>li:last-child>a{background:var(--gold);color:var(--dark)!important;padding:.44rem 1.1rem!important;border-radius:4px;font-weight:700!important}
.main-navigation .nav-menu>li:last-child>a:hover{background:var(--glt)!important;color:var(--dark)!important}

/* Mobile toggle */
button.menu-toggle{background:none!important;border:none!important;color:var(--glt)!important;padding:.6rem;min-width:44px;min-height:44px}
button.menu-toggle svg,button.menu-toggle .bars,button.menu-toggle::before{fill:var(--glt)!important;color:var(--glt)!important}
.main-navigation.toggled .nav-menu,.main-navigation.toggled ul{background:#130c02!important;border-top:1px solid rgba(200,146,42,.14)!important}
.main-navigation.toggled .nav-menu li,.main-navigation.toggled ul li{border-bottom:1px solid rgba(255,255,255,.05)!important}
.main-navigation.toggled .nav-menu li a,.main-navigation.toggled ul li a{color:rgba(255,255,255,.75)!important;padding:1rem 1.5rem!important}

/* ── GP: Content area full width ── */
.site-content{padding:0!important}
.content-area,.site-main{padding:0!important;margin:0!important;width:100%!important}
.inside-article,.entry-header,.entry-footer{padding:0!important;margin:0!important}
.entry-content{margin:0!important;padding:0!important;max-width:none!important}
.generate-columns-container{display:block!important}

/* Hide GP sidebar */
#secondary,.sidebar-primary,.widget-area{display:none!important}

/* ── GP: Footer override ── */
.site-footer{background:var(--dark)!important;padding:0!important;margin:0!important}
.footer-bar,.site-info{display:none!important}

/* ── BF container ── */
.bfc{max-width:1160px;margin:0 auto;padding:0 1.5rem;width:100%}

/* ── BREADCRUMB ── */
.bf-breadcrumb{background:var(--cream);border-bottom:1px solid rgba(0,0,0,.06);padding:.6rem 0}
.bf-breadcrumb nav{font-family:'DM Sans',sans-serif;font-size:.78rem;color:var(--muted);display:flex;flex-wrap:wrap;gap:.3rem;align-items:center}
.bf-breadcrumb a{color:var(--gold);transition:color .2s}.bf-breadcrumb a:hover{color:var(--rot)}
.bf-breadcrumb span{opacity:.5}
.bcr{background:#fff;border-bottom:1px solid rgba(0,0,0,.07);padding:.75rem 1.5rem}
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
.art-main ul li::before{content:'→';position:absolute;left:0;color:var(--gold);font-weight:700}
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

/* ── HUB PAGES (gastronomia, turismo, etc.) ── */
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
.article-main ul li::before{content:'→';position:absolute;left:0;color:var(--gold);font-weight:700}
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
.sidebar-links li{margin-bottom:.4rem}
.sidebar-links li a{font-family:'DM Sans',sans-serif;font-size:.84rem;color:var(--gold);display:flex;align-items:center;gap:.4rem;min-height:36px;transition:color .2s}
.sidebar-links li a:hover{color:var(--rot)}
.tip-box{background:rgba(139,26,26,.06);border:1px solid rgba(139,26,26,.15);border-radius:8px;padding:1.1rem;margin-bottom:1.4rem}
.tip-box p{font-family:'DM Sans',sans-serif;font-size:.84rem;color:var(--text);line-height:1.65}
.tip-box strong{color:var(--rot)}
.sec-red{background:var(--rot);text-align:center;padding:3rem 1rem}
.sec-red h2{font-family:'Playfair Display',serif;font-size:clamp(1.3rem,4vw,2rem);font-weight:900;color:#fff}
.sec-red p{color:rgba(255,255,255,.78);font-family:'Lora',serif;font-size:.97rem;margin:.7rem auto 1.4rem;max-width:440px;line-height:1.7}

/* ── NEWSLETTER ── */
.bf-newsletter{background:linear-gradient(135deg,#1a0d05 0%,#2a1508 100%)!important;border-top:2px solid #C8922A!important;padding:3rem 1rem;text-align:center}
.bf-newsletter .nl-inner{max-width:560px;margin:0 auto}
.bf-newsletter .nl-badge{display:inline-block;border:1px solid #C8922A;color:#E8B84B!important;font-size:.65rem;letter-spacing:.15em;text-transform:uppercase;padding:.28rem .8rem;border-radius:2px;margin-bottom:.9rem;font-family:'DM Sans',sans-serif}
.bf-newsletter h2{font-family:'Playfair Display',serif;font-size:clamp(1.3rem,3.5vw,1.9rem);font-weight:900;color:#fff!important;line-height:1.2;margin-bottom:.55rem}
.bf-newsletter h2 em{font-style:italic;color:#E8B84B!important}
.bf-newsletter p{font-family:'Lora',serif;font-size:.92rem;color:rgba(255,255,255,.75)!important;line-height:1.75;margin-bottom:1.4rem}
.nl-form{display:flex;flex-direction:column;gap:.7rem}
@media(min-width:480px){.nl-form{flex-direction:row}}
.nl-form input[type=email]{flex:1;background:rgba(255,255,255,.08);border:1px solid rgba(200,146,42,.35);border-radius:4px;padding:.82rem 1.1rem;font-family:'DM Sans',sans-serif;font-size:.9rem;color:#fff;outline:none;transition:border-color .2s,background .2s;min-height:48px}
.nl-form input[type=email]::placeholder{color:rgba(255,255,255,.35)}
.nl-form input[type=email]:focus{border-color:var(--gold);background:rgba(255,255,255,.12)}
.nl-form button{background:var(--gold);color:var(--dark);border:none;border-radius:4px;padding:.82rem 1.6rem;font-family:'DM Sans',sans-serif;font-weight:700;font-size:.88rem;cursor:pointer;min-height:48px;white-space:nowrap;transition:background .2s,transform .15s;flex-shrink:0}
.nl-form button:hover{background:var(--glt);transform:translateY(-2px)}
.nl-note{font-family:'DM Sans',sans-serif;font-size:.72rem;color:rgba(255,255,255,.3);margin-top:.7rem}
.nl-note a{color:rgba(255,255,255,.4);text-decoration:underline}

/* ── FOOTER ── */
.bfftr{background:var(--dark);padding:3.5rem 1rem 0;color:rgba(255,255,255,.42)}
@media(min-width:640px){.bfftr{padding:4rem 1.5rem 0}}
.ftrgrid{display:grid;grid-template-columns:1fr 1fr;gap:2rem 1.5rem;max-width:1160px;margin:0 auto 2.5rem}
@media(min-width:640px){.ftrgrid{grid-template-columns:repeat(3,1fr)}}
@media(min-width:1024px){.ftrgrid{grid-template-columns:2fr 1fr 1fr 1fr 1fr 1fr;gap:2rem 2rem}}
.ftrbrand{grid-column:1/-1}
@media(min-width:1024px){.ftrbrand{grid-column:auto}}
.ftrbrand p{font-family:'DM Sans',sans-serif;font-size:.83rem;line-height:1.7;margin-top:.7rem;color:rgba(255,255,255,.38);max-width:220px}
.bflogo{font-family:'Playfair Display',serif;font-size:1.5rem;font-weight:900;color:var(--glt);letter-spacing:.04em;text-decoration:none}
.bflogo span{color:#fff}
.ftrcol h4{font-family:'DM Sans',sans-serif;font-weight:700;font-size:.72rem;color:rgba(255,255,255,.9);margin-bottom:1rem;letter-spacing:.12em;text-transform:uppercase}
.ftrcol ul{display:flex;flex-direction:column;gap:.35rem;list-style:none;padding:0;margin:0}
.ftrcol ul li a{font-family:'DM Sans',sans-serif;font-size:.82rem;color:rgba(255,255,255,.36);transition:color .2s;display:inline-block;min-height:30px;line-height:30px;text-decoration:none}
.ftrcol ul li a:hover{color:var(--glt)}
.ftr-divider{max-width:1160px;margin:0 auto;border:none;border-top:1px solid rgba(255,255,255,.07)}
.ftrbtm{max-width:1160px;margin:0 auto;padding:1.2rem 0;display:flex;flex-direction:column;gap:.5rem;font-family:'DM Sans',sans-serif;font-size:.74rem;text-align:center;color:rgba(255,255,255,.25)}
@media(min-width:640px){.ftrbtm{flex-direction:row;justify-content:space-between;align-items:center;text-align:left}}
.ftrbtm a{color:rgba(255,255,255,.22);text-decoration:none}.ftrbtm a:hover{color:var(--glt)}
.ftr-legal{display:flex;flex-wrap:wrap;gap:1rem;justify-content:center}
@media(min-width:640px){.ftr-legal{justify-content:flex-end}}
.ftr-legal a{color:rgba(255,255,255,.28);font-family:'DM Sans',sans-serif;font-size:.72rem;transition:color .2s;text-decoration:none}
.ftr-legal a:hover{color:var(--glt)}

/* ── Buttons ── */
.btnp{display:inline-block;background:var(--gold);color:var(--dark);padding:.8rem 2rem;border-radius:4px;font-weight:700;font-size:.92rem;transition:background .2s,transform .15s;text-decoration:none}
.btnp:hover{background:var(--glt);transform:translateY(-2px);color:var(--dark)}
"""

# ─── STEP 1: Upload CSS ───────────────────────────────────────────────────────
def upload_css():
    print('[CSS] Uploading global CSS via XML-RPC...')
    try:
        posts = rpc.wp.getPosts(1, USER, PASS, {'post_type': 'custom_css', 'number': 10})
        existing = next((p for p in posts if p.get('post_name') == 'generatepress'), None)
    except Exception as e:
        print(f'  WARN: {e}')
        existing = None

    data = {
        'post_type': 'custom_css',
        'post_status': 'publish',
        'post_name': 'generatepress',
        'post_content': GLOBAL_CSS,
        'post_title': 'GeneratePress',
    }

    if existing:
        ok = rpc.wp.editPost(1, USER, PASS, existing['post_id'], data)
        print(f'  OK: Updated custom_css post {existing["post_id"]}')
    else:
        new_id = rpc.wp.newPost(1, USER, PASS, data)
        print(f'  OK: Created custom_css post {new_id}')


# ─── STEP 2: Create navigation menu ─────────────────────────────────────────
NAV_ITEMS = [
    ('Home',          'https://bauernfest.org/',                  1),
    ('A Festa',       'https://bauernfest.org/sobre/',             2),
    ('Programação',   'https://bauernfest.org/programacao/',       3),
    ('Gastronomia',   'https://bauernfest.org/gastronomia/',       4),
    ('Turismo',       'https://bauernfest.org/turismo/',           5),
    ('Receitas',      'https://bauernfest.org/receitas-alemas/',   6),
    ('FAQ',           'https://bauernfest.org/faq/',               7),
]

def create_menu():
    print('\n[MENU] Creating navigation menu...')

    def api(url, body=None, method=None):
        method = method or ('POST' if body else 'GET')
        req = urllib.request.Request(
            url, data=body, headers=HPOST if body else HGET, method=method)
        with urllib.request.urlopen(req, timeout=20) as r:
            return json.loads(r.read())

    # Find or create menu
    try:
        menus = api(f'{WP}/wp-json/wp/v2/menus')
        existing = next((m for m in menus if m.get('slug') == 'menu-principal'), None)
        if existing:
            menu_id = existing['id']
            print(f'  INFO: Menu exists (id={menu_id})')
        else:
            m = api(f'{WP}/wp-json/wp/v2/menus',
                    json.dumps({'name': 'Menu Principal', 'slug': 'menu-principal'}).encode())
            menu_id = m['id']
            print(f'  OK: Created menu id={menu_id}')
    except Exception as e:
        print(f'  ERRO menu create: {e}')
        return

    # Delete existing items to avoid duplicates
    try:
        items = api(f'{WP}/wp-json/wp/v2/menu-items?menus={menu_id}&per_page=50')
        for item in items:
            api(f'{WP}/wp-json/wp/v2/menu-items/{item["id"]}?force=true',
                b'{}', method='DELETE')
    except Exception:
        pass

    # Add items
    for title, url, order in NAV_ITEMS:
        try:
            api(f'{WP}/wp-json/wp/v2/menu-items',
                json.dumps({'title': title, 'url': url, 'menu-order': order,
                            'menus': menu_id, 'status': 'publish'}).encode())
            print(f'  OK: "{title}"')
        except Exception as e:
            print(f'  ERRO "{title}": {e}')

    print(f'\n  PROXIMO PASSO MANUAL:')
    print(f'     WP Admin -> Aparencia -> Menus -> "Menu Principal" -> Local: "Primary Menu" -> Salvar')


# ─── MAIN ───────────────────────────────────────────────────────────────────
print('\n======================================')
print(' GP Setup -- bauernfest.org')
print('======================================')

upload_css()
create_menu()

print('\nSetup concluído.')
