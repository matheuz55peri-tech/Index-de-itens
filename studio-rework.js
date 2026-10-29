(function(){
'use strict';
// Reorganização progressiva do Ateliê: os nós originais são movidos, não recriados.
// Dessa forma os handlers, IDs, IndexedDB, GIFs, molduras e integração Delta permanecem intactos.
const $=id=>document.getElementById(id);
const layout=document.querySelector('.layout');
if(!layout||!$('visualEditor')||!$('itemForm')||!$('frames')||!$('backgrounds'))return;
const left=layout.querySelector('.pane:first-child'),right=layout.querySelector('.pane:last-child'),form=$('itemForm'),editor=$('visualEditor');
if(!left||!right||document.querySelector('.cx-stage-nav'))return;
const stageStorage='codex-studio-stage-v3',motionStorage='codex-motion-preference-v1';
const stages=[
 {id:'arte',label:'Arte',number:'01',icon:'✎',description:'Importe a imagem, remova o fundo e ajuste sua posição dentro do ícone circular.'},
 {id:'molduras',label:'Molduras',number:'02',icon:'✧',description:'Escolha uma borda ornamental para seu item. Ela permanece fora do círculo.'},
 {id:'fundos',label:'Fundos',number:'03',icon:'◉',description:'Destaque sua criação com uma imagem ou GIF original animado.'},
 {id:'ficha',label:'Ficha',number:'04',icon:'⌁',description:'Nome, coleção, história, raridade e atributos para o Delta RPG.'},
 {id:'salvar',label:'Salvar',number:'05',icon:'⇩',description:'Salve na wiki, envie ao Delta RPG ou exporte um arquivo.'}
];
const stagePanels={},stageTabs={};
function stored(key){try{return sessionStorage.getItem(key)}catch(_){return null}}
function persist(key,val){try{sessionStorage.setItem(key,val)}catch(_){}}
function getPref(key){try{return localStorage.getItem(key)}catch(_){return null}}
function savePref(key,val){try{localStorage.setItem(key,val)}catch(_){}}
let motionOff=getPref(motionStorage)==='off';
document.body.classList.toggle('cx-motion-off',motionOff);
const prefersQuiet=()=>motionOff||window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const make=(tag,klass,text)=>{const node=document.createElement(tag);if(klass)node.className=klass;if(text!==undefined)node.textContent=text;return node};
function sectionHeading(cfg){
 const wrapper=make('header','cx-stage-heading'),ico=make('span','cx-stage-icon',cfg.icon);
 const text=make('div'),h=make('h3',null,cfg.number+' · '+cfg.label),p=make('p',null,cfg.description);
 text.append(h,p);wrapper.append(ico,text);return wrapper
}
function details(summary,open=false){
 const container=make('details','cx-advanced');if(open)container.open=true;
 const title=make('summary',null,summary),body=make('div','cx-advanced-body');
 container.append(title,body);return{container,body}
}
// Cabeçalho com ação principal, sem mudar os controles internos do formulário.
const top=document.querySelector('.top'),headerText=top?.querySelector('.top>div:first-child');
if(headerText){const eyebrow=headerText.querySelector('.eyebrow');if(eyebrow)eyebrow.prepend(make('span','cx-header-crest','✦'))}
const quick=make('div','cx-header-quick');
const saveQuick=make('button',null,'✦ Salvar criação'),fileLabel=make('span','cx-header-pill','✧ As imagens ficam no seu navegador');
saveQuick.type='button';quick.append(saveQuick,fileLabel);
top?.append(quick);
// Mantemos o painel de visualização e a edição por arraste juntos.
left.classList.add('cx-preview-pane');right.classList.add('cx-right-pane');
const oldLeft=[...left.children];
const artStart=oldLeft.findIndex(node=>node.contains?.($('artFile')));
const posStart=oldLeft.findIndex(node=>node.classList?.contains('section')&&node.textContent.includes('Posição do item'));
const frameStart=oldLeft.findIndex(node=>node.classList?.contains('section')&&node.textContent.includes('Molduras'));
const bgStart=oldLeft.findIndex(node=>node.classList?.contains('section')&&node.textContent.includes('Fundos de destaque'));
if([artStart,posStart,frameStart,bgStart].some(i=>i<0)||!(artStart<posStart&&posStart<frameStart&&frameStart<bgStart)){
 console.warn('Codex: estrutura original mudou; mantendo layout clássico.');return
}
const oldFormChildren=[...form.children],saveStart=oldFormChildren.findIndex(node=>node.classList?.contains('section')&&node.textContent.includes('Salvar e compartilhar'));
if(saveStart<0){console.warn('Codex: separação de ações indisponível.');return}
const previewHeading=left.querySelector('h2');previewHeading.textContent='Sua prévia';
const previewHeader=make('div','cx-preview-head');previewHeading.before(previewHeader);previewHeader.append(previewHeading,make('span','cx-preview-chip','◉ 512 × 512 · Ícone circular'));
const layerTip=left.querySelector('.layer-tip');if(layerTip)layerTip.textContent='Selecione uma camada e arraste diretamente. As guias rosas mostram o centro. Abra “Posição” para alinhar com precisão.';
const previewActions=make('div','cx-preview-actions');
const centerButton=make('button','btn','⊕ Centralizar'),checkButton=make('button','btn','▦ Ocultar quadriculado'),motionButton=make('button','btn','✧ Reduzir efeitos');
for(const button of [centerButton,checkButton,motionButton])button.type='button';
previewActions.append(centerButton,checkButton,motionButton);
const toolbar=left.querySelector('.editor-toolbar');toolbar?.after(previewActions);
const status=$('status');status.classList.add('cx-preview-status');
if(!status.textContent.trim())status.textContent='Pronto para criar. Escolha uma imagem e selecione uma etapa ao lado.';
left.append(status);
// Seletor de etapas no topo do painel de controles.
const currentTitle=right.querySelector('h2');if(currentTitle)currentTitle.textContent='Sua criação';
const sub=make('p','cx-workflow-subtitle','Tudo organizado em cinco passos. Escolha uma etapa para encontrar as ferramentas certas.');
currentTitle?.after(sub);
const nav=make('div','cx-stage-nav');nav.setAttribute('role','tablist');nav.setAttribute('aria-label','Etapas de criação do item');
sub.after(nav);
for(const config of stages){
 const tab=make('button','cx-stage-tab'),number=make('span','cx-step-number',config.number),label=make('span',null,config.label);
 tab.id='cx-tab-'+config.id;tab.type='button';tab.setAttribute('role','tab');tab.setAttribute('aria-controls','cx-panel-'+config.id);tab.setAttribute('aria-selected','false');tab.append(number,label);
 nav.append(tab);stageTabs[config.id]=tab;
 const panel=make('section','cx-stage-panel');panel.id='cx-panel-'+config.id;
 panel.setAttribute('role','tabpanel');panel.setAttribute('aria-labelledby',tab.id);panel.hidden=true;panel.append(sectionHeading(config));
 form.append(panel);stagePanels[config.id]=panel;
}
// Transfere as opções da esquerda para etapas correspondentes, mantendo seus IDs.
const piece=(start,end)=>oldLeft.slice(start,end);
for(const child of piece(artStart,frameStart))stagePanels.arte.append(child);
for(const child of piece(frameStart,bgStart))stagePanels.molduras.append(child);
for(const child of piece(bgStart,oldLeft.length))stagePanels.fundos.append(child);
// Parte do formulário original: ficha e ação final. Não recria campos e não perde os dados.
for(const child of oldFormChildren.slice(0,saveStart)){if(child!==status)stagePanels.ficha.append(child)}
for(const child of oldFormChildren.slice(saveStart)){if(child!==status)stagePanels.salvar.append(child)}
// Organiza os controles finos sem ocultar operações básicas.
const scaleGrid=$('scale')?.closest('.grid2');
if(scaleGrid){
 const tuning=details('Posição e escala da imagem · ajustes finos');
 const positionTitle=[...stagePanels.arte.children].find(x=>x.classList?.contains('section')&&x.textContent.includes('Posição do item'));
 positionTitle?.after(tuning.container);tuning.body.append(scaleGrid)
}
const frameGrid=make('div','grid2');
for(const id of ['frameScale','frameX','frameY']){const n=$(id)?.closest('.field');if(n)frameGrid.append(n)}
if(frameGrid.children.length){
 const tuning=details('Tamanho e posição da moldura · ajustes finos');
 tuning.body.append(frameGrid);
 const packs=stagePanels.molduras.querySelector('.pack');(packs||stagePanels.molduras.lastElementChild)?.after(tuning.container)
}
const bgGrid=$('bgZoom')?.closest('.grid2');
if(bgGrid){const tuning=details('Posicionamento, ampliação e luminosidade do fundo',true);tuning.body.append(bgGrid);stagePanels.fundos.append(tuning.container)}
// Coloca as opções de retoque avançado num painel secundário claro.
const canvas=$('source'),help=stagePanels.arte.querySelector('.help');
if(canvas){const tuning=details('Retoque manual de pixels · clique na área para remover');
 if(help)tuning.body.append(help);tuning.body.append(canvas);
 const row=stagePanels.arte.querySelector('.row');row?.after(tuning.container)
}
const file=$('artFile');file?.setAttribute('aria-label','Escolher PNG ou imagem para recortar e criar um ícone');
const infoBanner=make('div','cx-step-callout','Dica: depois de carregar sua imagem, use “Remover fundo”. Se o fundo for branco, use “Limpar branco e halos”. Você também pode arrastar um arquivo até a prévia.');
stagePanels.arte.insertBefore(infoBanner,stagePanels.arte.children[1]||null);
// Melhor separação de ações na etapa Salvar.
const packs=[...stagePanels.salvar.querySelectorAll(':scope > .pack')];
if(packs[0]){
 const actions=make('div','cx-panel-actions');packs[0].before(actions);actions.append(packs[0]);
}
const info=make('p','cx-panel-save-info','✦ Os dados ficam salvos neste navegador. Use “Backup do ateliê” para não perder suas criações ao mudar de aparelho.');
stagePanels.salvar.append(info);
// Etiquetas úteis, preservando os nomes originais para o mouse e leitor de tela.
const frames=$('frames'),backgrounds=$('backgrounds');
function describePresets(){
 frames.querySelectorAll('.frame').forEach(b=>{
  if(b.querySelector('.cx-frame-name'))return;
  const label=(b.title||'').split(' — ').slice(1).join(' — ')||(b.dataset.frame==='0'?'Sem moldura':'Moldura '+b.dataset.frame);
  b.append(make('span','cx-frame-name',label));b.setAttribute('aria-label',b.title||label)
 });
 backgrounds.querySelectorAll('.background-option').forEach(b=>{
  if(b.dataset.background==='0')b.setAttribute('aria-label','Nenhum fundo');
  else b.setAttribute('aria-label',(b.querySelector('.background-name')?.textContent||'Fundo')+(b.querySelector('.gif-label')?' animado':''))
 })
}
new MutationObserver(describePresets).observe(frames,{childList:true});
new MutationObserver(describePresets).observe(backgrounds,{childList:true});
describePresets();
let activeStage='arte';
function setStage(id,focus=false){
 if(!stagePanels[id])return;
 activeStage=id;
 for(const {id:key}of stages){const selected=key===id;stagePanels[key].hidden=!selected;stageTabs[key].setAttribute('aria-selected',String(selected));stageTabs[key].tabIndex=selected?0:-1}
 persist(stageStorage,id);
 if(focus)stageTabs[id].focus({preventScroll:true});
 if(window.innerWidth<851&&focus)right.scrollIntoView({behavior:prefersQuiet()?'auto':'smooth',block:'start'})
}
for(const s of stages)stageTabs[s.id].addEventListener('click',()=>setStage(s.id,true));
nav.addEventListener('keydown',e=>{
 if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;
 e.preventDefault();const i=stages.findIndex(x=>x.id===activeStage);
 const next=e.key==='Home'?0:e.key==='End'?stages.length-1:(i+(e.key==='ArrowRight'?1:-1)+stages.length)%stages.length;
 setStage(stages[next].id,true)
});
setStage(new URLSearchParams(location.search).get('edit')?'ficha':(stored(stageStorage)&&stagePanels[stored(stageStorage)]?stored(stageStorage):'arte'));
saveQuick.addEventListener('click',()=>{
 if(!form.checkValidity()){
  setStage('ficha',true);form.reportValidity();return
 }
 setStage('salvar');form.requestSubmit($('save'))
});
centerButton.addEventListener('click',()=>{
 if(!$('positionCenterBoth').disabled){$('positionCenterBoth').click();flashPreview('drop')}
 else{document.querySelector('.layer-tip')?.scrollIntoView({block:'nearest'})}
});
checkButton.addEventListener('click',()=>{
 const hidden=editor.classList.toggle('cx-no-checker');
 checkButton.textContent=hidden?'▦ Mostrar quadriculado':'▦ Ocultar quadriculado';
 checkButton.setAttribute('aria-pressed',String(hidden))
});
motionButton.addEventListener('click',()=>{
 motionOff=!motionOff;document.body.classList.toggle('cx-motion-off',motionOff);
 savePref(motionStorage,motionOff?'off':'on');
 motionButton.textContent=motionOff?'✦ Ativar efeitos':'✧ Reduzir efeitos';
 motionButton.setAttribute('aria-pressed',String(motionOff))
});
motionButton.setAttribute('aria-pressed',String(motionOff));
if(motionOff)motionButton.textContent='✦ Ativar efeitos';
function flashPreview(kind){
 if(prefersQuiet())return;
 const className=kind==='frame'?'cx-fx-summon':'cx-fx-drop';
 editor.classList.remove(className);void editor.offsetWidth;editor.classList.add(className);
 const onEnd=()=>{editor.classList.remove(className);editor.removeEventListener('animationend',onEnd)};editor.addEventListener('animationend',onEnd)
}
function burst(){
 if(prefersQuiet())return;
 flashPreview('frame');
 const ring=make('span','cx-fx-ring');ring.setAttribute('aria-hidden','true');editor.append(ring);ring.addEventListener('animationend',()=>ring.remove(),{once:true});
 for(let i=0;i<11;i++){
  const star=make('span','cx-fx-particle');star.setAttribute('aria-hidden','true');
  star.style.setProperty('--angle',(i*360/11)+'deg');
  star.style.setProperty('--dist',(110+(i%3)*18)+'px');
  star.style.setProperty('--delay',(i%3*30)+'ms');
  star.style.setProperty('--cx-fx-color',i%3?'#ebcda8':'#f0aadb');
  editor.append(star);star.addEventListener('animationend',()=>star.remove(),{once:true})
 }
}
frames.addEventListener('click',e=>{
 const frame=e.target.closest('.frame');if(!frame)return;
 if(frame.dataset.frame!=='0')burst();else flashPreview('drop')
});
backgrounds.addEventListener('click',e=>{
 const b=e.target.closest('.background-option');if(!b)return;flashPreview('drop')
});
let start=null;
editor.addEventListener('pointerdown',e=>{start={id:e.pointerId,x:e.clientX,y:e.clientY}},true);
editor.addEventListener('pointerup',e=>{if(start&&start.id===e.pointerId&&Math.hypot(start.x-e.clientX,start.y-e.clientY)>6)flashPreview('drop');start=null},true);
editor.addEventListener('pointercancel',()=>{start=null},true);
// Soltar imagem no editor faz upload usando o input original; não altera a ferramenta de recorte.
editor.addEventListener('dragover',e=>{if([...e.dataTransfer?.types||[]].includes('Files')){e.preventDefault();e.dataTransfer.dropEffect='copy';editor.classList.add('cx-drop-active')}});
editor.addEventListener('dragleave',e=>{if(!editor.contains(e.relatedTarget))editor.classList.remove('cx-drop-active')});
editor.addEventListener('drop',e=>{
 e.preventDefault();editor.classList.remove('cx-drop-active');
 const file=[...(e.dataTransfer?.files||[])].find(f=>f.type.startsWith('image/'));
 if(!file)return;
 try{const dt=new DataTransfer();dt.items.add(file);$('artFile').files=dt.files;$('artFile').dispatchEvent(new Event('change',{bubbles:true}));setStage('arte')}
 catch(err){console.warn('Arquivo não pôde ser encaminhado ao input',err);setStage('arte')}
});
// Microefeitos de clique: somente CSS, sem bloquear ações existentes.
function ripple(target,ev){
 if(prefersQuiet()||!target||target.disabled)return;
 const box=target.getBoundingClientRect();if(!box.width||!box.height)return;
 const centerX=typeof ev.clientX==='number'&&ev.clientX?ev.clientX-box.left:box.width/2;
 const centerY=typeof ev.clientY==='number'&&ev.clientY?ev.clientY-box.top:box.height/2;
 const wave=make('span','cx-fx-ripple');wave.style.setProperty('--x',centerX+'px');wave.style.setProperty('--y',centerY+'px');
 const computed=getComputedStyle(target);if(computed.position==='static')target.style.position='relative';
 target.append(wave);wave.addEventListener('animationend',()=>wave.remove(),{once:true})
}
document.addEventListener('click',e=>{
 const button=e.target.closest('button.btn,button.cx-stage-tab,button.frame,button.background-option');
 if(button)ripple(button,e)
},true);
function statusChanged(){
 const txt=status.textContent||'';
 status.classList.toggle('cx-is-error',/erro|falha|inválido|não foi possível|indisponível|bloqueou/i.test(txt));
 status.classList.toggle('cx-is-success',/salvo|exportad|recebid|enviado|restaurad|sucesso|concluído/i.test(txt));
 if(!prefersQuiet()){status.classList.remove('cx-status-flash');void status.offsetWidth;status.classList.add('cx-status-flash')}
}
new MutationObserver(statusChanged).observe(status,{childList:true,subtree:true,characterData:true});
statusChanged();
const externalHelp=make('div','cx-onboarding-banner');
externalHelp.innerHTML='<strong>Precisa de ajuda?</strong> Escolha uma etapa à direita. A prévia pode ser arrastada com mouse ou dedo; para uma imagem transparente, use a etapa Arte.';
left.append(externalHelp);
// Notificação visual de edição persistente no painel correto.
document.addEventListener('keydown',event=>{
 const el=event.target,typing=el instanceof HTMLElement&&(el.matches('input,textarea,select')||el.isContentEditable);
 if(typing||event.altKey||event.metaKey||event.ctrlKey)return;
 if(event.key==='?'&&!event.shiftKey){setStage('arte',true)}
});
})();