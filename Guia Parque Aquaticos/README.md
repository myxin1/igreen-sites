# Guia Parques Aquaticos

Automacao em Node.js + TypeScript para criar e publicar a estrutura SILO do site `guiaparquesaquaticos.com` via WordPress REST API, com preparo para SEO no Rank Math, interlinking estrategico e CTAs de afiliado.

## O que este projeto faz

- verifica conexao com o WordPress via Application Password
- detecta plugins obrigatorios e tenta instalar/ativar quando a API permitir
- instala automaticamente o plugin auxiliar `42flows SEO Meta` quando o Rank Math estiver ativo mas os campos REST ainda nao estiverem expostos
- instala automaticamente o companion `42flows Content` quando for necessario renderizar schema JSON-LD no front-end
- detecta o tema ativo e confere se o GeneratePress esta em uso
- publica o cluster principal como `posts`, mantendo o SILO por categoria, interlinking, widget e menus
- cria/atualiza o post cabeca `/aldeia-das-aguas/`
- cria/atualiza os posts satelite do silo
- cria/atualiza as pages institucionais `sobre`, `contato`, `politica-de-privacidade` e `termos-de-uso`
- aplica interlinking interno entre pagina pai, irmas comerciais e paginas informativas
- insere CTAs com link de afiliado no inicio, meio e fim do conteudo
- prepara payload de SEO para Rank Math usando metadados REST quando expostos pelo site
- publica schema JSON-LD via `_42flows_schemas` quando o companion `42flows Content` estiver disponivel
- suporta `DRY_RUN=true` para simular toda a publicacao sem gravar no WordPress
- atualiza o `roadmap.md` automaticamente conforme as etapas reais forem concluidas
- migra publicacoes antigas de `pages` para `posts`
- cria menus `HEADER` e `RODAPE`
- vincula o menu `HEADER` ao slot `primary` do GeneratePress
- publica o menu `RODAPE` em um widget de footer compativel do tema
- publica um widget de sidebar com links internos do silo principal
- gera arquivos de logo via OpenAI Images API para uso no WordPress e nas redes do projeto

## Estrutura

```text
src/
  config/
  content/
  branding/
    silo/
      definitions/
      index.ts
      registry.ts
      render.ts
  roadmap/
  scripts/
  seo/
  utils/
  wordpress/
wordpress-bridge/
```

Os arquivos em `src/content/silo/definitions/` separam o mapa do SILO por grupo:

- `children-commercial.ts`
- `children-lodging.ts`
- `children-informational.ts`
- `children-seo.ts`
- `pillar.ts`
- `top-funnel.ts`

## Requisitos

- Node.js 20+
- WordPress com REST API ativa
- usuario com permissao para editar paginas, plugins e tema
- Application Password ja criada para `Daniel Lopes`

## Instalar

No PowerShell deste ambiente, use `npm.cmd` no lugar de `npm`:

```powershell
npm.cmd install
```

## Configurar `.env`

Copie `.env.example` para `.env` e ajuste:

```env
WORDPRESS_URL=https://guiaparquesaquaticos.com
WORDPRESS_USERNAME=Daniel Lopes
WORDPRESS_APP_PASSWORD=7cSK vh9m fhO7 6tYe 0TRZ kHZG
OPENAI_API_KEY=
DRY_RUN=true
```

## Comandos

```powershell
npm.cmd run setup
npm.cmd run publish
npm.cmd run seo
npm.cmd run roadmap
npm.cmd run migrate-posts
npm.cmd run logo
```

## Fluxo recomendado

1. `npm.cmd install`
2. `npm.cmd run setup`
3. confirmar no output se `Rank Math`, `Site Kit by Google` e `Contact Form 7` estao instalados/ativos
4. confirmar se o tema ativo e `GeneratePress`
5. colocar `DRY_RUN=false` no `.env`
6. executar `npm.cmd run publish`
7. executar `npm.cmd run seo`
8. executar `npm.cmd run logo` para gerar as artes iniciais da marca

## Posts, Pages e SILO

No WordPress, o tipo nativo `post` nao e hierarquico, diferente de `page`. Por isso o projeto passou a manter o SILO principalmente por:

- categoria central do cluster
- interlinking forte entre cabeca e satelites
- menus tematicos
- widget de sidebar com links internos do cluster
- slugs consistentes

Com o GeneratePress ativo, o projeto tambem prende o menu `HEADER` na localizacao `primary` e adiciona o menu `RODAPE` em uma area de widget de footer, priorizando `footer-1` e depois `footer-bar`.

As paginas institucionais do site ficam em `pages`, enquanto o cluster editorial e comercial do silo permanece em `posts`.

## Rank Math e limitacao importante

O WordPress REST API aceita `meta` em posts e paginas, mas o Rank Math nao expoe automaticamente seus metacampos para escrita via REST. Por isso o projeto:

- detecta se os campos `rank_math_title`, `rank_math_description`, `rank_math_focus_keyword` e `rank_math_schema_type` estao disponiveis
- tenta instalar automaticamente o plugin `42flows SEO Meta` para expor `title`, `description` e `focus keyword`
- tenta instalar automaticamente o companion `42flows Content` para renderizar `Article` e `FAQPage` quando o `schema_type` do Rank Math nao estiver disponivel
- grava os dados de SEO automaticamente quando esses campos estiverem registrados no site
- gera um plugin auxiliar em [`wordpress-bridge/rank-math-rest-bridge.php`](wordpress-bridge/rank-math-rest-bridge.php) para registrar esses metacampos no REST quando necessario

Se o setup ainda indicar falta de `rank_math_schema_type`, o projeto pode continuar validando schema via `42flows Content`. O bridge local continua disponivel caso voce queira expor tambem o meta nativo `rank_math_schema_type`.

## Contact Form 7

O projeto tenta:

- detectar o plugin
- localizar a rota REST do Contact Form 7
- criar um formulario padrao e a pagina `/contato/`

Se a rota do Contact Form 7 nao estiver disponivel, a pagina de contato sera criada com um shortcode placeholder e o README orienta o ajuste manual.

## Logo e branding

O script `npm.cmd run logo` usa a OpenAI Images API para gerar:

- `output/branding/logo-primary.png`
- `output/branding/logo-icon.png`
- `output/branding/logo-manifest.json`

O manifesto salva os prompts usados e a data de geracao para futuras iteracoes de branding.

## Validacao SEO recomendada

- confirmar se a pagina pai ficou em `/aldeia-das-aguas/`
- confirmar se os posts satelite ficaram publicados nos slugs planejados, por exemplo `/preco/`, `/ingresso/` e `/pacote/`
- confirmar se `sobre`, `contato`, `politica-de-privacidade` e `termos-de-uso` ficaram em `pages`
- validar se o menu `HEADER` apareceu no topo com `Aldeia das Aguas`, `Contato` e `Sobre`
- validar se o `RODAPE` apareceu no footer com `Politica de Privacidade`, `Termos de Uso` e `Contato`
- validar se a sidebar mostra o widget `Links do Silo Aldeia das Aguas`
- validar se o CTA de afiliado aparece no inicio, meio e fim
- validar se o Rank Math reconheceu a focus keyword
- validar se `title` e `meta description` ficaram dentro do limite
- validar schema `Article` ou `FAQ` nas paginas correspondentes
- validar breadcrumbs e sitemap no painel do Rank Math

## O que fazer manualmente

- instalar/ativar GeneratePress se nao estiver ativo
- finalizar configuracoes globais do Rank Math no painel:
  - sitemap
  - breadcrumbs
  - open graph
  - twitter cards
  - templates de title e meta description
- conectar o Site Kit com Search Console e Analytics
- revisar claims e precos sensiveis antes de publicar com `DRY_RUN=false`
