(function(){
'use strict';
// Backups carregados sob demanda: os 17 JS originais não pesam no primeiro carregamento da Wiki.
const controls=document.querySelector('.controls');
if(!controls||typeof ITEMS==='undefined')return;
const remastered=new Map(ITEMS.filter(it=>/^g[1-6]_\d{3}$/.test(it.id)).map(it=>[it.id,it.image]));
const count=remastered.size;
const compare=document.createElement('button');compare.type='button';
compare.className='action codex-compare';
compare.title='Compare a nova arte com os 205 sprites originais, preservados para sua segurança';
compare.textContent='◫ Ver sprites originais';
compare.setAttribute('aria-pressed','false');
compare.setAttribute('aria-label','Alternar entre os 205 sprites remasterizados e suas versões originais');
const sort=document.getElementById('sort');sort?.after(compare);
let original=null,legacy=false,loading=false;
async function fetchOriginal(){
 if(original)return original;
 const mapped=Object.create(null),previous=window.CODEX_IMAGES;
 window.CODEX_IMAGES=mapped;
 try{
  for(let n=1;n<=17;n++){
   const file='assets/data/sprites-'+String(n).padStart(2,'0')+'.js';
   await new Promise((resolve,reject)=>{
    const src=document.createElement('script');src.src=file;src.async=false;
    src.onload=()=>{src.remove();resolve()};src.onerror=()=>{src.remove();reject(new Error('Não foi possível carregar '+file))};
    document.head.append(src)
   })
  }
  const loaded=Object.keys(mapped).filter(k=>remastered.has(k)).length;
  if(loaded!==count)throw new Error('Backup incompleto: '+loaded+'/'+count+' sprites');
  original={...mapped};return original
 }finally{window.CODEX_IMAGES=previous}
}
function switchImages(map){
 for(const it of ITEMS){const img=map.get?.(it.id)||map[it.id];if(img)it.image=img}
 draw();
 const tip=document.getElementById('cx-sprites-status');
 if(tip)tip.textContent=legacy?'Exibindo as versões originais. Clique novamente para retornar às novas artes.':'Exibindo os 205 sprites remasterizados.';
}
compare.onclick=async()=>{
 if(loading)return;
 loading=true;compare.disabled=true;
 try{
  if(!legacy){
   compare.textContent='⌛ Carregando originais...';
   const old=await fetchOriginal();legacy=true;switchImages(old);
   compare.textContent='✦ Voltar aos novos sprites';
  }else{
   legacy=false;switchImages(remastered);
   compare.textContent='◫ Ver sprites originais'
  }
  compare.classList.toggle('codex-originals',legacy);
  compare.setAttribute('aria-pressed',String(legacy))
 }catch(e){
  compare.textContent='◫ Ver sprites originais';
  const status=document.getElementById('cx-sprites-status');
  if(status)status.textContent='Falha ao abrir os originais: '+e.message
 }finally{loading=false;compare.disabled=false}
};
const description=document.createElement('p');description.id='cx-sprites-status';description.className='cx-sprites-status';
description.textContent='205 de 205 artes remasterizadas · PNGs transparentes individuais · Todos os originais preservados.';
const breadcrumb=document.querySelector('.cx-breadcrumbs'),heading=document.querySelector('.heading');
(breadcrumb||heading)?.after(description);
function decorate(){
 document.querySelectorAll('#grid .card').forEach(card=>{
  const id=card.dataset.itemId;
  const group=/^g([1-6])_/.exec(id)?.[1];if(group)card.dataset.group=group
 })
}
const grid=document.getElementById('grid');
new MutationObserver(decorate).observe(grid,{childList:true});
decorate();
})();