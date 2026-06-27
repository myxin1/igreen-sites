# Shopee Affiliate Auto Converter

Extensão Chrome (Manifest V3) que converte links da Shopee em links de afiliado automaticamente.

---

## Instalação

### 1. Gerar os ícones

Abra o arquivo `icons/create_icons.html` no Chrome e clique em **"Baixar Todos os Ícones"**.  
Mova os 4 arquivos baixados (`icon16.png`, `icon32.png`, `icon48.png`, `icon128.png`) para dentro da pasta `icons/`.

### 2. Carregar no Chrome

1. Acesse `chrome://extensions`
2. Ative **Modo do desenvolvedor** (canto superior direito)
3. Clique em **"Carregar sem compactação"**
4. Selecione a pasta `shopee-affiliate-converter/`

### 3. Configurar

Clique no ícone da extensão → insira seu **Affiliate ID** da Shopee → clique em **Salvar**.

---

## Permissões

| Permissão       | Motivo                                                              |
|-----------------|---------------------------------------------------------------------|
| `storage`       | Salvar Affiliate ID, histórico e estatísticas localmente           |
| `activeTab`     | Capturar URL da aba ativa para conversão                           |
| `contextMenus`  | Adicionar opção de conversão no menu de contexto (botão direito)   |
| `notifications` | Exibir confirmação após conversão e detector de clipboard          |
| `scripting`     | Copiar link para clipboard via tab ativa (context menu / background)|
| `tabs`          | Consultar URL da aba ativa                                         |

**Nenhum dado é enviado a servidores externos.**  
Tudo fica em `chrome.storage.local`.

---

## Estrutura do Projeto

```
shopee-affiliate-converter/
├── manifest.json            — Manifesto V3
├── background.js            — Service Worker (context menu, notificações, histórico)
├── content.js               — Script nas páginas Shopee (detector de cópia)
├── popup.html / .css / .js  — Popup principal
├── options.html / .css / .js — Página de configurações completa
├── lib/
│   └── shopee-converter.js  — ★ Lógica de conversão isolada (manutenção aqui)
└── icons/
    ├── create_icons.html    — Gerador de ícones (abra no Chrome)
    ├── icon16.png           — (gerar com create_icons.html)
    ├── icon32.png
    ├── icon48.png
    └── icon128.png
```

---

## Funcionalidades

### Popup Principal
- **Converter Página Atual** — converte a URL da aba aberta e copia para o clipboard
- **Copiar Link Afiliado** — mesma função, botão dedicado
- **Estatísticas** — hoje / 7 dias / 30 dias / total
- **Histórico recente** — últimas 5 conversões com botão de recópia

### Menu de Contexto (botão direito)
- Em links: **"Converter Link Afiliado Shopee"**
- Em página: **"Converter Esta Página (Shopee)"**
- Em seleção de texto: **"Converter URL Selecionada"**

### Detector de Clipboard
- Nas páginas da Shopee, detecta quando você copia uma URL
- Exibe notificação: "Deseja converter para link afiliado?"
- Botões: ✅ Converter Agora | ✗ Ignorar
- Pode ser desativado em Configurações

### Página de Configurações (`options.html`)
- Editar Affiliate ID e nome
- Toggle do detector de clipboard
- Dashboard com gráfico de barras (14 dias)
- Histórico completo com busca e exclusão
- Exportar / Importar configurações como JSON
- Apagar todos os dados

---

## Como Atualizar a Lógica de Conversão

Se a Shopee mudar o formato dos links de afiliado, **edite apenas** `lib/shopee-converter.js`:

```js
// Altere o nome do parâmetro se a Shopee mudar
var AFFILIATE_PARAM = 'af_id';

// Adicione novos domínios aqui
var SHOPEE_DOMAINS = [
  'shopee.com.br',
  // ...
];

// Altere esta função se a estrutura da URL mudar
function convertShopeeLink(url, affiliateId) {
  // lógica aqui
}
```

O restante do projeto chama `convertShopeeLink()` — nenhum outro arquivo precisa ser alterado.

---

## Domínios Suportados

- `shopee.com.br`
- `s.shopee.com.br`
- `shope.ee`
- `br.shp.ee`
- `affiliate.shopee.com.br`
- `shopee.com`

---

## Arquitetura Preparada Para

- Conversão em massa de links
- Integração com API oficial da Shopee
- Histórico sincronizado na nuvem (`chrome.storage.sync`)
- Sincronização entre navegadores
- Exportação CSV / Excel
- QR Code do link afiliado
- Encurtador de links integrado

---

## Segurança e Privacidade

- **Zero telemetria** — nenhum dado sai do dispositivo
- **Sem servidores externos** — usa apenas `chrome.storage.local`
- Detector de clipboard usa evento `copy` (sem permissão `clipboardRead`)
- Clipboard write usa `navigator.clipboard.writeText` com fallback
