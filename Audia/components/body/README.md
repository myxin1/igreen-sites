# Body component

Arquivos ligados ao corpo da Home do Audia.

- `body.js` contem as interacoes do conteudo principal: reveal no scroll, formulario de leads e link ativo do menu.
- `body.css` contem estilos experimentais do corpo da Home, incluindo o modo Cybercore aplicado ao `#hero`.
- `home-body.html` documenta a estrutura do corpo da landing enquanto o projeto ainda usa HTML estatico.
- `app-body.html` documenta a estrutura base do corpo do app e as abas renderizadas pelo controlador.

## Variante Cybercore

O modo Cybercore adapta o prompt React/Tailwind para HTML, CSS e JS puro. Ele e aplicado somente ao `#hero` da Home quando `localStorage.audia_hero_variant` esta como `cybercore`.

No painel DEV da Home:

- `Cybercore` ativa o efeito animado no Hero.
- `Original` remove o efeito e volta o Hero ao estilo padrao.

Quando o projeto evoluir para um sistema com componentes reais ou build step, as secoes da Home podem ser movidas para este diretorio e importadas em `index.html`.
