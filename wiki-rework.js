(function(){
'use strict';
const $=id=>document.getElementById(id);
const search=$('search'),grid=$('grid'),nav=$('nav'),sidebar=document.querySelector('.sidebar'),controls=document.querySelector('.controls'),hero=document.querySelector('.hero'),content=document.querySelector('.content');
if(!search||!grid||!nav||!sidebar||!controls||!hero||!content)return;
const motionKey='codex-motion-preference-v1',densityKey='codex-grid-density-v1';
function getValue(k){try{return localStorage.getItem(k)}catch(_){return null}}
function setValue(k,v){try{localStorage.setItem(k,v)}catch(_){}}
let motionOff=getValue(motionKey)==='off',compact=getValue(densityKey)==='compact';
document.body.classList.toggle('cx-motion-off',motionOff);
document.body.classList.toggle('cx-compact',compact);
const reduced=()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches||document.body.classList.contains('cx-motion-off');
const add=(parent,tag,klass,text)=>{const e=document.createElement(tag);if(klass)e.className=klass;if(text!==undefined)e.textContent=text;parent.append(e);return e};
const intro=add(hero,'div','cx-hero-rule');
intro.setAttribute('aria-hidden','true');
const sigil=add(hero,'span','cx-hero-eyecatch','✦ ARQUIVO DE RELÍQUIAS ✦');sigil.setAttribute('aria-hidden','true');
const welcome=document.createElement('section');welcome.className='cx-welcome';
const info=add(welcome,'div');add(info,'strong',null,'A sua biblioteca de descobertas');
add(info,'small',null,'Explore, favorite e dê um nome às suas relíquias. Ou crie um novo item no Ateliê.');
const actions=add(welcome,'div','cx-welcome-actions');
const quickCreate=add(actions,'a',null,'✦ Criar item');quickCreate.href='studio.html';
const quickHelp=add(actions,'button',null,'? Como funciona');quickHelp.type='button';
content.insertBefore(welcome,controls);
const tools=add(sidebar,'div','cx-sidebar-tools');
sidebar.insertBefore(tools,sidebar.querySelector('.sidefoot'));
const studioLink=add(tools,'a',null,'✦ Abrir Ateliê de Itens');studioLink.href='studio.html';
const imageLink=add(tools,'a',null,'◈ Biblioteca de Imagens');imageLink.href='images.html';
const helpSide=add(tools,'button',null,'? Guia rápido');helpSide.type='button';
search.placeholder='Buscar uma arma, flor, item ou código...';
search.setAttribute('aria-keyshortcuts','Control+K /');
search.setAttribute('spellcheck','false');
const searchHint=add(document.querySelector('.searchbox'),'span','cx-helper-key','/');searchHint.setAttribute('aria-hidden','true');
const clear=add(controls,'button','cx-density cx-clear','× Limpar');clear.type='button';clear.title='Limpar pesquisa';clear.hidden=true;
const density=add(controls,'button','cx-density',compact?'▦ Grade compacta':'▤ Grade confortável');
density.type='button';density.setAttribute('aria-pressed',String(compact));density.title='Mudar tamanho dos cartões';
const help=add(controls,'button','cx-help-button','? Ajuda');help.type='button';
const breadcrumb=document.createElement('div');breadcrumb.className='cx-breadcrumbs';breadcrumb.setAttribute('aria-label','Caminho na wiki');

add(breadcrumb,'span',null,'Codex Arcano');add(breadcrumb,'span',null,'›');const leaf=add(breadcrumb,'span',null,$('categoryName').textContent);
document.querySelector('.heading')?.before(breadcrumb);
function syncNavigation(){
 leaf.textContent=$('categoryName').textContent;
 nav.querySelectorAll('button').forEach(b=>{if(b.classList.contains('active'))b.setAttribute('aria-current','page');else b.removeAttribute('aria-current')});
 const active=$('favoritesBtn').textContent.includes('★');
 $('favoritesBtn').classList.toggle('cx-is-active',active);$('favoritesBtn').setAttribute('aria-pressed',String(active));
}
const heading=$('categoryName');
if(heading)new MutationObserver(syncNavigation).observe(heading,{childList:true,subtree:true,characterData:true});
new MutationObserver(syncNavigation).observe(nav,{childList:true});
$('favoritesBtn').addEventListener('click',syncNavigation);
function updateClear(){clear.hidden=!search.value.trim();searchHint.hidden=!!search.value.trim()}
search.addEventListener('input',updateClear);updateClear();
clear.addEventListener('click',()=>{search.value='';search.dispatchEvent(new Event('input',{bubbles:true}));search.focus({preventScroll:true})});
function setCompact(value){
 compact=value;document.body.classList.toggle('cx-compact',compact);
 density.textContent=compact?'▦ Grade compacta':'▤ Grade confortável';
 density.setAttribute('aria-pressed',String(compact));setValue(densityKey,compact?'compact':'comfortable')
}
density.addEventListener('click',()=>setCompact(!compact));
const dialog=document.createElement('dialog');dialog.className='cx-help-dialog';dialog.setAttribute('aria-label','Guia de uso da Wiki');
dialog.innerHTML='<div class="cx-help-header"><h2>Guia do Codex Arcano</h2><p>Uma wiki simples para suas descobertas e um ateliê para suas criações.</p></div>'+
'<div class="cx-help-content"><p><strong>Explore:</strong> use as coleções à esquerda ou pesquise pelo nome. Clique em um item para ver a imagem e editar a descrição.</p>'+
'<p><strong>Favoritos:</strong> marque seus itens importantes e use o filtro de favoritos na barra superior.</p>'+
'<p><strong>Crie:</strong> escolha “Criar item” para abrir o Ateliê. Lá você pode recortar a imagem, selecionar moldura e fundo, arrastar as camadas e exportar para o Delta RPG.</p>'+
'<p><strong>Backup:</strong> exporte seus dados periodicamente. Os itens editados ficam no armazenamento deste navegador.</p>'+
'<p><strong>Atalhos:</strong> <kbd>/</kbd> ou <kbd>Ctrl</kbd> + <kbd>K</kbd> para pesquisar; <kbd>Esc</kbd> para fechar.</p>'+
'<label style="display:flex;align-items:center;gap:9px;margin-top:18px"><input id="cxReducedMotion" type="checkbox"> Reduzir animações deste site</label></div>'+
'<div class="cx-help-footer"><button type="button" id="cxCloseHelp">Entendi, continuar</button></div>';
document.body.append(dialog);
const reduceBox=dialog.querySelector('#cxReducedMotion');reduceBox.checked=motionOff;
reduceBox.addEventListener('change',()=>{motionOff=reduceBox.checked;document.body.classList.toggle('cx-motion-off',motionOff);setValue(motionKey,motionOff?'off':'on')});
const openHelp=()=>{if(!dialog.open)dialog.showModal()};
for(const b of [quickHelp,helpSide,help])b.addEventListener('click',openHelp);
dialog.querySelector('#cxCloseHelp').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close()});
document.addEventListener('keydown',event=>{
 const target=event.target,typing=target instanceof HTMLElement&&(target.matches('input,textarea,select')||target.isContentEditable);
 if((event.key==='/'&&!typing)||(event.key.toLowerCase()==='k'&&(event.ctrlKey||event.metaKey))){
  if(!dialog.open&&!$('modal').open){event.preventDefault();search.focus();search.select()}
 }
 if(event.key==='Escape'&&document.activeElement===search&&search.value&&!dialog.open){
  search.value='';search.dispatchEvent(new Event('input',{bubbles:true}))
 }
});
function revealCards(){
 const cards=[...grid.querySelectorAll('.card')];
 const animate=!reduced()&&cards.length<=220;
 cards.forEach((card,i)=>{
  if(!card.classList.contains('cx-reveal')&&animate&&i<22){
   card.style.setProperty('--cx-order',Math.min(i,12)*22+'ms');
   card.classList.add('cx-reveal');
   card.addEventListener('animationend',()=>{card.classList.remove('cx-reveal');card.style.removeProperty('--cx-order')},{once:true})
  }
 });
 syncNavigation()
}
new MutationObserver(revealCards).observe(grid,{childList:true});revealCards();
function sparkle(host,x,y,count=5){
 if(reduced())return;
 host.style.position=host.style.position||'relative';
 for(let i=0;i<count;i++){
  const star=document.createElement('span');star.className='cx-spark';
  star.style.setProperty('--x',x+'px');star.style.setProperty('--y',y+'px');
  const angle=(Math.PI*2/count)*i,dist=20+((i%2)*13);
  star.style.setProperty('--dx',Math.cos(angle)*dist+'px');star.style.setProperty('--dy',Math.sin(angle)*dist+'px');
  host.append(star);star.addEventListener('animationend',()=>star.remove(),{once:true})
 }
}
grid.addEventListener('click',event=>{
 const card=event.target.closest('.card');if(!card)return;
 const r=card.getBoundingClientRect();sparkle(card,event.clientX-r.left,event.clientY-r.top,5)
});
$('favItem').addEventListener('click',()=>{if(reduced())return;const b=$('favItem');b.classList.remove('cx-card-pop');void b.offsetWidth;b.classList.add('cx-card-pop')});
$('favoritesBtn').addEventListener('click',()=>{syncNavigation();});
syncNavigation();
})();