# 200 Receitas Low Carb — Amazon KDP

Este projeto contém um gerador Python para transformar o PDF `200receitaslowcarbMaisSade.pdf` em um arquivo DOCX compatível com Kindle Create.

## Objetivo

- Extrair receitas do PDF
- Preservar ingredientes e modo de preparo
- Reescrever a introdução
- Criar páginas de direitos autorais, aviso nutricional, sobre o autor e considerações finais
- Gerar índice clicável
- Buscar imagens horizontais de alta resolução pelo Pexels
- Produzir:
  - `200-receitas-low-carb-dl-martins-kdp.docx`
  - `descricao-amazon.txt`
  - `relatorio-revisao.txt`
  - `imagens_nao_encontradas.txt`

## Instalação

```powershell
cd "C:\Users\User\Downloads\Projeto Claude Code\Amazon Receitas"
python -m pip install -r requirements.txt
```

## Uso

1. Coloque `200receitaslowcarbMaisSade.pdf` na pasta do projeto.
2. Defina a variável de ambiente `PEXELS_API_KEY` ou use `--api-key`.

```powershell
$env:PEXELS_API_KEY = "sua_chave_pexels"
python .\build_kdp_book.py --pdf "200receitaslowcarbMaisSade.pdf"
```

Se você não informar a chave da API, o script continuará gerando o DOCX, mas sem imagens.

## Observações

- O script tenta inferir categorias e receitas a partir do texto do PDF.
- Se a estrutura do PDF for muito diferente, será necessário ajustar o parser em `build_kdp_book.py`.
- Abra o arquivo DOCX no Word e atualize o índice para garantir links ativos.
