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

### Molduras originais já instaladas

As nove molduras transparentes foram publicadas como PNGs RGBA 900×900, sem recompressão, nos caminhos `assets/frames/frame-01.png` até `assets/frames/frame-09.png`.

O [Ateliê de Itens](https://matheuz55peri-tech.github.io/Index-de-itens/studio.html) as carrega automaticamente. Não é necessário enviar ZIP, token ou arquivo pelo navegador.

Links diretos reutilizáveis em outros sites: `https://matheuz55peri-tech.github.io/Index-de-itens/assets/frames/frame-01.png` (altere o número de 01 a 09).


### Fundos estáticos e animados para os itens

O Ateliê oferece **10 fundos predefinidos originais** em `assets/backgrounds/`, incluindo **6 JPG e 4 GIF animados**. Todos foram enviados sem recompressão, conservando a qualidade, o tamanho e a sequência de quadros dos arquivos recebidos. O [catálogo de fundos](assets/backgrounds/manifest.json) inclui nomes, resolução, quantidade de quadros e URLs diretas.

No [Ateliê de Itens](https://matheuz55peri-tech.github.io/Index-de-itens/studio.html), selecione **03 · Fundos de destaque**, escolha o visual desejado e ajuste a ampliação e o escurecimento. O fundo fica atrás do item e da moldura. A wiki também reproduz os GIFs como GIFs reais nos cartões e na visualização dos itens criados.

- **Sprite PNG:** continua transparente, sem fundo.
- **Card PNG:** inclui a imagem de fundo como captura estática (GIFs não têm animação no formato PNG).
- **HTML animado:** exporta um arquivo HTML autossuficiente que incorpora o GIF original com todos os quadros e preserva a animação, sem depender de internet.
- **Ficha exportada e backup:** o identificador, ampliação e escurecimento do fundo são guardados nos metadados do item; as imagens predefinidas continuam disponíveis no servidor.

### Interface V3 — Wiki + Ateliê

A interface foi reorganizada para tornar a criação de itens mais simples sem alterar os dados existentes em `localStorage` e `IndexedDB`.

**Wiki:** navegação em coleções, pesquisa em destaque, atalhos `/` e `Ctrl+K`, visualização compacta ou confortável, seção de favoritos, guia rápido e cartões com transições. A preferência de densidade é mantida neste navegador.

**Ateliê:** as ferramentas agora estão divididas em cinco etapas acessíveis na mesma tela: **Arte → Molduras → Fundos → Ficha → Salvar**. A prévia permanece ao lado no desktop e acima das etapas no celular. O botão **Posição** mantém os controles exatos; mouse, toque e teclado continuam funcionando para arrastar, redimensionar e centralizar.

**Fluxo sugerido:**
1. Na etapa **Arte**, carregue um PNG/JPG/WEBP, remova o fundo quando necessário e ajuste o ícone.
2. Em **Molduras**, escolha uma moldura PNG predefinida; ela permanece fora do disco circular.
3. Em **Fundos**, selecione um JPG ou GIF animado e personalize a posição.
4. Na **Ficha**, informe nome, categoria, descrição e atributos.
5. Em **Salvar**, grave na wiki, exporte PNG/HTML ou envie ao Delta RPG.

**Microanimações:** uma breve emissão de partículas confirma a seleção da moldura, os cliques recebem feedback e as etapas mudam com transições suaves. Existe uma opção **Reduzir efeitos**, que respeita também `prefers-reduced-motion`.

**Bibliotecas:** `assets.html` mostra as nove molduras e os links públicos; `images.html` é a interface de publicação de novas imagens no próprio repositório.

**Teste automático:** o workflow `.github/workflows/ux-smoke.yml` executa `tests/ui_smoke.py` com Chromium para confirmar navegação, biblioteca, molduras, GIFs, PNGs transparentes e salvamento/reabertura. O teste usa um servidor local no runner, sem modificar dados dos usuários.

### Rework de 205 sprites — nova arte de cada item

As 205 artes foram processadas individualmente, sem reutilizar um ícone genérico. A versão atual da wiki carrega `assets/data/sprites-reworked.js` e imagens RGBA 128×128 no diretório `assets/sprites-reworked/`.

- **18** itens e consumíveis, **14** flores, **9** itens carmesins, **32** glaciais, **32** espadas encantadas e **100** artefatos.
- Novo recorte e reenquadramento, tratamento de fundos cinzentos planos quando detectados, contraste e paleta balanceados por categoria, contorno e brilho de borda em pixel art.
- Os arquivos originais `assets/data/sprites-01.js` a `sprites-17.js` permanecem intocados como backup. A wiki tem o botão **Ver sprites originais** para comparar.
- **PNG transparente real**, sem adicionar um fundo ou moldura diretamente à arte de origem. A wiki desenha seus efeitos de categoria separadamente.

[Prévia dos 205 sprites](assets/sprites-reworked/preview-all-205.png) · [Pacote ZIP com os 205 PNGs](assets/sprites-reworked/205-sprites-codex-remaster.zip) · [Relatório do processamento](assets/sprites-reworked/report.json).

**Método:** a remasterização é feita por script a partir das imagens fornecidas e preserva os formatos dos itens existentes; não equivale a redesenhar manualmente 205 objetos do zero. O pipeline reproduzível está em `tools/remaster_sprites.py` e a automação em `.github/workflows/remaster-sprites.yml`.
