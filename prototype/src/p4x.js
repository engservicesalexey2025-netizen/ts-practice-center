/* ----- редактор урока ----- */
const ETABS=[["main","Основное"],["lec","Лекция"],["defect","Найди дефект (упражнения)"],["links","Видео, ссылки, фото"],["check","Чек-лист"],["norms","Норматив РК"],["ok","Эталон «Посмотри»"],["des","Замечание DES"],["quiz","Блиц-тест"]];
function edStart(id,sec){
  if(id){const l=ALL.find(x=>x.id===id);if(!l)return false;ED=clone(l)}
  else{const nums=ALL.filter(x=>x.s===sec).map(x=>parseInt(x.id.replace(/^\D+/,""))||0);ED={id:sec+(Math.max(0,...nums)+1),s:sec,t:"",sc:"conc",kw:"",d:[],c:[],p:"",n:[],ok:[],a:"",notes:"",vids:[],gal:[],photo:null,okPhoto:null,hidden:false,isNew:true}}
  ["vids","gal","lnk","lec","qz"].forEach(k=>{ED[k]=ED[k]||[]});ED.ex=ED.ex||[];ED.exi=typeof PENDING_EXI==="number"?Math.min(PENDING_EXI,ED.ex.length):0;PENDING_EXI=null;ED.qz=(ED.qz||[]).map(normQ);ED.desex=Object.assign({},ED.desex||{});if(ED.qauto===undefined)ED.qauto=!ED.qz.length;ED.lec=ED.lec.map(b=>b.t==="img"||b.t==="row"?{t:b.t,imgs:imgsOf(b)}:b);ED.notes=ED.notes||"";if(ED.auto===undefined)ED.auto=true;ED.dtype=ED.dtype||"stain";ED._ch=false;return true;
}
const lines=a=>a.join("\n");
const normToLine=n=>[nm(n[0])[0],n[1],n[2]].join(" | ");
function parseNorm(s){const p=s.split("|").map(x=>x.trim());if(!p[0])return null;const key=Object.keys(N).find(k=>k===p[0]||N[k][0]===p[0])||p[0];return[key,p[1]||"",p[2]||""]}
const parseLinks=t=>t.split("\n").map(x=>x.trim()).filter(Boolean).map(x=>{const p=x.split("|").map(y=>y.trim());return p.length>1?[p[0],p.slice(1).join("|").trim()]:["",p[0]]});
const linkLines=a=>(a||[]).map(v=>v[0]?`${v[0]} | ${v[1]}`:v[1]).join("\n");
const ZONES=[[0.6,"Малая"],[1,"Средняя"],[1.6,"Большая"]];

function TG(){return ED.exi>0&&ED.ex[ED.exi-1]?ED.ex[ED.exi-1]:ED}
function editorPage(tab){
  const l=ED,up=!!P.assets;tab=ETABS.some(t=>t[0]===tab)?tab:"main";
  const t={};
  t.main=`<div class="form">
   <label>Название урока<input class="inp" data-e="t" value="${esc(l.t)}"></label>
   <label>Что смотреть в проекте<input class="inp" data-e="p" value="${esc(l.p)}" placeholder="АР — узел примыкания, лист…"></label>
   <label>Ключевые слова для автоматических подборок видео и фото<input class="inp" data-e="kw" value="${esc(l.kw)}" placeholder="например: монтаж оконного блока ПВХ"></label>
   <label>Наставник: на что обратить внимание (блок «Посмотри»). Строки, начинающиеся с «- », станут списком; **текст** — жирным<textarea class="inp" rows="6" data-e="notes">${esc(l.notes)}</textarea></label>
   <label class="row"><input type="checkbox" data-b="hidden" ${l.hidden?"checked":""}> Скрыть урок от абитуриентов</label></div>`;
  t.lec=`<p class="mut sm">Лекция показывается абитуриенту отдельным разделом урока сразу после «Посмотри». Добавляйте блоки в нужном порядке.</p>
   <div id="leclist">${l.lec.map((b,i)=>`<div class="lecb"><div class="row" style="justify-content:space-between"><b>${{h:"Заголовок",p:"Текст",note:"Важно",img:"Слайдер фото",row:"Лента фото (слева направо)",link:"Ссылка"}[b.t]}</b><span class="row"><button class="btn" data-lmv="${i}:-1" aria-label="Выше">↑</button><button class="btn" data-lmv="${i}:1" aria-label="Ниже">↓</button><button class="btn" data-ldel="${i}">Удалить</button></span></div>
     ${b.t==="h"?`<input class="inp" data-lb="${i}" data-lk="v" value="${esc(b.v||"")}" placeholder="Заголовок раздела">`:""}
     ${b.t==="p"||b.t==="note"?`<textarea class="inp" rows="${b.t==="p"?6:3}" data-lb="${i}" data-lk="v" placeholder="Текст. Строки с «- » станут списком, **так** — жирный">${esc(b.v||"")}</textarea>`:""}
     ${b.t==="img"||b.t==="row"?`<div class="gal">${imgsOf(b).map((g,j)=>`<figure><img src="${blobUrl(g.id)}" alt=""><input class="inp" data-lbi="${i}:${j}" value="${esc(g.cap||"")}" placeholder="Подпись к фото ${j+1}"><button class="btn sm" data-lbd="${i}:${j}">Удалить фото</button></figure>`).join("")}</div><label class="btn ${up?"":"disabled"}" style="justify-self:start">＋ Фото в этот блок<input type="file" accept="image/*" multiple hidden data-lba="${i}" ${up?"":"disabled"}></label>`:""}
     ${b.t==="link"?`<div class="form"><input class="inp" data-lb="${i}" data-lk="v" value="${esc(b.v||"")}" placeholder="Текст ссылки"><input class="inp" data-lb="${i}" data-lk="u" value="${esc(b.u||"")}" placeholder="https://…"></div>`:""}</div>`).join("")||`<p class="mut">Лекция пустая.</p>`}</div>
   <div class="row" style="margin-top:10px"><button class="btn" data-ladd="h">＋ Заголовок</button><button class="btn" data-ladd="p">＋ Текст</button><button class="btn" data-ladd="note">＋ Важно</button><label class="btn ${up?"":"disabled"}">＋ Слайдер фото<input type="file" accept="image/*" multiple hidden id="lecimg" ${up?"":"disabled"}></label><label class="btn ${up?"":"disabled"}">＋ Лента фото<input type="file" accept="image/*" multiple hidden id="lecrow" ${up?"":"disabled"}></label><button class="btn" data-ladd="link">＋ Ссылка</button></div>
   <details style="margin-top:14px"><summary>Предпросмотр лекции</summary><div class="lec blk">${lecHTML(l.lec)||"<p class='mut'>Пусто</p>"}</div></details>`;
  t.defect=`<div class="extabs">${[{t:ED.et||"Упражнение 1"},...ED.ex].map((e,k)=>`<button type="button" class="${k===ED.exi?"on":""}" data-exsel="${k}">${k+1}. ${esc(e.t||`Упражнение ${k+1}`)} (${(k?e.d:ED.d).length})</button>`).join("")}<button type="button" class="btn edit sm" data-exnew>＋ Упражнение</button></div>
   <div class="row" style="margin:8px 0 12px"><label style="flex:1">Название упражнения <input class="inp" data-ext value="${esc(ED.exi?TG().t||"":ED.et||"")}" placeholder="Упражнение ${ED.exi+1}" style="width:100%"></label>${ED.exi?`<button class="btn" data-exdel2>Удалить упражнение</button>`:""}</div>
   <div class="row" style="margin-bottom:10px">
    <label class="btn ${up?"":"disabled"}">${TG().photo?"Заменить фото":"Заменить схему на фото с объекта"}<input type="file" accept="image/*" hidden id="edph" ${up?"":"disabled"}></label>
    ${TG().photo?`<button class="btn" id="edphdel">Вернуться к учебной схеме</button>`:`<label>Схема: <select class="inp" id="edsc">${Object.keys(SCN).map(k=>`<option value="${k}" ${TG().sc===k?"selected":""}>${SCN[k]}</option>`).join("")}</select></label>
    <label>Рисунок новой отметки: <select class="inp" id="edtype">${Object.keys(DFN).map(k=>`<option value="${k}" ${l.dtype===k?"selected":""}>${DFN[k]}</option>`).join("")}</select></label>`}</div>
   <p class="mut sm"><b>Щелчок по пустому месту</b> — новая отметка дефекта. <b>Перетащите номер</b>, чтобы сдвинуть отметку. Пунктирный круг — зона, куда должен попасть абитуриент. ${TG().photo?"Абитуриент увидит фото без отметок.":"На схеме дефект рисуется в месте отметки."}</p>
   <div id="edcanvas"></div><div class="res hidden" id="edup"></div>`;
  t.links=`<div class="form">
   <label>Видео «Обязательно к просмотру» — по одному на строку: Название | ссылка<textarea class="inp" rows="4" data-ln="vids" placeholder="Монтаж окна по ГОСТ 30971 | https://www.youtube.com/watch?v=…">${esc(linkLines(l.vids))}</textarea></label>
   <label>Ссылки для обзора в блоке «Посмотри» (фото, статьи, документы): Название | ссылка<textarea class="inp" rows="4" data-ln="lnk" placeholder="Альбом узлов производителя | https://…">${esc(linkLines(l.lnk))}</textarea></label>
   <label class="row"><input type="checkbox" data-b="auto" ${l.auto!==false?"checked":""}> Показывать автоматические подборки (поиск YouTube, Rutube, Яндекс по ключевым словам)</label></div>
   <h3 style="font-size:15px;margin:16px 0 8px">Фото-примеры с объектов (блок «Посмотри»)</h3>
   <label class="btn ${up?"":"disabled"}">＋ Добавить фото<input type="file" accept="image/*" multiple hidden id="edgal" ${up?"":"disabled"}></label>
   <div class="gal" id="edgallist" style="margin-top:10px">${l.gal.map((g,i)=>`<figure><img src="${blobUrl(g.id)}" alt=""><input class="inp" data-gi="${i}" value="${esc(g.cap||"")}" placeholder="Подпись к фото"><button class="btn" data-gdel="${i}">Удалить</button></figure>`).join("")}</div>`;
  t.check=`<label class="form">Что проверяет ТН — по шагу на строку<textarea class="inp" rows="10" data-l="c">${esc(lines(l.c))}</textarea></label>`;
  t.norms=`<p class="mut sm">Каждая строка — один документ. Можно выбрать из нормативной базы или вписать свой документ.</p>
   <datalist id="ndocs">${Object.keys(N).filter(k=>k!=="PRJ").map(k=>`<option value="${esc(N[k][0])}">${esc(N[k][1])}</option>`).join("")}</datalist>
   <div class="nrows"><div class="nrow nhead"><span>Документ</span><span>Пункт / раздел</span><span>Требование</span><span></span></div>
   ${l.n.map((n,j)=>n[0]==="PRJ"?"":`<div class="nrow"><input class="inp" list="ndocs" data-nn="${j}:0" value="${esc(nm(n[0])[0])}" placeholder="СП РК …"><input class="inp" data-nn="${j}:1" value="${esc(n[1]||"")}" placeholder="п. 5.3 / табл. 2"><textarea class="inp" rows="2" data-nn="${j}:2" placeholder="Текст требования">${esc(n[2]||"")}</textarea><button class="btn sm" data-ndel="${j}">Удалить</button></div>`).join("")}</div>
   <button class="btn edit" data-nadd style="margin-top:10px">＋ Норматив</button>`;
  t.ok=`<div class="row" style="margin-bottom:10px"><label class="btn ${up?"":"disabled"}">${l.okPhoto?"Заменить эталонное фото":"Загрузить эталонное фото «правильно»"}<input type="file" accept="image/*" hidden id="edok" ${up?"":"disabled"}></label>${l.okPhoto?`<button class="btn" id="edokdel">Убрать эталонное фото</button>`:""}</div>
   ${l.okPhoto?`<img class="scn" style="max-width:420px" src="${blobUrl(l.okPhoto.id)}" alt="Эталон">`:`<p class="mut sm">Без эталонного фото показывается учебная схема.</p>`}
   <label class="form" style="margin-top:12px">Признаки правильного выполнения — по одному на строку (нужно не меньше трёх для теста)<textarea class="inp" rows="6" data-l="ok">${esc(lines(l.ok))}</textarea></label>`;
  const DQ=ED.desq;
  t.des=`<h3 style="font-size:16px;margin-bottom:8px">Примеры для полей привязки</h3><div class="pgrid2">
   ${[["obj","Проект / объект"],["blk","Блок"],["ax","Ось"],["lvl","Этаж (отметка)"]].map(([k,lb])=>`<label class="pf"><span>${lb}</span><input class="inp" data-dx="${k}" value="${esc((ED.desex||{})[k]||"")}" placeholder="${esc(DES_EX_DEF[k])}"></label>`).join("")}</div>
   <label class="form" style="margin-top:14px">Эталон «Действия» для текста DES<textarea class="inp" rows="3" data-e="a">${esc(l.a)}</textarea></label>
   <h3 style="font-size:16px;margin:18px 0 6px">Варианты ответов в замечании</h3>
   ${DQ?`<p class="mut sm">Отметьте галочкой верные варианты. Абитуриенту варианты показываются вперемешку.</p>${DES_G.map(([g,title,multi])=>`<div class="dqe"><h4>${title}</h4>${(DQ[g]||[]).map((o,j)=>`<div class="row dqrow"><label class="row sm" style="gap:4px"><input type="${multi?"checkbox":"radio"}" name="dqok_${g}" data-dqc="${g}:${j}" ${o[1]?"checked":""}> верный</label><textarea class="inp" rows="1" data-dqt="${g}:${j}" style="flex:1">${esc(o[0]||"")}</textarea><button class="btn sm" data-dqd="${g}:${j}">Удалить</button></div>`).join("")}<button class="btn edit sm" data-dqa="${g}">＋ Вариант</button></div>`).join("")}
     <button class="btn sm" data-dqoff style="margin-top:10px">Вернуть автоматические варианты</button>`
   :`<p class="mut sm">Сейчас варианты создаются автоматически из дефектов, нормативов и действий урока (плюс ложные варианты из других уроков).</p><button class="btn edit" data-dqon>✎ Заполнить и редактировать вручную</button>`}
   <p class="mut sm" style="margin-top:14px">Предпросмотр эталонного замечания:</p><div class="des-pre" id="edes">${desText(l,{},l.d.map(()=>true))}</div>`;
  t.quiz=`<p class="mut sm">Напишите вопросы и варианты ответов, отметьте правильный кружком. При прохождении программа сравнит ответ абитуриента с отмеченным вами — засчитывается только правильный.</p>
   <label class="row" style="margin:6px 0 12px"><input type="checkbox" data-b="qauto" ${ED.qauto?"checked":""}> Дополнять тест автоматическими вопросами, если моих вопросов меньше 5</label>
   <div id="qzlist">${ED.qz.map((q,i)=>`<div class="lecb"><div class="row" style="justify-content:space-between"><b>Вопрос ${i+1}</b><button class="btn sm" data-qdel="${i}">Удалить вопрос</button></div>
     <textarea class="inp" rows="2" data-qq="${i}" placeholder="Текст вопроса">${esc(q.q)}</textarea>
     ${q.opts.map((o,j)=>`<div class="row qopt"><label class="row sm" style="gap:4px"><input type="radio" name="qok_${i}" data-qok="${i}:${j}" ${q.ok===j?"checked":""}> правильный</label><input class="inp" style="flex:1" data-qo="${i}:${j}" value="${esc(o)}" placeholder="Вариант ответа ${j+1}">${q.opts.length>2?`<button class="btn sm" data-qodel="${i}:${j}" aria-label="Удалить вариант">✕</button>`:""}</div>`).join("")}
     <button class="btn sm" data-qoadd="${i}">＋ Вариант ответа</button></div>`).join("")||`<p class="mut">Своих вопросов пока нет — тест создаётся автоматически.</p>`}</div>
   <button class="btn edit" id="qzadd" style="margin-top:10px">＋ Добавить вопрос</button>`;
  return `<div class="crumbs"><a href="#/mentor">Кабинет наставника</a> / ${l.isNew?"Новый урок":"Редактирование"} ${l.id}</div>
  <h1 style="font-size:clamp(22px,3.5vw,30px);margin-bottom:12px">${l.isNew?"Новый урок":"Урок"} ${l.id}${l.t?": "+esc(l.t):""}</h1>
  ${up?"":`<p class="note">Загрузка фото доступна только наставникам с ролью «Редактор» в опубликованной версии.</p>`}
  <nav class="mtabs">${ETABS.map(x=>`<a href="#/mentor/edit/${l.id}/${x[0]}" class="${x[0]===tab?"on":""}">${x[1]}</a>`).join("")}</nav>
  <div class="blk">${t[tab]}</div>
  <div class="row edbar no-print"><button class="btn pri" id="edsave">Сохранить урок</button>${l.isNew?"":`<a class="btn" href="#/l/${l.id}">Посмотреть урок</a>`}${l.base&&l.edited?`<button class="btn" id="edrev">Вернуть базовую версию</button>`:""}<a class="btn" href="#/mentor">К списку уроков</a><span class="sm" id="edmsg">${l._ch?"Есть несохранённые изменения":esc(FLASH)}</span></div>`;
}
function mark(){ED._ch=true;dirty=true;const m=document.getElementById("edmsg");if(m)m.textContent="Есть несохранённые изменения"}
function edCanvas(){
  const l=TG(),box=document.getElementById("edcanvas");if(!box)return;const g=geo(l),k=g.k;
  const marks=l.d.map((d,i)=>`<g data-di="${i}" transform="translate(${d[1]} ${d[2]})" style="cursor:grab"><circle r="${d[5]||52*k}" class="zone"/><circle r="${16*k}" fill="#D23A2E" stroke="#fff" stroke-width="${3*k}"/><text y="${5*k}" text-anchor="middle" fill="#fff" style="font:700 ${14*k}px var(--fb)">${i+1}</text></g>`).join("");
  box.innerHTML=`<div class="grid2"><div class="task-wrap" style="cursor:crosshair">${svgOf(l,"task","edsvg").replace("</svg>",marks+"</svg>")}</div>
   <div><ol class="dlist" style="margin-top:0">${l.d.map((d,i)=>`<li><div class="form"><input class="inp" data-dn="${i}" value="${esc(d[3])}" placeholder="Название дефекта"><textarea class="inp" rows="2" data-dw="${i}" placeholder="Почему это нарушение">${esc(d[4])}</textarea>
   <label class="row sm">Зона попадания <select class="inp" data-dz="${i}">${ZONES.map(z=>`<option value="${z[0]}" ${Math.abs((d[5]||52*k)/(52*k)-z[0])<.05?"selected":""}>${z[1]}</option>`).join("")}</select>${l.photo?"":`<select class="inp" data-dt="${i}">${Object.keys(DFN).map(t=>`<option value="${t}" ${d[0]===t?"selected":""}>${DFN[t]}</option>`).join("")}</select>`}</label></div>
   <button class="btn" data-ddel="${i}" style="margin-top:6px">Удалить отметку</button></li>`).join("")||`<p class="mut">Отметок пока нет. Щёлкните по ${l.photo?"фото":"схеме"} в месте дефекта.</p>`}</ol></div></div>`;
  const svg=document.getElementById("edsvg");let drag=null,moved=false;
  svg.addEventListener("pointerdown",e=>{const m=e.target.closest("[data-di]");if(!m)return;e.preventDefault();drag={i:+m.dataset.di,el:m};moved=false;try{svg.setPointerCapture(e.pointerId)}catch(er){}m.style.cursor="grabbing"});
  svg.addEventListener("pointermove",e=>{if(!drag)return;const p=svgPt(svg,e);const d=l.d[drag.i];d[1]=Math.round(Math.max(0,Math.min(g.W,p.x)));d[2]=Math.round(Math.max(0,Math.min(g.H,p.y)));drag.el.setAttribute("transform",`translate(${d[1]} ${d[2]})`);moved=true});
  svg.addEventListener("pointerup",()=>{if(!drag)return;const was=moved;drag=null;if(was){mark();setTimeout(edCanvas,0)}});
  svg.addEventListener("click",e=>{if(moved){moved=false;return}if(e.target.closest("[data-di]"))return;const p=svgPt(svg,e);l.d.push([l.photo?"pt":(ED.dtype||"stain"),Math.round(p.x),Math.round(p.y),"",""]);mark();edCanvas();const inp=box.querySelector(`[data-dn="${l.d.length-1}"]`);if(inp)inp.focus()});
}
function dataUrlToBlob(u){const [h,b]=u.split(",");const bin=atob(b);const a=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)a[i]=bin.charCodeAt(i);return new Blob([a],{type:(h.match(/data:([^;]+)/)||[,"image/jpeg"])[1]})}
function shrink(f,max=1600){return new Promise(res=>{const fr=new FileReader();fr.onload=()=>{const im=new Image();im.onload=()=>{const s=Math.min(1,max/Math.max(im.width,im.height));const c=document.createElement("canvas");c.width=Math.round(im.width*s);c.height=Math.round(im.height*s);c.getContext("2d").drawImage(im,0,0,c.width,c.height);res({url:c.toDataURL("image/jpeg",.84),w:c.width,h:c.height})};im.onerror=()=>res(null);im.src=fr.result};fr.onerror=()=>res(null);fr.readAsDataURL(f)})}
async function uploadImg(f){
  const m=document.getElementById("edup")||document.getElementById("edmsg");if(m){m.classList.remove("hidden");m.textContent="Загружаю фото…"}
  const s=await shrink(f);if(!s){if(m)m.textContent="Не удалось прочитать файл — выберите JPG или PNG.";return null}
  try{const r=await P.assets.upload(dataUrlToBlob(s.url));if(m){m.textContent="Фото загружено";if(m.id==="edup")m.classList.add("hidden")}return{id:r.id,w:s.w,h:s.h}}
  catch(e){const t={too_large:"Файл слишком большой.",unsupported_type:"Этот формат не поддерживается.",quota_or_state:"Хранилище фото заполнено — удалите ненужные фото.",rate_limited:"Слишком много загрузок подряд — подождите минуту."}[e&&e.code]||"Фото не загрузилось. Попробуйте ещё раз.";if(m){m.classList.remove("hidden");m.textContent=t}else alert(t);return null}
}
function rescale(oldG,newG){TG().d.forEach(d=>{d[1]=Math.round(d[1]*newG.W/oldG.W);d[2]=Math.round(d[2]*newG.H/oldG.H);if(d[5])d[5]=Math.round(d[5]*newG.k/oldG.k)})}
function bindEditor(tab){
  if(tab==="defect")edCanvas();
  const on=(sel,ev,fn)=>app.querySelectorAll(sel).forEach(el=>el.addEventListener(ev,fn));
  on("[data-e]","input",e=>{ED[e.target.dataset.e]=e.target.value;mark();const p=document.getElementById("edes");if(p)p.innerHTML=desText(ED,{},ED.d.map(()=>true))});
  on("[data-b]","change",e=>{ED[e.target.dataset.b]=e.target.checked;mark()});
  on("[data-l]","input",e=>{const ls=e.target.value.split("\n").map(x=>x.trim()).filter(Boolean);const k=e.target.dataset.l;ED[k]=k==="n"?ls.map(parseNorm).filter(Boolean):ls;mark()});
  on("[data-ln]","input",e=>{ED[e.target.dataset.ln]=parseLinks(e.target.value);mark()});
  const box=document.getElementById("edcanvas");
  if(box){box.addEventListener("input",e=>{const t=e.target;if(t.dataset.dn!=null)TG().d[+t.dataset.dn][3]=t.value;if(t.dataset.dw!=null)TG().d[+t.dataset.dw][4]=t.value;mark()});
    box.addEventListener("change",e=>{const t=e.target,k=geo(TG()).k;if(t.dataset.dz!=null){TG().d[+t.dataset.dz][5]=Math.round(52*k*+t.value);mark();edCanvas()}if(t.dataset.dt!=null){TG().d[+t.dataset.dt][0]=t.value;mark();edCanvas()}});
    box.addEventListener("click",e=>{const t=e.target;if(t.dataset.ddel!=null){TG().d.splice(+t.dataset.ddel,1);mark();edCanvas()}});}
  app.querySelectorAll("[data-exsel]").forEach(b=>b.onclick=()=>{ED.exi=+b.dataset.exsel;render()});
  const exn=app.querySelector("[data-exnew]");if(exn)exn.onclick=()=>{ED.ex.push({t:`Упражнение ${ED.ex.length+2}`,sc:"conc",d:[],photo:null});ED.exi=ED.ex.length;mark();render()};
  const ext=app.querySelector("[data-ext]");if(ext)ext.oninput=()=>{if(ED.exi)TG().t=ext.value;else ED.et=ext.value;mark()};
  const exd=app.querySelector("[data-exdel2]");if(exd)exd.onclick=async()=>{if(!await uiConfirm(`Удалить упражнение ${ED.exi+1} вместе с фото и отметками?`))return;ED.ex.splice(ED.exi-1,1);ED.exi=0;mark();render()};
  const sc=document.getElementById("edsc");if(sc)sc.onchange=()=>{TG().sc=sc.value;mark();edCanvas()};
  const ty=document.getElementById("edtype");if(ty)ty.onchange=()=>{ED.dtype=ty.value};
  const ph=document.getElementById("edph");if(ph)ph.onchange=async()=>{const f=ph.files[0];if(!f)return;const r=await uploadImg(f);if(!r)return;const og=geo(TG());TG().photo=r;rescale(og,geo(TG()));mark();render()};
  const phd=document.getElementById("edphdel");if(phd)phd.onclick=async()=>{if(!await uiConfirm("Вернуться к учебной схеме? Отметки сохранятся, проверьте их расположение."))return;const og=geo(TG());TG().photo=null;rescale(og,geo(TG()));mark();render()};
  const ok=document.getElementById("edok");if(ok)ok.onchange=async()=>{const f=ok.files[0];if(!f)return;const r=await uploadImg(f);if(r){ED.okPhoto=r;mark();render()}};
  const okd=document.getElementById("edokdel");if(okd)okd.onclick=()=>{ED.okPhoto=null;mark();render()};
  const gal=document.getElementById("edgal");if(gal)gal.onchange=async()=>{for(const f of gal.files){const r=await uploadImg(f);if(r)ED.gal.push({id:r.id,cap:""})}mark();render()};
  const gl=document.getElementById("edgallist");if(gl){gl.addEventListener("input",e=>{if(e.target.dataset.gi!=null){ED.gal[+e.target.dataset.gi].cap=e.target.value;mark()}});gl.addEventListener("click",e=>{if(e.target.dataset.gdel!=null){ED.gal.splice(+e.target.dataset.gdel,1);mark();render()}})}
  // лекция
  on("[data-ladd]","click",e=>{const t=e.target.dataset.ladd;ED.lec.push(t==="link"?{t,v:"",u:""}:{t,v:""});mark();render()});
  on("[data-lb]","input",e=>{ED.lec[+e.target.dataset.lb][e.target.dataset.lk]=e.target.value;mark()});
  on("[data-ldel]","click",async e=>{if(!await uiConfirm("Удалить блок лекции?"))return;ED.lec.splice(+e.target.dataset.ldel,1);mark();render()});
  on("[data-lmv]","click",e=>{const [i,dl]=e.target.dataset.lmv.split(":").map(Number);const j=i+dl;if(j<0||j>=ED.lec.length)return;[ED.lec[i],ED.lec[j]]=[ED.lec[j],ED.lec[i]];mark();render()});
  const li=document.getElementById("lecimg");if(li)li.onchange=async()=>{const add=await uploadMany(li.files);if(add.length){ED.lec.push({t:"img",imgs:add});mark();render()}};
  const lr=document.getElementById("lecrow");if(lr)lr.onchange=async()=>{const add=await uploadMany(lr.files);if(add.length){ED.lec.push({t:"row",imgs:add});mark();render()}};
  on("[data-lbi]","input",e=>{const [i,j]=e.target.dataset.lbi.split(":").map(Number);ED.lec[i].imgs[j].cap=e.target.value;mark()});
  on("[data-lbd]","click",e=>{const [i,j]=e.target.dataset.lbd.split(":").map(Number);ED.lec[i].imgs.splice(j,1);mark();render()});
  app.querySelectorAll("[data-lba]").forEach(inp=>inp.onchange=async()=>{const i=+inp.dataset.lba;const add=await uploadMany(inp.files);if(add.length){ED.lec[i].imgs=ED.lec[i].imgs.concat(add);mark();render()}});
  // вопросы
  // нормативы
  on("[data-nn]","input",e=>{const [j,c]=e.target.dataset.nn.split(":").map(Number);const v=e.target.value;if(c===0){const key=Object.keys(N).find(k=>N[k][0]===v.trim());ED.n[j][0]=key||v}else ED.n[j][c]=v;mark()});
  on("[data-ndel]","click",e=>{ED.n.splice(+e.target.dataset.ndel,1);mark();render()});
  on("[data-nadd]","click",()=>{ED.n.push(["","",""]);mark();render()});
  // DES
  on("[data-dx]","input",e=>{ED.desex=Object.assign({},ED.desex,{[e.target.dataset.dx]:e.target.value});mark()});
  on("[data-dqon]","click",()=>{const A=desAuto(ED,0);ED.desq={};DES_G.forEach(([g])=>{ED.desq[g]=A[g].map(o=>[o[0],o[1]])});mark();render()});
  on("[data-dqoff]","click",async()=>{if(!await uiConfirm("Вернуть автоматические варианты? Ваши ручные варианты будут удалены."))return;ED.desq=null;mark();render()});
  on("[data-dqt]","input",e=>{const [g,j]=e.target.dataset.dqt.split(":");ED.desq[g][+j][0]=e.target.value;mark()});
  on("[data-dqc]","change",e=>{const [g,j]=e.target.dataset.dqc.split(":");if(e.target.type==="radio")ED.desq[g].forEach((o,k)=>o[1]=k===+j?1:0);else ED.desq[g][+j][1]=e.target.checked?1:0;mark()});
  on("[data-dqd]","click",e=>{const [g,j]=e.target.dataset.dqd.split(":");ED.desq[g].splice(+j,1);mark();render()});
  on("[data-dqa]","click",e=>{const g=e.target.dataset.dqa;(ED.desq[g]=ED.desq[g]||[]).push(["",0]);mark();render()});
  // блиц-тест
  const qa=document.getElementById("qzadd");if(qa)qa.onclick=()=>{if(!ED.qz.length)ED.qauto=false;ED.qz.push({q:"",opts:["","","",""],ok:0});mark();render()};
  on("[data-qq]","input",e=>{ED.qz[+e.target.dataset.qq].q=e.target.value;mark()});
  on("[data-qo]","input",e=>{const [i,j]=e.target.dataset.qo.split(":").map(Number);ED.qz[i].opts[j]=e.target.value;mark()});
  on("[data-qok]","change",e=>{const [i,j]=e.target.dataset.qok.split(":").map(Number);ED.qz[i].ok=j;mark()});
  on("[data-qodel]","click",e=>{const [i,j]=e.target.dataset.qodel.split(":").map(Number);const q=ED.qz[i];q.opts.splice(j,1);if(q.ok===j)q.ok=0;else if(q.ok>j)q.ok--;mark();render()});
  on("[data-qoadd]","click",e=>{ED.qz[+e.target.dataset.qoadd].opts.push("");mark();render()});
  on("[data-qdel]","click",async e=>{const i=+e.target.dataset.qdel;if(!await uiConfirm(`Удалить вопрос ${i+1}?`))return;ED.qz.splice(i,1);mark();render()});
  document.getElementById("edsave").onclick=edSave;
  const rv=document.getElementById("edrev");if(rv)rv.onclick=async()=>{if(!await uiConfirm("Удалить все изменения наставника и вернуть исходную версию урока?"))return;try{await P.db.doc("cms/main/lessons/"+ED.id).delete();ED=null;FLASH="Урок возвращён к базовой версии.";location.hash="#/mentor"}catch(e){alert("Не удалось: нет прав на запись.")}};
}
async function edSave(){
  const msg=document.getElementById("edmsg");
  if(!ED.t.trim()){alert("Введите название урока (вкладка «Основное»).");return}
  const exs=[ED.d,...ED.ex.map(e=>e.d)];for(let q=0;q<exs.length;q++){const bad=exs[q].findIndex(d=>!d[3].trim());if(bad>=0){alert(`Упражнение ${q+1}: заполните название дефекта № ${bad+1} (вкладка «Найди дефект»).`);ED.exi=q;return}}
  const badL=[...ED.vids,...ED.lnk].find(v=>v[1]&&!/^https?:\/\//.test(v[1]));if(badL){alert(`Ссылка должна начинаться с http:// или https:// — проверьте: ${badL[1]}`);return}
  const badQ=ED.qz.findIndex(q=>(q.q.trim()||q.opts.some(o=>String(o).trim()))&&!validQ(q));if(badQ>=0){alert(`Вопрос ${badQ+1}: нужен текст вопроса, минимум два варианта ответа и отмеченный правильный вариант.`);return}
  if(ED.desq){const g=DES_G.find(([g])=>!(ED.desq[g]||[]).some(o=>o[1]&&String(o[0]).trim()));if(g){alert(`В замечании DES, поле «${g[1].split(":")[0]}»: отметьте хотя бы один верный вариант.`);return}}
  ED.n=ED.n.filter(n=>String(n[0]).trim());
  const out={ex:ED.ex.map(e=>({t:e.t||"",sc:e.sc||"conc",d:e.d||[],photo:e.photo||null})),et:ED.et||"",id:ED.id,t:ED.t.trim(),sc:ED.sc||"conc",kw:ED.kw||ED.t,d:ED.d,c:ED.c,p:ED.p,n:ED.n,ok:ED.ok,a:ED.a,notes:ED.notes,vids:ED.vids.filter(validLink),lnk:ED.lnk.filter(validLink),auto:ED.auto!==false,gal:ED.gal,lec:ED.lec,qz:ED.qz.map(normQ).filter(validQ),qauto:!!ED.qauto,desq:ED.desq?Object.fromEntries(DES_G.map(([g])=>[g,(ED.desq[g]||[]).filter(o=>String(o[0]).trim())])):null,desex:ED.desex||{},photo:ED.photo||null,okPhoto:ED.okPhoto||null,hidden:!!ED.hidden,upd:now(),by:P.uid||""};
  msg.textContent="Сохраняю…";
  try{await P.db.doc("cms/main/lessons/"+ED.id).set(clone(out));FLASH="Урок сохранён "+new Date().toLocaleTimeString("ru-RU")+" — изменения уже видны абитуриентам.";ED._ch=false;dirty=false;ED.isNew=false;ED.edited=true;msg.textContent=FLASH}
  catch(e){msg.textContent=e&&e.code==="quota_exceeded"?"База заполнена — удалите ненужные уроки.":"Не сохранено: нет прав на запись (нужна роль «Редактор»)."}
}

