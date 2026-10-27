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


## Ateliê de itens (v3)

Abra **studio.html** (ou o botão **✦ Criar item** na wiki):

1. Adicione uma imagem de item e use **Remover fundo**; ajuste a tolerância e clique nas regiões que ainda precisam ser removidas.
2. Selecione uma moldura. Os nove espaços aceitam PNGs transparentes importados de uma vez pelo botão **Importar molduras**. Nomes: nuvens rosadas, dragão celestial, filigrana dourada, floresta musical, sakura, vitral multicolor, tulipas de vidro, flores de outono e jardim ametista.
3. Ajuste a posição, escala e moldura na prévia. Preencha tipo, coleção, raridade, descrição, quantidade, peso, dados de dano, etiquetas e bônus de Força/Defesa/Inteligência/Agilidade.
4. **Salvar na wiki** torna o item visível nas coleções **deste navegador**; **Exportar item** gera JSON com imagem e atributos; **Card PNG** gera uma composição transparente; **♥ Enviar ao Delta RPG** transfere o item para a aba Inventário do projeto Deltarune-RPG no mesmo domínio GitHub Pages.
5. Para enviar o arquivo sem depender do navegador de origem, use **⇩ Exportar item (.json)** e depois **⇧ IMPORTAR DO CODEX** no Delta RPG.

Imagens personalizadas e molduras são armazenadas pelo navegador em **IndexedDB**; metadados são locais. O botão **Exportar** da wiki agora faz um backup v3 que inclui imagens, molduras, descrições e favoritos; **Importar** aceita esse formato. O Ateliê também possui backup próprio. Itens criados no navegador **não são enviados automaticamente ao repositório público**. Para publicar um catálogo compartilhado é necessário enviar as alterações ao GitHub ou usar um serviço com armazenamento online.

**Recorte:** fotos JPG possuem antialias e fundos artificiais; nenhum recorte automático baseado em cores é perfeito em todas as imagens. Inspecione os detalhes, reduza a tolerância para preservar bordas e, em imagens complexas, refine externamente.
