
/* ================= ЗАМЕЧАНИЕ DES: форма в стиле «Создать замечание ПГС» ================= */
const DES_EX_DEF={obj:"ЖК «Jambyl», 2 очередь",blk:"Блок 2",ax:"1–3 / А–Б",lvl:"+6.600 (3 этаж)"};
const desEx=l=>Object.assign({},DES_EX_DEF,l.desex||{});
const DES_G=[["defs","Комментарий: отметьте все дефекты, выявленные в этом узле",true],["norms","Норматив: отметьте все документы-основания",true],["whys","Причина: отметьте верные объяснения нарушений",true],["acts","Действия: выберите корректную формулировку",false]];
function desAuto(l,seed){
  const r=rng(l.id+":des:"+seed);const other=LS.filter(x=>x.s!==l.s&&x.d.length);
  const own=l.n.filter(n=>n[0]!=="PRJ");const nlab=k=>nm(k)[1]?`${nm(k)[0]} «${nm(k)[1]}»`:nm(k)[0];
  return{
    defs:[...l.d.map(d=>[d[3],1]),...shuffle(other.flatMap(x=>x.d),r).slice(0,2).map(d=>[d[3],0])],
    norms:[...own.map(n=>[nlab(n[0]),1]),...shuffle(Object.keys(N).filter(k=>k!=="PRJ"&&!own.some(n=>n[0]===k)),r).slice(0,3).map(k=>[nlab(k),0])],
    whys:[...l.d.map(d=>[d[4],1]),...shuffle(other.flatMap(x=>x.d.map(d=>d[4])),r).slice(0,2).map(w=>[w,0])],
    acts:[[l.a,1],...shuffle(WRONG_ACT,r).slice(0,3).map(a=>[a,0])]};
}
function desTask(l,seed){const r=rng(l.id+":dsh:"+seed),A=desAuto(l,seed),Q=l.desq||{},T={};
  DES_G.forEach(([g])=>{const src=Array.isArray(Q[g])&&Q[g].filter(o=>o[0]&&String(o[0]).trim()).length?Q[g].filter(o=>o[0]&&String(o[0]).trim()):A[g];T[g]=shuffle(src.map(o=>[o[0],o[1]?1:0]),r)});return T}
function desTaskHTML(T,l){
  const ex=desEx(l),E=exAll(l).filter(e=>e.d.length);
  const grp=(g,title,multi)=>`<fieldset class="dq" data-g="${g}"><legend>${title}</legend>${T[g].map((o,i)=>`<label><input type="${multi?"checkbox":"radio"}" name="dg_${g}" value="${i}"><span>${esc(o[0])}</span></label>`).join("")}<div class="dqr sm"></div></fieldset>`;
  const fld=(k,label,ph,req,hint)=>`<label class="pf"><span>${label}${req?' <i class="req">*</i>':""}</span><input class="inp" data-f="${k}" placeholder="${esc(ph||"—")}">${hint?`<small class="mut">Пример: ${esc(hint)}</small>`:""}</label>`;
  const sel=(k,label,opts,req)=>`<label class="pf"><span>${label}${req?' <i class="req">*</i>':""}</span><select class="inp" data-f="${k}"><option value="">${label}</option>${opts.map(o=>`<option>${esc(o)}</option>`).join("")}</select></label>`;
  return `<div class="pgs-head"><button type="button" class="btn sm" id="dnew" aria-label="Очистить форму">←</button><h3>Создать замечание DES</h3><span style="flex:1"></span><button type="button" class="btn" id="dnew2">Отмена</button><button type="button" class="btn pri" id="dsub">Создать</button></div>
  <div class="pgs">
   <div class="pgs-col">
    <div class="pcard"><h4>Проект и участники</h4><p class="mut sm" style="margin:-4px 0 8px">Заполните по своему объекту — ниже даны примеры.</p><div class="pgrid2">
     ${fld("obj","Выберите проект",ex.obj,true,ex.obj)}${fld("nach","Начальник участка","ФИО начальника участка")}${fld("gen","Генподрядчик","Генподрядчик")}${fld("sub","Субподрядчик","Субподрядчик")}</div></div>
    <div class="pcard"><h4>Местоположение</h4><div class="pgrid3">${fld("blk","Блок",ex.blk,false,ex.blk)}${fld("ax","Ось",ex.ax,true,ex.ax)}${fld("lvl","Этаж (отметка)",ex.lvl,false,ex.lvl)}</div></div>
    <div class="pcard"><h4>Описание</h4>${grp("defs",DES_G[0][1],true)}
     <div class="pf"><span>Файлы</span><div class="pdrop">${E.length?E.map((e,j)=>`<button type="button" class="pthumb" data-showtask="${j}" title="Открыть фото узла">${svgOf(e,"task")}<small>${esc(e.t)}</small></button>`).join(""):""}<span class="mut sm">Фото из «Найди дефект» прикреплено автоматически — нажмите, чтобы открыть.</span></div></div></div>
    <div class="pcard"><h4>Рекомендация по улучшению и недопущению в дальнейшем</h4>${grp("acts",DES_G[3][1],false)}</div>
   </div>
   <div class="pgs-col">
    <div class="pcard"><h4>Сроки</h4>${fld("term","Срок устранения","—")}</div>
    <div class="pcard"><h4>Тип и классификация</h4>${sel("type","Тип замечания",["Качество СМР","Нарушение технологии","Исполнительная документация","Охрана труда и ТБ","Пожарная безопасность"])}${sel("ctrl","Тип контроля",["Входной","Операционный","Приёмочный","Инспекционный"])}</div>
    <div class="pcard"><h4>Норматив</h4>${grp("norms",DES_G[1][1],true)}</div>
    <div class="pcard"><h4>Причина</h4>${grp("whys",DES_G[2][1],true)}</div>
    <div class="pcard"><h4>Виды работ</h4>${sel("dir","Вид направления работ",SEC.map(s=>s[1]))}${sel("work","Вид работ",LS.filter(z=>z.s===l.s).map(z=>z.t))}<label class="pf"><span>Подвид работ</span><select class="inp" disabled><option>Подвид работ</option></select></label></div>
   </div></div>`;
}
/* просмотр фото узла из «Найди дефект» */
function showTaskPhoto(l,j){
  const E=exAll(l).filter(e=>e.d.length);if(!E.length)return;const x=st.lp[l.id]||{},es=exSt(x);let cur=Math.min(j||0,E.length-1),marks=false;
  const d=document.createElement("div");d.className="lb";document.body.appendChild(d);document.body.classList.add("noscroll");
  const close=()=>{d.remove();document.body.classList.remove("noscroll")};
  const draw=()=>{const e=E[cur],can=isMentor()||es.fx[e.i]||es.sx[e.i];
    d.innerHTML=`<div class="mdl viewer" role="dialog" aria-modal="true" aria-label="Фото узла"><div class="row" style="justify-content:space-between;margin-bottom:10px"><h3 style="font-size:17px">Фото узла: ${esc(e.t)}</h3><button type="button" class="btn" data-x>Закрыть ✕</button></div>
    ${E.length>1?`<div class="extabs">${E.map((z,k)=>`<button type="button" class="${k===cur?"on":""}" data-vj="${k}">${k+1}. ${esc(z.t)}</button>`).join("")}</div>`:""}
    <div class="viewer-img">${svgOf(e,marks&&can?"answer":"task")}</div>
    <div class="row" style="margin-top:10px">${can?`<label class="row sm"><input type="checkbox" data-vm ${marks?"checked":""}> Показать отметки дефектов</label>`:`<span class="mut sm">Отметки дефектов доступны после выполнения «Найди дефект».</span>`}</div>
    ${marks&&can?`<ol class="dlist">${e.d.map(q=>`<li><b>${esc(q[3])}</b><br><span class="mut">${esc(q[4])}</span></li>`).join("")}</ol>`:""}</div>`;
    d.querySelector("[data-x]").onclick=close;d.querySelectorAll("[data-vj]").forEach(b=>b.onclick=()=>{cur=+b.dataset.vj;draw()});const m=d.querySelector("[data-vm]");if(m)m.onchange=()=>{marks=m.checked;draw()};d.querySelector("[data-x]").focus()};
  d.addEventListener("click",e=>{if(e.target===d)close()});d.addEventListener("keydown",e=>{if(e.key==="Escape")close()});draw();
}

/* ================= БЛИЦ-ТЕСТ: вопросы наставника ================= */
function normQ(q){if(Array.isArray(q))return{q:q[0]||"",opts:q.slice(1).filter(v=>v!==undefined&&v!==null),ok:0};return{q:q.q||"",opts:(q.opts||[]).slice(),ok:+q.ok||0}}
const validQ=q=>q.q.trim()&&q.opts.filter(o=>String(o).trim()).length>=2&&q.opts[q.ok]&&String(q.opts[q.ok]).trim();
function customQs(l,r){return (l.qz||[]).map(normQ).filter(validQ).map(q=>{const items=q.opts.map((o,i)=>[String(o).trim(),i===q.ok]).filter(o=>o[0]);const sh=shuffle(items,r);return{q:q.q,opts:sh.map(o=>o[0]),ans:sh.findIndex(o=>o[1]),lid:l.id}})}
const qAuto=l=>l.qauto===undefined?!(l.qz&&l.qz.length):!!l.qauto;
function lessonQuiz(l,r){const c=shuffle(customQs(l,r),r).slice(0,15);let auto=[];if(!c.length||(qAuto(l)&&c.length<5))auto=["viol","why","norm","chk","act"].slice(0,Math.max(0,5-c.length)).map(t=>buildQ(l,t,r)).filter(Boolean);return shuffle([...c,...auto],r)}

/* ================= ГЛАВНАЯ: конструктор наставника ================= */
const HB_NAME={hero:"Баннер",route:"Шаги обучения",princ:"Принципы",secs:"Разделы курса",text:"Текст",img:"Картинка",gal:"Галерея",note:"Выделенный текст",hr:"Разделитель"};
function DEFAULT_HOME(){return[
  {t:"hero",logo:true,title:CFG.heroTitle||"Центр «Практика ТН»",text:CFG.heroText||"Учебный центр технического надзора Engineering Services: визуальные уроки по строительству жилых комплексов. Наставник готовит материал, абитуриент проходит урок и подтверждает знания.",img:null,noimg:false,pos:"right",cap:"Пример задания «Найди дефект»"},
  {t:"route",items:["Посмотри","Найди дефект","Объясни нарушение","Найди норматив","Реши, что делать","Напиши замечание в DES"]},
  {t:"princ",items:[["Фото и видео","показывают, как выполняется работа"],["Проект","определяет, как должно быть на конкретном объекте"],["Норматив РК","— обязательное требование"],["ТН","сверяет факт с проектом и НТД и фиксирует несоответствие"]]},
  {t:"secs",title:"Разделы"}]}
const homeBlocks=()=>Array.isArray(CFG.home)&&CFG.home.length?CFG.home:DEFAULT_HOME();
async function homeSave(fn){const h=clone(homeBlocks());fn(h);await P.db.doc("cms/main").set(Object.assign({},CFG,{home:h}))}
async function secSave(k,patch){await P.db.doc("cms/main/sections/"+k).set(Object.assign({k,name:secName(k)||k,hidden:false},CSEC[k]||{},patch))}
function secsGrid(b,M){
  const done=LS.filter(l=>isDone(l.id)).length;
  return `<div class="row" style="justify-content:space-between;margin-bottom:12px"><h2 style="font-size:20px">${esc(b.title||"Разделы")}</h2><span class="mut">Освоено ${done} из ${LS.length} уроков${CFG.seq?" · уроки открываются по порядку":""}</span></div>
  ${SEC.length?"":`<div class="note">Наставник ещё не открыл вам разделы для обучения. Как только он отметит доступные разделы в журнале, они появятся здесь.</div>`}
  <div class="secs">${SEC.map(s=>{const d=secDone(s[0]),n=secCnt(s[0]),first=LS.find(l=>l.s===s[0]),cov=CSEC[s[0]]&&CSEC[s[0]].img;
   return `<div class="secw"><a class="sec" href="#/s/${s[0]}"><div class="th">${cov?`<img src="${blobUrl(cov)}" alt="" style="width:100%;height:100%;object-fit:cover">`:first?cleanFig(first):""}</div><div class="bd"><h3>${s[0]}. ${esc(s[1])}</h3><span class="mut sm">${n} уроков · освоено ${d}${secMastered(s[0])?" · <b style='color:var(--good)'>раздел закрыт ✓</b>":""}</span><div class="prog"><i style="width:${pct(d,n)}%"></i></div></div></a>
   ${M?`<div class="lec-tools no-print" style="margin-top:6px"><button class="btn edit sm" data-sren="${s[0]}">✎ Название</button><label class="btn edit sm">🖼 Обложка<input type="file" accept="image/*" hidden data-scov="${s[0]}"></label>${cov?`<button class="btn sm" data-scovdel="${s[0]}">Убрать обложку</button>`:""}<button class="btn sm" data-shide="${s[0]}">Удалить раздел</button></div>`:""}</div>`}).join("")}
   ${M?`<button type="button" class="sec secadd no-print" data-sadd><span>＋</span><b>Новый раздел</b></button>`:""}</div>`;
}
function homeBlockHTML(b,M){
  if(b.t==="hero"){const ex=LS.find(l=>l.id==="B2")||LS[0];const img=b.noimg?"":`<div><figure>${b.img?`<img class="hero-img" src="${blobUrl(b.img)}" alt="${esc(b.cap||"")}">`:(ex?svgOf(ex,"task"):"")}${b.cap?`<figcaption>${esc(b.cap)}</figcaption>`:""}</figure></div>`;
    return `<section class="hero ${b.pos==="left"?"rev":""} ${b.noimg?"noimg":""}"><div>${b.logo!==false?`<img class="hero-logo" src="${LOGO_FULL}" alt="Engineering Services">`:""}<h1>${esc(b.title||"")}</h1>${textBlock(b.text)}</div>${img}</section>`}
  if(b.t==="route")return `<ol class="route" style="margin-bottom:22px">${(b.items||[]).map(s=>`<li>${esc(s)}</li>`).join("")}</ol>`;
  if(b.t==="princ")return `<div class="princ" style="grid-template-columns:repeat(${Math.max(1,(b.items||[]).length)},1fr)">${(b.items||[]).map(c=>`<div><b>${esc(c[0])}</b>${esc(c[1])}</div>`).join("")}</div>`;
  if(b.t==="secs")return secsGrid(b,M);
  if(b.t==="text")return `<div class="hb-text">${b.h?`<h2>${esc(b.h)}</h2>`:""}${textBlock(b.v)}</div>`;
  if(b.t==="note")return `<div class="mentor-note">${b.h?`<b>${esc(b.h)}</b>`:""}<div>${textBlock(b.v)}</div></div>`;
  if(b.t==="img")return b.id?`<figure class="hb-img hb-${b.size||"full"}"><img src="${blobUrl(b.id)}" alt="${esc(b.cap||"")}" data-z="1">${b.cap?`<figcaption>${esc(b.cap)}</figcaption>`:""}</figure>`:"";
  if(b.t==="gal")return (b.imgs||[]).length?`<div class="gal hb-gal">${b.imgs.map(g=>`<figure><img src="${blobUrl(g.id)}" alt="${esc(g.cap||"")}" data-z="1"><figcaption>${esc(g.cap||"")}</figcaption></figure>`).join("")}</div>`:"";
  if(b.t==="hr")return `<hr class="hb-hr">`;
  return"";
}
function home(){
  const H=homeBlocks(),M=isMentor(),up=!!P.assets;
  if(!M)return H.map(b=>homeBlockHTML(b,false)).join("")+(H.some(b=>b.t==="secs")?"":secsGrid({title:"Разделы"},false));
  return `<div class="mbar no-print">Режим наставника: главная страница редактируется блоками. Абитуриенты видят результат без жёлтых кнопок.</div>
  ${H.map((b,i)=>`<div class="hbw"><div class="lec-tools no-print"><span class="mut sm">${i+1}. ${HB_NAME[b.t]||b.t}</span>
   ${["hero","route","princ","secs","text","note","img","gal"].includes(b.t)?`<button class="btn edit sm" data-hq="edit:${i}">✎ Изменить</button>`:""}
   ${b.t==="hero"?`<label class="btn edit sm ${up?"":"disabled"}">🖼 Своя картинка<input type="file" accept="image/*" hidden data-hqimg="${i}"></label><button class="btn sm" data-hq="pos:${i}">Картинка ${b.pos==="left"?"справа":"слева"}</button><button class="btn sm" data-hq="noimg:${i}">${b.noimg?"Показать картинку":"Без картинки"}</button>${b.img?`<button class="btn sm" data-hq="defimg:${i}">Пример схемы</button>`:""}<button class="btn sm" data-hq="logo:${i}">${b.logo!==false?"Скрыть логотип":"Показать логотип"}</button>`:""}
   ${b.t==="img"?`<label class="btn edit sm ${up?"":"disabled"}">🖼 Заменить<input type="file" accept="image/*" hidden data-hqimg="${i}"></label><button class="btn sm" data-hq="size:${i}">Размер: ${{full:"во всю ширину",half:"половина",third:"треть"}[b.size||"full"]}</button>`:""}
   ${b.t==="gal"?`<label class="btn edit sm ${up?"":"disabled"}">＋ Фото<input type="file" accept="image/*" multiple hidden data-hqgal="${i}"></label>`:""}
   <button class="btn sm" data-hq="up:${i}" ${i?"":"disabled"} aria-label="Выше">↑</button><button class="btn sm" data-hq="down:${i}" ${i<H.length-1?"":"disabled"} aria-label="Ниже">↓</button><button class="btn sm" data-hq="del:${i}">Удалить блок</button></div>
   ${homeBlockHTML(b,true)||`<p class="mut">(пустой блок)</p>`}</div>`).join("")}
  <div class="lec-add no-print"><b>Добавить блок:</b>
   <button class="btn edit" data-hq="add:text">＋ Заголовок и текст</button><button class="btn edit" data-hq="add:note">＋ Выделенный текст</button>
   <label class="btn edit ${up?"":"disabled"}">＋ Картинка<input type="file" accept="image/*" hidden id="hqnewimg"></label><label class="btn edit ${up?"":"disabled"}">＋ Галерея<input type="file" accept="image/*" multiple hidden id="hqnewgal"></label>
   <button class="btn edit" data-hq="add:hero">＋ Баннер</button><button class="btn edit" data-hq="add:route">＋ Шаги</button><button class="btn edit" data-hq="add:princ">＋ Принципы</button>${H.some(b=>b.t==="secs")?"":`<button class="btn edit" data-hq="add:secs">＋ Разделы курса</button>`}<button class="btn edit" data-hq="add:hr">＋ Разделитель</button>
   <button class="btn sm" data-hq="reset:0">Вернуть стандартную главную</button><span class="sm" id="edup"></span></div>`;
}
function hbFields(b){
  if(b.t==="hero")return[{label:"Заголовок",value:b.title||""},{label:"Текст (строки с «- » — список, **так** — жирный)",type:"area",rows:6,value:b.text||""},{label:"Подпись под картинкой",value:b.cap||""}];
  if(b.t==="route")return[{label:"Шаги — по одному на строку",type:"area",rows:7,value:(b.items||[]).join("\n")}];
  if(b.t==="princ")return[{label:"Карточки — по одной на строку: Заголовок | текст (последняя выделяется цветом)",type:"area",rows:6,value:(b.items||[]).map(c=>c.join(" | ")).join("\n")}];
  if(b.t==="secs")return[{label:"Заголовок над разделами",value:b.title||""}];
  if(b.t==="text"||b.t==="note")return[{label:"Заголовок (можно оставить пустым)",value:b.h||""},{label:"Текст (строки с «- » — список, **так** — жирный)",type:"area",rows:8,value:b.v||""}];
  if(b.t==="img")return[{label:"Подпись",value:b.cap||""}];
  if(b.t==="gal")return (b.imgs||[]).map((g,j)=>({label:`Подпись к фото ${j+1} (очистите поле и впишите «-», чтобы удалить фото)`,value:g.cap||""}));
  return[];
}
function hbApply(b,v){
  if(b.t==="hero"){b.title=v[0];b.text=v[1];b.cap=v[2]}
  if(b.t==="route")b.items=v[0].split("\n").map(s=>s.trim()).filter(Boolean);
  if(b.t==="princ")b.items=v[0].split("\n").map(s=>s.split("|").map(z=>z.trim())).filter(c=>c[0]).map(c=>[c[0],c.slice(1).join(" | ")]);
  if(b.t==="secs")b.title=v[0];
  if(b.t==="text"||b.t==="note"){b.h=v[0];b.v=v[1]}
  if(b.t==="img")b.cap=v[0];
  if(b.t==="gal")b.imgs=b.imgs.map((g,j)=>({id:g.id,cap:v[j]})).filter(g=>g.cap!=="-");
}
function bindHome(){
  app.querySelectorAll("img[data-z]").forEach(i=>i.onclick=()=>lightbox(i.src));
  if(!isMentor())return;
  const err=()=>uiAlert("Не сохранено: нет прав на запись (нужна роль «Редактор»).");
  app.querySelectorAll("[data-hq]").forEach(btn=>btn.onclick=async()=>{const [op,a]=btn.dataset.hq.split(":");const i=+a;const H=homeBlocks();try{
    if(op==="add"){const nb={text:{t:"text",h:"",v:""},note:{t:"note",h:"",v:""},hero:{t:"hero",logo:false,title:"Новый баннер",text:"",img:null,noimg:true,pos:"right",cap:""},route:{t:"route",items:["Шаг 1","Шаг 2","Шаг 3"]},princ:{t:"princ",items:[["Заголовок","текст"],["Заголовок","текст"]]},secs:{t:"secs",title:"Разделы"},hr:{t:"hr"}}[a];
      if(["text","note","route","princ"].includes(a)){modal(`Новый блок: ${HB_NAME[a]}`,hbFields(nb),async v=>{hbApply(nb,v);await homeSave(h=>h.push(nb))});return}
      await homeSave(h=>h.push(nb));return}
    if(op==="edit"){modal(`Блок ${i+1}: ${HB_NAME[H[i].t]}`,hbFields(H[i]),async v=>{await homeSave(h=>hbApply(h[i],v))});return}
    if(op==="up"||op==="down"){const j=op==="up"?i-1:i+1;await homeSave(h=>{if(j<0||j>=h.length)return;[h[i],h[j]]=[h[j],h[i]]});return}
    if(op==="del"){if(!await uiConfirm(`Удалить блок «${HB_NAME[H[i].t]}» с главной страницы?`))return;await homeSave(h=>h.splice(i,1));return}
    if(op==="pos")return await homeSave(h=>{h[i].pos=h[i].pos==="left"?"right":"left"});
    if(op==="noimg")return await homeSave(h=>{h[i].noimg=!h[i].noimg});
    if(op==="defimg")return await homeSave(h=>{h[i].img=null;h[i].noimg=false});
    if(op==="logo")return await homeSave(h=>{h[i].logo=h[i].logo===false});
    if(op==="size")return await homeSave(h=>{const o=["full","half","third"];h[i].size=o[(o.indexOf(h[i].size||"full")+1)%3]});
    if(op==="reset"){if(!await uiConfirm("Вернуть стандартную главную страницу? Все ваши блоки главной будут удалены."))return;await P.db.doc("cms/main").set(Object.assign({},CFG,{home:[]}));return}
  }catch(e){err()}});
  app.querySelectorAll("[data-hqimg]").forEach(inp=>inp.onchange=async()=>{const r=await uploadImg(inp.files[0]);if(!r)return;const i=+inp.dataset.hqimg;try{await homeSave(h=>{if(h[i].t==="hero"){h[i].img=r.id;h[i].noimg=false}else h[i].id=r.id})}catch(e){err()}});
  app.querySelectorAll("[data-hqgal]").forEach(inp=>inp.onchange=async()=>{const add=await uploadMany(inp.files);if(!add.length)return;const i=+inp.dataset.hqgal;try{await homeSave(h=>{h[i].imgs=(h[i].imgs||[]).concat(add)})}catch(e){err()}});
  const ni=document.getElementById("hqnewimg");if(ni)ni.onchange=async()=>{const r=await uploadImg(ni.files[0]);if(!r)return;try{await homeSave(h=>h.push({t:"img",id:r.id,cap:"",size:"full"}))}catch(e){err()}};
  const ng=document.getElementById("hqnewgal");if(ng)ng.onchange=async()=>{const add=await uploadMany(ng.files);if(!add.length)return;try{await homeSave(h=>h.push({t:"gal",imgs:add}))}catch(e){err()}};
  // разделы
  app.querySelectorAll("[data-sren]").forEach(b=>b.onclick=async()=>{const k=b.dataset.sren;const n=await uiPrompt("Название раздела",secName(k));if(!n||!n.trim())return;try{await secSave(k,{name:n.trim()})}catch(e){err()}});
  app.querySelectorAll("[data-scov]").forEach(inp=>inp.onchange=async()=>{const r=await uploadImg(inp.files[0]);if(!r)return;try{await secSave(inp.dataset.scov,{img:r.id})}catch(e){err()}});
  app.querySelectorAll("[data-scovdel]").forEach(b=>b.onclick=async()=>{try{await secSave(b.dataset.scovdel,{img:null})}catch(e){err()}});
  app.querySelectorAll("[data-shide]").forEach(b=>b.onclick=async()=>{const k=b.dataset.shide;if(!await uiConfirm(`Удалить раздел «${secName(k)}» с сайта? Его уроки скроются у абитуриентов. Вернуть раздел можно в «Кабинет наставника → Уроки и разделы».`))return;try{await secSave(k,{hidden:true})}catch(e){err()}});
  const sa=app.querySelector("[data-sadd]");if(sa)sa.onclick=async()=>{const n=await uiPrompt("Название нового раздела");if(!n||!n.trim())return;const used=new Set([...BASE_SEC.map(s=>s[0]),...Object.keys(CSEC)]);const k="KLMNOPQRSTUVWXYZ".split("").find(c=>!used.has(c));if(!k){uiAlert("Достигнут предел разделов.");return}try{await P.db.doc("cms/main/sections/"+k).set({k,name:n.trim(),hidden:false})}catch(e){err()}};
}
