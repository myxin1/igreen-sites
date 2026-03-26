# CHECKLIST ON-PAGE SEO — doodly.online

> Aplicar em TODOS os artigos antes de publicar.

---

## 1. TITLE TAG

- [ ] Contém a palavra-chave principal
- [ ] Keyword o mais próximo possível do início
- [ ] Entre 50–60 caracteres
- [ ] Inclui um diferencial (ano, "review", "guia completo", "vale a pena")
- [ ] Não repete a keyword do domínio desnecessariamente

**Fórmulas que funcionam para afiliados:**
```
[Keyword] + [Benefício/Promessa] | doodly.online
[Keyword]: [Pergunta que o usuário faz] | doodly.online

Exemplos:
"Doodly Review 2026: Vale a Pena? Testei e Falo Tudo"
"Doodly Preço 2026: Planos, Valores e Onde Comprar Mais Barato"
"Doodly vs VideoScribe: Qual é Melhor em 2026?"
```

---

## 2. META DESCRIPTION

- [ ] Entre 150–160 caracteres
- [ ] Contém a palavra-chave principal
- [ ] Tem uma chamada para ação (CTA): "Veja", "Descubra", "Confira", "Clique"
- [ ] Gera curiosidade ou resolve uma dúvida clara
- [ ] Única por página (nunca duplicada)

**Fórmula:**
```
[Benefício claro] + [Palavra-chave] + [CTA]

Exemplo:
"Testei o Doodly por 30 dias. Veja tudo sobre preços, recursos,
vantagens e se realmente vale a pena investir. Leia antes de comprar."
```

---

## 3. URL

- [ ] Curta e descritiva
- [ ] Contém a keyword principal
- [ ] Letras minúsculas, palavras separadas por hífen
- [ ] Sem stop words desnecessárias (de, para, o, a, um)
- [ ] Estrutura de subpasta correta para o idioma (/pt/, /es/, /nl/)

```
✅ /pt/doodly-vale-a-pena/
✅ /doodly-pricing/
❌ /pt/saiba-se-o-doodly-realmente-vale-a-pena-usar/
```

---

## 4. H1

- [ ] Apenas UM H1 por página
- [ ] Contém a keyword principal
- [ ] Pode ser ligeiramente diferente do title (mais natural)
- [ ] Desperta curiosidade ou resolve diretamente a busca do usuário

---

## 5. ESTRUTURA DE HEADINGS (H2, H3)

- [ ] H2s cobrem os principais subtópicos do artigo
- [ ] Pelo menos 1 H2 contém a keyword principal ou variação
- [ ] H2s respondem perguntas que o leitor tem
- [ ] H3s detalham os H2s quando necessário
- [ ] Não pular níveis (H1 → H2 → H3, nunca H1 → H3)

**Estrutura recomendada para artigos de review:**
```
H1: [Keyword] — Review Completo
  H2: O Que é o [Produto]?
  H2: Como Funciona?
  H2: Principais Recursos
    H3: [Recurso 1]
    H3: [Recurso 2]
  H2: Preços e Planos
  H2: Prós e Contras
  H2: Para Quem é Indicado?
  H2: [Produto] Vale a Pena?
  H2: Perguntas Frequentes (FAQ)
```

---

## 6. CONTEÚDO

- [ ] Keyword principal nas primeiras 100 palavras
- [ ] Variações da keyword distribuídas naturalmente no texto
- [ ] Responde a intenção de busca (review = opinião + decisão de compra)
- [ ] Mínimo de 1.500 palavras para artigos de review
- [ ] Mínimo de 2.500 palavras para artigos de comparação
- [ ] Sem keyword stuffing (repetição excessiva)
- [ ] Usa negrito para palavras importantes (não em excesso)
- [ ] Parágrafos curtos (máx. 3–4 linhas)
- [ ] Listas com marcadores onde couber
- [ ] Tabelas para comparações de preços/recursos
- [ ] Box de destaque com o CTA do afiliado (ex: "Teste o Doodly grátis por 14 dias")

---

## 7. IMAGENS

- [ ] Nome do arquivo descritivo: `doodly-interface-2026.webp` (não `img001.jpg`)
- [ ] Alt text descritivo em todos os imagens
- [ ] Alt text da imagem principal contém a keyword
- [ ] Formato WebP (menor tamanho, mesmo qualidade)
- [ ] Tamanho máximo: 100–150kb por imagem
- [ ] Dimensões corretas para web (não enorme e redimensionada via CSS)
- [ ] Lazy load ativado

**Fórmula para alt text:**
```
[O que a imagem mostra] + [contexto da keyword quando natural]

✅ "Interface do Doodly com painel de edição de vídeo whiteboard"
✅ "Comparação de preços Doodly vs VideoScribe"
❌ "doodly doodly software doodly review"
```

---

## 8. LINKS INTERNOS

- [ ] Artigo linka para o Hub do seu silo
- [ ] Hub linka para este artigo
- [ ] Usa anchor text descritivo (não "clique aqui")
- [ ] Mínimo 2–3 links internos por artigo
- [ ] Links abrem na mesma aba (links internos nunca target="_blank")

**Exemplos de anchor text:**
```
✅ "confira nossa review completa do Doodly"
✅ "veja a comparação Doodly vs VideoScribe"
❌ "clique aqui"
❌ "leia mais"
```

---

## 9. LINK AFILIADO

- [ ] Link afiliado em texto âncora natural (não em "CLIQUE AQUI" em caps)
- [ ] CTA box no início, meio e final do artigo
- [ ] Botão com texto de ação: "Testar o Doodly Grátis", "Ver Planos e Preços"
- [ ] Atributo `rel="nofollow sponsored"` no link afiliado
- [ ] Aviso de divulgação no início do artigo (ex-box amarelo no topo)

**Exemplo de divulgação:**
```
⚠️ Este artigo contém links de afiliado. Se você comprar através
dos nossos links, podemos receber uma comissão sem custo adicional
para você. Isso nos ajuda a manter o site.
```

---

## 10. SCHEMA MARKUP

- [ ] Artigos: `Article` schema com datePublished, dateModified, author
- [ ] Reviews: `Review` schema com ratingValue (ex: 4.5/5)
- [ ] FAQ: `FAQPage` schema para seção de perguntas
- [ ] Comparações: `Table` ou `ItemList`
- [ ] inLanguage: correto para cada idioma (`pt-BR`, `en`, `es`, `nl`)

**Tipos de schema por silo:**
```
Review/Vale a pena → Review + Article
Preços            → Article + FAQPage
Comparações       → Article + ItemList
Tutoriais         → HowTo + Article
Alternativas      → ItemList + Article
```

---

## 11. VELOCIDADE E CORE WEB VITALS

- [ ] LCP < 2,5 segundos (imagem principal otimizada)
- [ ] CLS < 0,1 (sem elementos que pulam ao carregar)
- [ ] INP < 200ms (tema leve, sem JS desnecessário)
- [ ] Testar com PageSpeed Insights após publicar

**Principais ajustes:**
- Usar tema leve (GeneratePress/Astra sem Elementor)
- Cloudflare CDN gratuito
- Plugin de cache (WP Rocket ou W3 Total Cache)
- Hospedar fontes localmente (não do Google Fonts externo)
- Evitar plugins desnecessários

---

## 12. MOBILE

- [ ] Testar layout no mobile antes de publicar
- [ ] Botões de CTA com tamanho mínimo 44x44px
- [ ] Texto legível sem zoom (mínimo 16px)
- [ ] Sem scroll horizontal
- [ ] Imagens responsivas

---

## CHECKLIST RÁPIDO PRÉ-PUBLICAÇÃO

```
□ Title com keyword (50–60 chars)
□ Meta description única (150–160 chars)
□ URL limpa com keyword
□ H1 único com keyword
□ H2s cobrem subtópicos
□ Keyword nas primeiras 100 palavras
□ Imagens com alt text
□ Links internos para Hub
□ Link afiliado com rel="nofollow sponsored"
□ Aviso de afiliado no topo
□ Schema configurado no Rank Math
□ Testado no mobile
□ PageSpeed > 80
□ hreflang configurado para as variantes do artigo
```
