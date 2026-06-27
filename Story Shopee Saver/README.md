# StoryShopee Saver

Extensao Chrome Manifest V3, local e de uso pessoal, para capturar a midia visivel de um story do Facebook, detectar links da Shopee no DOM e gerar um link afiliado a partir de um template configurado pelo usuario.

Tudo roda localmente no navegador. A extensao nao envia dados para servidores externos, nao burla login, paywall, criptografia, DRM ou protecoes do Facebook, e depende da pagina ja estar aberta com o usuario logado normalmente.

## Arquivos

- `manifest.json`
- `background.js`
- `content.js`
- `popup.html`
- `popup.js`
- `options.html`
- `options.js`
- `styles.css`
- `README.md`

## Como instalar como extensao local

1. Abra `chrome://extensions`.
2. Ative o modo desenvolvedor.
3. Clique em "Carregar sem compactacao".
4. Selecione a pasta deste projeto.

## Como usar

1. Abra um story do Facebook no Chrome.
2. Clique no icone da extensao.
3. A extensao abre uma janela flutuante dentro da propria aba.
4. Na aba "Captura", clique em "Baixar midia do story".
5. Revise o status, a midia detectada, a confianca, o link detectado e o link afiliado gerado.

Se o Facebook nao disponibilizar a midia como arquivo direto, use "Gravar story visivel". O Chrome pedira para escolher a aba/tela e a extensao salvara uma gravacao local em `.webm`.

Se a extensao nao conseguir detectar midia ou link, ela exibira um aviso claro no popup.

## Como configurar o template de afiliado

1. Abra o popup da extensao.
2. Clique na aba "Config".
3. Informe seu ID/tag/codigo de afiliado Shopee.
4. Informe o template de link afiliado.
5. Clique em "Salvar configuracao".

Exemplo de template:

```text
https://s.shopee.com.br/SEU_CODIGO?url={{URL_ENCODED}}
```

O marcador `{{URL_ENCODED}}` sera substituido pelo link original da Shopee usando `encodeURIComponent`.

Tambem e possivel usar `{{AFFILIATE_ID}}` no template. Na aba "Config", o modo manual permite colar um link da Shopee e converter sem abrir um story.

## Permissoes usadas

- `activeTab`: acessar somente a aba ativa quando o usuario clica na extensao.
- `scripting`: executar o script de captura na pagina aberta.
- `downloads`: baixar a midia detectada.
- `storage`: salvar o template e o codigo de afiliado localmente no Chrome.

Host permissions restritas:

- `https://www.facebook.com/*`
- `https://facebook.com/*`
- `https://*.facebook.com/*`
- `https://*.fbcdn.net/*`
- `https://shopee.com.br/*`
- `https://*.shopee.com.br/*`

## Limitacoes conhecidas

- O Facebook pode mudar o HTML a qualquer momento.
- Alguns videos podem usar `blob:` temporario ou MediaSource. A extensao tenta baixar URLs diretas e blobs legiveis pela aba, mas videos segmentados/protegidos pelo player do Facebook podem nao ser baixaveis sem tecnicas de bypass.
- Quando o download direto nao for possivel, o modo "Gravar story visivel" captura o que aparece na tela com permissao do Chrome. Isso gera um `.webm`, nao o arquivo original do Facebook.
- Stories privados/protegidos nao devem ser baixados sem permissao.
- Links podem estar escondidos ou nao disponiveis no DOM.
- A extensao nao tenta burlar login, restricoes, DRM, criptografia ou protecoes do Facebook.
