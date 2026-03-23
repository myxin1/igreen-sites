# BauerUP — Propagar alterações para todas as páginas do site

Sempre que qualquer elemento global do site for alterado (rodapé, newsletter, CSS do footer, links de navegação, categorias/silos), execute este comando para replicar as mudanças em todas as páginas automaticamente.

## O que o BauerUP faz

1. Lê o arquivo de referência `site-bauernfest/Rodape/footer.html` — que contém o footer e newsletter atuais.
2. Executa o `update_footer.py` via Bash, que varre todas as páginas `**/index.html` e substitui o bloco `<!-- NEWSLETTER --> ... <!-- FOOTER --> ... </html>` pelo conteúdo mais recente.
3. Também atualiza o CSS do footer (tudo entre `/* FOOTER */` e `</style>`) em cada página.
4. Exibe quais arquivos foram UPDATED e quais foram SKIPPED (sem alteração).
5. Faz commit automático de todas as mudanças.

## Instruções de execução

Execute o script:

```bash
cd "c:/Users/User/Downloads/Projeto Claude Code/Bauernfest Claud" && python update_footer.py
```

Após o script, faça commit:

```bash
cd "c:/Users/User/Downloads/Projeto Claude Code" && git add -A && git commit -m "BauerUP: propaga alterações globais para todas as páginas"
```

Mostre ao usuário o resultado (arquivos atualizados) e confirme que o commit foi feito.

## Quando usar

- Adicionou um novo SILO ou categoria → edite `Rodape/footer.html`, rode `/BauerUP`
- Alterou um link, texto ou layout do footer → edite `Rodape/footer.html`, rode `/BauerUP`
- Alterou o bloco de newsletter → edite `Rodape/footer.html`, rode `/BauerUP`
- Qualquer mudança global que precisa ser replicada em todas as páginas → rode `/BauerUP`
