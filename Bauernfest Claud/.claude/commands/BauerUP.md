# BauerUP — Atualizar rodapé em todas as páginas

Executa o script `update_footer.py` para propagar o footer e newsletter mais recentes para todas as páginas do site bauernfest.

## Instruções

1. Leia o arquivo `site-bauernfest/Rodape/footer.html` para confirmar o estado atual do footer.
2. Execute o script Python abaixo via Bash para atualizar todas as páginas:

```bash
cd "c:/Users/User/Downloads/Projeto Claude Code/Bauernfest Claud" && python update_footer.py
```

3. Mostre ao usuário quais arquivos foram atualizados (UPDATED) e quais foram ignorados (SKIPPED).
4. Faça commit de todas as alterações com a mensagem:
   `Atualiza rodapé global em todas as páginas (BauerUP)`
5. Informe o usuário que o processo foi concluído.

## Quando usar

Use `/BauerUP` sempre que:
- Adicionar um novo SILO ou categoria ao footer (`Rodape/footer.html`)
- Alterar links, textos ou o bloco de newsletter no footer
- Criar novas páginas que precisam receber o footer atualizado

## Como adicionar um novo SILO antes de rodar

Edite `site-bauernfest/Rodape/footer.html` e acrescente uma nova coluna `.ftrcol` ou novos `<li>` em uma coluna existente. Depois execute `/BauerUP`.
