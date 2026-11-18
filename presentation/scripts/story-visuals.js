/* Ink visuals driven by the presentation scroll; media opens directly on click. */
(() => {
'use strict';
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const svg=body=>`<svg viewBox="0 0 700 320" aria-hidden="true">${body}</svg>`;
const text=(x,y,value,size=30,accent=false)=>`<text x="${x}" y="${y}" font-size="${size}" fill="${accent?'#6f2093':'#241d29'}">${esc(value)}</text>`;
function render(el,step=0){
 const kind=el.dataset.demo;let art='';el.dataset.step=step;
 if(kind==='cipher'){
  const lines=['Ig. Sqlod, qz fro Iulqg Zugi,','ruc aqmeoc fro rol-rqhdod'];
  const decoded=['Mr. Jones, of the Manor Farm,','had locked the hen-houses'];
  art=svg(lines.map((line,i)=>text(25,130+i*65,step===3?decoded[i]:[...line].map((c,n)=>n<Math.round(step/3*line.length)?(decoded[i][n]||''):c).join(''),30,step===3)).join(''));
 }else if(kind==='tape'){
  const bits=step===0?'00000':step===1?'10000':'11000',pointer=step===3?1:0;
  art=svg(text(22,55,'r I i',36)+[...bits].map((b,i)=>`<path d="M${22+i*135} 115v95h112v-95" fill="none" stroke="#6f2093" stroke-width="${i===pointer?3:1}" opacity="${i===pointer?1:.3}"/>`+text(62+i*135,178,b,44,i===pointer)).join('')+text(22,278,step===3?'rIi':'rIi'.slice(0,step),22,true));
 }else if(kind==='list'){
  const vals=step<1?[10,20,30]:step<3?[10,15,20,30]:[10,15,30];
  art=svg(vals.map((v,i)=>`<circle cx="${75+i*175}" cy="160" r="48" fill="none" stroke="#6f2093" stroke-width="${v===15?2.5:1}"/>`+`<text x="${75+i*175}" y="172" text-anchor="middle" font-size="34" fill="#241d29">${v}</text>`+(i<vals.length-1?`<path d="M${123+i*175} 160h79" stroke="#6f2093" stroke-width="1.5"/>`:'')).join(''));
 }else if(kind==='matches'){
  art=svg(text(22,50,'MATCHES',18,true)+[0,1,2].map((n)=>text(22,120+n*72,'#00'+(n+1)+'     Bot A / Bot B       ⋮',25)+`<path d="M22 ${138+n*72}H675" stroke="#6f2093" opacity=".18"/>`).join('')+text(500,30,'UI sketch',15));
 }else if(kind==='merge'){
  art=svg(text(22,100,'SCAN 01     A  B  C',30)+text(22,170,'SCAN 02        B  C  D',30)+text(22,265,'HISTORY     A  B  C  D',30,true));
 }else if(kind==='agent'){
  art=svg(text(22,85,'17 × $23.75',34)+text(22,155,'12% discount',26)+text(22,260,'$355.30',72,true));
 }
 el.innerHTML=art;
}
function markup(page,asset=x=>x){
 let body='';
 if(page.demo)body=`<div class="ink-demo" data-demo="${esc(page.demo)}"></div>`;
 else if(page.image)body=`<img src="${esc(asset(page.image))}" alt="${esc(page.alt)}" loading="lazy">`;
 else if(page.video)body=`<video src="${esc(asset(page.video))}" autoplay loop muted playsinline preload="metadata" aria-label="${esc(page.title)}"></video>`;
 else if(page.code)body=`<pre>${esc(page.code)}</pre>`;
 if(!body)return '';
 return `<figure class="story-visual visual media-visual ${esc(page.imageClass||'')}" data-title="${esc(page.title)}"><div class="media-content" role="button" tabindex="0" aria-label="View ${esc(page.title)}">${body}</div></figure>`;
}
let dialog,active,placeholder,trigger,oldOverflow,closing=false;
let originFigure,playback,opening;
const reducedMotion=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
function preserveVideo(){const v=active?.querySelector('video');return v?{v,time:v.currentTime,playing:!v.paused}:null;}
function restoreVideo(state){if(!state)return;state.v.currentTime=state.time;if(state.playing)state.v.play().catch(()=>{});else state.v.pause();}
function open(figure,button) {
 if(active)return;
 originFigure=figure;trigger=button;active=figure.querySelector('.media-content');
 const rect=active.getBoundingClientRect();playback=preserveVideo();placeholder=document.createElement('div');placeholder.style.height=rect.height+'px';placeholder.setAttribute('aria-hidden','true');active.before(placeholder);
 dialog.querySelector('h2').textContent=figure.dataset.title||'Visual';dialog.querySelector('.media-stage').append(active);active.removeAttribute('role');active.removeAttribute('tabindex');if(playback)playback.v.controls=true;
 oldOverflow=document.body.style.overflow;document.body.style.overflow='hidden';dialog.showModal();document.documentElement.dataset.mediaOpen='true';restoreVideo(playback);document.dispatchEvent(new Event('media-viewer-open'));
 active.inert=true;delete dialog.dataset.ready;
 const ready=()=>{if(active&&!closing){active.inert=false;dialog.dataset.ready='true';}};
 const end=active.getBoundingClientRect();if(!reducedMotion()){opening=active.animate([{transform:`translate(${rect.x-end.x}px,${rect.y-end.y}px) scale(${rect.width/end.width},${rect.height/end.height})`,opacity:.5},{transform:'none',opacity:1}],{duration:380,easing:'cubic-bezier(.2,.8,.2,1)'});opening.finished.then(ready).catch(()=>{});}else ready();
}
async function close() {
 if(!active||closing)return;closing=true;delete dialog.dataset.ready;opening?.cancel();active.inert=false;
 const start=active.getBoundingClientRect(),end=placeholder.getBoundingClientRect();
 if(!reducedMotion())await active.animate([{transform:'none',opacity:1},{transform:`translate(${end.x-start.x}px,${end.y-start.y}px) scale(${end.width/start.width},${end.height/start.height})`,opacity:.3}],{duration:300,easing:'cubic-bezier(.4,0,.2,1)'}).finished.catch(()=>{});
 playback=preserveVideo();placeholder.replaceWith(active);active.setAttribute('role','button');active.tabIndex=0;if(playback)playback.v.controls=false;restoreVideo(playback);dialog.close();active=null;closing=false;delete document.documentElement.dataset.mediaOpen;document.body.style.overflow=oldOverflow;trigger?.focus({preventScroll:true});document.dispatchEvent(new Event('media-viewer-close'));
 if(originFigure?.dataset.temporary)originFigure.remove();
}
function openImage(src,title){const fig=document.createElement('figure');fig.className='media-visual';fig.dataset.title=title;fig.dataset.temporary='true';fig.style.cssText='position:fixed;left:45vw;top:45vh;width:10vw;visibility:hidden';fig.innerHTML=`<div class="media-content"><img src="${esc(src)}" alt="${esc(title)}"></div>`;document.body.append(fig);open(fig,document.activeElement);}

function mount(root=document){root.querySelectorAll('.ink-demo:not([data-step])').forEach(el=>render(el));}
function progress(root,value){root.querySelectorAll('.ink-demo').forEach(el=>{const step=Math.min(3,Math.max(0,Math.floor(value*4)));if(+el.dataset.step!==step)render(el,step);});}
function init(){
 dialog=document.createElement('dialog');dialog.className='media-viewer';dialog.setAttribute('aria-labelledby','media-viewer-title');dialog.innerHTML='<header><h2 id="media-viewer-title"></h2><button aria-label="Close visual">×</button></header><div class="media-stage"></div>';document.body.append(dialog);
 dialog.querySelector('button').addEventListener('click',close);dialog.addEventListener('cancel',e=>{e.preventDefault();close();});dialog.addEventListener('click',e=>{if(e.target===dialog)close();});
 document.addEventListener('click',e=>{const fig=e.target.closest('.media-visual');if(fig)open(fig,fig.querySelector('.media-content'));});
 document.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches('.media-visual .media-content')){e.preventDefault();open(e.target.closest('.media-visual'),e.target);}});
 mount();
}
window.StoryVisuals={markup,mount,progress,openImage,isOpen:()=>!!active};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
