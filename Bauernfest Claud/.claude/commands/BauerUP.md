# /BauerUP — Propagar qualquer mudança global para todas as páginas

Execute este comando sempre que qualquer elemento global do site for alterado:
nav, footer, newsletter, CSS de topo, CSS de base, links, cores, fontes, etc.

O BauerUP lê os **arquivos fonte em `Rodape/`** e replica as mudanças em todas as páginas `index.html` do projeto.

## Arquivos fonte (edite aqui, depois rode /BauerUP)

| Arquivo | O que controla |
|---------|---------------|
| `Rodape/nav.html` | HTML do menu de navegação (links, CTA, botão hambúrguer) |
| `Rodape/nav-breadcrumb.css` | CSS do nav + breadcrumb (cores, tamanho, responsivo) |
| `Rodape/footer.html` | HTML do newsletter + footer (colunas, links, redes sociais) |
| `Rodape/shared-bottom.css` | CSS do newsletter + footer |

## Seções substituídas em cada página

| Seção | Delimitadores usados |
|-------|---------------------|
| CSS do nav+breadcrumb | `/* NAV */` … `.bf-breadcrumb span{opacity:.5}` |
| CSS newsletter+footer | `/* NEWSLETTER */` … `</style>` |
| HTML do nav | `<!-- NAV -->` … `<!-- BREADCRUMB -->` |
| HTML newsletter+footer | `<!-- NEWSLETTER -->` / `<!-- FOOTER -->` … `</html>` |

## Como executar

```bash
cd "c:/Users/User/Downloads/Projeto Claude Code/Bauernfest Claud" && python update_footer.py
```

Após rodar, faça commit:

```bash
cd "c:/Users/User/Downloads/Projeto Claude Code" && git add -A && git commit -m "BauerUP: propaga mudanças globais para todas as páginas"
```

Mostre ao usuário quais arquivos foram UPDATED e quais foram skipped. Confirme o commit.

## Fluxo de trabalho padrão

1. Usuário pede uma mudança global (ex: "adiciona link X no footer", "muda cor do nav")
2. Edito o arquivo fonte correspondente em `Rodape/`
3. Rodo `/BauerUP` — propaga para todos as 15+ páginas
4. Commit automático

## O que o /BauerUP cobre

- Novo link na navegação
- Novo SILO no footer
- Mudança de cor, fonte ou espaçamento do nav ou footer
- Novo campo ou texto na newsletter
- Qualquer CSS global (nav, breadcrumb, footer)
- Qualquer HTML global (nav, footer)
