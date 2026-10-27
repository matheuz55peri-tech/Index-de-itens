(function(){
'use strict';
const STUDIO_KEY='codex_studio_items_v1',DATABASE='codex-arcano-assets',INBOX='codex-delta-inbox-v1';
function readStudio(){try{const a=JSON.parse(localStorage.getItem(STUDIO_KEY)||'[]');return Array.isArray(a)?a:[]}catch{return []}}
function category(g){return CATEGORIES[(Number(g)||1)-1]?.[0]||'Itens e Consumíveis'}
function itemMeta(it){return readStudio().find(x=>x.id===it?.id)}
const db=new Promise((resolve,reject)=>{const req=indexedDB.open(DATABASE,1);req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains('blobs'))req.result.createObjectStore('blobs')};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)});
async function asset(key){try{const d=await db;return await new Promise(resolve=>{const tx=d.transaction('blobs','readonly'),r=tx.objectStore('blobs').get(key);r.onsuccess=()=>resolve(r.result||null);r.onerror=()=>resolve(null)})}catch{return null}}
async function setAsset(key,val){const d=await db;return new Promise((resolve,reject)=>{let tx=d.transaction('blobs','readwrite'),r=tx.objectStore('blobs').put(val,key);r.onsuccess=()=>resolve();r.onerror=()=>reject(r.error)})}
function asData(b){return new Promise((resolve,reject)=>{let r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(r.error);r.readAsDataURL(b)})}
function fromData(s){if(typeof s!=='string'||!s.startsWith('data:image/'))throw Error('Imagem inválida');let parts=s.split(','),b=atob(parts[1]),a=new Uint8Array(b.length);for(let i=0;i<b.length;i++)a[i]=b.charCodeAt(i);return new Blob([a],{type:parts[0].slice(5).split(';')[0]||'image/png'})}
function saveJson(o,file){let a=document.createElement('a'),u=URL.createObjectURL(new Blob([JSON.stringify(o,null,2)],{type:'application/json'}));a.href=u;a.download=file;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),2000)}
const ids=new Set(),urls=new Map();
async function reloadItems(){const list=readStudio(),known=new Set(list.map(x=>x.id));for(const it of [...ITEMS]){if(ids.has(it.id)&&!known.has(it.id)){ITEMS.splice(ITEMS.indexOf(it),1);ids.delete(it.id)}}for(const m of list){let it=ITEMS.find(x=>x.id===m.id);if(!it){it={id:m.id,name:m.name,group:Number(m.group)||1,category:category(m.group),number:ITEMS.length+1,emoji:'✦',image:''};ITEMS.push(it);ids.add(it.id)}it.name=m.name;it.group=Number(m.group)||1;it.category=category(it.group);it.number=ITEMS.indexOf(it)+1;const b=await asset('card:'+m.id)||await asset('art:'+m.id);if(b){let old=urls.get(m.id);if(old)URL.revokeObjectURL(old);it.image=URL.createObjectURL(b);urls.set(m.id,it.image)}}draw()}
function tinyPng(src){return new Promise((resolve,reject)=>{if(!src){resolve(null);return}const img=new Image();img.onload=()=>{const c=document.createElement('canvas');c.width=180;c.height=180;let ctx=c.getContext('2d'),ratio=Math.min(180/img.width,180/img.height),w=ratio*img.width,h=ratio*img.height;ctx.drawImage(img,(180-w)/2,(180-h)/2,w,h);resolve(c.toDataURL('image/png'))};img.onerror=()=>resolve(null);img.src=src})}
function packComposition(m){
 const f=Math.trunc(Number(m.frame)||0),b=Math.trunc(Number(m.background)||0);
 const bgExt=b>=3&&b<=6?'gif':'jpg';
 const base='https://matheuz55peri-tech.github.io/Index-de-itens/';
 return{iconShape:'circle',frameOutside:true,iconRadius:40,
  frameUrl:f>0&&f<=9?base+'assets/frames/frame-'+String(f).padStart(2,'0')+'.png':null,
  backgroundUrl:b>0&&b<=10?base+'assets/backgrounds/background-'+String(b).padStart(2,'0')+'.'+bgExt:null,
  bgZoom:Number(m.bgZoom)||100,bgDim:Number(m.bgDim)||0,bgX:Number(m.bgX)||0,bgY:Number(m.bgY)||0,frameScale:Number(m.frameScale)||100,frameX:Number(m.frameX)||0,frameY:Number(m.frameY)||0}
}
async function packOne(it){
 const m=itemMeta(it);
 if(m){
  const art=await asset('art:'+m.id),card=await asset('card:'+m.id),f=m.frame?await asset('frame:'+m.frame):null,original=await asset('source:'+m.id);
  return{format:'codex-item-v1',version:2,item:m,composition:packComposition(m),
   image:art?await asData(art):null,card:card?await asData(card):null,
   frameImage:f?await asData(f):null,sourceImage:original?await asData(original):null}
 }
 return{format:'codex-item-v1',version:1,
  item:{id:it.id,name:itemName(it),description:descriptions[it.id]||'',group:it.group,quantity:1,weight:0,damageDice:'',type:it.group===6?'✦':it.group>=3?'⚔':'◆',rarity:'Comum',bonuses:[]},
  image:it.image.startsWith('data:image/')?it.image:await tinyPng(it.image),card:await tinyPng(it.image)}
}
async function send(it){
 try{
  const p=await packOne(it);
  if(p.version===2&&p.image){p.image=await tinyPng(p.image);p.card=await tinyPng(it.image)}
  localStorage.setItem(INBOX,JSON.stringify(p));
  window.open('https://matheuz55peri-tech.github.io/Deltarune-RPG/#codex-import','_blank');
  notify('Item enviado ao Delta RPG com ícone redondo, moldura externa, fundo e atributos.')
 }catch(e){notify('Não foi possível enviar: '+e.message)}
}
const link=document.createElement('a');link.className='primary';link.textContent='✦ Criar item';link.href='studio.html';link.style.textDecoration='none';link.style.display='inline-flex';link.style.alignItems='center';el('favoritesBtn').before(link);
const modalButtons=el('modal').querySelector('.editoractions');
const advanced=document.createElement('button');advanced.type='button';advanced.className='minor';advanced.textContent='✦ Editar no ateliê';
advanced.onclick=()=>{if(!active)return;let m=itemMeta(active);if(!m){notify('O Ateliê permite criar novas fichas avançadas.');return}location.href='studio.html?edit='+encodeURIComponent(active.id)};
const exportItem=document.createElement('button');exportItem.type='button';exportItem.className='minor';exportItem.textContent='⇩ JSON do item';exportItem.onclick=async()=>{if(!active)return;saveJson(await packOne(active),(itemName(active).replace(/[^\p{L}\p{N}-]+/gu,'_'))+'.codex.json')};
const delta=document.createElement('button');delta.type='button';delta.className='minor';delta.textContent='♥ Delta RPG';delta.onclick=()=>active&&send(active);
modalButtons.prepend(advanced,exportItem,delta);modalButtons.style.flexWrap='wrap';
const bgExt={1:'jpg',2:'jpg',3:'gif',4:'gif',5:'gif',6:'gif',7:'jpg',8:'jpg',9:'jpg',10:'jpg'};
const bgCSS=document.createElement('style');bgCSS.textContent=
 '.card-art>.codex-item-disc,.visual>.codex-item-disc{position:absolute;display:block;z-index:0;clip-path:circle(40% at 50% 50%);pointer-events:none;left:50%;top:50%;transform:translate(-50%,-50%);aspect-ratio:1}' +'.card-art>.codex-item-disc{height:94%;width:auto}' +'.visual>.codex-item-disc{width:min(92%,320px);height:auto}'
 +'.codex-item-disc>.codex-item-background{position:absolute;inset:0;display:block;width:100%;height:100%;object-fit:cover;transform-origin:center;image-rendering:auto;max-width:none;max-height:none;filter:none}'
 +'.codex-item-disc>.codex-item-shade{position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none}'
 +'.card-art>img:not(.codex-item-background){position:relative;z-index:2}.card-art>.gem,.card-art>.fav{z-index:3}'
 +'.visual>#bigImage{position:relative;z-index:2}';
document.head.append(bgCSS);
function applyItemBackground(host,m){
 if(!host)return;
 host.querySelectorAll(':scope > .codex-item-disc,:scope > .codex-item-background,:scope > .codex-item-shade').forEach(x=>x.remove());
 const id=Number(m?.background)||0;if(!bgExt[id])return;
 const disc=document.createElement('span');disc.className='codex-item-disc';
 const bg=document.createElement('img');bg.className='codex-item-background';
 bg.src='assets/backgrounds/background-'+String(id).padStart(2,'0')+'.'+bgExt[id];bg.alt='';bg.setAttribute('aria-hidden','true');bg.loading='lazy';
 bg.style.transform='translate('+Math.max(-50,Math.min(50,(Number(m.bgX)||0)/512*100))+'%,'+Math.max(-50,Math.min(50,(Number(m.bgY)||0)/512*100))+'%) scale('+Math.max(1,Math.min(2,(Number(m.bgZoom)||100)/100))+')';
 const shade=document.createElement('span');shade.className='codex-item-shade';
 shade.style.background='rgba(0,0,0,'+Math.max(0,Math.min(.75,(Number(m.bgDim)||0)/100))+')';
 disc.append(bg,shade);host.prepend(disc)
}
const originalDraw=draw;draw=function(){originalDraw();for(const card of el('grid').querySelectorAll('.card[data-item-id]')){const id=card.dataset.itemId,m=readStudio().find(x=>x.id===id);if(m?.background)applyItemBackground(card.querySelector('.card-art'),m)}};
const defaultOpen=openItem;openItem=function(it){defaultOpen(it);const m=itemMeta(it);advanced.hidden=!Boolean(m);applyItemBackground(el('visual'),m);};
const exportBtn=el('exportBtn'),file=el('importFile');
exportBtn.addEventListener('click',async e=>{e.preventDefault();e.stopImmediatePropagation();try{const meta=readStudio(),assets={};for(const m of meta)for(const p of ['art:','source:','card:']){let b=await asset(p+m.id);if(b)assets[p+m.id]=await asData(b)}for(let i=1;i<=9;i++){let b=await asset('frame:'+i);if(b)assets['frame:'+i]=await asData(b)}saveJson({format:'codex-arcano-v3',descriptions,names:customNames,favorites,studio:{items:meta,assets}},'codex_arcano_backup_completo.json');notify('Backup completo da wiki e do Ateliê exportado.')}catch(e){notify('Falha no backup: '+e.message)}},true);
file.addEventListener('change',async e=>{const f=e.target.files?.[0];if(!f)return;let o;try{o=JSON.parse(await f.text())}catch{return}if(o?.format!=='codex-arcano-v3')return;e.preventDefault();e.stopImmediatePropagation();try{if(!o.studio||!Array.isArray(o.studio.items))throw Error('Backup incompleto');for(const [key,data]of Object.entries(o.studio.assets||{}))if(/^(frame:\d|art:custom_|source:custom_|card:custom_)/.test(key))await setAsset(key,fromData(data));localStorage.setItem(STUDIO_KEY,JSON.stringify(o.studio.items));descriptions=o.descriptions||{};customNames=o.names||{};favorites=Array.isArray(o.favorites)?o.favorites:[];persist('codex_descriptions',descriptions);persist('codex_names_v2',customNames);persist('codex_favorites_v2',favorites);await reloadItems();notify('Backup completo restaurado.')}catch(err){notify('Erro ao restaurar: '+err.message)}finally{e.target.value=''}},true);
window.addEventListener('focus',()=>reloadItems());
window.addEventListener('storage',e=>{if(e.key===STUDIO_KEY)reloadItems()});
reloadItems();
})();