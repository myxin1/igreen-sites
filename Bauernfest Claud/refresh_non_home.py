import glob
import os
import re

BASE = r"c:\Users\User\Downloads\Projeto Claude Code\Bauernfest Claud\site-bauernfest"
HEADER_PATH = os.path.join(BASE, "Rodape", "nav.html")
FOOTER_PATH = os.path.join(BASE, "Rodape", "footer.html")

STYLE_BLOCK = """<style id="bf-non-home-refresh">
body{
  background:#f6efe5;
  color:var(--text,#2c1a0e);
}

.bfsite{
  background:transparent;
}

.bf-topbar,
.bf-brand-meta{
  display:none !important;
}

.bf-header-shell{
  position:relative;
  z-index:20;
  background:rgba(255,251,246,.96);
  border-bottom:1px solid rgba(48,29,16,.08);
  box-shadow:0 10px 28px rgba(53,31,15,.05);
}

.bf-header-shell::after{
  display:none;
}

.bf-header-shell .bfnav{
  display:flex;
  align-items:center;
  justify-content:space-between;
  width:min(1160px,calc(100vw - 2rem));
  margin:0 auto;
  padding:.95rem 0;
  gap:1rem;
  background:transparent;
}

.bf-header-shell .bflogo{
  flex:0 0 auto;
  color:#8b1a1a;
  font-family:'Playfair Display',serif;
  font-size:clamp(1.4rem,2vw,1.7rem);
  font-weight:900;
  letter-spacing:.04em;
  text-decoration:none;
}

.bf-header-shell .bflogo span{
  color:#261508;
}

.bf-header-shell .bfnl{
  display:flex;
  align-items:center;
  gap:1rem;
  margin:0;
  padding:0;
  list-style:none;
}

.bf-header-shell .bfnl a{
  color:#5f4b3a;
  font-family:'DM Sans',sans-serif;
  font-size:.8rem;
  font-weight:700;
  letter-spacing:.08em;
  text-transform:uppercase;
}

.bf-header-shell .bfnl a::after{
  display:none;
}

.bf-header-shell .bfnl a:hover{
  color:#8b1a1a;
}

.bf-header-shell .bfnl .ncta{
  padding:.78rem 1rem;
  border-radius:999px;
  background:#8b1a1a;
  color:#fff7ef !important;
  box-shadow:none;
}

.bf-header-shell .bfnl .ncta:hover{
  background:#6e1414;
  color:#fff7ef !important;
}

.bf-header-shell .bfburg{
  border:1px solid rgba(48,29,16,.12);
  background:#fff;
}

.bf-header-shell .bfburg span{
  background:#8b1a1a;
}

.bf-header-shell .bfnl.bfopen{
  top:calc(100% - .15rem);
  border:1px solid rgba(48,29,16,.08);
  background:#fffdf9;
  box-shadow:0 22px 42px rgba(53,31,15,.1);
}

.bf-header-shell .bfnl.bfopen li + li{
  border-top:1px solid rgba(48,29,16,.06);
}

.bf-header-shell .bfnl.bfopen a{
  color:#5f4b3a;
}

.bf-header-shell .bfnl.bfopen .ncta{
  margin-top:.65rem;
}

.pg-hero{
  padding:1.9rem 0 1rem;
  background:transparent;
  overflow:visible;
}

.pg-hero::before,
.pg-hero::after{
  display:none;
}

.pg-hero-in,
.pg-hero-inner{
  width:min(1100px,calc(100vw - 2rem));
  margin:0 auto;
  padding:0;
  border:none;
  border-radius:0;
  background:transparent;
  box-shadow:none;
  backdrop-filter:none;
}

.pg-badge{
  display:inline-flex;
  align-items:center;
  min-height:30px;
  padding:0 .8rem;
  border-radius:999px;
  background:rgba(139,26,26,.08);
  border:none;
  color:#8b1a1a;
  font-family:'DM Sans',sans-serif;
  font-size:.73rem;
  font-weight:800;
  letter-spacing:.08em;
  text-transform:uppercase;
}

.pg-h1{
  margin-top:.85rem;
  color:#261508;
  font-family:'Playfair Display',serif;
  font-size:clamp(2rem,4.7vw,3.6rem);
  font-weight:900;
  line-height:1.05;
  letter-spacing:-.03em;
}

.pg-h1 em{
  display:block;
  margin-top:.35rem;
  color:#7d6450;
  font-style:normal;
  font-size:clamp(1rem,2vw,1.25rem);
  letter-spacing:0;
}

.pg-sub{
  max-width:760px;
  margin-top:.9rem;
  color:#685341;
  font-family:'Lora',serif;
  font-size:1rem;
  line-height:1.8;
}

.pg-hero-inner h1{
  margin-top:.85rem;
  color:#261508;
  font-family:'Playfair Display',serif;
  font-size:clamp(2rem,4.7vw,3.6rem);
  font-weight:900;
  line-height:1.05;
  letter-spacing:-.03em;
}

.pg-hero-inner h1 em{
  color:#7d6450;
  font-style:normal;
}

.pg-hero-sub{
  max-width:760px;
  margin-top:.9rem;
  color:#685341;
  font-family:'Lora',serif;
  font-size:1rem;
  line-height:1.8;
}

.btnp,
.pg-hero .btnp,
.ad-cta .btnp,
.ct-form-wrap .cf-btn{
  display:inline-flex;
  align-items:center;
  justify-content:center;
  min-height:48px;
  padding:0 1.25rem;
  border:none;
  border-radius:999px;
  background:#8b1a1a;
  color:#fff8f0 !important;
  font-family:'DM Sans',sans-serif;
  font-size:.84rem;
  font-weight:800;
  letter-spacing:.08em;
  text-decoration:none;
  text-transform:uppercase;
  cursor:pointer;
  box-shadow:none;
  transition:background .2s ease, transform .2s ease;
}

.btnp:hover,
.pg-hero .btnp:hover,
.ad-cta .btnp:hover,
.ct-form-wrap .cf-btn:hover{
  background:#6e1414;
  transform:translateY(-1px);
}

.bcr,
.bf-breadcrumb{
  width:min(1100px,calc(100vw - 2rem));
  margin:0 auto 1.5rem;
  padding:0;
  border:none;
  border-radius:0;
  background:transparent;
  box-shadow:none;
}

.bcr-in,
.bf-breadcrumb nav{
  display:flex;
  flex-wrap:wrap;
  align-items:center;
  gap:.45rem;
  color:#7c6550;
  font-family:'DM Sans',sans-serif;
  font-size:.8rem;
  letter-spacing:.02em;
}

.bcr-in a,
.bf-breadcrumb a{
  color:#8b1a1a;
  font-weight:700;
  text-decoration:none;
}

.bcr-sep,
.bf-breadcrumb span{
  opacity:.45;
}

.pg-hero + .faq-hero-img,
.faq-hero-img{
  display:none !important;
}

.article-wrap{
  background:transparent;
  padding:0 0 0;
}

.article-grid{
  display:grid;
  grid-template-columns:minmax(0,1.48fr) minmax(280px,.78fr);
  gap:1.4rem;
  align-items:start;
}

.article-main{
  --panel-pad:clamp(1.2rem,2.4vw,2rem);
  padding:var(--panel-pad);
  border:1px solid rgba(52,31,16,.08);
  border-radius:24px;
  background:#fffdf9;
  box-shadow:0 16px 40px rgba(54,33,17,.06);
}

.article-main > .article-img,
.article-main > img:first-child{
  display:block;
  width:calc(100% + (var(--panel-pad) * 2));
  max-width:none;
  max-height:540px;
  margin:calc(var(--panel-pad) * -1) calc(var(--panel-pad) * -1) 1.4rem;
  border-radius:24px 24px 0 0;
  object-fit:cover;
  box-shadow:none;
}

.article-main h2{
  margin:1.7rem 0 .75rem;
  color:#261508;
  font-family:'Playfair Display',serif;
  font-size:clamp(1.45rem,3vw,2rem);
  font-weight:900;
  line-height:1.18;
}

.article-main h3{
  margin:1.3rem 0 .55rem;
  color:#2f1b0d;
  font-family:'Playfair Display',serif;
  font-size:1.15rem;
  font-weight:800;
  line-height:1.28;
}

.article-main p,
.article-main li,
.faq-intro p,
.faq-card p{
  color:#614d39;
  font-family:'Lora',serif;
  font-size:.98rem;
  line-height:1.85;
}

.article-main p + p{
  margin-top:.9rem;
}

.article-main blockquote{
  margin:1.35rem 0;
  padding:1rem 1.15rem;
  border-left:4px solid #c8922a;
  border-radius:0 18px 18px 0;
  background:#fbf3e5;
  color:#553f2b;
  font-family:'Lora',serif;
  font-style:italic;
}

.article-main ul{
  margin:1rem 0 0;
  padding:0;
  list-style:none;
}

.article-main li{
  position:relative;
  padding-left:1.2rem;
}

.article-main li + li{
  margin-top:.65rem;
}

.article-main li::before{
  content:"+";
  position:absolute;
  left:0;
  top:0;
  color:#c8922a;
  font-weight:700;
}

.article-main strong,
.faq-intro strong,
.faq-card strong{
  color:#261508;
}

.article-main table{
  width:100%;
  margin:1.4rem 0;
  border-collapse:collapse;
  border-spacing:0;
  overflow:hidden;
  border:1px solid rgba(52,31,16,.08);
  border-radius:18px;
  background:#fff;
  font-family:'DM Sans',sans-serif;
  font-size:.88rem;
}

.article-main th,
.article-main td{
  padding:.9rem .95rem;
  border-bottom:1px solid rgba(52,31,16,.08);
  text-align:left;
  vertical-align:top;
}

.article-main th{
  background:#f6ede1;
  color:#261508;
  font-weight:800;
}

.article-main tr:last-child td{
  border-bottom:none;
}

.info-box{
  margin:1.25rem 0;
  padding:1.15rem 1.2rem;
  border:1px solid rgba(200,146,42,.22);
  border-radius:18px;
  background:#fbf3e5;
  box-shadow:none;
}

.info-box p{
  margin:0;
  color:#553f2b;
}

.cards-grid{
  display:grid;
  grid-template-columns:repeat(12,minmax(0,1fr));
  gap:1rem;
}

.cards-grid .card{
  grid-column:span 4;
}

.cards-grid .card:nth-child(1),
.cards-grid .card:nth-child(2){
  grid-column:span 6;
}

.card{
  overflow:hidden;
  border:1px solid rgba(52,31,16,.08);
  border-radius:20px;
  background:#fff;
  box-shadow:0 14px 30px rgba(54,33,17,.06);
}

.card > img,
.card-img-wrap img{
  width:100%;
  aspect-ratio:16 / 10;
  object-fit:cover;
}

.card-body{
  padding:1.05rem 1.1rem 1.2rem;
}

.ctag{
  display:inline-flex;
  align-items:center;
  min-height:28px;
  padding:0 .7rem;
  border-radius:999px;
  background:rgba(139,26,26,.08);
  color:#8b1a1a;
  font-family:'DM Sans',sans-serif;
  font-size:.72rem;
  font-weight:800;
  letter-spacing:.08em;
  text-transform:uppercase;
}

.card-body h3{
  margin:.8rem 0 .45rem;
  color:#261508;
  font-family:'Playfair Display',serif;
  font-size:1.1rem;
  font-weight:800;
  line-height:1.28;
}

.card-body p{
  color:#6c5742;
  font-family:'Lora',serif;
  font-size:.93rem;
  line-height:1.7;
}

.card-body a,
.card-link,
.faq-read{
  display:inline-flex;
  align-items:center;
  gap:.35rem;
  margin-top:1rem;
  color:#8b1a1a;
  font-family:'DM Sans',sans-serif;
  font-size:.8rem;
  font-weight:800;
  letter-spacing:.06em;
  text-decoration:none;
  text-transform:uppercase;
}

.sidebar{
  position:sticky;
  top:1rem;
  display:grid;
  gap:1rem;
}

.sb-card,
.sb-cta,
.bf-sb-search,
.bf-banner-sidebar{
  padding:1.1rem;
  border:1px solid rgba(52,31,16,.08);
  border-radius:20px;
  background:#fffdf9;
  box-shadow:0 14px 30px rgba(54,33,17,.05);
}

.sb-card h4,
.bf-sb-search h4{
  margin:0 0 .8rem;
  color:#261508;
  font-family:'Playfair Display',serif;
  font-size:1rem;
  font-weight:800;
}

.sb-links{
  display:grid;
  gap:.5rem;
}

.sb-links a{
  display:block;
  padding:.78rem .9rem;
  border-radius:16px;
  background:#f8f1e7;
  color:#5f4b39;
  font-family:'DM Sans',sans-serif;
  font-size:.84rem;
  font-weight:600;
  line-height:1.45;
  text-decoration:none;
}

.sb-links a:hover,
.sb-links a.active{
  background:#8b1a1a;
  color:#fff8f0;
}

.ttl-s{
  color:#261508;
  font-family:'Playfair Display',serif;
  font-size:1.15rem;
  font-weight:900;
}

.sb-cta p{
  margin:.55rem 0 1rem;
  color:#684f39;
  font-family:'Lora',serif;
  font-size:.94rem;
  line-height:1.75;
}

.bf-banner-sidebar{
  padding:.4rem;
}

.bf-banner-sidebar img{
  border-radius:16px;
}

.bf-sb-search{
  margin-bottom:0;
}

.bf-sb-search-row{
  display:flex;
  gap:.45rem;
}

.bf-sb-search-inp{
  flex:1;
  min-height:44px;
  padding:0 .85rem;
  border:1px solid rgba(52,31,16,.12);
  border-radius:14px;
  background:#fff;
  color:#2c1a0e;
  font-family:'DM Sans',sans-serif;
  font-size:.84rem;
  outline:none;
}

.bf-sb-search-btn{
  min-width:44px;
  min-height:44px;
  border:none;
  border-radius:14px;
  background:#8b1a1a;
  color:#fff;
  cursor:pointer;
}

.bf-share{
  margin-top:1.6rem;
  padding:1.25rem;
  border:1px solid rgba(52,31,16,.08);
  border-radius:20px;
  background:#fbf4ea;
}

.bf-share-title{
  margin-bottom:.95rem;
  color:#261508;
  font-family:'Playfair Display',serif;
  font-size:1rem;
  font-weight:800;
  line-height:1.3;
}

.bf-share-btns{
  display:flex;
  flex-wrap:wrap;
  gap:.65rem;
}

.bf-share-btn{
  min-height:44px;
  border-radius:999px;
  font-family:'DM Sans',sans-serif;
  font-size:.79rem;
  font-weight:800;
  letter-spacing:.05em;
  text-transform:uppercase;
}

.bf-toast{
  border-radius:999px;
}

.ct-section,
.ad-stats,
.ad-audience,
.ad-formats,
.ad-cta,
.ct-disclaimer{
  padding:0 0 1.35rem;
  background:transparent;
}

.ct-section .bfc,
.ad-stats .bfc,
.ad-audience .bfc,
.ad-formats .bfc,
.ad-cta .bfc,
.ct-disclaimer .bfc{
  width:min(1100px,calc(100vw - 2rem));
  margin:0 auto;
}

.ct-grid{
  display:grid;
  grid-template-columns:minmax(0,.95fr) minmax(0,1.05fr);
  gap:1.4rem;
  align-items:start;
}

.ct-info,
.ct-form-wrap,
.ad-stats .bfc,
.ad-audience .bfc,
.ad-formats .bfc{
  padding:1.4rem;
  border:1px solid rgba(52,31,16,.08);
  border-radius:24px;
  background:#fffdf9;
  box-shadow:0 16px 40px rgba(54,33,17,.05);
}

.ct-info h2,
.ct-form-wrap h2,
.ad-audience h2,
.ad-formats h2,
.ad-cta h2{
  margin:0 0 .7rem;
  color:#261508;
  font-family:'Playfair Display',serif;
  font-size:clamp(1.6rem,3vw,2.2rem);
  font-weight:900;
  line-height:1.12;
}

.ct-info p,
.ct-form-wrap p,
.ad-audience p,
.ad-formats p,
.ct-disclaimer p{
  color:#654f3a;
  font-family:'Lora',serif;
  font-size:.97rem;
  line-height:1.8;
}

.ct-info a,
.ct-form-wrap a,
.ad-audience a,
.ad-formats a,
.ct-disclaimer a{
  color:#8b1a1a;
}

.ct-cards{
  display:grid;
  grid-template-columns:repeat(2,minmax(0,1fr));
  gap:1rem;
  margin-top:1.25rem;
}

.ct-card{
  display:grid;
  grid-template-columns:auto 1fr;
  gap:.85rem;
  align-items:start;
  padding:1rem;
  border:1px solid rgba(52,31,16,.08);
  border-radius:20px;
  background:#f8f1e7;
}

.ct-card-icon{
  display:grid;
  place-items:center;
  width:48px;
  height:48px;
  border-radius:16px;
  background:#fff;
  color:#8b1a1a;
  font-size:1.2rem;
  line-height:1;
  box-shadow:inset 0 0 0 1px rgba(52,31,16,.08);
}

.ct-card-body{
  display:grid;
  gap:.35rem;
}

.ct-card-body strong{
  color:#261508;
  font-family:'DM Sans',sans-serif;
  font-size:.86rem;
  font-weight:800;
  letter-spacing:.05em;
  text-transform:uppercase;
}

.ct-card-body span{
  color:#6a543f;
  font-family:'Lora',serif;
  font-size:.92rem;
  line-height:1.7;
}

.ct-form-wrap form{
  display:grid;
  gap:1rem;
}

.cf-row{
  display:grid;
  grid-template-columns:repeat(2,minmax(0,1fr));
  gap:1rem;
}

.cf-field{
  display:grid;
  gap:.45rem;
}

.cf-field label{
  color:#4b3523;
  font-family:'DM Sans',sans-serif;
  font-size:.76rem;
  font-weight:800;
  letter-spacing:.08em;
  text-transform:uppercase;
}

.cf-field input,
.cf-field select,
.cf-field textarea{
  width:100%;
  min-height:50px;
  padding:0 .95rem;
  border:1px solid rgba(52,31,16,.12);
  border-radius:16px;
  background:#fff;
  color:#2c1a0e;
  font-family:'DM Sans',sans-serif;
  font-size:.94rem;
  outline:none;
  transition:border-color .2s ease, box-shadow .2s ease;
}

.cf-field textarea{
  min-height:170px;
  padding:.85rem .95rem;
  resize:vertical;
}

.cf-field input:focus,
.cf-field select:focus,
.cf-field textarea:focus{
  border-color:#8b1a1a;
  box-shadow:0 0 0 4px rgba(139,26,26,.08);
}

.cf-note{
  margin:0;
  color:#78624d;
  font-family:'DM Sans',sans-serif;
  font-size:.78rem;
  line-height:1.6;
}

.ct-disclaimer .bfc{
  padding:1rem 1.2rem;
  border-left:4px solid #c8922a;
  border-radius:0 18px 18px 0;
  background:#fbf3e5;
}

.stats-grid,
.aud-grid,
.fmt-grid{
  display:grid;
  grid-template-columns:repeat(12,minmax(0,1fr));
  gap:1rem;
  margin-top:1.2rem;
}

.stat-box{
  grid-column:span 3;
  padding:1.15rem 1rem;
  border:1px solid rgba(52,31,16,.08);
  border-radius:20px;
  background:#fff;
  text-align:center;
}

.stat-num{
  color:#261508;
  font-family:'Playfair Display',serif;
  font-size:clamp(1.45rem,3vw,2rem);
  font-weight:900;
  line-height:1;
}

.stat-lbl{
  margin-top:.45rem;
  color:#6b5540;
  font-family:'DM Sans',sans-serif;
  font-size:.82rem;
  font-weight:700;
  letter-spacing:.06em;
  text-transform:uppercase;
}

.aud-card,
.fmt-card{
  grid-column:span 4;
  padding:1.15rem;
  border:1px solid rgba(52,31,16,.08);
  border-radius:22px;
  background:#fff;
  box-shadow:0 14px 30px rgba(54,33,17,.04);
}

.aud-icon,
.fmt-tag{
  display:inline-flex;
  align-items:center;
  justify-content:center;
  min-height:32px;
  padding:0 .8rem;
  border-radius:999px;
  background:rgba(139,26,26,.08);
  color:#8b1a1a;
  font-family:'DM Sans',sans-serif;
  font-size:.75rem;
  font-weight:800;
  letter-spacing:.08em;
  text-transform:uppercase;
}

.aud-icon{
  width:52px;
  height:52px;
  padding:0;
  border-radius:18px;
  background:#f8f1e7;
  font-size:1.35rem;
  letter-spacing:0;
}

.aud-card h3,
.fmt-card h3{
  margin:.85rem 0 .45rem;
  color:#261508;
  font-family:'Playfair Display',serif;
  font-size:1.15rem;
  font-weight:800;
  line-height:1.25;
}

.aud-card p,
.fmt-card p{
  margin:0;
  color:#67513d;
  font-family:'Lora',serif;
  font-size:.94rem;
  line-height:1.75;
}

.fmt-card ul{
  display:grid;
  gap:.55rem;
  margin:1rem 0 0;
  padding:0;
  list-style:none;
}

.fmt-card li{
  position:relative;
  padding-left:1.15rem;
  color:#5f4a36;
  font-family:'DM Sans',sans-serif;
  font-size:.86rem;
  line-height:1.6;
}

.fmt-card li::before{
  content:"+";
  position:absolute;
  left:0;
  top:0;
  color:#c8922a;
  font-weight:800;
}

.ad-cta .bfc{
  padding:2rem 1.4rem;
  border-radius:28px;
  background:#8b1a1a;
  text-align:center;
  box-shadow:0 18px 42px rgba(94,20,20,.16);
}

.ad-cta h2,
.ad-cta p{
  color:#fff8f0;
}

.ad-cta p{
  max-width:720px;
  margin:0 auto 1.2rem;
  opacity:.88;
}

.ad-cta .btnp{
  background:#d4a12f;
  color:#281507 !important;
}

.ad-cta .btnp:hover{
  background:#e1b754;
}

.faq-intro,
.faq-section,
.faq-cta{
  background:transparent;
}

.faq-intro .bfc,
.faq-cta .bfc{
  padding:1.4rem;
  border:1px solid rgba(52,31,16,.08);
  border-radius:22px;
  background:#fffdf9;
  box-shadow:0 14px 30px rgba(54,33,17,.05);
}

.faq-section-title,
.faq-cta h2{
  color:#261508;
  font-family:'Playfair Display',serif;
  font-weight:900;
  line-height:1.08;
}

.faq-section-sub,
.faq-cta p{
  color:#6a543e;
  font-family:'Lora',serif;
  line-height:1.8;
}

.faq-grid{
  display:grid;
  grid-template-columns:repeat(12,minmax(0,1fr));
  gap:1rem;
  margin-top:1.5rem;
}

.faq-card{
  grid-column:span 4;
  display:flex;
  flex-direction:column;
  padding:1.15rem;
  border:1px solid rgba(52,31,16,.08);
  border-radius:20px;
  background:#fff;
  box-shadow:0 14px 30px rgba(54,33,17,.05);
}

.faq-card:nth-child(1),
.faq-card:nth-child(2){
  grid-column:span 6;
}

.faq-card-num{
  color:#c8922a;
  font-family:'Playfair Display',serif;
  font-size:2rem;
  font-weight:900;
  line-height:1;
}

.faq-card h3{
  margin:.75rem 0 .45rem;
  color:#261508;
  font-family:'Playfair Display',serif;
  font-size:1.1rem;
  font-weight:800;
  line-height:1.26;
}

.faqls{
  display:grid;
  gap:.75rem;
}

.faqit{
  border:1px solid rgba(52,31,16,.08);
  border-radius:18px;
  background:#fff;
}

.faqq{
  padding:1rem 1.1rem;
  color:#261508;
  font-family:'Playfair Display',serif;
  font-size:.98rem;
  font-weight:800;
  line-height:1.35;
}

.faqic{
  background:#c8922a;
}

.faqa{
  color:#5e4834;
  font-family:'Lora',serif;
  line-height:1.8;
}

.sec-red{
  padding:0;
  background:transparent;
}

.sec-red .bfc{
  width:100vw;
  max-width:none;
  margin-left:calc(50% - 50vw);
  padding:3rem 1rem;
  border-radius:0;
  background:#9a1d1d;
  box-shadow:none;
  text-align:center;
}

.sec-red h2{
  color:#fff8f0;
  font-family:'Playfair Display',serif;
  font-size:clamp(1.8rem,4vw,3rem);
  font-weight:900;
  line-height:1.08;
}

.sec-red p{
  max-width:780px;
  margin:.85rem auto 1.3rem;
  color:rgba(255,245,238,.82);
  font-family:'Lora',serif;
  font-size:1rem;
  line-height:1.8;
}

.sec-red .btnp{
  border-radius:10px;
  background:#d4a12f;
  color:#2b1608;
}

.sec-red .btnp:hover{
  background:#e1b754;
}

.bf-footer-shell{
  margin-top:0;
  background:#f7f0e6;
  color:#3f2c1c;
}

.bf-footer-shell::before{
  display:none;
}

.bf-footer-shell .bf-newsletter,
.bf-footer-shell .ftr-shell{
  width:min(1160px,calc(100vw - 2rem));
}

.bf-footer-shell .nl-badge,
.bf-footer-shell .ftr-label{
  color:#8b1a1a;
  border-color:rgba(139,26,26,.18);
  background:rgba(139,26,26,.05);
}

.bf-footer-shell .bf-newsletter h2,
.bf-footer-shell .bflogo span,
.bf-footer-shell .ftr-event-card strong,
.bf-footer-shell .ftrcol h4{
  color:#261508 !important;
}

.bf-footer-shell .bf-newsletter h2 em,
.bf-footer-shell .bflogo,
.bf-footer-shell .ftr-event-link,
.bf-footer-shell .ftrcol a:hover{
  color:#8b1a1a !important;
}

.bf-footer-shell .bf-newsletter p,
.bf-footer-shell .nl-note,
.bf-footer-shell .ftr-brand-copy p,
.bf-footer-shell .ftr-event-card p,
.bf-footer-shell .ftrcol a,
.bf-footer-shell .ftrbtm,
.bf-footer-shell .ftrbtm a,
.bf-footer-shell .ftr-tags span{
  color:#6a543f !important;
}

.bf-footer-shell .nl-card,
.bf-footer-shell .ftr-event-card{
  border:1px solid rgba(52,31,16,.08);
  background:#fffdf9;
  box-shadow:none;
}

.bf-footer-shell .nl-form input[type=email]{
  border:1px solid rgba(52,31,16,.12);
  background:#fff;
  color:#2c1a0e;
}

.bf-footer-shell .nl-form input[type=email]::placeholder{
  color:#8c7761;
}

.bf-footer-shell .nl-form button{
  background:#8b1a1a;
  color:#fff8f0;
  box-shadow:none;
}

.bf-footer-shell .nl-form button:hover{
  background:#6f1414;
}

.bf-footer-shell .ftr-tags span{
  border:1px solid rgba(52,31,16,.08);
  background:#fff;
}

.bf-footer-shell .ftr-event-link{
  background:rgba(139,26,26,.08);
}

.bf-footer-shell .ftr-event-link:hover{
  background:rgba(139,26,26,.12);
}

.bf-footer-shell .ftr-divider{
  border-top:1px solid rgba(52,31,16,.08);
}

@media(max-width:1024px){
  .article-grid{
    grid-template-columns:1fr;
  }

  .sidebar{
    position:static;
  }

  .ct-grid,
  .cf-row{
    grid-template-columns:1fr;
  }

  .stat-box{
    grid-column:span 6;
  }

  .aud-card,
  .fmt-card{
    grid-column:span 6;
  }

  .cards-grid .card,
  .cards-grid .card:nth-child(1),
  .cards-grid .card:nth-child(2),
  .faq-card,
  .faq-card:nth-child(1),
  .faq-card:nth-child(2){
    grid-column:span 6;
  }
}

@media(max-width:720px){
  .bf-header-shell .bfnav,
  .pg-hero-in,
  .pg-hero-inner,
  .bcr,
  .bf-breadcrumb,
  .bf-footer-shell .bf-newsletter,
  .bf-footer-shell .ftr-shell{
    width:min(1160px,calc(100vw - 1.2rem));
  }

  .cards-grid .card,
  .cards-grid .card:nth-child(1),
  .cards-grid .card:nth-child(2),
  .faq-card,
  .faq-card:nth-child(1),
  .faq-card:nth-child(2){
    grid-column:1 / -1;
  }

  .ct-cards{
    grid-template-columns:1fr;
  }

  .stat-box,
  .aud-card,
  .fmt-card{
    grid-column:1 / -1;
  }

  .bf-share-btns{
    flex-direction:column;
  }

  .bf-share-btn{
    width:100%;
    justify-content:center;
  }
}
</style>"""

HELPER_SCRIPT = """<script id="bf-non-home-js">
(function(){
  function initMenu(){
    var burger=document.getElementById('bfBurger');
    var menu=document.getElementById('bfMenu');
    if(!burger||!menu){return;}

    function closeMenu(){
      menu.classList.remove('bfopen');
      burger.classList.remove('open');
      burger.setAttribute('aria-expanded','false');
    }

    burger.addEventListener('click',function(e){
      e.stopPropagation();
      var open=menu.classList.toggle('bfopen');
      burger.classList.toggle('open',open);
      burger.setAttribute('aria-expanded',String(open));
    });

    document.addEventListener('click',function(e){
      if(!burger.contains(e.target)&&!menu.contains(e.target)){
        closeMenu();
      }
    });

    document.addEventListener('keydown',function(e){
      if(e.key==='Escape'){
        closeMenu();
      }
    });

    window.addEventListener('resize',function(){
      if(window.innerWidth>=860){
        closeMenu();
      }
    });
  }

  function initFaq(){
    var items=document.querySelectorAll('.faqit');
    items.forEach(function(item){
      var trigger=item.querySelector('.faqq');
      if(!trigger||trigger.dataset.bfBound==='true'){return;}
      trigger.dataset.bfBound='true';

      function toggle(){
        item.classList.toggle('open');
      }

      trigger.addEventListener('click',toggle);
      trigger.addEventListener('keydown',function(e){
        if(e.key==='Enter'||e.key===' '){
          e.preventDefault();
          toggle();
        }
      });
    });
  }

  window.bfCopyLink=async function(url){
    try{
      if(navigator.clipboard&&window.isSecureContext){
        await navigator.clipboard.writeText(url);
      }else{
        var area=document.createElement('textarea');
        area.value=url;
        area.setAttribute('readonly','');
        area.style.position='absolute';
        area.style.left='-9999px';
        document.body.appendChild(area);
        area.select();
        document.execCommand('copy');
        document.body.removeChild(area);
      }
      var toast=document.getElementById('bfToast');
      if(toast){
        toast.classList.add('show');
        window.setTimeout(function(){ toast.classList.remove('show'); },1800);
      }
    }catch(err){
      console.error('copy failed',err);
    }
  };

  window.bfSearch=function(){
    var input=document.getElementById('bfSbSearch');
    if(!input){return;}
    var query=(input.value||'').trim();
    if(!query){return;}
    window.location.href='https://bauernfest.org/?s='+encodeURIComponent(query);
  };

  initMenu();
  initFaq();
})();
</script>"""


def non_home_files():
    files = []
    for path in glob.glob(os.path.join(BASE, "**", "*.html"), recursive=True):
        if "\\Rodape\\" in path:
            continue
        if os.path.normpath(path) == os.path.normpath(os.path.join(BASE, "index.html")):
            continue
        files.append(path)
    return sorted(files)


def read(path):
    with open(path, "r", encoding="utf-8") as handle:
        return handle.read()


def write(path, content):
    with open(path, "w", encoding="utf-8") as handle:
        handle.write(content)


def normalize_document(content):
    lower = content.lower()
    doctypes = []
    idx = 0
    needle = "<!doctype html"
    while True:
        idx = lower.find(needle, idx)
        if idx == -1:
            break
        doctypes.append(idx)
        idx += len(needle)

    if len(doctypes) > 1:
        content = content[doctypes[-1]:]

    html_close = content.lower().find("</html>")
    if html_close != -1:
        content = content[: html_close + len("</html>")]

    return content


def upsert_style(content):
    patterns = [
        re.compile(r'<style id="bf-non-home-refresh">.*?</style>', re.DOTALL),
        re.compile(r'<style id="bf-hub-refresh">.*?</style>', re.DOTALL),
    ]
    cleaned = content
    for pattern in patterns:
        cleaned = pattern.sub("", cleaned)
    return cleaned.replace("</head>", STYLE_BLOCK + "\n</head>")


def replace_header(content, header_html):
    header_pattern = re.compile(r"<header class=\"bf-header-shell\">[\s\S]*?</header>", re.IGNORECASE)
    if not header_pattern.search(content):
        return content
    return header_pattern.sub(header_html, content, count=1)


def remove_faq_hero_image(content):
    return re.sub(
        r"\n?<img[^>]*class=\"faq-hero-img\"[^>]*>\s*",
        "\n\n",
        content,
        count=1,
        flags=re.IGNORECASE,
    )


def filter_scripts(fragment):
    scripts = re.findall(r"<script[\s\S]*?</script>", fragment, re.DOTALL)
    keep = []
    for script in scripts:
        if "var burger=document.getElementById('bfBurger')" in script:
            continue
        if 'id="bf-non-home-js"' in script:
            continue
        if "window.bfCopyLink" in script:
            continue
        if "window.bfSearch" in script:
            continue
        keep.append(script.strip())
    return keep


def replace_footer_and_tail(content, footer_html):
    body_close = re.search(r"</body>\s*</html>", content, re.DOTALL | re.IGNORECASE)
    if not body_close:
        return content

    trailing = content[body_close.end():]
    footer_markers = [
        r"<!-- NEWSLETTER -->",
        r"<div class=\"bf-footer-shell\">",
        r"<section class=\"bf-newsletter\"[^>]*>",
    ]

    starts = []
    for marker in footer_markers:
        match = re.search(marker, content, re.DOTALL)
        if match:
            starts.append(match.start())

    if not starts:
        return content

    footer_start = min(starts)
    script_fragment = content[footer_start:body_close.start()]
    preserved = filter_scripts(script_fragment)

    rebuilt = content[:footer_start].rstrip() + "\n\n" + footer_html + "\n\n"
    if preserved:
        rebuilt += "\n\n".join(preserved) + "\n\n"
    rebuilt += HELPER_SCRIPT + "\n</body>\n</html>"
    rebuilt += trailing
    return rebuilt


def main():
    header_html = read(HEADER_PATH).strip()
    footer_html = read(FOOTER_PATH).strip()
    files = non_home_files()
    print(f"Refreshing {len(files)} non-home page(s)")

    for path in files:
        content = normalize_document(read(path))
        updated = upsert_style(content)
        updated = replace_header(updated, header_html)
        updated = remove_faq_hero_image(updated)
        updated = replace_footer_and_tail(updated, footer_html)
        write(path, updated)
        print("UPDATED", os.path.relpath(path, BASE))


if __name__ == "__main__":
    main()
