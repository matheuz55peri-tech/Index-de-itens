# Codex Arcano — Index de itens

Site de wiki visual com **205 sprites de itens em pixel art** distribuídos em seis coleções.

## Abrir ou publicar

- **Página principal:** `index.html`.
- **Hospedagem:** no GitHub, abra **Settings → Pages → Build and deployment → Deploy from a branch**, selecione **main** e **/(root)** e salve. O endereço terá o formato `https://matheuz55peri-tech.github.io/Index-de-itens/`.
- **Abrir localmente:** baixe o repositório inteiro como ZIP, extraia e abra `index.html` (os pacotes de sprites devem permanecer na pasta `assets/data/`).

## Organização

- `index.html` — interface, temas e lógica visual da wiki.
- `assets/data/sprites-01.js` até `sprites-17.js` — os 205 PNGs transparentes integrados em pacotes de dados locais (data URLs; não dependem de servidores externos).
- `.nojekyll` — GitHub Pages serve os arquivos diretamente.

As imagens são exibidas por item e também podem ser baixadas como PNG pela própria ficha do site.

## Funcionalidades atuais

- 205 fichas com imagens, divididas por categorias;
- busca, navegação, ampliação e download de sprite;
- edição de nomes e descrições, favoritos;
- exportação e importação de um arquivo JSON com os dados da wiki.

**Atenção:** alterações de nomes e descrições feitas no navegador ficam salvas no armazenamento local daquele navegador. Exporte o JSON para fazer backup; elas não são gravadas automaticamente no GitHub.

## Próxima fase: estética

A interface publicada preserva as funções da versão 2. Podemos trabalhar no CSS, nas cores, nas fontes, no layout, nos efeitos e na apresentação dos itens **sem refazer os sprites nem mudar os dados**.

As ilustrações enviadas são usadas como referência para este catálogo; respeite as permissões de uso dos artistas caso distribua o site publicamente.
