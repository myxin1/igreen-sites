<?php
/**
 * Plugin Name: Doodly Home Fullwidth
 * Description: Layout fullwidth + dark design nas páginas home (EN/PT/ES/DE).
 * Version: 2.3
 */

function dly_is_home_page() {
    if (is_front_page()) return true;
    if (!is_page()) return false;
    global $post;
    return $post && in_array($post->post_name, ['inicio','inicio-es','startseite'], true);
}

add_filter('generate_sidebar_layout', function($l) { return dly_is_home_page() ? 'no-sidebar' : $l; }, 99);
add_filter('generate_do_sidebar',     function($d) { return dly_is_home_page() ? false : $d; }, 99);
add_filter('generate_show_title',     function($s) { return dly_is_home_page() ? false : $s; });

// ── JS: injeta Doodly + força layout do header ────────────────────────────────
add_action('wp_head', function() {
    if (!dly_is_home_page()) return; ?>
<script>
document.addEventListener('DOMContentLoaded', function() {
    if (document.querySelector('.dly-header-name')) return;

    // 1. Encontra o container interno do header
    var wrap = document.querySelector('.inside-header')
            || document.querySelector('#masthead > .grid-container')
            || document.querySelector('#masthead > div')
            || document.querySelector('#masthead');
    if (!wrap) return;

    // 2. Cria o link "Doodly"
    var a = document.createElement('a');
    a.href = '/'; a.rel = 'home';
    a.className = 'dly-header-name';
    a.textContent = 'Doodly';

    // 3. Insere antes do <nav>
    var nav = wrap.querySelector('nav');
    nav ? wrap.insertBefore(a, nav) : wrap.insertBefore(a, wrap.firstChild);

    // 4. Força o layout via inline style (sobrepõe qualquer CSS do tema)
    function setLayout() {
        var mobile = window.innerWidth <= 768;
        wrap.setAttribute('style',
            'display:flex !important;' +
            'align-items:center !important;' +
            'justify-content:' + (mobile ? 'space-between' : 'center') + ' !important;' +
            'gap:' + (mobile ? '0' : '32px') + ' !important;'
        );
    }
    setLayout();
    window.addEventListener('resize', setLayout);
});
</script>
<?php });

// ── CSS ───────────────────────────────────────────────────────────────────────
add_action('wp_enqueue_scripts', function() {
    if (!dly_is_home_page()) return;

    $css = '
/* DOODLY DARK HOME v2.3 */

/* ── FULLWIDTH — body e conteúdo sem restrição ── */
#content .content-area, .content-area, .site-main,
.site-main .entry-content, .page-content, .entry-content,
.inside-article, .entry {
    max-width:100% !important; width:100% !important;
    padding-left:0 !important; padding-right:0 !important;
    margin-left:0 !important; margin-right:0 !important;
    float:none !important; box-sizing:border-box !important;
}
.site-content .grid-container, .site-content .inside-article,
.site-content > .grid-container {
    max-width:100% !important; padding:0 !important; width:100% !important;
}

/* ── SIDEBAR ── */
.widget-area, #secondary, .sidebar { display:none !important; }

/* ── BODY ── */
body, html, .site, .site-content, #page, main {
    background-color:#0d0d0d !important; color:#c8d8e8;
}

/* ── HEADER ── */
.site-header, #masthead, .site-header-wrap {
    background-color:#0d0d0d !important;
    border-bottom:1px solid rgba(176,249,90,0.10) !important;
    box-shadow:none !important;
}
.inside-header, #masthead > .grid-container, #masthead > div {
    background-color:#0d0d0d !important;
}

/* Esconde logo e branding original */
.site-branding, .site-logo, .site-logo img,
.custom-logo-link, img.custom-logo, .header-image { display:none !important; }

/* ── DOODLY — sempre visível, fora do menu colapsável ── */
a.dly-header-name {
    color:#b0f95a !important;
    font-size:1.35rem !important;
    font-weight:800 !important;
    text-decoration:none !important;
    letter-spacing:-0.02em;
    line-height:1;
    display:inline-block !important;
    white-space:nowrap;
    flex-shrink:0;
    padding-right:20px !important;
    border-right:1px solid rgba(176,249,90,0.20);
}
a.dly-header-name:hover { color:#c8ff7a !important; }

/* Mobile: Doodly sem separador, nav colapsa separado */
@media (max-width:768px) {
    a.dly-header-name {
        border-right:none !important;
        padding-right:0 !important;
        font-size:1.2rem !important;
    }
}

/* ── NAV ── */
.main-navigation a { color:#c8d8e8 !important; }
.main-navigation a:hover,
.main-navigation .current-menu-item > a { color:#b0f95a !important; }
.main-nav ul, .mobile-menu-control-wrapper, .toggled-on { background:#0d0d0d !important; }

/* ── TÍTULO DA PÁGINA ── */
h1.entry-title, .entry-header, .page-header { display:none !important; }

/* ── RODAPÉ ── */
.site-footer, #colophon, .footer-bar { display:none !important; }

/* ── HERO ── */
.dly-hero {
    background:linear-gradient(160deg,#0f0f1e 0%,#0d0d0d 70%);
    padding:72px 32px 64px; text-align:center;
}
.dly-hero h1 {
    color:#fff; font-size:clamp(1.9rem,4vw,2.9rem);
    font-weight:800; line-height:1.2; margin-bottom:16px;
}
.dly-hero p {
    color:#c8d8e8; font-size:1.15rem;
    max-width:700px; margin:0 auto 32px; line-height:1.8;
}

/* ── BOTÕES ── */
.dly-btn-green, a.dly-btn-green {
    display:inline-block; background:#b0f95a; color:#0d0d0d !important;
    font-weight:700; font-size:1rem; padding:14px 32px;
    border-radius:6px; text-decoration:none !important;
    transition:background .2s,transform .15s;
}
.dly-btn-green:hover { background:#c8ff7a; transform:translateY(-2px); }
.dly-btn-ghost, a.dly-btn-ghost {
    display:inline-block; background:transparent; color:#b0f95a !important;
    font-weight:600; font-size:.95rem; padding:12px 24px;
    border-radius:6px; border:1px solid rgba(176,249,90,0.4);
    text-decoration:none !important; transition:border-color .2s,background .2s;
}
.dly-btn-ghost:hover { border-color:#b0f95a; background:rgba(176,249,90,0.08); }

/* ── BADGE ── */
.dly-badge {
    display:inline-block; background:rgba(176,249,90,0.12); color:#b0f95a;
    font-size:.8rem; font-weight:600; letter-spacing:.08em; text-transform:uppercase;
    padding:4px 12px; border-radius:20px; border:1px solid rgba(176,249,90,0.3);
    margin-bottom:16px;
}

/* ── TEASER ── */
.dly-review-teaser, .dly-review-teaser p {
    font-size:1.15rem !important; line-height:1.8 !important;
    color:#c8d8e8 !important; max-width:760px;
    margin-left:auto; margin-right:auto; text-align:center;
}

/* ── FEATURE CARDS ── */
.dly-feature-card {
    background:#111120; border:1px solid rgba(176,249,90,0.1);
    border-radius:10px; padding:24px 20px; margin-bottom:16px;
}
.dly-feature-card h3 { color:#b0f95a; font-size:1rem; margin-bottom:8px; }
.dly-feature-card p  { color:#c8d8e8; font-size:.92rem; line-height:1.6; margin:0; }

/* ── PRICING ── */
.dly-pricing, .dly-plan {
    background:#111120; border:1px solid rgba(176,249,90,0.15);
    border-radius:12px; padding:28px 24px; text-align:center;
}
.dly-pricing .price, .dly-plan .price { font-size:2.4rem; font-weight:800; color:#b0f95a; }
.dly-pricing .price-note, .dly-plan .price-note { color:#8899aa; font-size:.85rem; }

/* ══ FAQ ══ */
.dly-faq { max-width:820px; margin:0 auto; padding:0 20px; }
.dly-faq h2 {
    text-align:center; color:#fff;
    font-size:clamp(1.3rem,3vw,1.7rem); margin-bottom:28px;
}
.dly-faq details {
    background:#111120; border:1px solid rgba(176,249,90,0.18);
    border-radius:12px; margin-bottom:12px; overflow:hidden;
    transition:border-color .25s,box-shadow .25s;
}
.dly-faq details[open] {
    border-color:rgba(176,249,90,0.45);
    box-shadow:0 0 0 1px rgba(176,249,90,0.10);
}
.dly-faq summary {
    cursor:pointer; list-style:none;
    display:flex !important; justify-content:space-between !important;
    align-items:center !important; gap:24px;
    padding:22px 36px 22px 56px !important;
    color:#fff; font-weight:600;
    font-size:clamp(1rem,2.2vw,1.12rem); line-height:1.5;
    background:transparent; user-select:none; -webkit-user-select:none;
}
.dly-faq summary::marker,
.dly-faq summary::-webkit-details-marker { display:none; }
.dly-faq summary::after {
    content:"+"; flex-shrink:0;
    width:30px; height:30px; border-radius:50%;
    border:1px solid rgba(176,249,90,0.45); color:#b0f95a;
    font-size:1.2rem; font-weight:300; line-height:28px; text-align:center;
    transition:background .2s,border-color .2s;
}
.dly-faq details[open] summary::after {
    content:"−"; background:rgba(176,249,90,0.12); border-color:#b0f95a;
}
.dly-faq summary:hover { color:#b0f95a; }
.dly-faq summary:hover::after { border-color:#b0f95a; }
.dly-faq details p, .dly-faq details > p {
    color:#9aaabb; margin:0 !important;
    padding:14px 36px 26px 56px !important;
    font-size:clamp(0.9rem,1.8vw,0.98rem); line-height:1.8;
    border-top:1px solid rgba(176,249,90,0.10);
}
@media (max-width:600px) {
    .dly-faq { padding:0 12px; }
    .dly-faq summary { padding:16px 20px 16px 28px !important; gap:12px; }
    .dly-faq details p { padding:12px 20px 18px 28px !important; }
}

/* ── CONTEÚDO — full width, sem restrição de largura ── */
.entry-content h2 { color:#fff; margin-top:2.5em; }
.entry-content h3 { color:#c8d8e8; }
.entry-content p  { color:#c8d8e8; line-height:1.75; }
.entry-content a  { color:#b0f95a; }
.entry-content a:hover { color:#c8ff7a; }
';

    wp_register_style('dly-home-dark', false);
    wp_enqueue_style('dly-home-dark');
    wp_add_inline_style('dly-home-dark', $css);
});
