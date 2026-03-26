# ESTRUTURA SILO — doodly.online

## O que é SILO?

SILO é uma arquitetura de site onde as páginas são agrupadas em **temas fechados**.
Cada silo tem uma página pilar (Hub) que aponta para artigos filhos.
Os artigos filhos só fazem links internos DENTRO do mesmo silo.
Isso concentra a autoridade temática e sinaliza ao Google que o site é especialista no assunto.

---

## Arquitetura Visual

```
doodly.online/
│
├── [SILO 1] DOODLY REVIEW (pilar principal)
│   ├── Hub: /pt/doodly-review/ (PT)
│   ├── Hub: /doodly-review/ (EN)
│   ├── Hub: /es/doodly-review/ (ES)
│   └── Hub: /nl/doodly-review/ (NL)
│
├── [SILO 2] PREÇO E PLANOS
│   ├── Hub: /pt/doodly-preco/
│   ├── Hub: /doodly-pricing/
│   ├── Hub: /es/doodly-precio/
│   └── Hub: /nl/doodly-prijs/
│
├── [SILO 3] COMPARAÇÕES
│   ├── Hub: /pt/doodly-vs/
│   ├── Hub: /doodly-vs/
│   ├── Hub: /es/doodly-vs/
│   └── Hub: /nl/doodly-vs/
│
├── [SILO 4] ALTERNATIVAS
│   ├── Hub: /pt/alternativas-doodly/
│   ├── Hub: /doodly-alternatives/
│   ├── Hub: /es/alternativas-doodly/
│   └── Hub: /nl/doodly-alternatieven/
│
├── [SILO 5] TUTORIAIS / HOW-TO
│   ├── Hub: /pt/tutorial-doodly/
│   ├── Hub: /doodly-tutorial/
│   ├── Hub: /es/tutorial-doodly/
│   └── Hub: /nl/doodly-handleiding/
│
└── [AFILIADO — noindex]
    └── /go/ → redirect para link afiliado
```

---

## SILO 1 — Doodly Review (Pilar)

### PT
| URL | Palavra-chave alvo | Tipo |
|-----|-------------------|------|
| `/pt/doodly-review/` | doodly review | Hub (pilar) |
| `/pt/doodly-vale-a-pena/` | doodly vale a pena | Artigo filho |
| `/pt/o-que-e-doodly/` | o que é doodly | Artigo filho |
| `/pt/doodly-como-funciona/` | como funciona o doodly | Artigo filho |
| `/pt/doodly-pros-e-contras/` | doodly vantagens desvantagens | Artigo filho |

### EN
| URL | Target keyword | Type |
|-----|---------------|------|
| `/doodly-review/` | doodly review | Hub (pillar) |
| `/what-is-doodly/` | what is doodly | Child article |
| `/how-does-doodly-work/` | how does doodly work | Child article |
| `/doodly-pros-and-cons/` | doodly pros and cons | Child article |
| `/is-doodly-worth-it/` | is doodly worth it | Child article |

### ES
| URL | Palabra clave | Tipo |
|-----|--------------|------|
| `/es/doodly-review/` | doodly review español | Hub (pilar) |
| `/es/que-es-doodly/` | que es doodly | Artículo hijo |
| `/es/doodly-vale-la-pena/` | doodly vale la pena | Artículo hijo |
| `/es/como-usar-doodly/` | como usar doodly | Artículo hijo |

### NL
| URL | Zoekwoord | Type |
|-----|-----------|------|
| `/nl/doodly-review/` | doodly review | Hub (pijler) |
| `/nl/wat-is-doodly/` | wat is doodly | Kind-artikel |
| `/nl/doodly-ervaringen/` | doodly ervaringen | Kind-artikel |
| `/nl/doodly-prijs/` | doodly prijs | Kind-artikel |

---

## SILO 2 — Preço e Planos

### PT
| URL | Palavra-chave alvo |
|-----|-------------------|
| `/pt/doodly-preco/` | doodly preço (hub) |
| `/pt/doodly-planos/` | doodly planos e preços |
| `/pt/doodly-desconto/` | doodly desconto cupom |
| `/pt/doodly-gratis/` | doodly gratis / trial |

### EN
| URL | Target keyword |
|-----|---------------|
| `/doodly-pricing/` | doodly pricing (hub) |
| `/doodly-free-trial/` | doodly free trial |
| `/doodly-coupon/` | doodly coupon discount |
| `/doodly-plans/` | doodly plans |

### ES
| URL | Palabra clave |
|-----|--------------|
| `/es/doodly-precio/` | doodly precio (hub) |
| `/es/doodly-gratis/` | doodly gratis prueba |
| `/es/doodly-descuento/` | doodly descuento cupón |

### NL
| URL | Zoekwoord |
|-----|-----------|
| `/nl/doodly-prijs/` | doodly prijs (hub) |
| `/nl/doodly-gratis/` | doodly gratis proberen |
| `/nl/doodly-korting/` | doodly korting |

---

## SILO 3 — Comparações

### PT
| URL | Palavra-chave alvo |
|-----|-------------------|
| `/pt/doodly-vs/` | doodly vs (hub) |
| `/pt/doodly-vs-videoscribe/` | doodly vs videoscribe |
| `/pt/doodly-vs-vyond/` | doodly vs vyond |
| `/pt/doodly-vs-powtoon/` | doodly vs powtoon |
| `/pt/doodly-vs-animaker/` | doodly vs animaker |

### EN
| URL | Target keyword |
|-----|---------------|
| `/doodly-vs/` | doodly vs (hub) |
| `/doodly-vs-videoscribe/` | doodly vs videoscribe |
| `/doodly-vs-vyond/` | doodly vs vyond |
| `/doodly-vs-powtoon/` | doodly vs powtoon |
| `/doodly-vs-animaker/` | doodly vs animaker |
| `/doodly-vs-toonly/` | doodly vs toonly |

### ES
| URL | Palabra clave |
|-----|--------------|
| `/es/doodly-vs/` | doodly vs (hub) |
| `/es/doodly-vs-videoscribe/` | doodly vs videoscribe |
| `/es/doodly-vs-vyond/` | doodly vs vyond |

### NL
| URL | Zoekwoord |
|-----|-----------|
| `/nl/doodly-vs/` | doodly vs (hub) |
| `/nl/doodly-vs-videoscribe/` | doodly vs videoscribe |
| `/nl/doodly-vs-vyond/` | doodly vs vyond |

---

## SILO 4 — Alternativas

### PT
| URL | Palavra-chave alvo |
|-----|-------------------|
| `/pt/alternativas-doodly/` | alternativas ao doodly (hub) |
| `/pt/melhores-softwares-whiteboard/` | melhores softwares whiteboard |
| `/pt/videoscribe-review/` | videoscribe review |
| `/pt/vyond-review/` | vyond review |

### EN
| URL | Target keyword |
|-----|---------------|
| `/doodly-alternatives/` | doodly alternatives (hub) |
| `/best-whiteboard-animation-software/` | best whiteboard animation software |
| `/videoscribe-review/` | videoscribe review |
| `/vyond-review/` | vyond review |

### ES / NL
*(estrutura idêntica, adaptar idioma)*

---

## SILO 5 — Tutoriais

### PT
| URL | Palavra-chave alvo |
|-----|-------------------|
| `/pt/tutorial-doodly/` | tutorial doodly (hub) |
| `/pt/doodly-para-iniciantes/` | doodly para iniciantes |
| `/pt/como-criar-video-doodly/` | como criar vídeo com doodly |
| `/pt/doodly-para-professores/` | doodly para professores |
| `/pt/doodly-para-marketing/` | doodly para marketing |

### EN
| URL | Target keyword |
|-----|---------------|
| `/doodly-tutorial/` | doodly tutorial (hub) |
| `/doodly-for-beginners/` | doodly for beginners |
| `/how-to-use-doodly/` | how to use doodly |
| `/doodly-for-teachers/` | doodly for teachers |
| `/doodly-for-marketing/` | doodly for marketing |

---

## Regras de Links Internos SILO

1. **Hub aponta para todos os artigos filhos do seu silo** ✅
2. **Artigo filho aponta SEMPRE para o Hub** ✅
3. **Artigos filhos podem linkar entre si DENTRO do mesmo silo** ✅
4. **Artigos de silos diferentes NÃO se linkam diretamente** — passam pelo Hub ✅
5. **Homepage linka para todos os Hubs** ✅
6. **Cada idioma tem seus próprios links internos — sem cruzar idiomas** ✅

---

## hreflang — Mapeamento entre idiomas

Para cada página, adicionar o conjunto completo de hreflang:

```html
<!-- Exemplo: página de Review -->
<link rel="alternate" hreflang="pt-br" href="https://doodly.online/pt/doodly-review/" />
<link rel="alternate" hreflang="en"    href="https://doodly.online/doodly-review/" />
<link rel="alternate" hreflang="es"    href="https://doodly.online/es/doodly-review/" />
<link rel="alternate" hreflang="nl"    href="https://doodly.online/nl/doodly-review/" />
<link rel="alternate" hreflang="x-default" href="https://doodly.online/doodly-review/" />
```

Configurar via Rank Math → Títulos & Meta → Hreflang (ativar módulo).
