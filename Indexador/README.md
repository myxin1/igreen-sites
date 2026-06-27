# Indexador Zindexing

Exemplo simples de indexador que usa a API `https://zindexing.com/v1/boost`.

## Como usar

1. Copie `.env.example` para `.env`.
2. Adicione o token real:

```env
ZINDEXING_TOKEN=zidx_live_6ddcc46cd5b0a8b7e3406193
```

3. Instale dependências:

```bash
npm install
```

4. Inicie o servidor:

```bash
npm start
```

5. Abra `http://localhost:3000` no navegador.
6. Para acessar rapidamente, abra o atalho do desktop `Indexador Zindexing`.

## Importante

- O token não deve ser exposto no frontend.
- O `index.html` envia a requisição para `/api/index` no servidor local.
- O backend usa o token do ambiente para fazer a chamada segura.
- Insira várias URLs no campo principal, uma por linha, para indexação em massa.
- O resultado aparece em uma tabela com status e horário de cada solicitação.
