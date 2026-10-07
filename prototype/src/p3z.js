
/* ================= ЛЕКЦИЯ: слайдеры фото и правка на месте ================= */
const imgsOf=b=>b.imgs&&b.imgs.length?b.imgs:(b.id?[{id:b.id,cap:b.cap||""}]:[]);
const ICON_ZOOM=`<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M15.5 15.5 21 21" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><path class="zplus" d="M10.5 7.5v6M7.5 10.5h6" stroke="currentColor" stroke-width="2"/></svg>`;
function sliderHTML(imgs){
  if(!imgs.length)return"";
  return `<figure class="sld" data-i="0"><div class="sld-view">${imgs.map((g,i)=>`<img src="${g.src||blobUrl(g.id)}" alt="${esc(g.cap||`Фото ${i+1}`)}" data-cap="${esc(g.cap||"")}" class="${i?"":"on"}" loading="lazy">`).join("")}
  <button type="button" class="zoom" aria-label="Открыть фото на весь экран">${ICON_ZOOM}</button>
  ${imgs.length>1?`<div class="dots">${imgs.map((_,i)=>`<button type="button" class="dot ${i?"":"on"}" data-dot="${i}" aria-label="Фото ${i+1} из ${imgs.length}"></button>`).join("")}</div><span class="sld-n">1 / ${imgs.length}</span>`:""}</div>
  <figcaption>${esc(imgs[0].cap||"")}</figcaption></figure>`;
}
function stripHTML(imgs,bi,M){
  if(!imgs.length)return"";const step=imgs.length>1;
  return `<div class="strip" data-all="${step?0:1}">${M&&imgs.length>1?`<p class="mut sm no-print" style="margin:0 0 6px">Так видит абитуриент: фото по одному, щелчок — справа появляется следующее. <button type="button" class="btn sm" data-sall>Показать все фото для правки</button></p>`:""}<div class="strip-track">${imgs.map((g,j)=>`<figure class="strip-item ${step&&j?"hid":""}"><div class="ph"><img src="${g.src||blobUrl(g.id)}" alt="${esc(g.cap||`Фото ${j+1}`)}" data-cap="${esc(g.cap||"")}" loading="lazy"><span class="strip-num">${j+1}</span><button type="button" class="zoom" data-j="${j}" aria-label="Открыть фото ${j+1} на весь экран">${ICON_ZOOM}</button></div>
    ${g.cap?`<figcaption>${esc(g.cap)}</figcaption>`:""}
    ${M?`<div class="row no-print" style="gap:4px;margin-top:6px"><button class="btn sm" data-lq="mvrow:${bi}:${j}:-1" ${j?"":"disabled"} aria-label="Сдвинуть влево">←</button><button class="btn sm" data-lq="mvrow:${bi}:${j}:1" ${j<imgs.length-1?"":"disabled"} aria-label="Сдвинуть вправо">→</button><button class="btn sm" data-lq="delrow:${bi}:${j}">Удалить</button></div>`:""}</figure>`).join("")}${step?`<button type="button" class="strip-more" data-smore><span class="sm-arrow">›</span><b>Следующее фото</b><span class="sm-n">2 / ${imgs.length}</span></button>`:""}</div>
  ${imgs.length>3?`<button type="button" class="strip-nav prev" data-snav="-1" aria-label="Листать влево">‹</button><button type="button" class="strip-nav next" data-snav="1" aria-label="Листать вправо">›</button>`:""}</div>`;
}
function lecBlock(b,bi,M){
  if(b.t==="h")return b.v?`<h3 class="lec-h">${esc(b.v)}</h3>`:"";
  if(b.t==="p")return textBlock(b.v);
  if(b.t==="note")return b.v?`<div class="mentor-note"><b>Важно</b><div>${textBlock(b.v)}</div></div>`:"";
  if(b.t==="img")return sliderHTML(imgsOf(b));
  if(b.t==="row")return stripHTML(imgsOf(b),bi,M===true);
  if(b.t==="link")return /^https?:\/\//.test(b.u||"")?`<p><a class="lec-link" target="_blank" rel="noopener" href="${esc(b.u)}">${esc(b.v||b.u)} ↗</a></p>`:"";
  return"";
}
function lecHTML(bl){return (bl||[]).map(b=>lecBlock(b)).join("")}
const LEC_NAME={h:"Заголовок",p:"Текст",note:"Важно",img:"Слайдер фото",row:"Лента фото",link:"Ссылка"};
function lecView(l){
  const bl=l.lec||[],M=isMentor(),up=!!P.assets;
  if(!M)return bl.length?`<div class="lec">${lecHTML(bl)}</div>`:`<p class="mut">Лекция пока не подготовлена.</p>`;
  return `<div class="lec">${bl.map((b,i)=>`<div class="lecw"><div class="lec-tools no-print"><span class="mut sm">${i+1}. ${LEC_NAME[b.t]||""}</span>
     <button class="btn edit sm" data-lq="edit:${i}">✎ Изменить</button>
     ${b.t==="row"?`<label class="btn edit sm ${up?"":"disabled"}">＋ Фото в ленту (справа)<input type="file" accept="image/*" multiple hidden data-lqadd="${i}" ${up?"":"disabled"}></label>`:""}${b.t==="img"?`<label class="btn edit sm ${up?"":"disabled"}">＋ Фото в слайдер<input type="file" accept="image/*" multiple hidden data-lqadd="${i}" ${up?"":"disabled"}></label>${imgsOf(b).length>1?`<button class="btn sm" data-lq="delimg:${i}">Удалить показанное фото</button>`:""}`:""}
     <button class="btn sm" data-lq="up:${i}" aria-label="Выше" ${i?"":"disabled"}>↑</button><button class="btn sm" data-lq="down:${i}" aria-label="Ниже" ${i<bl.length-1?"":"disabled"}>↓</button><button class="btn sm" data-lq="del:${i}">Удалить блок</button></div>
     ${lecBlock(b,i,true)||`<p class="mut">(пустой блок)</p>`}</div>`).join("")||`<p class="mut">Лекция пустая. Добавьте первый блок кнопками ниже.</p>`}</div>
  <div class="lec-add no-print"><b>Добавить в конец лекции:</b>
   <button class="btn edit" data-lq="add:h">＋ Заголовок</button><button class="btn edit" data-lq="add:p">＋ Текст</button><button class="btn edit" data-lq="add:note">＋ Важно</button>
   <label class="btn edit ${up?"":"disabled"}">＋ Слайдер фото<input type="file" accept="image/*" multiple hidden id="lqnew" ${up?"":"disabled"}></label><label class="btn edit ${up?"":"disabled"}">＋ Лента фото<input type="file" accept="image/*" multiple hidden id="lqrow" ${up?"":"disabled"}></label><button class="btn edit" data-lq="add:link">＋ Ссылка</button>
   <span class="sm" id="edup"></span></div>
  <p class="mut sm no-print"><b>Слайдер</b> — фото сменяют друг друга по кружкам. <b>Лента</b> — фото стоят рядом слева направо, новые добавляются справа. Можно выбрать сразу несколько фото. Каждое изменение сохраняется сразу.</p>`;
}
const lecSave=(l,fn)=>quickSave(l,doc=>{doc.lec=(doc.lec||[]).map(b=>b.t==="img"||b.t==="row"?{t:b.t,imgs:imgsOf(b)}:b);fn(doc.lec)});
function lecFields(b){
  if(b.t==="h")return[{label:"Заголовок",value:b.v||""}];
  if(b.t==="p"||b.t==="note")return[{label:"Текст. Строки с «- » станут списком, **так** — жирным",type:"area",rows:10,value:b.v||""}];
  if(b.t==="link")return[{label:"Текст ссылки",value:b.v||""},{label:"Адрес",value:b.u||"",ph:"https://…"}];
  if(b.t==="img"||b.t==="row")return imgsOf(b).map((g,j)=>({label:`Подпись к фото ${j+1}`,value:g.cap||""}));
  return[];
}
function lecApply(b,v){
  if(b.t==="h"||b.t==="p"||b.t==="note")b.v=v[0];
  if(b.t==="link"){chkUrl(v[1]);b.v=v[0].trim();b.u=v[1].trim()}
  if(b.t==="img"||b.t==="row")b.imgs=imgsOf(b).map((g,j)=>({id:g.id,cap:v[j]||""}));
}
async function uploadMany(files){const out=[];for(const f of files){const r=await uploadImg(f);if(r)out.push({id:r.id,cap:""})}return out}
function bindLecture(l){
  app.querySelectorAll("[data-lq]").forEach(btn=>btn.onclick=async()=>{
    const [op,arg,a2,a3]=btn.dataset.lq.split(":");const i=+arg;const cur=(l.lec||[])[i];
    try{
      if(op==="add"){const nb=arg==="link"?{t:"link",v:"",u:""}:{t:arg,v:""};modal(`Новый блок: ${LEC_NAME[arg]}`,lecFields(nb),async v=>{lecApply(nb,v);await lecSave(l,a=>a.push(nb))});return}
      if(op==="edit"){modal(`Блок ${i+1}: ${LEC_NAME[cur.t]}`,lecFields(cur),async v=>{await lecSave(l,a=>{lecApply(a[i],v)})});return}
      if(op==="up"||op==="down"){const j=op==="up"?i-1:i+1;await lecSave(l,a=>{if(j<0||j>=a.length)return;[a[i],a[j]]=[a[j],a[i]]});return}
      if(op==="del"){if(!await uiConfirm("Удалить этот блок лекции?"))return;await lecSave(l,a=>a.splice(i,1));return}
      if(op==="delrow"){const j=+a2;if(!await uiConfirm(`Удалить фото ${j+1} из ленты?`))return;await lecSave(l,a=>{a[i].imgs.splice(j,1)});return}
      if(op==="mvrow"){const j=+a2,k2=j+(+a3);await lecSave(l,a=>{const m=a[i].imgs;if(k2<0||k2>=m.length)return;[m[j],m[k2]]=[m[k2],m[j]]});return}
      if(op==="delimg"){const f=btn.closest(".lecw").querySelector(".sld");const k=+(f&&f.dataset.i||0);if(!await uiConfirm(`Удалить фото ${k+1} из слайдера?`))return;await lecSave(l,a=>{a[i].imgs.splice(k,1)});return}
    }catch(e){alert("Не сохранено: нет прав на запись (нужна роль «Редактор»).")}
  });
  app.querySelectorAll("[data-lqadd]").forEach(inp=>inp.onchange=async()=>{const i=+inp.dataset.lqadd;const add=await uploadMany(inp.files);if(!add.length)return;try{await lecSave(l,a=>{a[i].imgs=imgsOf(a[i]).concat(add)})}catch(e){alert("Не сохранено.")}});
  const rw=document.getElementById("lqrow");if(rw)rw.onchange=async()=>{const add=await uploadMany(rw.files);if(!add.length)return;try{await lecSave(l,a=>a.push({t:"row",imgs:add}))}catch(e){alert("Не сохранено.")}};
  const nw=document.getElementById("lqnew");if(nw)nw.onchange=async()=>{const add=await uploadMany(nw.files);if(!add.length)return;try{await lecSave(l,a=>a.push({t:"img",imgs:add}))}catch(e){alert("Не сохранено.")}};
}

/* ----- переключение слайдов и полноэкранный режим (для всех страниц) ----- */
function sldGo(f,i){const ims=f.querySelectorAll(".sld-view img");const n=ims.length;if(!n)return;i=((i%n)+n)%n;
  ims.forEach((im,j)=>im.classList.toggle("on",j===i));f.querySelectorAll("[data-dot]").forEach((d,j)=>{d.classList.toggle("on",j===i);if(j===i)d.setAttribute("aria-current","true");else d.removeAttribute("aria-current")});
  f.dataset.i=i;const c=f.querySelector("figcaption");if(c)c.textContent=ims[i].dataset.cap||"";const s=f.querySelector(".sld-n");if(s)s.textContent=`${i+1} / ${n}`}
function sldFull(f,on){if(!on&&f.dataset.tmp){f.remove();document.body.classList.remove("noscroll");return}f.classList.toggle("full",on);document.body.classList.toggle("noscroll",on);const z=f.querySelector(".zoom");if(z)z.setAttribute("aria-label",on?"Свернуть фото":"Открыть фото на весь экран")}
function stripMore(strip){const h=strip.querySelector(".strip-item.hid");if(!h)return;h.classList.remove("hid");h.classList.add("appear");
  const left=strip.querySelectorAll(".strip-item.hid").length,tot=strip.querySelectorAll(".strip-item").length,b=strip.querySelector("[data-smore]");
  if(b){if(!left){b.remove();strip.dataset.all="1"}else b.querySelector(".sm-n").textContent=`${tot-left+1} / ${tot}`}
  const tr=strip.querySelector(".strip-track");tr.scrollTo({left:Math.max(0,h.offsetLeft+h.offsetWidth+(left&&b?b.offsetWidth+12:0)-tr.clientWidth),behavior:"smooth"})}
function openViewer(strip,j){const items=[...strip.querySelectorAll(".strip-item:not(.hid) img")].map(im=>({src:im.getAttribute("src"),cap:im.dataset.cap||""}));const w=document.createElement("div");w.innerHTML=sliderHTML(items);const f=w.firstElementChild;f.dataset.tmp="1";document.body.appendChild(f);sldGo(f,j);sldFull(f,true);const z=f.querySelector(".zoom");if(z)z.focus()}
document.addEventListener("click",e=>{
  const sall=e.target.closest("[data-sall]");if(sall){const s=sall.closest(".strip");while(s.querySelector(".strip-item.hid"))stripMore(s);sall.remove();return}
  const smb=e.target.closest("[data-smore]");if(smb){stripMore(smb.closest(".strip"));return}
  const sim=e.target.closest(".strip-item .ph img");if(sim){const s=sim.closest(".strip");if(s.querySelector(".strip-item.hid")){stripMore(s);return}}
  const sz=e.target.closest(".strip .zoom");if(sz){openViewer(sz.closest(".strip"),+sz.dataset.j);return}
  const sn=e.target.closest("[data-snav]");if(sn){const tr=sn.closest(".strip").querySelector(".strip-track");const it=tr.querySelector(".strip-item");tr.scrollBy({left:(+sn.dataset.snav)*((it?it.offsetWidth:300)+12),behavior:"smooth"});return}
  const dot=e.target.closest("[data-dot]");if(dot){sldGo(dot.closest(".sld"),+dot.dataset.dot);return}
  const z=e.target.closest(".zoom");if(z){const f=z.closest(".sld");sldFull(f,!f.classList.contains("full"));return}
  const im=e.target.closest(".sld.full .sld-view img");if(im){sldFull(im.closest(".sld"),false)}
});
document.addEventListener("keydown",e=>{const f=document.querySelector(".sld.full");if(!f)return;if(e.key==="Escape")sldFull(f,false);if(e.key==="ArrowRight")sldGo(f,+f.dataset.i+1);if(e.key==="ArrowLeft")sldGo(f,+f.dataset.i-1)});
let sldTouch=null;
document.addEventListener("touchstart",e=>{const v=e.target.closest(".sld-view");if(v&&e.touches.length===1)sldTouch={v,x:e.touches[0].clientX}},{passive:true});
document.addEventListener("touchend",e=>{if(!sldTouch)return;const dx=e.changedTouches[0].clientX-sldTouch.x;const f=sldTouch.v.closest(".sld");sldTouch=null;if(Math.abs(dx)>40)sldGo(f,+f.dataset.i+(dx<0?1:-1))},{passive:true});
