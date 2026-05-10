# Header component

Arquivos do header compartilhado do Audia.

- `header.css` centraliza o visual do menu superior, botoes de tema e CTA.
- `header.js` normaliza os icones claro/escuro e reaplica o tema salvo.
- `header.html` e a fonte de referencia do markup usado nas paginas estaticas.
- `app-tab-bar.html` documenta o header/menu do app renderizado por `js/app.js`.

Como o projeto ainda roda como HTML estatico, as paginas mantem o markup do header nelas mesmas. Quando houver build step ou includes, o conteudo de `header.html` pode virar o unico ponto de renderizacao.
