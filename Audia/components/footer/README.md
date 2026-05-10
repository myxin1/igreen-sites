# Audia Footer

Componente compartilhado do rodape do Audia.

Arquivos:
- `footer.html`: estrutura HTML base.
- `footer.css`: estilos, responsividade e efeito visual de background boxes.
- `footer.js`: montagem das caixas interativas e sincronizacao do logo claro/escuro.

Uso em paginas na raiz do projeto:
```html
<link rel="stylesheet" href="components/footer/footer.css">
...
<script src="components/footer/footer.js"></script>
```

Uso em paginas dentro de subpastas, como `roadmap/`:
```html
<link rel="stylesheet" href="../components/footer/footer.css">
...
<script src="../components/footer/footer.js"></script>
```

O script ajusta automaticamente o caminho da logo para paginas na raiz ou dentro de `roadmap/`.
