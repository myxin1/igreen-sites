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
.site-header{
  position:sticky;top:0;z-index:999;
  background:linear-gradient(135deg,#120904 0%,#231108 52%,#35180b 100%)!important;
  border-bottom:1px solid rgba(232,184,75,.18)!important;
  padding:0!important;
  box-shadow:0 16px 42px rgba(16,8,5,.18)!important
}
.site-header .inside-header{
  width:min(1240px,calc(100vw - 2rem));
  margin:0 auto;
  display:flex;align-items:center;justify-content:center;
  gap:clamp(1.2rem,3vw,2.8rem);padding:1rem 0!important;min-height:auto;max-width:none!important
}
@media(min-width:768px){.site-header .inside-header{width:min(1240px,calc(100vw - 3rem))}}
.site-branding{min-width:0;flex:0 0 auto}
.main-title,.main-title a,.site-title,.site-title a{text-decoration:none!important}
.main-title a,.site-title a{font-size:0!important;display:inline-flex;align-items:baseline;gap:.08em}
.main-title a::before,.site-title a::before{
  font-family:'Playfair Display',serif;font-size:clamp(1.55rem,2.2vw,1.9rem);
  font-weight:900;letter-spacing:.04em;color:var(--glt);content:'Bauern'
}
.main-title a::after,.site-title a::after{
  font-family:'Playfair Display',serif;font-size:clamp(1.55rem,2.2vw,1.9rem);
  font-weight:900;letter-spacing:.04em;color:#fff6eb;content:'fest'
}
.site-description{display:none!important}
.main-navigation,.main-navigation#site-navigation,#site-navigation,.main-navigation .inside-navigation{background:transparent!important}
.main-navigation#site-navigation{margin-left:0;flex:0 1 auto}
.main-navigation .inside-navigation{
  padding:.28rem .5rem!important;justify-content:center;gap:1rem;
  border:1px solid rgba(232,184,75,.12);border-radius:0;
  background:linear-gradient(180deg,rgba(255,255,255,.045) 0%,rgba(255,255,255,.02) 100%)!important;
  box-shadow:0 14px 30px rgba(8,4,2,.12)
}
.main-navigation .nav-menu,.main-navigation ul,.main-navigation .main-nav{background:transparent!important}
.main-navigation .nav-menu>li,.main-navigation ul>li{margin:0}
.main-navigation .nav-menu>li>a,.main-navigation ul>li>a{
  position:relative;
  font-family:'DM Sans',sans-serif!important;font-size:.79rem!important;font-weight:700!important;
  letter-spacing:.12em!important;text-transform:uppercase!important;
  color:rgba(255,248,236,.76)!important;transition:color .2s,transform .2s!important;
  min-height:46px;display:flex;align-items:center;padding:.25rem .82rem!important
}
.main-navigation .nav-menu>li>a::after,.main-navigation ul>li>a::after{
  content:'';position:absolute;left:.82rem;right:.82rem;bottom:.45rem;height:1.5px;
  background:linear-gradient(90deg,transparent,var(--glt),transparent);
  transform:scaleX(0);transform-origin:center;transition:transform .22s ease
}
.main-navigation .nav-menu>li>a:hover,.main-navigation ul>li>a:hover{color:#fff8ef!important;transform:translateY(-1px)}
.main-navigation .nav-menu>li>a:hover::after,.main-navigation ul>li>a:hover::after{transform:scaleX(1)}
.main-navigation .nav-menu>li:last-child>a{
  background:linear-gradient(135deg,var(--glt) 0%,var(--gold) 100%)!important;
  color:var(--dark)!important;padding:.78rem 1.18rem!important;border-radius:999px;
  font-weight:800!important;box-shadow:0 12px 26px rgba(200,146,42,.24)
}
.main-navigation .nav-menu>li:last-child>a::after{display:none}
.main-navigation .nav-menu>li:last-child>a:hover{background:linear-gradient(135deg,#f2c865 0%,#d39a34 100%)!important;color:var(--dark)!important}
button.menu-toggle{
  background:rgba(255,255,255,.04)!important;border:1px solid rgba(232,184,75,.22)!important;
  border-radius:999px;color:var(--glt)!important;padding:.68rem;min-width:46px;min-height:46px
}
button.menu-toggle svg,button.menu-toggle .bars,button.menu-toggle::before{fill:var(--glt)!important;color:var(--glt)!important}
.menu-toggle,.mobile-menu-control-wrapper,.main-navigation button{
  background:rgba(255,255,255,.04)!important;color:var(--glt)!important
}
.main-navigation.toggled .nav-menu,.main-navigation.toggled ul{
  background:linear-gradient(180deg,rgba(35,17,8,.98) 0%,rgba(17,8,4,.98) 100%)!important;
  border:1px solid rgba(232,184,75,.16)!important;border-radius:0;margin-top:.75rem;padding:.45rem .65rem!important
}
.main-navigation.toggled .nav-menu li,.main-navigation.toggled ul li{border-bottom:1px solid rgba(255,255,255,.06)!important}
.main-navigation.toggled .nav-menu li:last-child,.main-navigation.toggled ul li:last-child{border-bottom:none!important}
.main-navigation.toggled .nav-menu li a,.main-navigation.toggled ul li a{color:rgba(255,248,236,.82)!important;padding:1rem .8rem!important}
.main-navigation ul ul,.main-navigation .sub-menu{
  background:linear-gradient(180deg,rgba(35,17,8,.98) 0%,rgba(17,8,4,.98) 100%)!important;
  border:1px solid rgba(232,184,75,.16)!important
}
@media(max-width:860px){
  .site-header .inside-header{justify-content:space-between;gap:.9rem;padding:.9rem 0!important}
  .main-navigation#site-navigation{flex:0 0 auto}
  .main-navigation .inside-navigation{padding:0!important;border:none;background:transparent!important;box-shadow:none}
}

/* ── GP: Content area full width ── */
.site-content{padding:0!important}
.single-post .grid-container,.single-post .site,.single-post .site-content,
.single-post .content-area,.single-post .site-main{
  padding:0!important;margin:0!important;width:100%!important;max-width:none!important
}
.page .grid-container,.page .site,.page .site-content,
.page .content-area,.page .site-main{
  padding:0!important;margin:0!important;width:100%!important;max-width:none!important
}
.inside-article,.entry-header,.entry-footer{padding:0!important;margin:0!important}
.single-post .inside-article{
  background:transparent!important;box-shadow:none!important;max-width:none!important;width:100%!important
}
.page .inside-article{
  background:transparent!important;box-shadow:none!important;max-width:none!important;width:100%!important
}
.entry-content{margin:0!important;padding:0!important;max-width:none!important}
.generate-columns-container{display:block!important}
.single-post .entry-header,
.single-post header.entry-header,
.single-post .entry-title,
.single-post .entry-meta,
.single-post footer.entry-meta,
.single-post .post-navigation,
.single-post .comments-area{display:none!important}
.single-post .site-main .wp-block-group__inner-container{padding:0!important}
.page .entry-header,
.page header.entry-header,
.page .entry-title,
.page .entry-meta,
.page footer.entry-meta,
.page .post-navigation,
.page .comments-area{display:none!important}
.page .site-main .wp-block-group__inner-container{padding:0!important}

/* Hide GP sidebar */
#secondary,.sidebar-primary,.widget-area{display:none!important}

/* ── GP: Footer override ── */
.site-footer{background:var(--dark)!important;padding:0!important;margin:0!important;width:100%!important}
.footer-bar,.site-info{display:none!important}
.footer-widgets,.footer-widgets-container,.site-footer .inside-site-info{
  max-width:none!important;width:100%!important;padding:0!important;margin:0!important
}

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
.hub-page-wrap{background:#FDF6EA;overflow:hidden}
.hub-page-wrap>.wp-block-group__inner-container{padding:0 0 clamp(3rem,5vw,4.5rem)}
.hub-section>.wp-block-group__inner-container{
  width:min(1320px,calc(100vw - 2rem));margin:0 auto
}
.hub-hero,.hub-cta{
  position:relative;left:50%;right:50%;margin-left:-50vw;margin-right:-50vw;width:100vw
}
.hub-hero>.wp-block-group__inner-container,
.hub-cta>.wp-block-group__inner-container{
  width:100%!important;max-width:none!important
}
.hub-cta .hub-shell{width:min(1320px,calc(100vw - 2rem));margin:0 auto}
.hub-section{padding:clamp(2.4rem,4vw,3.6rem) 1rem}
.hub-grid>.wp-block-group__inner-container{
  display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1.35rem;margin-top:1.9rem
}
@media(max-width:860px){.hub-grid>.wp-block-group__inner-container{grid-template-columns:1fr}}
.hub-card{
  background:#fff;border:1px solid rgba(200,146,42,.16);border-radius:24px;padding:1.35rem 1.35rem 1.2rem;
  box-shadow:0 16px 34px rgba(44,26,14,.07)
}
.hub-card-media{margin:0 0 1rem!important}
.hub-card-media img{
  width:100%;height:190px;object-fit:cover;border-radius:18px;
  box-shadow:0 12px 28px rgba(44,26,14,.08)
}
.hub-card-tag{
  display:inline-flex;width:auto;font-family:'DM Sans',sans-serif;font-size:.67rem;font-weight:800;
  letter-spacing:.12em;text-transform:uppercase;color:var(--rot);background:rgba(139,26,26,.08);
  border-radius:999px;padding:.28rem .7rem;margin-bottom:.7rem!important
}
.hub-card-title{margin:0 0 .55rem!important}
.hub-card-title a{color:var(--dark)!important;text-decoration:none}
.hub-card-title a:hover{color:var(--rot)!important}
.hub-card-text{color:var(--muted)!important}
.hub-card-link{margin:0!important}
.hub-card-link a{
  display:inline-flex;align-items:center;gap:.3rem;font-family:'DM Sans',sans-serif;font-size:.84rem;
  font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--gold)!important
}
.hub-card-link a:hover{color:var(--rot)!important}
.article-wrap{
  background:
    radial-gradient(circle at top right,rgba(232,184,75,.11),transparent 24rem),
    linear-gradient(180deg,#FDF6EA 0%,#f7ecd7 100%);
  padding:clamp(2rem,4vw,3.5rem) 1rem clamp(3rem,5vw,4.75rem)
}
.article-wrap>.wp-block-group__inner-container{
  width:min(1680px,calc(100vw - 1rem));margin:0 auto
}
.article-grid>.wp-block-group__inner-container{
  display:grid;grid-template-columns:minmax(0,2.55fr) minmax(280px,340px);gap:2rem;align-items:start
}
@media(max-width:980px){.article-grid>.wp-block-group__inner-container{grid-template-columns:1fr}}
.article-main{
  background:#fff;border:1px solid rgba(200,146,42,.16);border-radius:28px;
  padding:clamp(1.75rem,2.6vw,3rem);box-shadow:0 24px 50px rgba(44,26,14,.08)
}
.article-main h1{font-family:'Playfair Display',serif;font-size:clamp(2rem,4vw,3rem);font-weight:900;color:#3D2B1A;line-height:1.08;margin-bottom:1.1rem}
.article-main h1 em,.article-content h1 em{font-style:normal;display:inline-block;margin-left:.24em}
.article-main h2{font-family:'Playfair Display',serif;font-size:clamp(1.4rem,2.6vw,1.95rem);font-weight:700;color:#3D2B1A;margin:2.35rem 0 .95rem;line-height:1.18}
.article-main h3{font-family:'Playfair Display',serif;font-size:clamp(1.08rem,2vw,1.32rem);font-weight:700;color:#3D2B1A;margin:1.8rem 0 .7rem}
.article-main p{font-family:'Lora',serif;font-size:1.03rem;color:var(--text);line-height:1.92;margin-bottom:1.05rem}
.article-main p strong,.article-main li strong{font-weight:600;color:inherit}
.article-main ul,.article-main ol{margin:1rem 0 1.2rem;padding-left:1.35rem}
.article-main ul li,.article-main ol li{font-family:'Lora',serif;font-size:1rem;color:var(--text);line-height:1.8;margin-bottom:.45rem}
.article-cover-image{margin:0 0 1.6rem!important}
.article-cover-image img{
  width:100%;height:auto;max-height:520px;object-fit:cover;border-radius:22px;
  box-shadow:0 18px 38px rgba(44,26,14,.1)
}
.article-map-section,.article-faq-section{
  margin-top:2.5rem;padding-top:2rem;border-top:1px solid rgba(200,146,42,.16)
}
.article-map-lead,.article-faq-lead{color:var(--muted)!important}
.article-map-frame{
  border-radius:22px;overflow:hidden;border:1px solid rgba(200,146,42,.16);
  box-shadow:0 18px 36px rgba(44,26,14,.08);margin:1rem 0 1.1rem
}
.article-map-frame iframe{display:block;width:100%;height:min(420px,62vw);min-height:320px;border:0}
.article-map-link a{
  font-family:'DM Sans',sans-serif;font-size:.84rem;font-weight:700;letter-spacing:.08em;
  text-transform:uppercase;color:var(--rot)!important
}
.article-faq-section .wp-block-heading{margin-bottom:.8rem}
.article-faq-item{
  background:linear-gradient(180deg,#fffdf9 0%,#fbf4e8 100%);
  border:1px solid rgba(200,146,42,.16);border-radius:20px;padding:0 1.15rem;
  box-shadow:0 10px 24px rgba(44,26,14,.05)
}
.article-faq-item + .article-faq-item{margin-top:.9rem}
.article-faq-item summary{
  list-style:none;cursor:pointer;display:flex;align-items:center;justify-content:space-between;gap:1rem;
  font-family:'DM Sans',sans-serif;font-size:.98rem;font-weight:700;color:var(--dark);padding:1rem 0
}
.article-faq-item summary::-webkit-details-marker{display:none}
.article-faq-item summary::after{
  content:'+';flex-shrink:0;width:28px;height:28px;border-radius:50%;
  background:linear-gradient(135deg,var(--glt) 0%,var(--gold) 100%);
  color:var(--dark);display:flex;align-items:center;justify-content:center;font-size:1rem;font-weight:900
}
.article-faq-item[open] summary::after{content:'-'}
.article-faq-item p{margin:0 0 1rem!important;padding-right:.3rem}
.article-postnav{margin-top:2.4rem}
.article-postnav-links>.wp-block-group__inner-container{
  display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1rem
}
@media(max-width:760px){.article-postnav-links>.wp-block-group__inner-container{grid-template-columns:1fr}}
.article-postnav-item{margin:0!important}
.article-postnav-item a{
  display:flex;flex-direction:column;gap:.35rem;min-height:100%;padding:1.05rem 1.15rem;border-radius:20px;
  background:linear-gradient(180deg,#fffaf2 0%,#f7eddc 100%);border:1px solid rgba(200,146,42,.18);
  box-shadow:0 14px 30px rgba(44,26,14,.06);text-decoration:none!important;color:var(--dark)!important
}
.article-postnav-item a:hover{transform:translateY(-2px);box-shadow:0 18px 36px rgba(44,26,14,.08)}
.postnav-eyebrow{
  font-family:'DM Sans',sans-serif;font-size:.72rem;font-weight:800;letter-spacing:.14em;
  text-transform:uppercase;color:var(--rot)
}
.postnav-title{font-family:'Playfair Display',serif;font-size:1.08rem;font-weight:700;line-height:1.25}
.article-grid>.wp-block-group__inner-container>*{min-width:0}
.article-sidebar{display:flex;flex-direction:column;gap:1rem;min-width:0}
.article-sidebar>.wp-block-group__inner-container{display:flex;flex-direction:column;gap:1rem}
@media(min-width:981px){.article-sidebar{position:sticky;top:calc(var(--nav-h) + 1.25rem)}}
.sidebar-box{
  background:linear-gradient(180deg,#fffaf2 0%,#f8f1e4 100%);
  border:1px solid rgba(200,146,42,.18);border-radius:22px;padding:1.2rem 1.15rem;
  box-shadow:0 14px 32px rgba(44,26,14,.07)
}
.sidebar-box h3,.sidebar-box h4{
  font-family:'DM Sans',sans-serif;font-size:.77rem;font-weight:800;color:var(--rot);
  margin-bottom:.85rem;letter-spacing:.14em;text-transform:uppercase
}
.sidebar-box .wp-block-list{list-style:none!important;padding:0!important;margin:0!important}
.sidebar-box .wp-block-list li{margin:0!important;padding:0!important}
.sidebar-box .wp-block-list li + li{margin-top:.65rem!important;padding-top:.65rem!important;border-top:1px solid rgba(200,146,42,.14)}
.sidebar-box .wp-block-list li::before{display:none!important}
.sidebar-box a{
  color:var(--dark);font-family:'DM Sans',sans-serif;font-size:.9rem;line-height:1.55;
  text-decoration:none;transition:color .2s,transform .2s;display:inline-flex;gap:.35rem
}
.sidebar-box a:hover{color:var(--rot);transform:translateX(2px)}
.sidebar-links a strong{color:var(--rot)}
.sidebar-box-compact{padding:1rem 1rem}
.sidebar-box-compact h4{font-size:.7rem;letter-spacing:.16em;margin-bottom:.65rem}
.sidebar-box-compact a{font-size:.84rem;line-height:1.45}
.sidebar-box-compact .wp-block-list li + li{margin-top:.5rem!important;padding-top:.5rem!important}
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
