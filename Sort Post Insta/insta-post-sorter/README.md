# Insta Post Sorter

Primeira versao do backend local da extensao Chrome MV3 para analisar posts carregados em paginas do Instagram, ordenar visualmente os cards quando possivel e exportar CSV com dados visiveis no navegador.

## O que ja existe

- Manifest V3 com permissoes minimas.
- Content script para `https://www.instagram.com/*`.
- Parser resiliente para posts carregados no DOM.
- Ordenacao por likes, comentarios, views, score de engajamento e data.
- Restauracao da ordem original.
- Exportacao CSV local.
- Diagnostico interno para a futura UI.
- Nenhum servidor externo, login, senha, postagem, curtida, comentario ou follow.

## Estrutura

```text
insta-post-sorter/
  manifest.json
  package.json
  README.md
  src/
    background.js
    content.js
    utils/
      parser.js
      sorter.js
      csv.js
      dom.js
```

## Como validar

```bash
npm run validate
```

## Como carregar no Chrome

1. Abra `chrome://extensions`.
2. Ative o modo desenvolvedor.
3. Clique em `Carregar sem compactacao`.
4. Selecione a pasta `insta-post-sorter`.
5. Abra um perfil do Instagram e use a futura UI para chamar as acoes.

## Politica de privacidade

A extensao processa os dados localmente e nao envia dados para servidores externos.

## Aviso

Esta extensao nao e afiliada, patrocinada ou endossada pelo Instagram ou pela Meta.

## Limitacoes

O Instagram muda o DOM com frequencia. O parser usa seletores flexiveis e falha de forma segura quando nao encontra metricas ou grids compativeis. Algumas metricas, como compartilhamentos, normalmente nao ficam publicamente visiveis no DOM e serao marcadas como indisponiveis.
