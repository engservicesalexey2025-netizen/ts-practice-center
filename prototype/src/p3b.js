
/* ================= ПЛАТФОРМА: общая база, роли ================= */
const P={db:null,user:null,assets:null,dl:null,uid:null,canEdit:false,ready:!(window.claude&&window.claude.use),writeFail:false};
let CFG={seq:true,passHash:null},OVR={},CSEC={},ACC=null;
const KEY="tnSchool.v2";
const blank=()=>({prof:null,lp:{},ex:[],tr:{n:0,hit:0,tot:0},chk:{},desf:{}});
let st=blank();
try{const r=localStorage.getItem(KEY);if(r)st=Object.assign(blank(),JSON.parse(r))}catch(e){}
let saveT=null,saving=false,saveAgain=false;
function save(){try{localStorage.setItem(KEY,JSON.stringify(st))}catch(e){}if(P.db&&P.uid){clearTimeout(saveT);saveT=setTimeout(flush,700)}}
async function flush(){
  if(saving){saveAgain=true;return}saving=true;
  try{await P.db.doc("trainees/"+P.uid).set(JSON.parse(JSON.stringify(Object.assign({},st,{upd:new Date().toISOString()}))));P.writeFail=false}
  catch(e){if(e&&e.code==="unavailable")setTimeout(flush,1500+Math.random()*1500);else P.writeFail=true}
  saving=false;if(saveAgain){saveAgain=false;flush()}
}
const now=()=>new Date().toISOString();
const fd=iso=>iso?new Date(iso).toLocaleString("ru-RU",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"}):"—";
const fdd=iso=>iso?new Date(iso).toLocaleDateString("ru-RU"):"—";
const lp=id=>(st.lp[id]=st.lp[id]||{});
const isDone=id=>!!(st.lp[id]&&st.lp[id].p);
const clone=o=>JSON.parse(JSON.stringify(o));

function rebuild(){
  SEC=[];
  BASE_SEC.forEach(s=>{const c=CSEC[s[0]];if(c&&c.hidden)return;SEC.push([s[0],(c&&c.name)||s[1],s[2]])});
  Object.values(CSEC).forEach(c=>{if(!c.hidden&&!SEC.some(s=>s[0]===c.k))SEC.push([c.k,c.name||c.k,"conc"])});
  const map={};BASE.forEach(b=>map[b.id]=Object.assign({},clone(b),{base:true}));
  Object.values(OVR).forEach(o=>{const b=map[o.id];map[o.id]=Object.assign({sc:"",kw:"",d:[],c:[],p:"",n:[],ok:[],a:""},b||{},clone(o),{s:o.id.replace(/\d+$/,""),base:!!b,edited:true})});
  const ord=k=>SEC.findIndex(s=>s[0]===k),num=id=>parseInt(id.replace(/^\D+/,""))||0;
  ALL=Object.values(map).filter(l=>ord(l.s)>=0).sort((a,b)=>ord(a.s)-ord(b.s)||num(a.id)-num(b.id));
  ALL.forEach(l=>{l.notes=l.notes||"";l.vids=l.vids||[];l.gal=l.gal||[]});
  LS=ALL.filter(l=>!l.hidden);
  let mm=false;try{mm=isMentor()}catch(e){}
  if(!mm){SEC=SEC.filter(z=>secAllowed(z[0]));LS=LS.filter(l=>secAllowed(l.s))}
}
function secAllowed(k){if(!P.db)return true;if(ACC&&Array.isArray(ACC.secs))return ACC.secs.includes(k);return CFG.accDef!=="none"}
rebuild();

let dirty=false,firstSnaps=0;
function softRender(force){
  const p=(location.hash||"#/").replace(/^#\/?/,"").split("/")[0];
  const busy=dirty&&(p==="l"||p==="exam"||p==="mentor"||p==="trainer");
  if(force&&!busy){render();return}
  if(busy){const b=document.getElementById("upd");b.classList.remove("hidden")}
  else if(["","s","video","norms","des","progress","mentor"].includes(p))render();
}
async function initPlatform(){
  if(!(window.claude&&window.claude.use)){P.ready=true;return}
  const tm=setTimeout(()=>{if(!P.ready){P.ready=true;render()}},12000);
  const [db,user]=await Promise.all([claude.use("db"),claude.use("user")]);
  P.db=db;P.user=user;
  if(user){P.uid=await user.id();P.canEdit=await user.canEdit()}
  claude.use("assets").then(a=>{P.assets=a});
  claude.use("downloads").then(d=>{P.dl=d});
  if(db&&P.uid){try{const s=await db.doc("trainees/"+P.uid).get();if(s.exists){st=Object.assign(blank(),clone(s.data()));try{localStorage.setItem(KEY,JSON.stringify(st))}catch(e){}}else if(st.prof)save()}catch(e){}}
  if(db){
    const fin=()=>{if(++firstSnaps===3){clearTimeout(tm);P.ready=true;softRender(true)}else if(firstSnaps>3)softRender()};
    db.doc("cms/main").onSnapshot(s=>{CFG=Object.assign({seq:true,passHash:null},s.exists?clone(s.data()):{});fin()},()=>fin());
    db.collection("cms/main/lessons").onSnapshot(s=>{OVR={};s.docs.forEach(d=>{OVR[d.id]=clone(d.data())});rebuild();fin()},()=>fin());
    if(P.uid)db.doc("cms/main/access/"+P.uid).onSnapshot(s=>{ACC=s.exists?clone(s.data()):null;rebuild();if(firstSnaps>=3)softRender()},()=>{});
    db.collection("cms/main/sections").onSnapshot(s=>{CSEC={};s.docs.forEach(d=>{CSEC[d.id]=clone(d.data())});rebuild();fin()},()=>fin());
  }else{clearTimeout(tm);P.ready=true;render()}
}

/* ---------- наставник: пароль ---------- */
async function hashPw(pw){try{const b=await crypto.subtle.digest("SHA-256",new TextEncoder().encode("tnzhk:"+pw));return[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,"0")).join("")}catch(e){return"plain:"+pw}}
const isMentor=()=>{try{return P.canEdit&&sessionStorage.getItem("tnMentor")==="1"}catch(e){return false}};
function locked(l){if(!CFG.seq||isMentor())return false;const sl=LS.filter(x=>x.s===l.s);const i=sl.indexOf(l);return i>0&&!isDone(sl[i-1].id)}

/* ================= UI ================= */
const app=document.getElementById("app");
const STEPS=["Посмотри","Видео","Найди дефект","Ответы","Чек-лист ТН","Норматив РК","Правильно / неправильно","Замечание DES","Блиц-тест"];
const secDone=k=>LS.filter(l=>l.s===k&&isDone(l.id)).length;
const secCnt=k=>LS.filter(l=>l.s===k).length;
const normLine=n=>nm(n[0])[1]?`<span class="code">${esc(nm(n[0])[0])}</span> «${esc(nm(n[0])[1])}»`:`<span class="code">${esc(nm(n[0])[0])}</span>`;
const pct=(a,b)=>b?Math.round(a/b*100):0;

function registerPage(){
  const p=st.prof||{};
  return `<div class="blk" style="max-width:640px;margin:20px auto">
  <h1 style="font-size:clamp(22px,4vw,30px);margin-bottom:6px">Добро пожаловать в Школу ТН ЖК</h1>
  <p class="mut">Укажите свои данные. Они фиксируются в журнале обучения вместе с датами прохождения уроков, тестов и аттестаций.</p>
  <div class="form">
   <label>ФИО<input class="inp" id="rf" value="${esc(p.fio||"")}" placeholder="Иванов Иван Иванович" autocomplete="name"></label>
   <label>Специальность<input class="inp" id="rs" list="specs" value="${esc(p.spec||"")}" placeholder="Выберите или впишите"></label>
   <datalist id="specs"><option>ТН — общестроительные работы</option><option>ТН — монолитные и каменные работы</option><option>ТН — кровля и фасады</option><option>ТН — инженерные сети (ОВиК, ВК)</option><option>ТН — электромонтажные работы и СС</option><option>Инженер СК заказчика</option><option>Инженер ПТО</option></datalist>
   <label>Уровень ТН<select class="inp" id="rl">${["Абитуриент (стажёр)","Технический надзор","Ведущий ТН","Главный специалист ТН"].map(x=>`<option ${p.lvl===x?"selected":""}>${x}</option>`).join("")}</select></label>
   <label>Объект / подразделение (необязательно)<input class="inp" id="ro" value="${esc(p.obj||"")}"></label>
  </div>
  <div class="row" style="margin-top:16px"><button class="btn pri" id="rgo">${st.prof?"Сохранить данные":"Начать обучение"}</button>${st.prof?`<a class="btn" href="#/progress">Отмена</a>`:""}</div>
  <p class="mut sm" style="margin-top:14px">${P.db?(P.uid?"Ваши результаты сохраняются в общей базе школы и видны наставнику.":"Вы не вошли в аккаунт — результаты сохранятся только в этом браузере."):"Файл открыт без подключения к общей базе — результаты сохранятся только в этом браузере."}</p></div>`;
}

function home(){
  const done=LS.filter(l=>isDone(l.id)).length;
  const ex=LS.find(l=>l.id==="B2")||LS[0];
  return `<section class="hero"><div>
  <h1>Школа ТН ЖК</h1>
  <p>${LS.length} визуальных уроков технадзора на строительстве жилых комплексов. Обучение глазами ТН: каждый урок — это узел, дефекты, норматив и готовое замечание.</p>
  <ol class="route"><li>Посмотри</li><li>Найди дефект</li><li>Объясни нарушение</li><li>Найди норматив</li><li>Реши, что делать</li><li>Напиши замечание в DES</li></ol>
  </div><div><figure>${ex?svgOf(ex,"task"):""}<figcaption>Пример задания «Найди дефект»</figcaption></figure></div></section>
  <div class="princ">
   <div><b>Фото и видео</b>показывают, как выполняется работа</div>
   <div><b>Проект</b>определяет, как должно быть на конкретном объекте</div>
   <div><b>Норматив РК</b>— обязательное требование</div>
   <div><b>ТН</b>сверяет факт с проектом и НТД и фиксирует несоответствие</div>
  </div>
  <div class="row" style="justify-content:space-between;margin-bottom:12px"><h2 style="font-size:20px">Разделы курса</h2><span class="mut">Пройдено ${done} из ${LS.length} уроков${CFG.seq?" · уроки открываются по порядку":""}</span></div>
  ${SEC.length?"":`<div class="note">Наставник ещё не открыл вам разделы для обучения. Как только он отметит доступные разделы в журнале, они появятся здесь.</div>`}<div class="secs">${SEC.map(s=>{const d=secDone(s[0]),n=secCnt(s[0]);const first=LS.find(l=>l.s===s[0]);return `<a class="sec" href="#/s/${s[0]}"><div class="th">${first?cleanFig(first):""}</div><div class="bd"><h3>${s[0]}. ${esc(s[1])}</h3><span class="mut sm">${n} уроков · пройдено ${d}</span><div class="prog"><i style="width:${pct(d,n)}%"></i></div></div></a>`}).join("")}</div>`;
}

function secPage(k){
  const ls=LS.filter(l=>l.s===k);if(!SEC.some(s=>s[0]===k))return notFound();
  return `<div class="crumbs"><a href="#/">Школа</a> / ${esc(secName(k))}</div>
  <h1 style="font-size:clamp(24px,4vw,36px);margin-bottom:6px">${k}. ${esc(secName(k))}</h1>
  <p class="mut">${ls.length} уроков.${CFG.seq?" Следующий урок открывается после зачёта блиц-теста предыдущего (от 80 %).":""}</p>
  <div class="lcards">${ls.map(l=>{const lk2=locked(l),x=st.lp[l.id]||{};return `<a class="lcard ${lk2?"is-locked":""}" href="#/l/${l.id}">${cleanFig(l)}<div class="bd"><b>Урок ${l.id}</b><div style="font-weight:700;margin:4px 0">${esc(l.t)}</div><span class="pill ${isDone(l.id)?"ok":""}">${lk2?"Закрыт — пройдите предыдущий":isDone(l.id)?`Пройден ${fdd(x.p)}`:x.o?"В процессе":"Не начат"}${x.q!=null?` · тест ${x.q}%`:""}</span></div></a>`}).join("")||`<p class="mut">В разделе пока нет уроков.</p>`}</div>`;
}

function lessonPage(id){
  const l=LS.find(x=>x.id===id);if(!l)return notFound();
  const i=LS.indexOf(l),prev=LS[i-1],next=LS[i+1];
  if(locked(l)){const sl=LS.filter(x=>x.s===l.s);const pv=sl[sl.indexOf(l)-1];return `<div class="blk"><h1 style="font-size:24px">Урок ${l.id} пока закрыт</h1><p>Уроки проходятся по порядку. Сначала сдайте блиц-тест урока ${pv.id} «${esc(pv.t)}» на 80 % и выше.</p><a class="btn pri" href="#/l/${pv.id}">Перейти к уроку ${pv.id}</a></div>`}
  const f=st.desf||{},chk=st.chk[l.id]||[],x=st.lp[l.id]||{};
  return `<div class="crumbs"><a href="#/">Школа</a> / <a href="#/s/${l.s}">${esc(secName(l.s))}</a> / Урок ${l.id}</div>
  <header class="lhead"><div class="lnum">${l.id}</div><div><h1>${esc(l.t)}</h1><div class="mut sm">Урок ${i+1} из ${LS.length} · начат ${fd(x.o)}${x.p?` · <span class="pill ok">Пройден ${fdd(x.p)}</span>`:""}</div></div></header>
  <nav class="steps no-print">${STEPS.map((s,k)=>`<a href="#" data-jump="b${k+1}"><b>${k+1}</b>${s}</a>`).join("")}</nav>

  <section class="blk" id="b1"><h2><span>1</span>Посмотри: узел и технология</h2>
   <div class="grid2"><figure>${cleanFig(l)}<figcaption>${l.okPhoto?"Эталон с объекта — как должно быть":"Учебная схема узла — эталон без дефектов"}</figcaption></figure>
   <div><div class="tbl-wrap"><table class="src">
    <tr><th>Фото / видео</th><td>Показывают, как выполняется работа. Не являются основанием для замечания.</td></tr>
    <tr><th>Проект</th><td>${esc(l.p||"—")}</td></tr>
    <tr><th>Норматив РК</th><td>${l.n.filter(n=>n[0]!=="PRJ").map(n=>`<span class="code">${esc(nm(n[0])[0])}</span>`).join(", ")||"по проекту"}</td></tr>
    <tr><th>ТН</th><td>Сверяет факт с проектом и НТД, фиксирует несоответствие в DES.</td></tr></table></div>
    <div class="links"><a target="_blank" rel="noopener" href="${lk.ya(l)}">Фото выполнения работ ↗</a><a target="_blank" rel="noopener" href="${lk.yad(l)}">Фото дефектов ↗</a><a target="_blank" rel="noopener" href="${lk.gg(l)}">Схемы узлов ↗</a></div>
   </div></div>
   ${l.notes?`<div class="mentor-note"><b>Наставник: на что обратить внимание</b><div>${esc(l.notes).replace(/\n/g,"<br>")}</div></div>`:""}
   ${l.gal.length?`<h3 style="font-size:15px;margin:16px 0 8px">Фото-примеры с объектов</h3><div class="gal">${l.gal.map(g=>`<figure><img src="${blobUrl(g.id)}" alt="${esc(g.cap||"Фото с объекта")}" data-z="1" loading="lazy"><figcaption>${esc(g.cap||"")}</figcaption></figure>`).join("")}</div>`:""}
  </section>

  <section class="blk" id="b2"><h2><span>2</span>Видео по технологии</h2>
   ${l.vids.length?`<h3 style="font-size:15px;margin-bottom:8px">Рекомендует наставник</h3><div class="vids" style="margin-bottom:14px">${l.vids.map(v=>`<a class="vid" target="_blank" rel="noopener" href="${esc(v[1])}"><span class="pl"></span><span><b>${esc(v[0]||"Видео")}</b><small>${esc((v[1].match(/\/\/([^/]+)/)||[,""])[1])}</small></span></a>`).join("")}</div>`:""}
   <div class="vids">
    <a class="vid" target="_blank" rel="noopener" href="${lk.yt(l)}"><span class="pl"></span><span><b>Технология выполнения</b><small>YouTube · подборка по теме</small></span></a>
    <a class="vid" target="_blank" rel="noopener" href="${lk.ytd(l)}"><span class="pl"></span><span><b>Типовые ошибки и дефекты</b><small>YouTube · подборка по теме</small></span></a>
    <a class="vid" target="_blank" rel="noopener" href="${lk.rt(l)}"><span class="pl"></span><span><b>Технология на русском</b><small>Rutube · подборка по теме</small></span></a>
   </div>
   <p class="note">Если в видео сделано иначе, чем в проекте, — на объекте действует проект и НТД РК.</p></section>

  <section class="blk" id="b3"><h2><span>3</span>Найди дефект</h2>
   <p>Отметьте на ${l.photo?"фото":"схеме"} все места, где видите нарушение. Подсказок нет — как на реальной приёмке. Количество дефектов не указывается.</p>
   ${l.d.length?`<div class="grid2"><div class="task-wrap">${svgOf(l,"task","task")}</div>
   <div><textarea class="inp" id="myans" rows="6" style="width:100%" placeholder="Запишите, какие нарушения вы видите и почему (для разбора с наставником)"></textarea>
   <div class="row" style="margin-top:10px"><button class="btn pri" id="chkbtn">Проверить отметки</button><button class="btn" id="rstbtn">Сбросить отметки</button><button class="btn" id="giveup">Показать ответы</button></div>
   <div class="res ${x.f?"":"hidden"}" id="fres">${x.f?`Прошлая попытка: найдено ${x.f[0]} из ${x.f[1]} (${fd(x.f[2])}).`:""}</div></div></div>`:`<p class="mut">Наставник ещё не разметил дефекты для этого урока.</p>`}</section>

  <section class="blk" id="b4"><h2><span>4</span>Ответы: дефекты и почему это нарушение</h2>
   <div id="ansHide" class="${x.f?"hidden":""}"><p class="mut">Сначала выполните задание «Найди дефект» — ответы откроются после проверки.</p></div>
   <div id="ans" class="${x.f?"":"hidden"}"><div class="grid2"><figure>${svgOf(l,"answer")}</figure>
   <ol class="dlist">${l.d.map(d=>`<li><b>${esc(d[3])}</b><br><span class="mut">Почему нарушение:</span> ${esc(d[4])}</li>`).join("")}</ol></div></div></section>

  <section class="blk" id="b5"><h2><span>5</span>Что должен проверить ТН</h2>
   <div class="chk" id="chk">${l.c.map((c,k)=>`<label><input type="checkbox" data-k="${k}" ${chk[k]?"checked":""}><span>${esc(c)}</span></label>`).join("")}</div></section>

  <section class="blk" id="b6"><h2><span>6</span>Норматив РК и проект</h2>
   <div class="tbl-wrap"><table class="nt"><tr><th>Документ</th><th>Пункт / раздел</th><th>Требование</th></tr>
   <tr><td><span class="code">Проект</span></td><td>${esc(l.p||"—")}</td><td>Требования проекта для конкретного объекта — основание замечания в пределах НТД</td></tr>
   ${l.n.filter(n=>n[0]!=="PRJ").map(n=>`<tr><td>${normLine(n)}</td><td>${esc(n[1])}</td><td>${esc(n[2])}</td></tr>`).join("")}</table></div>
   <p class="note">Перед записью в DES уточните номер пункта по действующей редакции на <a href="https://www.egfntd.kz/" target="_blank" rel="noopener">egfntd.kz</a>.</p></section>

  <section class="blk" id="b7"><h2><span>7</span>Правильно и неправильно</h2>
   <div class="rw"><div class="ok">${cleanFig(l)}<h3 style="color:var(--good)">Правильно</h3><ul>${l.ok.map(o=>`<li>${esc(o)}</li>`).join("")}</ul></div>
   <div class="no">${svgOf(l,"answer")}<h3 style="color:var(--bad)">Неправильно</h3><ul>${l.d.map(d=>`<li>${esc(d[3])}</li>`).join("")}</ul></div></div></section>

  <section class="blk" id="b8"><h2><span>8</span>Готовое замечание для DES</h2>
   <p class="mut sm">Заполните привязку — текст обновится. Снимите галочки с дефектов, которых нет на вашем объекте.</p>
   <div class="des-f">
    <input data-f="obj" placeholder="Объект (ЖК, очередь)" value="${esc(f.obj||st.prof&&st.prof.obj||"")}"><input data-f="sec" placeholder="Блок / секция" value="${esc(f.sec||"")}"><input data-f="ax" placeholder="Оси">
    <input data-f="lvl" placeholder="Этаж / отметка"><input data-f="con" placeholder="Подрядчик / ответственный" value="${esc(f.con||"")}"><input data-f="term" placeholder="Срок устранения">
   </div>
   <div class="row" id="dsel">${l.d.map((d,k)=>`<label class="pill"><input type="checkbox" data-d="${k}" checked> ${k+1}. ${esc(d[3])}</label>`).join("")}</div>
   <div class="des-pre" id="despre"></div>
   <button class="btn pri" id="copydes">Копировать замечание</button></section>

  <section class="blk" id="b9"><h2><span>9</span>Блиц-тест</h2>
   <div id="quiz"></div><div class="row" style="margin-top:12px"><button class="btn pri" id="qsub">Проверить ответы</button><button class="btn" id="qnew">Новый вариант</button></div>
   <div class="res ${x.q!=null?"":"hidden"}" id="qres">${x.q!=null?`Лучший результат: ${x.q}% (${fd(x.qd)}).`:""}</div></section>

  <div class="pager no-print">${prev?`<a class="btn" href="#/l/${prev.id}">← ${prev.id}. ${esc(prev.t)}</a>`:"<span></span>"}${next?`<a class="btn dark" href="#/l/${next.id}">${next.id}. ${esc(next.t)} →</a>`:""}</div>`;
}

function desText(l,f,sel){f=Object.assign({},f,{sec:f.sec||f.blk,con:f.con||f.gen||f.sub});
  const ds=l.d.filter((_,k)=>sel[k]);
  const loc=`${f.obj||"[Объект]"}, ${f.sec||"[блок/секция]"}, оси ${f.ax||"[__]"}, ${f.lvl||"[этаж/отметка]"}`;
  return `<b>Комментарий:</b>\n${esc(loc)}. При освидетельствовании работ «${esc(l.t)}» выявлено:\n${ds.map((d,k)=>`${k+1}) ${esc(d[3])}`).join(";\n")||"[выберите дефекты]"}.\nФотофиксация прилагается.\n\n<b>Норматив:</b>\n— Проект: ${esc(l.p||"[раздел, лист]")};\n${l.n.filter(n=>n[0]!=="PRJ").map(n=>`— ${esc(nm(n[0])[0])}${nm(n[0])[1]?` «${esc(nm(n[0])[1])}»`:""}, ${esc(n[1])}: ${esc(n[2])}`).join(";\n")}.\n\n<b>Причина:</b>\n${ds.map(d=>esc(d[4])).join(" ")}\n\n<b>Действия:</b>\n${esc(l.a)} Последующие работы на участке не выполнять до устранения и повторного освидетельствования ТН. Срок: ${esc(f.term||"[дата]")}. Ответственный: ${esc(f.con||"[подрядчик / ФИО]")}.`;
}
const plain=h=>h.replace(/<[^>]+>/g,"").replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&quot;/g,'"');
function copyText(t,btn){const lbl=btn.textContent;const done=()=>{btn.textContent="Скопировано";setTimeout(()=>btn.textContent=lbl,1500)};const fb=()=>{const ta=document.createElement("textarea");ta.value=t;document.body.appendChild(ta);ta.select();try{document.execCommand("copy")}catch(e){}ta.remove();done()};if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(t).then(done,fb);else fb()}

function svgPt(svg,e){const p=svg.createSVGPoint();p.x=e.clientX;p.y=e.clientY;return p.matrixTransform(svg.getScreenCTM().inverse())}
const NS="http://www.w3.org/2000/svg";
function finder(svg,l){
  const k=geo(l).k,R=52*k;let marks=[],nodes=[],lockd=false;
  svg.addEventListener("click",e=>{if(lockd)return;dirty=true;const p=svgPt(svg,e);marks.push(p);const c=document.createElementNS(NS,"circle");c.setAttribute("cx",p.x);c.setAttribute("cy",p.y);c.setAttribute("r",20*k);c.setAttribute("class","mark");c.style.strokeWidth=4*k;svg.appendChild(c);nodes.push(c)});
  return{check(){lockd=true;const hit=l.d.map(d=>marks.some(m=>Math.hypot(m.x-d[1],m.y-d[2])<R));const extra=marks.filter(m=>!l.d.some(d=>Math.hypot(m.x-d[1],m.y-d[2])<R)).length;
      l.d.forEach((d,j)=>{const g=document.createElementNS(NS,"g");g.innerHTML=ringNum(d[1],d[2],j+1,hit[j]?"ring-hit":"ring-miss",k);svg.appendChild(g);nodes.push(g)});return{hit:hit.filter(Boolean).length,tot:l.d.length,extra}},
    reset(){marks=[];lockd=false;nodes.forEach(n=>n.remove());nodes=[]}};
}
function lightbox(src){const d=document.createElement("div");d.className="lb";d.innerHTML=`<img src="${src}" alt="">`;d.onclick=()=>d.remove();document.body.appendChild(d)}

function bindLesson(l){
  const x=lp(l.id);if(!x.o){x.o=now();save()}
  document.querySelectorAll("[data-jump]").forEach(a=>a.addEventListener("click",e=>{e.preventDefault();document.getElementById(a.dataset.jump).scrollIntoView({behavior:"smooth"})}));
  app.querySelectorAll("img[data-z]").forEach(i=>i.onclick=()=>lightbox(i.src));
  const open=()=>{document.getElementById("ans").classList.remove("hidden");document.getElementById("ansHide").classList.add("hidden")};
  const tk=document.getElementById("task");
  if(tk){const F=finder(tk,l);
    document.getElementById("chkbtn").onclick=()=>{const r=F.check();const el=document.getElementById("fres");el.classList.remove("hidden");el.innerHTML=`Найдено ${r.hit} из ${r.tot} дефектов${r.extra?`, лишних отметок: ${r.extra}`:""}. Зелёный круг — найдено, красный — пропущено. Разбор — в блоке 4.`;x.f=[r.hit,r.tot,now()];x.fa=(x.fa||0)+1;st.tr.n++;st.tr.hit+=r.hit;st.tr.tot+=r.tot;save();open()};
    document.getElementById("rstbtn").onclick=()=>{F.reset();document.getElementById("fres").classList.add("hidden")};
    document.getElementById("giveup").onclick=()=>{open();document.getElementById("b4").scrollIntoView({behavior:"smooth"})};}
  document.getElementById("chk").addEventListener("change",e=>{const k=+e.target.dataset.k;const a=st.chk[l.id]||[];a[k]=e.target.checked;st.chk[l.id]=a;save()});
  const f={},sel=l.d.map(()=>true);
  const upd=()=>{document.getElementById("despre").innerHTML=desText(l,f,sel)};
  document.querySelectorAll("[data-f]").forEach(i=>{f[i.dataset.f]=i.value;i.addEventListener("input",()=>{f[i.dataset.f]=i.value;st.desf={obj:f.obj,sec:f.sec,con:f.con};save();upd()})});
  document.getElementById("dsel").addEventListener("change",e=>{sel[+e.target.dataset.d]=e.target.checked;upd()});
  document.getElementById("copydes").onclick=e=>copyText(plain(desText(l,f,sel)),e.target);
  upd();
  let v=x.qv||0,qs;
  const mk=()=>{const r=rng(l.id+":"+v);qs=["viol","why","norm","chk","act"].map(t=>buildQ(l,t,r)).filter(Boolean);document.getElementById("quiz").innerHTML=qs.length?quizHTML(qs,"q"):`<p class="mut">Для теста нужно заполнить чек-лист, дефекты и нормативы урока.</p>`;document.getElementById("qsub").disabled=!qs.length};
  mk();
  document.getElementById("quiz").addEventListener("change",()=>{dirty=true});
  document.getElementById("qsub").onclick=()=>{const g=gradeQuiz(document.getElementById("quiz"),qs,"q");const pc=pct(g.ok,qs.length);x.q=Math.max(x.q||0,pc);x.qd=now();x.qa=(x.qa||0)+1;if(pc>=80&&!x.p)x.p=now();save();const el=document.getElementById("qres");el.classList.remove("hidden");el.innerHTML=`Результат: ${g.ok} из ${qs.length} (${pc}%). ${pc>=80?"Урок засчитан"+(LS[LS.indexOf(l)+1]&&LS[LS.indexOf(l)+1].s===l.s?" — следующий урок открыт.":"."):"Для зачёта нужно 80 %. Разберите ответы и пройдите новый вариант."}`;document.getElementById("qsub").disabled=true};
  document.getElementById("qnew").onclick=()=>{v++;x.qv=v;save();mk();document.getElementById("qres").classList.add("hidden")};
}

/* ---------- тренажёр ---------- */
let TR={sec:"all",cur:null,des:null};
function trainerPage(){
  return `<h1 style="font-size:clamp(24px,4vw,36px)">Тренажёр дефектов</h1>
  <p class="mut">Случайный узел из открытых вам уроков. Отметьте все нарушения, проверьте себя и переходите к следующему.</p>
  <div class="row" style="margin:12px 0"><select class="inp" id="trsec"><option value="all">Все разделы</option>${SEC.map(s=>`<option value="${s[0]}" ${TR.sec===s[0]?"selected":""}>${s[0]}. ${esc(s[1])}</option>`).join("")}</select><button class="btn dark" id="trnext">Следующий узел</button><span class="mut sm">Проверок: ${st.tr.n} · найдено ${st.tr.hit} из ${st.tr.tot}</span></div><div id="trbox"></div>`;
}
function trainerLoad(){
  const pool=LS.filter(l=>(TR.sec==="all"||l.s===TR.sec)&&!locked(l)&&l.d.length);const box=document.getElementById("trbox");
  if(!pool.length){box.innerHTML=`<p class="mut">В этом разделе пока нет открытых уроков с разметкой дефектов.</p>`;return}
  let l;do{l=pool[Math.floor(Math.random()*pool.length)]}while(pool.length>1&&l.id===TR.cur);TR.cur=l.id;
  box.innerHTML=`<div class="blk"><h2 style="font-size:18px;margin-bottom:10px">${esc(l.t)}</h2><div class="grid2"><div class="task-wrap">${svgOf(l,"task","task")}</div><div><p>Отметьте нарушения.</p><div class="row"><button class="btn pri" id="trchk">Проверить</button><a class="btn" href="#/l/${l.id}">Открыть урок ${l.id}</a></div><div class="res hidden" id="trres"></div><ol class="dlist hidden" id="trans">${l.d.map(d=>`<li><b>${esc(d[3])}</b><br><span class="mut">${esc(d[4])}</span></li>`).join("")}</ol></div></div></div>`;
  const F=finder(document.getElementById("task"),l);
  document.getElementById("trchk").onclick=e=>{const r=F.check();e.target.disabled=true;st.tr.n++;st.tr.hit+=r.hit;st.tr.tot+=r.tot;save();const el=document.getElementById("trres");el.classList.remove("hidden");el.textContent=`Найдено ${r.hit} из ${r.tot}${r.extra?`, лишних отметок: ${r.extra}`:""}.`;document.getElementById("trans").classList.remove("hidden");dirty=false};
}

function videoPage(){
  return `<h1 style="font-size:clamp(24px,4vw,36px)">Видеотека</h1><p class="mut">Видео, рекомендованные наставником, и подборки по технологии и типовым ошибкам для каждого урока.</p>
  ${SEC.map(s=>`<div class="blk"><h2 style="font-size:17px">${s[0]}. ${esc(s[1])}</h2><div class="tbl-wrap"><table class="nt">${LS.filter(l=>l.s===s[0]).map(l=>`<tr><td style="width:60px"><b>${l.id}</b></td><td><a href="#/l/${l.id}">${esc(l.t)}</a>${l.vids.length?`<div class="sm">${l.vids.map(v=>`<a target="_blank" rel="noopener" href="${esc(v[1])}">▶ ${esc(v[0]||"Видео наставника")}</a>`).join(" · ")}</div>`:""}</td><td style="white-space:nowrap"><a target="_blank" rel="noopener" href="${lk.yt(l)}">Технология</a> · <a target="_blank" rel="noopener" href="${lk.ytd(l)}">Ошибки</a> · <a target="_blank" rel="noopener" href="${lk.rt(l)}">Rutube</a></td></tr>`).join("")}</table></div></div>`).join("")}`;
}
function normsPage(){
  const use={};LS.forEach(l=>l.n.forEach(n=>{(use[n[0]]=use[n[0]]||new Set()).add(l.id)}));
  const keys=[...new Set([...Object.keys(N),...Object.keys(use)])];
  return `<h1 style="font-size:clamp(24px,4vw,36px)">Нормативная база</h1>
  <p class="note">Иерархия на объекте: проект, прошедший экспертизу → действующие НТД РК (СН РК, СП РК) → межгосударственные ГОСТ, применяемые в РК → документация производителя (справочно, не основание для замечания, если не включена в проект). Статус и пункты проверяйте на <a href="https://www.egfntd.kz/" target="_blank" rel="noopener">egfntd.kz</a> и <a href="https://adilet.zan.kz/" target="_blank" rel="noopener">adilet.zan.kz</a>.</p>
  <div class="blk"><div class="tbl-wrap"><table class="nt"><tr><th>Документ</th><th>Наименование</th><th>Уроки</th></tr>
  ${keys.map(k=>`<tr><td><span class="code">${esc(nm(k)[0])}</span></td><td>${esc(nm(k)[1])}</td><td>${[...(use[k]||[])].map(id=>`<a href="#/l/${id}">${id}</a>`).join(", ")||"—"}</td></tr>`).join("")}</table></div></div>`;
}
function desPage(){
  const k=TR.des&&SEC.some(s=>s[0]===TR.des)?TR.des:SEC[0][0];
  return `<h1 style="font-size:clamp(24px,4vw,36px)">Библиотека DES-замечаний</h1><p class="mut">Готовые замечания по формату «Комментарий — Норматив — Причина — Действия».</p>
  <div class="row" style="margin:12px 0"><select class="inp" id="dessec">${SEC.map(s=>`<option value="${s[0]}" ${k===s[0]?"selected":""}>${s[0]}. ${esc(s[1])}</option>`).join("")}</select></div>
  ${LS.filter(l=>l.s===k).map(l=>`<div class="blk"><h2 style="font-size:16px">${l.id}. ${esc(l.t)}</h2><div class="des-pre">${desText(l,st.desf||{},l.d.map(()=>true))}</div><div class="row"><button class="btn pri" data-copy="${l.id}">Копировать</button><a class="btn" href="#/l/${l.id}">Открыть урок</a></div></div>`).join("")}`;
}

/* ---------- аттестация ---------- */
let EX=null;
function examPage(){
  if(EX&&EX.stage==="run")return examRun();
  if(EX&&EX.stage==="done")return examResult();
  return `<h1 style="font-size:clamp(24px,4vw,36px)">Аттестация ТН</h1>
  <p class="mut">Случайные вопросы из выбранных разделов: дефекты, причины нарушений, нормативы, порядок проверки и действия в DES. Порог зачёта — 80 %. Время — 1,5 минуты на вопрос. Результат сохраняется в журнале с датой.</p>
  <div class="blk"><p>Аттестуемый: <b>${esc(st.prof.fio)}</b> · ${esc(st.prof.spec||"")} · ${esc(st.prof.lvl||"")}</p>
  <div class="row" style="margin-bottom:12px"><select class="inp" id="exn"><option value="20">20 вопросов</option><option value="30">30 вопросов</option><option value="50">50 вопросов</option></select></div>
  <div class="chk">${SEC.map(s=>`<label><input type="checkbox" class="exs" value="${s[0]}" checked><span>${s[0]}. ${esc(s[1])} <span class="mut sm">(пройдено ${secDone(s[0])} из ${secCnt(s[0])})</span></span></label>`).join("")}</div>
  <div class="row" style="margin-top:14px"><button class="btn pri" id="exgo">Начать аттестацию</button></div></div>
  ${st.ex.length?`<div class="blk"><h2 style="font-size:17px">Мои аттестации</h2><div class="tbl-wrap"><table class="nt"><tr><th>Дата</th><th>Разделы</th><th>Результат</th></tr>${st.ex.slice().reverse().map(e=>`<tr><td>${fd(e.date)}</td><td>${esc(e.secs)}</td><td><span class="pill ${e.pc>=80?"ok":"no"}">${e.pc}% · ${e.ok}/${e.n}</span></td></tr>`).join("")}</table></div></div>`:""}`;
}
function examStart(){
  const secs=[...document.querySelectorAll(".exs:checked")].map(x=>x.value);if(!secs.length){alert("Выберите хотя бы один раздел.");return}
  const n=+document.getElementById("exn").value,r=rng("ex"+Date.now()),pool=LS.filter(l=>secs.includes(l.s)),types=["viol","why","norm","chk","act"];
  const qs=[];const ls=shuffle(pool,r);for(let i=0;i<n*2&&qs.length<n;i++){const q=buildQ(ls[i%ls.length],types[(i+Math.floor(r()*5))%5],r);if(q)qs.push(q)}
  if(!qs.length){alert("В выбранных разделах нет уроков с вопросами.");return}
  EX={stage:"run",qs,secs,start:now(),end:Date.now()+qs.length*90000};dirty=true;render();
}
function examRun(){return `<h1 style="font-size:clamp(22px,3.5vw,30px)">Аттестация: ${esc(st.prof.fio)}</h1><div class="row" style="justify-content:space-between;margin:8px 0"><span class="mut">${EX.qs.length} вопросов · порог 80 %</span><span class="timer" id="timer"></span></div><div class="blk" id="exq">${quizHTML(EX.qs,"e")}</div><button class="btn pri" id="exend">Завершить и получить результат</button>`}
function examFinish(){
  const root=document.getElementById("exq");const g=gradeQuiz(root,EX.qs,"e");EX.ans=[...root.querySelectorAll(".q")].map(q=>{const s=q.querySelector("input:checked");return s?+s.value:-1});
  EX.ok=g.ok;EX.pc=pct(g.ok,EX.qs.length);EX.stage="done";EX.date=now();
  st.ex.push({date:EX.date,start:EX.start,secs:EX.secs.join(", "),n:EX.qs.length,ok:EX.ok,pc:EX.pc});if(st.ex.length>60)st.ex=st.ex.slice(-60);save();clearInterval(EX.t);dirty=false;render();
}
function examResult(){
  const wrong=EX.qs.map((q,i)=>({q,i,a:EX.ans[i]})).filter(x=>x.a!==x.q.ans);
  const bySec={};EX.qs.forEach((q,i)=>{const s=q.lid.replace(/\d+$/,"");bySec[s]=bySec[s]||[0,0];bySec[s][1]++;if(EX.ans[i]===q.ans)bySec[s][0]++});
  return `<div class="blk"><h1 style="font-size:clamp(22px,3.5vw,30px)">Протокол аттестации ТН</h1>
  <p>ФИО: <b>${esc(st.prof.fio)}</b><br>Специальность: ${esc(st.prof.spec||"—")}<br>Уровень: ${esc(st.prof.lvl||"—")}<br>Дата: ${fd(EX.date)}<br>Разделы: ${esc(EX.secs.join(", "))}</p>
  <div class="stat"><div><b>${EX.pc}%</b>результат</div><div><b>${EX.ok}/${EX.qs.length}</b>верных ответов</div><div><b style="color:${EX.pc>=80?"var(--good)":"var(--bad)"}">${EX.pc>=80?"Зачёт":"Незачёт"}</b>порог 80 %</div></div>
  <div class="tbl-wrap"><table class="nt"><tr><th>Раздел</th><th>Верно</th></tr>${Object.keys(bySec).sort().map(s=>`<tr><td>${s}. ${esc(secName(s))}</td><td>${bySec[s][0]} из ${bySec[s][1]}</td></tr>`).join("")}</table></div>
  ${wrong.length?`<h2 style="font-size:17px;margin:18px 0 8px">Ошибки и правильные ответы</h2>${wrong.map(x=>`<div class="q"><p>${x.i+1}. ${esc(x.q.q)}</p><div class="mut sm">Ответ: ${x.a<0?"нет ответа":esc(x.q.opts[x.a])}</div><div style="color:var(--good)">Правильно: ${esc(x.q.opts[x.q.ans])}</div><a class="sm" href="#/l/${x.q.lid}">Повторить урок ${x.q.lid}</a></div>`).join("")}`:""}
  <p style="margin-top:20px">Подпись аттестуемого ____________ &nbsp;&nbsp; Подпись наставника ____________</p>
  <div class="row no-print"><button class="btn pri" id="exprint">Печать протокола</button><button class="btn" id="exagain">Новая аттестация</button></div></div>`;
}

/* ---------- прогресс ---------- */
function progressPage(){
  const done=LS.filter(l=>isDone(l.id)).length,qv=LS.map(l=>st.lp[l.id]&&st.lp[l.id].q).filter(x=>x!=null),avg=qv.length?Math.round(qv.reduce((a,b)=>a+b,0)/qv.length):0;
  return `<h1 style="font-size:clamp(24px,4vw,36px)">Мой прогресс</h1>
  <div class="blk"><div class="row" style="justify-content:space-between"><div><b>${esc(st.prof.fio)}</b><br><span class="mut">${esc(st.prof.spec||"")} · ${esc(st.prof.lvl||"")}${st.prof.obj?" · "+esc(st.prof.obj):""} · в школе с ${fdd(st.prof.reg)}</span></div><a class="btn" href="#/register">Изменить данные</a></div>
  ${P.writeFail?`<p class="note">Результаты не удалось записать в общую базу — у вас роль только для просмотра. Попросите наставника выдать роль «Участник» (Contributor). Пока данные сохраняются в этом браузере.</p>`:""}</div>
  <div class="stat"><div><b>${done}</b>уроков пройдено из ${LS.length}</div><div><b>${avg}%</b>средний балл блиц-тестов</div><div><b>${pct(st.tr.hit,st.tr.tot)}%</b>дефектов найдено</div><div><b>${st.ex.length}</b>аттестаций</div></div>
  ${SEC.map(s=>`<div class="blk"><h2 style="font-size:16px">${s[0]}. ${esc(s[1])} · ${secDone(s[0])}/${secCnt(s[0])}</h2><div class="tbl-wrap"><table class="nt"><tr><th>Урок</th><th>Начат</th><th>Найди дефект</th><th>Тест</th><th>Пройден</th></tr>${LS.filter(l=>l.s===s[0]).map(l=>{const x=st.lp[l.id]||{};return `<tr><td><a href="#/l/${l.id}">${l.id}. ${esc(l.t)}</a></td><td>${fdd(x.o)}</td><td>${x.f?`${x.f[0]}/${x.f[1]}`:"—"}</td><td>${x.q!=null?x.q+"%":"—"}</td><td>${x.p?fdd(x.p):"—"}</td></tr>`}).join("")}</table></div></div>`).join("")}`;
}
function notFound(){return `<div class="blk"><h1 style="font-size:24px">Страница не найдена</h1><p><a href="#/">Вернуться к урокам</a></p></div>`}
