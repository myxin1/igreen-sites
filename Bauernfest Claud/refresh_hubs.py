import os
import re

BASE = r"c:\Users\User\Downloads\Projeto Claude Code\Bauernfest Claud\site-bauernfest"
FOOTER_PATH = os.path.join(BASE, "Rodape", "footer.html")

TARGETS = [
    os.path.join(BASE, "sobre", "index.html"),
    os.path.join(BASE, "programacao", "index.html"),
    os.path.join(BASE, "gastronomia", "index.html"),
    os.path.join(BASE, "turismo", "index.html"),
    os.path.join(BASE, "receitas-alemas", "index.html"),
    os.path.join(BASE, "FAQ", "index.html"),
]

STYLE_BLOCK = """<style id="bf-hub-refresh">
body{
  background:
    radial-gradient(circle at top left,rgba(232,184,75,.08),transparent 24%),
    linear-gradient(180deg,#f8f1e6 0%,#f4ebdf 52%,#efe5d7 100%);
  color:var(--text,#2c1a0e);
}

.bfsite{
  background:transparent;
}

.pg-hero{
  position:relative;
  overflow:hidden;
  padding:clamp(3.4rem,8vw,6.2rem) 0 2.7rem;
  background:
    radial-gradient(circle at 16% 18%,rgba(232,184,75,.22),transparent 26%),
    radial-gradient(circle at 82% 22%,rgba(139,26,26,.18),transparent 24%),
    linear-gradient(140deg,#1c0c05 0%,#261208 38%,#160903 100%);
}

.pg-hero::before{
  content:"";
  position:absolute;
  inset:auto 0 0;
  height:1px;
  background:linear-gradient(90deg,transparent,rgba(232,184,75,.7),transparent);
}

.pg-hero::after{
  content:"";
  position:absolute;
  inset:0;
  background:
    linear-gradient(90deg,rgba(255,255,255,.03) 1px,transparent 1px),
    linear-gradient(rgba(255,255,255,.03) 1px,transparent 1px);
  background-size:32px 32px;
  mask-image:linear-gradient(180deg,rgba(0,0,0,.7),transparent 78%);
  pointer-events:none;
}

.pg-hero-in{
  position:relative;
  z-index:1;
  width:min(1120px,calc(100vw - 2rem));
  margin:0 auto;
  padding:clamp(1.5rem,4vw,2.6rem);
  border:1px solid rgba(232,184,75,.16);
  border-radius:32px;
  background:linear-gradient(180deg,rgba(255,255,255,.09),rgba(255,255,255,.03));
  box-shadow:0 28px 70px rgba(10,4,2,.24);
  backdrop-filter:blur(10px);
}

.pg-badge{
  display:inline-flex;
  align-items:center;
  min-height:34px;
  padding:0 .95rem;
  border:1px solid rgba(232,184,75,.28);
  border-radius:999px;
  background:rgba(255,255,255,.05);
  color:#f0ca7a;
  font-family:'DM Sans',sans-serif;
  font-size:.74rem;
  font-weight:700;
  letter-spacing:.12em;
  text-transform:uppercase;
}

.pg-h1{
  margin-top:1rem;
  color:#fff7ef;
  font-family:'Playfair Display',serif;
  font-size:clamp(2.2rem,6vw,4.6rem);
  font-weight:900;
  line-height:1.02;
  letter-spacing:-.03em;
}

.pg-h1 em{
  display:block;
  margin-top:.4rem;
  color:#f0ca7a;
  font-style:italic;
  font-size:clamp(1.2rem,3.1vw,2rem);
  letter-spacing:0;
}

.pg-sub{
  max-width:760px;
  margin-top:1.15rem;
  color:rgba(255,248,240,.76);
  font-family:'Lora',serif;
  font-size:clamp(.98rem,2vw,1.08rem);
  line-height:1.85;
}

.bcr,
.bf-breadcrumb{
  width:min(1120px,calc(100vw - 2rem));
  margin:-1.25rem auto 0;
  position:relative;
  z-index:3;
  border:1px solid rgba(26,16,8,.08);
  border-radius:20px;
  background:rgba(255,255,255,.9);
  box-shadow:0 18px 40px rgba(60,36,18,.08);
}

.bcr{
  padding:.95rem 1.15rem;
}

.bcr-in,
.bf-breadcrumb .bfc{
  padding:0;
}

.bcr-in,
.bf-breadcrumb nav{
  display:flex;
  flex-wrap:wrap;
  align-items:center;
  gap:.45rem;
  color:var(--muted,#7a6048);
  font-family:'DM Sans',sans-serif;
  font-size:.8rem;
  letter-spacing:.02em;
}

.bcr-in a,
.bf-breadcrumb a{
  color:var(--gold,#c8922a);
  font-weight:700;
  text-decoration:none;
}

.bcr-sep,
.bf-breadcrumb span{
  opacity:.45;
}

.article-wrap{
  background:transparent;
  padding:clamp(2rem,5vw,4rem) 0 0;
}

.article-grid{
  display:grid;
  grid-template-columns:minmax(0,1.55fr) minmax(290px,.78fr);
  gap:clamp(1.2rem,2.8vw,2rem);
  align-items:start;
}

.article-main{
  padding:clamp(1.35rem,3vw,2.2rem);
  border:1px solid rgba(61,35,16,.08);
  border-radius:30px;
  background:rgba(255,255,255,.88);
  box-shadow:0 18px 46px rgba(77,51,24,.08);
}

.article-main > :first-child{
  margin-top:0 !important;
}

.article-img,
.article-main > img:first-child{
  width:100%;
  border-radius:24px;
  box-shadow:0 22px 42px rgba(22,10,4,.16);
  margin-bottom:1.6rem;
}

.article-main h2{
  margin:2rem 0 .85rem;
  color:#231208;
  font-family:'Playfair Display',serif;
  font-size:clamp(1.55rem,3vw,2.2rem);
  font-weight:900;
  line-height:1.18;
}

.article-main h3{
  margin:1.5rem 0 .65rem;
  color:#2b170a;
  font-family:'Playfair Display',serif;
  font-size:1.2rem;
  font-weight:800;
  line-height:1.25;
}

.article-main p,
.article-main li,
.faq-intro p{
  color:#584531;
  font-family:'Lora',serif;
  font-size:1rem;
  line-height:1.88;
}

.article-main p + p{
  margin-top:.95rem;
}

.article-main ul{
  display:grid;
  gap:.8rem;
  margin:1rem 0 0;
  padding:0;
  list-style:none;
}

.article-main li{
  position:relative;
  padding-left:1.2rem;
}

.article-main li::before{
  content:"+";
  position:absolute;
  left:0;
  top:0;
  color:var(--gold,#c8922a);
  font-weight:700;
}

.article-main strong,
.faq-intro strong{
  color:#241206;
}

.info-box{
  margin:1.4rem 0 1.1rem;
  padding:1.2rem 1.25rem;
  border:1px solid rgba(200,146,42,.22);
  border-radius:24px;
  background:linear-gradient(135deg,rgba(248,232,198,.55),rgba(255,255,255,.82));
  box-shadow:0 14px 28px rgba(200,146,42,.08);
}

.info-box p{
  margin:0;
  color:#47331f;
}

.article-main .cards-grid{
  display:grid !important;
  grid-template-columns:repeat(12,minmax(0,1fr)) !important;
  gap:1rem !important;
  margin-top:1.5rem !important;
}

.article-main .cards-grid .card{
  grid-column:span 4;
  height:100%;
}

.article-main .cards-grid .card:nth-child(1),
.article-main .cards-grid .card:nth-child(2){
  grid-column:span 6;
}

.card{
  overflow:hidden;
  border:1px solid rgba(61,35,16,.08);
  border-radius:24px;
  background:#fffdf9;
  box-shadow:0 16px 36px rgba(57,33,15,.08);
  transition:transform .2s ease,box-shadow .2s ease;
}

.card:hover{
  transform:translateY(-4px);
  box-shadow:0 24px 46px rgba(57,33,15,.14);
}

.card > img,
.card-img-wrap img{
  width:100%;
  aspect-ratio:16 / 10;
  object-fit:cover;
}

.card-body{
  padding:1.15rem 1.15rem 1.25rem;
}

.ctag{
  display:inline-flex;
  align-items:center;
  min-height:30px;
  padding:0 .7rem;
  border-radius:999px;
  background:rgba(139,26,26,.08);
  color:#8b1a1a;
  font-family:'DM Sans',sans-serif;
  font-size:.72rem;
  font-weight:700;
  letter-spacing:.08em;
  text-transform:uppercase;
}

.card-body h3{
  margin:.9rem 0 .45rem;
  color:#241206;
  font-family:'Playfair Display',serif;
  font-size:1.18rem;
  font-weight:800;
  line-height:1.24;
}

.card-body p{
  color:#6a543d;
  font-family:'Lora',serif;
  font-size:.94rem;
  line-height:1.72;
}

.card-body a,
.card-link{
  display:inline-flex;
  align-items:center;
  gap:.35rem;
  margin-top:1rem;
  color:var(--gold,#c8922a);
  font-family:'DM Sans',sans-serif;
  font-size:.82rem;
  font-weight:800;
  letter-spacing:.05em;
  text-transform:uppercase;
  text-decoration:none;
}

.sidebar{
  position:sticky;
  top:1.2rem;
  display:grid;
  gap:1rem;
}

.sb-card,
.sb-cta,
.bf-sb-search,
.bf-banner-sidebar{
  padding:1.2rem;
  border:1px solid rgba(61,35,16,.08);
  border-radius:24px;
  background:rgba(255,255,255,.82);
  box-shadow:0 16px 34px rgba(57,33,15,.07);
}

.sb-card h4,
.bf-sb-search h4{
  margin:0 0 .85rem;
  color:#231208;
  font-family:'Playfair Display',serif;
  font-size:1.05rem;
  font-weight:800;
  line-height:1.3;
}

.sb-links{
  display:grid;
  gap:.55rem;
}

.sb-links a{
  display:block;
  padding:.8rem .95rem;
  border-radius:18px;
  background:#f8f3eb;
  color:#56422f;
  font-family:'DM Sans',sans-serif;
  font-size:.86rem;
  font-weight:600;
  line-height:1.5;
  text-decoration:none;
  transition:background .2s ease,color .2s ease,transform .2s ease;
}

.sb-links a:hover,
.sb-links a.active{
  background:linear-gradient(135deg,#2d1408 0%,#1a0d05 100%);
  color:#fff9f0;
  transform:translateX(2px);
}

.ttl-s{
  color:#231208;
  font-family:'Playfair Display',serif;
  font-size:1.2rem;
  font-weight:900;
  line-height:1.2;
}

.sb-cta p{
  margin:.65rem 0 1rem;
  color:#614d38;
  font-family:'Lora',serif;
  font-size:.95rem;
  line-height:1.75;
}

.bf-banner-sidebar{
  padding:.5rem;
}

.bf-banner-sidebar img{
  border-radius:18px;
}

.bf-share{
  margin-top:1.8rem;
  padding:1.35rem;
  border:1px solid rgba(61,35,16,.08);
  border-radius:24px;
  background:linear-gradient(135deg,rgba(249,243,232,.96),rgba(255,255,255,.95));
}

.bf-share-title{
  margin-bottom:1rem;
  color:#241206;
  font-family:'Playfair Display',serif;
  font-size:1.08rem;
  font-weight:800;
  line-height:1.3;
}

.bf-share-btns{
  display:flex;
  flex-wrap:wrap;
  gap:.7rem;
}

.bf-share-btn{
  min-height:46px;
  border-radius:999px;
  font-family:'DM Sans',sans-serif;
  font-size:.82rem;
  font-weight:800;
  letter-spacing:.04em;
  text-transform:uppercase;
}

.bf-toast{
  border-radius:999px;
}

.faqls{
  display:grid;
  gap:.8rem;
}

.faqit{
  border:1px solid rgba(61,35,16,.08);
  border-radius:20px;
  background:#fffdf9;
  box-shadow:0 12px 28px rgba(57,33,15,.06);
}

.faqq{
  padding:1.1rem 1.2rem;
  color:#251308;
  font-family:'Playfair Display',serif;
  font-size:1rem;
  font-weight:800;
  line-height:1.35;
}

.faqic{
  background:linear-gradient(135deg,#f0ca7a,#c8922a);
}

.faqa{
  color:#5c4833;
  font-family:'Lora',serif;
  line-height:1.8;
}

.sec-red{
  background:transparent;
  padding:1.2rem 0 0;
}

.sec-red .bfc{
  padding:clamp(1.6rem,4vw,2.5rem);
  border-radius:30px;
  background:
    radial-gradient(circle at top right,rgba(232,184,75,.16),transparent 24%),
    linear-gradient(135deg,#8b1a1a 0%,#56100f 100%);
  box-shadow:0 24px 44px rgba(71,15,14,.18);
  text-align:left;
}

.sec-red h2{
  color:#fff7ef;
  font-family:'Playfair Display',serif;
  font-size:clamp(1.8rem,4vw,2.9rem);
  font-weight:900;
  line-height:1.08;
}

.sec-red p{
  max-width:760px;
  margin:.9rem 0 1.2rem;
  color:rgba(255,248,240,.76);
  font-family:'Lora',serif;
  font-size:1rem;
  line-height:1.8;
}

.sec-red .btnp{
  border-radius:999px;
  background:#fff7ef;
  color:#6d1312;
}

.sec-red .btnp:hover{
  background:#f0ca7a;
  color:#241206;
}

.faq-hero-img{
  width:min(1120px,calc(100vw - 2rem));
  margin:-1rem auto 0;
  border-radius:24px;
  box-shadow:0 24px 50px rgba(20,8,4,.16);
  position:relative;
  z-index:3;
}

.faq-intro{
  padding:2rem 0 .4rem;
}

.faq-intro .bfc{
  padding:1.3rem 1.4rem;
  border:1px solid rgba(61,35,16,.08);
  border-radius:24px;
  background:rgba(255,255,255,.78);
  box-shadow:0 16px 34px rgba(57,33,15,.06);
}

.faq-section{
  padding:2rem 0 0;
}

.faq-section-title{
  color:#231208;
  font-family:'Playfair Display',serif;
  font-size:clamp(1.9rem,4vw,3rem);
  font-weight:900;
  line-height:1.08;
}

.faq-section-sub{
  margin-top:.8rem;
  color:#6a543d;
  font-family:'Lora',serif;
  font-size:1rem;
  line-height:1.8;
}

.faq-grid{
  display:grid;
  grid-template-columns:repeat(12,minmax(0,1fr));
  gap:1rem;
  margin-top:1.7rem;
}

.faq-card{
  grid-column:span 4;
  display:flex;
  flex-direction:column;
  min-height:100%;
  padding:1.2rem;
  border:1px solid rgba(61,35,16,.08);
  border-radius:24px;
  background:rgba(255,255,255,.9);
  box-shadow:0 16px 34px rgba(57,33,15,.07);
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
  margin:.8rem 0 .45rem;
  color:#241206;
  font-family:'Playfair Display',serif;
  font-size:1.16rem;
  font-weight:800;
  line-height:1.25;
}

.faq-card p{
  color:#654f39;
  font-family:'Lora',serif;
  font-size:.95rem;
  line-height:1.76;
}

.faq-read{
  display:inline-flex;
  align-items:center;
  margin-top:auto;
  padding-top:1rem;
  color:#8b1a1a;
  font-family:'DM Sans',sans-serif;
  font-size:.82rem;
  font-weight:800;
  letter-spacing:.05em;
  text-decoration:none;
  text-transform:uppercase;
}

.faq-cta{
  padding:1.4rem 0 0;
  background:transparent;
}

.faq-cta .bfc{
  padding:1.8rem;
  border-radius:28px;
  background:
    radial-gradient(circle at top right,rgba(232,184,75,.18),transparent 26%),
    linear-gradient(135deg,#231108 0%,#120904 100%);
  box-shadow:0 26px 48px rgba(20,8,4,.16);
  text-align:left;
}

.faq-cta h2{
  color:#fff7ef;
  font-family:'Playfair Display',serif;
  font-size:clamp(1.85rem,4vw,2.8rem);
  font-weight:900;
  line-height:1.08;
}

.faq-cta p{
  max-width:700px;
  margin:.8rem 0 1.15rem;
  color:rgba(255,248,240,.74);
  font-family:'Lora',serif;
  font-size:1rem;
  line-height:1.8;
}

@media(max-width:1024px){
  .article-grid{
    grid-template-columns:1fr;
  }

  .sidebar{
    position:static;
  }

  .article-main .cards-grid .card,
  .article-main .cards-grid .card:nth-child(1),
  .article-main .cards-grid .card:nth-child(2),
  .faq-card,
  .faq-card:nth-child(1),
  .faq-card:nth-child(2){
    grid-column:span 6;
  }
}

@media(max-width:720px){
  .pg-hero-in,
  .bcr,
  .bf-breadcrumb,
  .faq-hero-img{
    width:min(1120px,calc(100vw - 1.2rem));
  }

  .article-main .cards-grid .card,
  .article-main .cards-grid .card:nth-child(1),
  .article-main .cards-grid .card:nth-child(2),
  .faq-card,
  .faq-card:nth-child(1),
  .faq-card:nth-child(2){
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


def replace_or_insert_style(content):
    marker = re.compile(r'<style id="bf-hub-refresh">.*?</style>', re.DOTALL)
    if marker.search(content):
        return marker.sub(STYLE_BLOCK, content)
    return content.replace("</head>", STYLE_BLOCK + "\n</head>")


def replace_footer(content, footer_html):
    pattern = re.compile(r"<!-- NEWSLETTER -->.*?(?=<script>\s*\(function\(\)\{)", re.DOTALL)
    return pattern.sub(footer_html + "\n\n", content)


def main():
    with open(FOOTER_PATH, "r", encoding="utf-8") as handle:
        footer_html = handle.read().strip()

    for path in TARGETS:
        with open(path, "r", encoding="utf-8") as handle:
            content = handle.read()

        updated = replace_or_insert_style(content)
        updated = replace_footer(updated, footer_html)

        with open(path, "w", encoding="utf-8") as handle:
            handle.write(updated)

        print(f"UPDATED {os.path.relpath(path, BASE)}")


if __name__ == "__main__":
    main()
