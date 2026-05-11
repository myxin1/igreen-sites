# $site — Bauernfest.org Design System Reference

> Snapshot completo do design system aprovado. Usar como referência em qualquer alteração futura de layout, cor, fonte ou estrutura.

---

## Identidade Visual

**Tema:** Festival alemão / bávaro — Bauernfest de Petrópolis
**Tom:** Elegante, tradicional, sério (não kitsch)

### Paleta de Cores (CSS Variables)

| Token | Valor | Uso |
|---|---|---|
| `--rot` | `#8B1A1A` | Vermelho Bávaro — CTAs secundários, links hover |
| `--rot-l` | `#a82020` | Vermelho claro — hover states |
| `--gold` | `#C8922A` | Ouro Alemão — labels, bordas, destaques |
| `--glt` | `#E8B84B` | Ouro claro — logo, links nav, números |
| `--dark` | `#100805` | Marrom quase-preto — backgrounds escuros |
| `--dark2` | `#1c0d06` | Marrom escuro — gradiente header |
| `--dark3` | `#2a1508` | Marrom médio — sidebar CTA, footer topo |
| `--cream` | `#F8F1E4` | Creme — background de seções, breadcrumb |
| `--sand` | `#EDE3D4` | Areia — bordas claras, hover backgrounds |
| `--text` | `#2C1A0E` | Marrom texto — corpo de texto |
| `--muted` | `#7A6048` | Marrom médio — texto secundário |

---

## Tipografia

| Fonte | Uso |
|---|---|
| **Playfair Display** (serif, 900) | H1–H6, logo, números de stats |
| **DM Sans** (sans-serif) | Labels, nav, botões, UI em geral |
| **Lora** (serif) | Parágrafos de artigos, texto editorial |

- `font-size` base: `16px`
- `line-height` corpo: `1.6` (parágrafos de artigo: `1.85`)
- Títulos usam `clamp()` para responsividade automática

---

## Layout Geral

```
┌──────────────────────────────────────────────────────┐
│  TOPBAR (36px) — frase + link dourado                │
├──────────────────────────────────────────────────────┤
│  NAV (68px) — logo esquerda · links direita · burger │
├──────────────────────────────────────────────────────┤
│  TICKER BAR (38px) — animação de notícias            │
├──────────────────────────────────────────────────────┤
│  HERO — fundo escuro, H1 branco/ouro, badge, stats   │
├──────────────────────────────────────────────────────┤
│  INTRO — fundo creme, imagem float-left + texto Lora │
├──────────────────────────────────────────────────────┤
│  CARDS GRID — 3 colunas desktop, 1 mobile           │
├──────────────────────────────────────────────────────┤
│  CTA SECTION — fundo vermelho (#8B1A1A)              │
├──────────────────────────────────────────────────────┤
│  NEWSLETTER — fundo escuro, 2 colunas                │
├──────────────────────────────────────────────────────┤
│  FOOTER — 2 linhas (brand+evento / grid de links)    │
└──────────────────────────────────────────────────────┘
```

**Container max-width:** `1180px` (classe `.bfc`, padding lateral `1.25rem` → `2rem`)

---

## Header

```
┌────────────────────────────────────────────────────┐
│ TOPBAR: [texto esquerda]          [LINK DOURADO →] │  h=36px, bg escuro
├────────────────────────────────────────────────────┤
│ [BAUERNFEST  · Petrópolis RJ]  [menu links] [CTA] │  h=68px, sticky
└────────────────────────────────────────────────────┘
```

- **Posição:** `sticky top:0; z-index:200`
- **Background:** `linear-gradient(180deg, #100805 → #1c0d06)`
- **Logo:** Playfair Display 900, cor `--glt` + span branco, tagline abaixo
- **Links nav desktop:** visíveis em ≥860px, underline animado em hover
- **CTA nav:** pill dourada com gradiente, `border-radius:999px`
- **Mobile:** hamburger com 3 linhas → X animado, dropdown com `backdrop-filter:blur`
- **Ticker bar:** 38px, fundo `#0e0702`, animação scroll 240s

---

## Body / Páginas de Artigo

```
┌──────────────────────────────────┬──────────────┐
│  BREADCRUMB (fundo creme)        │              │
├──────────────────────────────────┤              │
│  ARTIGO (.bf-article)            │  SIDEBAR     │
│  - H1 Playfair                   │  300–320px   │
│  - H2 com border-bottom sand     │  sticky      │
│  - Parágrafos Lora 1.04rem       │              │
│  - Blockquote borda ouro         │  [sb-card]   │
│  - Tabelas escuras               │  [sb-cta]    │
│  - Post nav anterior/próximo     │  [banner]    │
│  - FAQ accordion                 │              │
├──────────────────────────────────┴──────────────┤
│  SHARE BUTTONS (FB · WhatsApp · Copiar link)    │
└────────────────────────────────────────────────┘
```

- **Grid:** `1fr` mobile → `2fr 300px` (≥900px) → `2fr 320px` (≥1100px)
- **Background:** `var(--cream)` na page-wrap
- **Breadcrumb:** `var(--cream)`, `border-bottom`, links `--gold`
- **3-block approach nos posts:** nav customizado com breadcrumb por categoria

---

## Sidebar

```
┌──────────────────────┐
│  LABEL DOURADO       │
│  sb-card:            │
│  → link artigo 1     │
│  → link artigo 2     │
│  → link artigo 3     │
├──────────────────────┤
│  sb-cta (escuro):    │
│  título branco       │
│  texto 65%           │
│  [BOTÃO OURO 100%]   │
├──────────────────────┤
│  banner img          │
└──────────────────────┘
```

- **Sticky:** `top: calc(68px + 36px + 1.5rem)` quando desktop
- **Cards:** `bg:#fff`, `border-radius:16px`, `box-shadow`
- **Links:** `color:--rot`, seta `→` dourada antes de cada item
- **CTA card:** background gradiente escuro, botão dourado 100% width

---

## Footer

```
┌─────────────────────────────────────────────────────┐
│  [BAUERNFEST logo]              [Card Evento]        │
│  tagline                        data, desc, link     │
│  [tags: Petrópolis · Alemã · ...]                   │
├─────────────────────────────────────────────────────┤
│  FAQ | Sobre | Gastronomia | Programação | Turismo  │ 5 colunas
│  links...  links...  links...   links...   links... │
├─────────────────────────────────────────────────────┤
│  © 2025 bauernfest.org     Privacidade · Termos     │
└─────────────────────────────────────────────────────┘
```

- **Background:** `linear-gradient(#3d1f0a → #1c0d06)`
- **Grid links:** 2 cols mobile → 3 cols 680px → 5 cols 1100px
- **Card evento:** `border:1px solid rgba(--glt, .16)`, `border-radius:18px`, glassmorphism leve
- **Copyright:** `font-size:.76rem`, cor `rgba(255,247,238,.4)`

---

## Estrutura SILO

```
bauernfest.org/
├── /FAQ/              ← Hub FAQ (10 artigos)
│   ├── bauernfest-2026/
│   ├── como-funciona-a-bauernfest/
│   ├── datas-da-bauernfest/
│   ├── horario-bauernfest-petropolis/
│   ├── o-que-e-a-bauernfest/
│   ├── o-que-fazer-na-bauernfest/
│   ├── quando-e-a-bauernfest-petropolis/
│   ├── quantos-dias-dura-a-bauernfest/
│   ├── quem-a-bauernfest-homenageia/
│   └── significado-de-bauernfest/
│
├── /gastronomia/      ← Hub Gastronomia
│   ├── chopp-artesanal-petropolis
│   ├── eisbein-bauernfest
│   ├── pratos-tipicos-bauernfest
│   └── strudel-receita-alema
│
├── /programacao/      ← Hub Programação
│   ├── bauernfest-2026-datas
│   ├── concursos-jogos-germanicos
│   ├── shows-musica-ao-vivo-bauernfest
│   └── vale-germanico-bauernfest
│
├── /receitas-alemas/  ← Hub Receitas
│   ├── bratwurst-receita/
│   ├── kassler-receita/
│   ├── pretzel-receita/
│   ├── sauerkraut-receita/
│   └── selva-negra-receita/
│
├── /sobre/            ← Hub Sobre / Institucional
│   ├── dancas-folcloricas-alemas-petropolis
│   ├── historia-bauernfest-petropolis
│   ├── imigracao-alema-petropolis
│   └── palacio-de-cristal-petropolis
│
├── /turismo/          ← Hub Turismo
│   ├── como-chegar-bauernfest-rio-de-janeiro
│   ├── hoteis-perto-bauernfest-petropolis
│   ├── o-que-fazer-petropolis
│   └── petropolis-fim-de-semana
│
├── /anuncie/
├── /contato/
├── /politica-de-privacidade/
└── /termos-de-uso/
```

**Total:** ~43 páginas HTML estáticas

---

## Componentes Chave

### Botões
- `.btnp` — sólido dourado (`--gold`), hover `--glt` + translateY(-2px)
- `.btno` — outline branco translúcido, hover borda dourada
- `.ncta` — pill dourada no nav (gradient), `border-radius:999px`

### Cards (silos)
- `border-radius:16px`, `overflow:hidden`, `border:1px solid rgba(0,0,0,.07)`
- Hover: `translateY(-5px)` + shadow mais forte
- Imagem `aspect-ratio:16/9`, `object-fit:cover`, zoom 1.05 no hover

### FAQ Accordion
- `<details>/<summary>` nativo HTML
- `+` → rotaciona 45° quando aberto
- Background `--cream` quando aberto, `border-bottom:1px solid --sand`

### Breadcrumb
- Fundo `--cream`, `font-size:.76rem`
- Links `--gold`, hover `--rot`, separador `›` com `opacity:.45`

---

## CSS Principal

**Arquivo:** `site-bauernfest/assets/bf-main.css`
**CSS adicional:** `site-bauernfest/Rodape/shared-bottom.css`, `nav-breadcrumb.css`
**Versão:** Design System v2.0 (BauerUP v2)

### Breakpoints
| px | Layout muda |
|---|---|
| 480px | Stats grid 2→4 colunas; ticker ajusta |
| 520px | Brand meta visível |
| 640px | Padding container aumenta |
| 680px | Footer grid 2→3 colunas |
| 860px | Nav desktop aparece, hamburger some |
| 900px | Article+sidebar 2 colunas |
| 920px | Footer top 2 colunas |
| 1100px | Sidebar 320px; footer grid 5 colunas |
| 1200px | Container padding máximo |

---

## Propagação de Mudanças

Qualquer mudança global deve ser propagada com `/BauerUP`.
O BauerUP atualiza:
1. Nav, footer e estilos em todas as ~43 páginas HTML estáticas
2. **WordPress Reusable Blocks** (blocos sincronizados):
   - `BF-Nav` (ID 2349) — header + nav HTML para todos os posts WP
   - `BF-Footer` (ID 2350) — footer HTML para todos os posts WP
   - `BF-CSS` (ID 2348) — CSS global dos posts WP (atualização manual se necessário)

### Estrutura de novo post WordPress

Todo post novo deve usar esta estrutura de blocos:
```
<!-- wp:block {"ref":2348} --><!-- /wp:block -->   ← CSS global
<!-- wp:block {"ref":2349} --><!-- /wp:block -->   ← nav/header
<!-- wp:html -->
<div class="bf-breadcrumb"><nav class="bfc" aria-label="Breadcrumb">
  <a href="https://bauernfest.org/">Bauernfest</a><span>›</span>
  <a href="/[categoria]/">[Categoria]</a><span>›</span>
  <span>[Título]</span>
</nav></div>
<div class="bf-page-wrap"><div class="bf-page-inner">
<article class="bf-article">
  <h1>[Título]</h1>
  [conteúdo]
</article>
<aside>
  <div class="sb-card">
    <span class="lbl">[Label da sidebar]</span>
    <ul>[links relacionados]</ul>
  </div>
</aside>
</div></div>
<!-- /wp:html -->
<!-- wp:block {"ref":2350} --><!-- /wp:block -->   ← footer
```
