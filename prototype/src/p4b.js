
/* ================= НАСТАВНИК ================= */
const DFN={crack:"Трещина",honey:"Раковины",rust:"Ржавчина",gap:"Щель / разрыв",wire:"Проволока",puddle:"Вода",bubble:"Вздутие",sag:"Провис",debris:"Мусор",tilt:"Наклон",foam:"Пена",holes:"Отверстия",cable:"Кабель",flap:"Отклейка",wave:"Неровность",hole:"Проходка",joint:"Толстый шов",stain:"Пятно",bar:"Стержень",spacing:"Шаг стержней",bulge:"Выпучивание",chip:"Скол",burn:"Прожог"};
const SCN={form:"Опалубка стен",slab:"Опалубка перекрытия",mesh:"Сетка армирования",cage:"Каркас колонны",conc:"Бетонная поверхность",pour:"Бетонирование",cubes:"Образцы бетона",wp:"Гидроизоляция подземной части",wet:"Санузел",roof:"Кровля",mason:"Кладка",win:"Окно",nvf:"Вентфасад",fin:"Отделка стены",floor:"Пол",mep:"Инженерные системы"};
let ED=null,JR=null,FLASH="";

function mentorGate(){
  if(!P.ready)return `<div class="blk"><p>Подключение к базе школы…</p></div>`;
  if(!P.db)return `<div class="blk"><h1 style="font-size:24px">Режим наставника</h1><p>Редактор работает только в опубликованной версии школы на claude.ai (там есть общая база и хранилище фото). В скачанном файле редактирование недоступно.</p></div>`;
  if(!P.canEdit)return `<div class="blk"><h1 style="font-size:24px">Режим наставника</h1><p>У вашей учётной записи нет роли «Редактор» в этой школе. Попросите владельца выдать вам роль «Редактор» в меню «Поделиться».</p></div>`;
  return `<div class="blk" style="max-width:460px;margin:30px auto"><h1 style="font-size:24px;margin-bottom:10px">Вход наставника</h1><p class="mut sm">Введите пароль наставника.</p><input class="inp" id="mpw" type="password" style="width:100%" autocomplete="current-password"><div class="row" style="margin-top:12px"><button class="btn pri" id="mgo">Войти</button></div><div class="res hidden" id="merr"></div></div>`;
}
function mNav(cur){const f=FLASH;return `${f?`<div class="res" style="background:rgba(46,125,79,.18)">${esc(f)}</div>`:""}<div class="mtabs no-print"><a href="#/mentor" class="${cur==="d"?"on":""}">Уроки и разделы</a><a href="#/mentor/journal" class="${cur==="j"?"on":""}">Журнал абитуриентов</a><a href="#/mentor/settings" class="${cur==="s"?"on":""}">Настройки</a><button class="btn" id="mout">Выйти из режима наставника</button></div>`}

function mentorDash(){
  return `<h1 style="font-size:clamp(24px,4vw,34px)">Кабинет наставника</h1>${mNav("d")}
  <p class="mut">Изменения сохраняются в общую базу и сразу видны всем абитуриентам. Базовые уроки можно изменить и вернуть к исходной версии.</p>
  ${SEC.map(s=>`<div class="blk"><div class="row" style="justify-content:space-between"><h2 style="font-size:17px">${s[0]}. ${esc(s[1])}</h2><div class="row"><button class="btn" data-ren="${s[0]}">Переименовать</button><button class="btn" data-hidesec="${s[0]}">Удалить раздел</button><a class="btn pri" href="#/mentor/new/${s[0]}">＋ Урок</a></div></div>
  <div class="tbl-wrap"><table class="nt">${ALL.filter(l=>l.s===s[0]).map(l=>`<tr><td style="width:60px"><b>${l.id}</b></td><td>${esc(l.t||"(без названия)")} ${l.hidden?'<span class="pill no">Скрыт</span>':""} ${l.edited?(l.base?'<span class="pill">Изменён</span>':'<span class="pill ok">Новый</span>'):""} ${l.photo?'<span class="pill">Фото-задание</span>':""}</td><td style="white-space:nowrap"><a class="btn" href="#/mentor/edit/${l.id}">Редактировать</a></td></tr>`).join("")}</table></div></div>`).join("")}
  ${Object.values(CSEC).filter(c=>c.hidden).length?`<div class="blk"><h2 style="font-size:17px">Удалённые (скрытые) разделы</h2>${Object.values(CSEC).filter(c=>c.hidden).map(c=>`<div class="row" style="margin:6px 0"><b>${c.k}.</b> ${esc(c.name||(BASE_SEC.find(z=>z[0]===c.k)||[,c.k])[1])} <button class="btn sm" data-unhide="${c.k}">Вернуть раздел</button></div>`).join("")}</div>`:""}
  <button class="btn dark" id="addsec">＋ Новый раздел</button>`;
}

function mentorSettings(){
  return `<h1 style="font-size:clamp(24px,4vw,34px)">Настройки школы</h1>${mNav("s")}
  <div class="blk"><h2 style="font-size:17px">Порядок прохождения</h2><label class="row"><input type="checkbox" id="seq" ${CFG.seq?"checked":""}> Открывать уроки раздела по порядку: следующий — после зачёта блиц-теста предыдущего (80 %)</label></div>
  <div class="blk"><h2 style="font-size:17px">Пароль наставника</h2><p class="mut sm">Пароль закрывает вход в режим наставника в интерфейсе. Права на изменение уроков дополнительно проверяются по роли «Редактор».</p>
  <div class="form" style="max-width:420px"><label>Новый пароль<input class="inp" id="np1" type="password" autocomplete="new-password"></label><label>Повторите пароль<input class="inp" id="np2" type="password" autocomplete="new-password"></label></div>
  <button class="btn pri" id="npgo" style="margin-top:10px">Сменить пароль</button><div class="res hidden" id="npres"></div></div>`;
}

/* ----- редактор урока ----- */
function edStart(id,sec){
  if(id){const l=ALL.find(x=>x.id===id);if(!l)return false;ED=clone(l)}
  else{const nums=ALL.filter(x=>x.s===sec).map(x=>parseInt(x.id.replace(/^\D+/,""))||0);ED={id:sec+(Math.max(0,...nums)+1),s:sec,t:"",sc:"conc",kw:"",d:[],c:[],p:"",n:[],ok:[],a:"",notes:"",vids:[],gal:[],photo:null,okPhoto:null,hidden:false,isNew:true}}
  ED.notes=ED.notes||"";ED.vids=ED.vids||[];ED.gal=ED.gal||[];ED.dtype=ED.dtype||"stain";return true;
}
const lines=a=>a.join("\n");
const normToLine=n=>[nm(n[0])[0],n[1],n[2]].join(" | ");
function parseNorm(s){const p=s.split("|").map(x=>x.trim());if(!p[0])return null;const key=Object.keys(N).find(k=>k===p[0]||N[k][0]===p[0])||p[0];return[key,p[1]||"",p[2]||""]}
function editorPage(){
  const l=ED;const up=!!P.assets;
  return `<div class="crumbs"><a href="#/mentor">Кабинет наставника</a> / ${l.isNew?"Новый урок":"Редактирование"} ${l.id}</div>
  <h1 style="font-size:clamp(22px,3.5vw,30px);margin-bottom:12px">${l.isNew?"Новый урок":"Урок"} ${l.id}${l.t?": "+esc(l.t):""}</h1>
  ${up?"":`<p class="note">Загрузка фото доступна только наставникам с ролью «Редактор» в опубликованной версии.</p>`}
  <div class="blk"><h2 style="font-size:17px">Основное</h2><div class="form">
   <label>Название урока<input class="inp" data-e="t" value="${esc(l.t)}"></label>
   <label>Ключевые слова для подбора видео и фото<input class="inp" data-e="kw" value="${esc(l.kw)}" placeholder="например: монтаж оконного блока ПВХ"></label>
   <label>Что смотреть в проекте<input class="inp" data-e="p" value="${esc(l.p)}" placeholder="АР — узел примыкания, лист…"></label>
  </div></div>

  <div class="blk"><h2 style="font-size:17px">Задание «Найди дефект»</h2>
   <div class="row" style="margin-bottom:10px">
    <label class="btn ${up?"":"disabled"}">${l.photo?"Заменить фото задания":"Загрузить фото с дефектами"}<input type="file" accept="image/*" hidden id="edph" ${up?"":"disabled"}></label>
    ${l.photo?`<button class="btn" id="edphdel">Вернуться к учебной схеме</button>`:`<label>Схема: <select class="inp" id="edsc">${Object.keys(SCN).map(k=>`<option value="${k}" ${l.sc===k?"selected":""}>${SCN[k]}</option>`).join("")}</select></label>
    <label>Тип отметки: <select class="inp" id="edtype">${Object.keys(DFN).map(k=>`<option value="${k}" ${l.dtype===k?"selected":""}>${DFN[k]}</option>`).join("")}</select></label>`}
   </div>
   <p class="mut sm">Щёлкните по ${l.photo?"фото":"схеме"} в месте дефекта — появится номер. Заполните название дефекта и объяснение, почему это нарушение. Абитуриент увидит ${l.photo?"фото":"схему"} без отметок.</p>
   <div id="edcanvas"></div><div class="res hidden" id="edup"></div></div>

  <div class="blk"><h2 style="font-size:17px">Как правильно</h2>
   <div class="row" style="margin-bottom:10px"><label class="btn ${up?"":"disabled"}">${l.okPhoto?"Заменить эталонное фото":"Загрузить эталонное фото «правильно»"}<input type="file" accept="image/*" hidden id="edok" ${up?"":"disabled"}></label>${l.okPhoto?`<button class="btn" id="edokdel">Убрать эталонное фото</button>`:""}</div>
   ${l.okPhoto?`<img class="scn" style="max-width:420px" src="${blobUrl(l.okPhoto.id)}" alt="Эталон">`:""}
   <label class="form">Признаки правильного выполнения — по одному на строку<textarea class="inp" rows="4" data-l="ok">${esc(lines(l.ok))}</textarea></label></div>

  <div class="blk"><h2 style="font-size:17px">Подсказки наставника и примеры</h2>
   <label class="form">На что обратить внимание (видит абитуриент в блоке «Посмотри»)<textarea class="inp" rows="5" data-e="notes" placeholder="Например: на этом объекте подрядчик часто не ставит подкладки под раму — проверяйте каждую створку.">${esc(l.notes)}</textarea></label>
   <h3 style="font-size:15px;margin:14px 0 8px">Фото-примеры с объектов</h3>
   <label class="btn ${up?"":"disabled"}">＋ Добавить фото-примеры<input type="file" accept="image/*" multiple hidden id="edgal" ${up?"":"disabled"}></label>
   <div class="gal" id="edgallist" style="margin-top:10px">${l.gal.map((g,i)=>`<figure><img src="${blobUrl(g.id)}" alt=""><input class="inp" data-gi="${i}" value="${esc(g.cap||"")}" placeholder="Подпись к фото"><button class="btn" data-gdel="${i}">Удалить</button></figure>`).join("")}</div>
   <label class="form" style="margin-top:14px">Видео — по одному на строку: Название | ссылка<textarea class="inp" rows="3" data-l="vids" placeholder="Монтаж окна по ГОСТ 30971 | https://www.youtube.com/watch?v=...">${esc(l.vids.map(v=>v.join(" | ")).join("\n"))}</textarea></label></div>

  <div class="blk"><h2 style="font-size:17px">Чек-лист, нормативы, замечание</h2><div class="form">
   <label>Что проверяет ТН — по шагу на строку<textarea class="inp" rows="6" data-l="c">${esc(lines(l.c))}</textarea></label>
   <label>Нормативы — по одному на строку: Документ | пункт или раздел | требование<textarea class="inp" rows="5" data-l="n">${esc(l.n.filter(n=>n[0]!=="PRJ").map(normToLine).join("\n"))}</textarea></label>
   <details class="sm"><summary>Коды документов из нормативной базы</summary>${Object.keys(N).filter(k=>k!=="PRJ").map(k=>`<div><b>${esc(N[k][0])}</b> — ${esc(N[k][1])}</div>`).join("")}<p class="mut">Можно вписать и другой документ — он появится в нормативной базе.</p></details>
   <label>Действия для замечания DES<textarea class="inp" rows="3" data-e="a">${esc(l.a)}</textarea></label>
  </div></div>

  <div class="row edbar no-print"><button class="btn pri" id="edsave">Сохранить урок</button>${l.isNew?"":`<a class="btn" href="#/l/${l.id}">Открыть урок</a><button class="btn" id="edhide">${l.hidden?"Показать урок абитуриентам":"Скрыть урок"}</button>`}${l.base&&l.edited?`<button class="btn" id="edrev">Вернуть базовую версию</button>`:""}<a class="btn" href="#/mentor">Отмена</a><span class="mut sm" id="edmsg">${esc(FLASH)}</span></div>`;
}
function edCanvas(){
  const l=ED,box=document.getElementById("edcanvas");if(!box)return;
  box.innerHTML=`<div class="grid2"><div class="task-wrap" style="cursor:crosshair">${svgOf(l,"answer","edsvg")}</div><div><ol class="dlist" style="margin-top:0">${l.d.map((d,i)=>`<li><div class="form"><input class="inp" data-dn="${i}" value="${esc(d[3])}" placeholder="Название дефекта"><textarea class="inp" rows="2" data-dw="${i}" placeholder="Почему это нарушение">${esc(d[4])}</textarea></div><button class="btn" data-ddel="${i}" style="margin-top:6px">Удалить отметку</button></li>`).join("")||`<p class="mut">Отметок пока нет.</p>`}</ol></div></div>`;
  const svg=document.getElementById("edsvg");
  svg.addEventListener("click",e=>{const p=svgPt(svg,e);ED.d.push([l.photo?"pt":(ED.dtype||"stain"),Math.round(p.x),Math.round(p.y),"",""]);dirty=true;edCanvas();const inp=box.querySelector(`[data-dn="${ED.d.length-1}"]`);if(inp)inp.focus()});
}
function dataUrlToBlob(u){const [h,b]=u.split(",");const bin=atob(b);const a=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)a[i]=bin.charCodeAt(i);return new Blob([a],{type:(h.match(/data:([^;]+)/)||[,"image/jpeg"])[1]})}
function shrink(f,max=1600){return new Promise(res=>{const fr=new FileReader();fr.onload=()=>{const im=new Image();im.onload=()=>{const s=Math.min(1,max/Math.max(im.width,im.height));const c=document.createElement("canvas");c.width=Math.round(im.width*s);c.height=Math.round(im.height*s);c.getContext("2d").drawImage(im,0,0,c.width,c.height);res({url:c.toDataURL("image/jpeg",.84),w:c.width,h:c.height})};im.onerror=()=>res(null);im.src=fr.result};fr.onerror=()=>res(null);fr.readAsDataURL(f)})}
async function uploadImg(f){
  const m=document.getElementById("edup");if(m){m.classList.remove("hidden");m.textContent="Загружаю фото…"}
  const s=await shrink(f);if(!s){if(m)m.textContent="Не удалось прочитать файл — выберите JPG или PNG.";return null}
  try{const r=await P.assets.upload(dataUrlToBlob(s.url));if(m)m.classList.add("hidden");return{id:r.id,w:s.w,h:s.h}}
  catch(e){const t={too_large:"Файл слишком большой.",unsupported_type:"Этот формат не поддерживается.",quota_or_state:"Хранилище фото заполнено — удалите ненужные фото.",rate_limited:"Слишком много загрузок подряд — подождите минуту."}[e&&e.code]||"Фото не загрузилось. Попробуйте ещё раз.";if(m){m.classList.remove("hidden");m.textContent=t}else alert(t);return null}
}
function bindEditor(){
  edCanvas();
  app.querySelectorAll("[data-e]").forEach(i=>i.addEventListener("input",()=>{ED[i.dataset.e]=i.value;dirty=true}));
  app.querySelectorAll("[data-l]").forEach(i=>i.addEventListener("input",()=>{dirty=true;const ls=i.value.split("\n").map(x=>x.trim()).filter(Boolean);const k=i.dataset.l;
    if(k==="n")ED.n=ls.map(parseNorm).filter(Boolean);else if(k==="vids")ED.vids=ls.map(x=>{const p=x.split("|").map(y=>y.trim());return p.length>1?[p[0],p.slice(1).join("|")]:["",p[0]]}).filter(v=>/^https?:\/\//.test(v[1]));else ED[k]=ls}));
  const box=document.getElementById("edcanvas");
  box.addEventListener("input",e=>{const t=e.target;if(t.dataset.dn!=null)ED.d[+t.dataset.dn][3]=t.value;if(t.dataset.dw!=null)ED.d[+t.dataset.dw][4]=t.value;dirty=true});
  box.addEventListener("click",e=>{const t=e.target;if(t.dataset.ddel!=null){ED.d.splice(+t.dataset.ddel,1);edCanvas()}});
  const sc=document.getElementById("edsc");if(sc)sc.onchange=()=>{ED.sc=sc.value;edCanvas()};
  const ty=document.getElementById("edtype");if(ty)ty.onchange=()=>{ED.dtype=ty.value};
  const ph=document.getElementById("edph");if(ph)ph.onchange=async()=>{const f=ph.files[0];if(!f)return;if(ED.d.length&&!confirm("Отметки дефектов будут сброшены — их нужно поставить заново на новом фото. Продолжить?")){ph.value="";return}const r=await uploadImg(f);if(r){ED.photo=r;ED.d=[];dirty=true;render()}};
  const phd=document.getElementById("edphdel");if(phd)phd.onclick=()=>{if(!confirm("Убрать фото задания и вернуться к учебной схеме? Отметки будут сброшены."))return;ED.photo=null;ED.d=[];render()};
  const ok=document.getElementById("edok");if(ok)ok.onchange=async()=>{const f=ok.files[0];if(!f)return;const r=await uploadImg(f);if(r){ED.okPhoto=r;dirty=true;render()}};
  const okd=document.getElementById("edokdel");if(okd)okd.onclick=()=>{ED.okPhoto=null;render()};
  const gal=document.getElementById("edgal");if(gal)gal.onchange=async()=>{for(const f of gal.files){const r=await uploadImg(f);if(r)ED.gal.push({id:r.id,cap:""})}dirty=true;render()};
  const gl=document.getElementById("edgallist");
  gl.addEventListener("input",e=>{if(e.target.dataset.gi!=null)ED.gal[+e.target.dataset.gi].cap=e.target.value});
  gl.addEventListener("click",e=>{if(e.target.dataset.gdel!=null){ED.gal.splice(+e.target.dataset.gdel,1);render()}});
  document.getElementById("edsave").onclick=edSave;
  const hd=document.getElementById("edhide");if(hd)hd.onclick=()=>{ED.hidden=!ED.hidden;edSave()};
  const rv=document.getElementById("edrev");if(rv)rv.onclick=async()=>{if(!confirm("Удалить все изменения наставника и вернуть исходную версию урока?"))return;try{await P.db.doc("cms/main/lessons/"+ED.id).delete();dirty=false;ED=null;location.hash="#/mentor"}catch(e){alert("Не удалось: нет прав на запись.")}};
}
async function edSave(){
  const msg=document.getElementById("edmsg");
  if(!ED.t.trim()){alert("Введите название урока.");return}
  const bad=ED.d.findIndex(d=>!d[3].trim());if(bad>=0){alert(`Заполните название дефекта № ${bad+1}.`);return}
  const out={id:ED.id,t:ED.t.trim(),sc:ED.sc||"conc",kw:ED.kw||ED.t,d:ED.d,c:ED.c,p:ED.p,n:ED.n,ok:ED.ok,a:ED.a,notes:ED.notes,vids:ED.vids,gal:ED.gal,photo:ED.photo||null,okPhoto:ED.okPhoto||null,hidden:!!ED.hidden,upd:now(),by:P.uid||""};
  msg.textContent="Сохраняю…";
  try{await P.db.doc("cms/main/lessons/"+ED.id).set(clone(out));FLASH="Урок сохранён "+new Date().toLocaleTimeString("ru-RU")+" — изменения уже видны абитуриентам.";msg.textContent=FLASH;dirty=false;ED.isNew=false;ED.edited=true}
  catch(e){msg.textContent=e&&e.code==="quota_exceeded"?"База заполнена — удалите ненужные уроки.":"Не сохранено: нет прав на запись (нужна роль «Редактор»)."}
}

/* ----- журнал абитуриентов ----- */
async function loadJournal(){
  JR={loading:true,rows:[]};
  try{const s=await P.db.collection("trainees").limit(1000).get();JR={rows:s.docs.map(d=>Object.assign({uid:d.id},clone(d.data()))).filter(r=>r.prof),acc:{}};try{const a=await P.db.collection("cms/main/access").limit(1000).get();a.docs.forEach(d=>{JR.acc[d.id]=clone(d.data())})}catch(e){}}catch(e){JR={rows:[],acc:{},err:true}}
  if(location.hash.startsWith("#/mentor/journal")||location.hash.startsWith("#/mentor/t/"))render();
}
function tStats(r){const ids=LS.map(l=>l.id),lp2=r.lp||{};const done=ids.filter(id=>lp2[id]&&lp2[id].p).length;const qs=ids.map(id=>lp2[id]&&lp2[id].q).filter(x=>x!=null);const last=[r.upd,...Object.values(lp2).flatMap(x=>[x.o,x.qd,x.p,x.f&&x.f[2]])].filter(Boolean).sort().pop();const ex=(r.ex||[]).slice(-1)[0];return{done,avg:qs.length?Math.round(qs.reduce((a,b)=>a+b,0)/qs.length):null,last,ex,fp:r.tr&&r.tr.tot?pct(r.tr.hit,r.tr.tot):null}}
function accOf(uid){const a=JR&&JR.acc&&JR.acc[uid];if(a&&Array.isArray(a.secs))return a.secs;return CFG.accDef==="none"?[]:SEC.map(s=>s[0])}
async function accSet(uid,secs,msgEl){try{await P.db.doc("cms/main/access/"+uid).set({secs,upd:now(),by:P.uid||""});JR.acc[uid]={secs};if(msgEl){msgEl.textContent="Сохранено "+new Date().toLocaleTimeString("ru-RU")}return true}catch(e){if(msgEl)msgEl.textContent="Не сохранено: нет прав на запись.";return false}}
function accMatrix(rows){return `<p class="mut sm">Отметьте, какие разделы видит и проходит каждый абитуриент. Изменения сохраняются сразу — абитуриент увидит новый набор разделов без перезагрузки страницы. Новым абитуриентам по умолчанию ${CFG.accDef==="none"?"<b>закрыты все разделы</b>":"<b>открыты все разделы</b>"} (меняется в «Настройках»).</p>
  <div class="blk"><div class="tbl-wrap"><table class="nt acc"><tr><th>ФИО</th>${SEC.map(s=>`<th title="${esc(s[1])}" style="text-align:center">${s[0]}</th>`).join("")}<th>Быстро</th></tr>
  ${rows.map(r=>{const a=accOf(r.uid);return `<tr><td>${esc(r.prof.fio)}<div class="mut sm">${esc(r.prof.spec||"")}</div></td>${SEC.map(s=>`<td style="text-align:center"><input type="checkbox" class="accb" data-u="${esc(r.uid)}" data-s="${s[0]}" ${a.includes(s[0])?"checked":""} aria-label="${esc(r.prof.fio)}: раздел ${s[0]}"></td>`).join("")}<td style="white-space:nowrap"><button class="btn sm" data-accall="${esc(r.uid)}">Все</button> <button class="btn sm" data-accnone="${esc(r.uid)}">Снять</button></td></tr>`}).join("")||`<tr><td colspan="${SEC.length+2}" class="mut">Пока никто не зарегистрировался.</td></tr>`}</table></div>
  <div class="row" style="margin-top:10px"><span class="sm" id="accmsg"></span></div>
  <details class="sm" style="margin-top:10px" open><summary>Расшифровка разделов</summary>${SEC.map(s=>`<div><b>${s[0]}</b> — ${esc(s[1])}</div>`).join("")}</details></div>`}
function journalPage(){
  if(!JR){loadJournal();return `<h1 style="font-size:clamp(24px,4vw,34px)">Журнал абитуриентов</h1>${mNav("j")}<p>Загрузка…</p>`}
  if(JR.loading)return `<h1 style="font-size:clamp(24px,4vw,34px)">Журнал абитуриентов</h1>${mNav("j")}<p>Загрузка…</p>`;
  const q=(JR.q||"").toLowerCase();const rows=JR.rows.filter(r=>!q||[r.prof.fio,r.prof.spec,r.prof.lvl,r.prof.obj].join(" ").toLowerCase().includes(q)).sort((a,b)=>(a.prof.fio||"").localeCompare(b.prof.fio||"","ru"));
  return `<h1 style="font-size:clamp(24px,4vw,34px)">Журнал абитуриентов</h1>${mNav("j")}
  ${JR.err?`<p class="note">Журнал не загрузился. Обновите страницу.</p>`:""}
  <div class="row" style="margin:10px 0"><input class="inp" id="jq" placeholder="Поиск по ФИО, специальности, объекту" value="${esc(JR.q||"")}" style="min-width:280px"><button class="btn" id="jre">Обновить</button>${P.dl?`<button class="btn pri" id="jcsv">Скачать журнал (CSV для Excel)</button>`:""}<button class="btn" id="jpr">Печать</button></div>
  <div class="extabs"><button type="button" class="${JR.view==="acc"?"":"on"}" data-jv="list">Журнал</button><button type="button" class="${JR.view==="acc"?"on":""}" data-jv="acc">Доступ к разделам ✓</button></div>
  <p class="mut sm">Абитуриентов: ${JR.rows.length}. Уроков в курсе: ${LS.length}.</p>${JR.view==="acc"?accMatrix(rows):`
  <div class="blk"><div class="tbl-wrap"><table class="nt"><tr><th>ФИО</th><th>Специальность</th><th>Уровень</th><th>В школе с</th><th>Пройдено</th><th>Ср. тест</th><th>Дефекты</th><th>Посл. активность</th><th>Аттестация</th><th>Открыто разделов</th></tr>
  ${rows.map(r=>{const s=tStats(r);return `<tr><td><a href="#/mentor/t/${encodeURIComponent(r.uid)}">${esc(r.prof.fio)}</a></td><td>${esc(r.prof.spec||"")}</td><td>${esc(r.prof.lvl||"")}</td><td>${fdd(r.prof.reg)}</td><td>${s.done}/${LS.length}</td><td>${s.avg!=null?s.avg+"%":"—"}</td><td>${s.fp!=null?s.fp+"%":"—"}</td><td>${fd(s.last)}</td><td>${s.ex?`<span class="pill ${s.ex.pc>=80?"ok":"no"}">${s.ex.pc}% · ${fdd(s.ex.date)}</span>`:"—"}</td><td>${accOf(r.uid).length}/${SEC.length}</td></tr>`}).join("")||`<tr><td colspan="11" class="mut">Пока никто не зарегистрировался. Поделитесь ссылкой на школу с абитуриентами.</td></tr>`}</table></div></div>`}`;
}
function traineePage(uid){
  if(!JR||JR.loading){if(!JR)loadJournal();return `<p>Загрузка…</p>`}
  const r=JR.rows.find(x=>x.uid===uid);if(!r)return notFound();const lp2=r.lp||{},s=tStats(r);
  return `<div class="crumbs no-print"><a href="#/mentor/journal">Журнал абитуриентов</a> / ${esc(r.prof.fio)}</div>
  <div class="blk"><h1 style="font-size:clamp(22px,3.5vw,30px)">${esc(r.prof.fio)}</h1><p class="mut">${esc(r.prof.spec||"")} · ${esc(r.prof.lvl||"")}${r.prof.obj?" · "+esc(r.prof.obj):""} · в школе с ${fd(r.prof.reg)}</p>
  <div class="stat"><div><b>${s.done}/${LS.length}</b>уроков пройдено</div><div><b>${s.avg!=null?s.avg+"%":"—"}</b>средний балл тестов</div><div><b>${s.fp!=null?s.fp+"%":"—"}</b>дефектов найдено</div><div><b>${(r.ex||[]).length}</b>аттестаций</div></div>
  <button class="btn no-print" id="jpr">Печать карточки</button></div>
  <div class="blk no-print"><h2 style="font-size:16px;margin-bottom:8px">Доступ к разделам</h2><p class="mut sm">Отмеченные разделы абитуриент видит на экране и может проходить.</p>
  <div class="chk">${SEC.map(sc=>`<label><input type="checkbox" class="accb" data-u="${esc(uid)}" data-s="${sc[0]}" ${accOf(uid).includes(sc[0])?"checked":""}><span>${sc[0]}. ${esc(sc[1])}</span></label>`).join("")}</div>
  <div class="row" style="margin-top:8px"><button class="btn sm" data-accall="${esc(uid)}">Открыть все</button><button class="btn sm" data-accnone="${esc(uid)}">Закрыть все</button><span class="sm" id="accmsg"></span></div></div>
  ${(r.ex||[]).length?`<div class="blk"><h2 style="font-size:16px">Аттестации</h2><div class="tbl-wrap"><table class="nt"><tr><th>Дата</th><th>Разделы</th><th>Результат</th></tr>${r.ex.slice().reverse().map(e=>`<tr><td>${fd(e.date)}</td><td>${esc(e.secs)}</td><td><span class="pill ${e.pc>=80?"ok":"no"}">${e.pc}% · ${e.ok}/${e.n}</span></td></tr>`).join("")}</table></div></div>`:""}
  ${SEC.map(sc=>`<div class="blk"><h2 style="font-size:16px">${sc[0]}. ${esc(sc[1])}</h2><div class="tbl-wrap"><table class="nt"><tr><th>Урок</th><th>Начат</th><th>Найди дефект</th><th>Тест (попыток)</th><th>Пройден</th></tr>${LS.filter(l=>l.s===sc[0]).map(l=>{const x=lp2[l.id]||{};return `<tr><td>${l.id}. ${esc(l.t)}</td><td>${fd(x.o)}</td><td>${x.f?`${x.f[0]}/${x.f[1]} · ${fdd(x.f[2])}`:"—"}</td><td>${x.q!=null?`${x.q}% (${x.qa||1})`:"—"}</td><td>${x.p?fd(x.p):"—"}</td></tr>`}).join("")}</table></div></div>`).join("")}`;
}
async function journalCsv(btn){
  const q=v=>`"${String(v==null?"":v).replace(/"/g,'""')}"`;
  const head=["ФИО","Специальность","Уровень","Объект","В школе с","Пройдено уроков","Всего уроков","Средний балл тестов","Найдено дефектов %","Последняя активность","Последняя аттестация %","Дата аттестации","Открытые разделы",...LS.map(l=>"Пройден "+l.id)];
  const body=JR.rows.map(r=>{const s=tStats(r),lp2=r.lp||{};return[r.prof.fio,r.prof.spec,r.prof.lvl,r.prof.obj,fdd(r.prof.reg),s.done,LS.length,s.avg,s.fp,fd(s.last),s.ex?s.ex.pc:"",s.ex?fdd(s.ex.date):"",accOf(r.uid).join(" "),...LS.map(l=>lp2[l.id]&&lp2[l.id].p?fdd(lp2[l.id].p):"")].map(q).join(";")});
  try{await P.dl.save({filename:"zhurnal-shkola-tn-"+new Date().toISOString().slice(0,10)+".csv",data:"\ufeff"+[head.map(q).join(";"),...body].join("\r\n")})}catch(e){if(e&&e.code!=="cancelled")alert("Скачивание недоступно в этом окне.")}
}

/* ================= МАРШРУТИЗАЦИЯ ================= */
function render(){
  const h=(location.hash||"#/").replace(/^#\/?/,"");const [p,a,b]=h.split("/");
  document.getElementById("upd").classList.add("hidden");
  document.querySelectorAll("#nav a").forEach(x=>x.classList.toggle("on",x.dataset.r===(p==="s"||p==="l"?"":p)));
  if(EX&&EX.t&&p!=="exam"){clearInterval(EX.t);EX=null}
  const who=document.getElementById("who");who.textContent=st.prof?st.prof.fio.split(" ").slice(0,2).join(" ")+(isMentor()?" · наставник":""):"";who.classList.toggle("hidden",!st.prof);
  dirty=false;let html;
  if(!P.ready)html=`<div class="blk"><p>Подключение к базе школы…</p></div>`;
  else if(p==="mentor"){
    if(!isMentor())html=mentorGate();
    else if(a==="new"){if(SEC.some(s=>s[0]===b)){edStart(null,b);history.replaceState(null,"","#/mentor/edit/"+ED.id);html=editorPage()}else html=notFound()}
    else if(a==="edit"){if((ED&&ED.id===b)||edStart(b))html=editorPage();else html=notFound()}
    else if(a==="journal")html=journalPage();
    else if(a==="t")html=traineePage(decodeURIComponent(b||""));
    else if(a==="settings")html=mentorSettings();
    else{ED=null;html=mentorDash()}
  }
  else if(!st.prof||p==="register")html=registerPage();
  else if(!p)html=home();else if(p==="s")html=secPage(a);else if(p==="l")html=lessonPage(a);else if(p==="trainer")html=trainerPage();else if(p==="video")html=videoPage();else if(p==="norms")html=normsPage();else if(p==="des")html=desPage();else if(p==="exam")html=examPage();else if(p==="progress")html=progressPage();else html=notFound();
  app.innerHTML=html;window.scrollTo(0,0);
  bindPage(p,a,b);
}
function bindPage(p,a,b){
  if(!P.ready)return;
  if(p==="mentor"){
    const go=document.getElementById("mgo");if(go){const tryIn=async()=>{const pw=document.getElementById("mpw").value;const hh=await hashPw(pw);const ok=CFG.passHash?hh===CFG.passHash:pw==="123456";if(ok){try{sessionStorage.setItem("tnMentor","1")}catch(e){}render()}else{const m=document.getElementById("merr");m.classList.remove("hidden");m.textContent="Неверный пароль."}};go.onclick=tryIn;document.getElementById("mpw").onkeydown=e=>{if(e.key==="Enter")tryIn()};return}
    const mo=document.getElementById("mout");if(mo)mo.onclick=()=>{try{sessionStorage.removeItem("tnMentor")}catch(e){}location.hash="#/"};
    if(a==="edit"||a==="new")bindEditor();
    if(!a){
      app.querySelectorAll("[data-ren]").forEach(bt=>bt.onclick=async()=>{const k=bt.dataset.ren;const n=prompt("Новое название раздела",secName(k));if(!n)return;try{await P.db.doc("cms/main/sections/"+k).set({k,name:n.trim(),hidden:false})}catch(e){alert("Нет прав на запись.")}});
      app.querySelectorAll("[data-hidesec]").forEach(bt=>bt.onclick=async()=>{const k=bt.dataset.hidesec;if(!confirm(`Удалить раздел ${k}? Его уроки перестанут показываться абитуриентам.`))return;try{await P.db.doc("cms/main/sections/"+k).set({k,name:secName(k),hidden:true})}catch(e){alert("Нет прав на запись.")}});
      app.querySelectorAll("[data-unhide]").forEach(bt=>bt.onclick=async()=>{const k=bt.dataset.unhide;try{await P.db.doc("cms/main/sections/"+k).set(Object.assign({},CSEC[k],{hidden:false}))}catch(e){uiAlert("Нет прав на запись.")}});
      const as=document.getElementById("addsec");if(as)as.onclick=async()=>{const n=prompt("Название нового раздела");if(!n)return;const used=new Set([...BASE_SEC.map(s=>s[0]),...Object.keys(CSEC)]);const k="KLMNOPQRSTUVWXYZ".split("").find(c=>!used.has(c));if(!k){alert("Достигнут предел разделов.");return}try{await P.db.doc("cms/main/sections/"+k).set({k,name:n.trim(),hidden:false})}catch(e){alert("Нет прав на запись.")}};
    }
    if(a==="settings"){
      document.getElementById("seq").onchange=async e=>{try{await P.db.doc("cms/main").set(Object.assign({},CFG,{seq:e.target.checked}));FLASH="Настройка сохранена."}catch(er){alert("Нет прав на запись.")}};
      document.getElementById("npgo").onclick=async()=>{const p1=document.getElementById("np1").value,p2=document.getElementById("np2").value,m=document.getElementById("npres");m.classList.remove("hidden");if(p1.length<6){m.textContent="Пароль должен быть не короче 6 символов.";return}if(p1!==p2){m.textContent="Пароли не совпадают.";return}try{await P.db.doc("cms/main").set(Object.assign({},CFG,{passHash:await hashPw(p1)}));FLASH="Пароль наставника изменён.";m.textContent=FLASH}catch(e){m.textContent="Нет прав на запись."}};
    }
    const accSave=async(uid,msg)=>{const secs=[...app.querySelectorAll(`.accb[data-u="${CSS.escape(uid)}"]`)].filter(x=>x.checked).map(x=>x.dataset.s);await accSet(uid,secs,msg)};
    app.querySelectorAll(".accb").forEach(cb=>cb.onchange=()=>accSave(cb.dataset.u,document.getElementById("accmsg")));
    app.querySelectorAll("[data-accall],[data-accnone]").forEach(bt=>bt.onclick=()=>{const uid=bt.dataset.accall||bt.dataset.accnone,on=!!bt.dataset.accall;app.querySelectorAll(`.accb[data-u="${CSS.escape(uid)}"]`).forEach(x=>x.checked=on);accSave(uid,document.getElementById("accmsg"))});
    app.querySelectorAll("[data-jv]").forEach(bt=>bt.onclick=()=>{JR.view=bt.dataset.jv;render()});
    app.querySelectorAll('input[name="accdef"]').forEach(r=>r.onchange=async()=>{try{await P.db.doc("cms/main").set(Object.assign({},CFG,{accDef:r.value}));FLASH="Настройка доступа сохранена."}catch(e){uiAlert("Нет прав на запись.")}});
    if(a==="journal"&&JR&&!JR.loading){const jq=document.getElementById("jq");jq.oninput=()=>{JR.q=jq.value;const pos=jq.selectionStart;render();const n=document.getElementById("jq");n.focus();n.setSelectionRange(pos,pos)};document.getElementById("jre").onclick=()=>{JR=null;render()};const c=document.getElementById("jcsv");if(c)c.onclick=()=>journalCsv(c)}
    const jp=document.getElementById("jpr");if(jp)jp.onclick=()=>window.print();
    return;
  }
  if(!st.prof||p==="register"){document.getElementById("rgo").onclick=()=>{const fio=document.getElementById("rf").value.trim();if(fio.split(/\s+/).length<2){alert("Введите фамилию и имя полностью.");return}st.prof={fio,spec:document.getElementById("rs").value.trim(),lvl:document.getElementById("rl").value,obj:document.getElementById("ro").value.trim(),reg:(st.prof&&st.prof.reg)||now()};save();location.hash=p==="register"?"#/progress":"#/";render()};return}
  if(p==="l"&&LS.find(x=>x.id===a)&&!locked(LS.find(x=>x.id===a)))bindLesson(LS.find(x=>x.id===a));
  if(p==="trainer"){document.getElementById("trsec").onchange=e=>{TR.sec=e.target.value;trainerLoad()};document.getElementById("trnext").onclick=trainerLoad;trainerLoad()}
  if(p==="des"){document.getElementById("dessec").onchange=e=>{TR.des=e.target.value;render()};document.querySelectorAll("[data-copy]").forEach(bt=>bt.onclick=()=>{const l=LS.find(x=>x.id===bt.dataset.copy);copyText(plain(desText(l,st.desf||{},l.d.map(()=>true))),bt)})}
  if(p==="exam"){
    const g=document.getElementById("exgo");if(g)g.onclick=examStart;
    const e=document.getElementById("exend");if(e)e.onclick=()=>{const left=EX.qs.length-document.querySelectorAll("#exq input:checked").length;if(left&&!confirm(`Без ответа осталось вопросов: ${left}. Завершить?`))return;examFinish()};
    if(EX&&EX.stage==="run"){dirty=true;const tick=()=>{const s=Math.max(0,Math.round((EX.end-Date.now())/1000));const el=document.getElementById("timer");if(el)el.textContent=`${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`;if(s<=0)examFinish()};clearInterval(EX.t);EX.t=setInterval(tick,1000);tick()}
    const pr=document.getElementById("exprint");if(pr)pr.onclick=()=>window.print();
    const ag=document.getElementById("exagain");if(ag)ag.onclick=()=>{EX=null;render()};
  }
}
window.addEventListener("hashchange",()=>{FLASH="";render()});
document.getElementById("updgo").onclick=()=>{if(dirty&&!confirm("Несохранённые изменения на этой странице пропадут. Обновить?"))return;dirty=false;render()};
document.getElementById("thm").onclick=()=>{const r=document.documentElement;const dark=r.dataset.theme?r.dataset.theme==="dark":matchMedia("(prefers-color-scheme: dark)").matches;r.dataset.theme=dark?"light":"dark";try{localStorage.setItem("tnTheme",r.dataset.theme)}catch(e){}};
try{const t=localStorage.getItem("tnTheme");if(t)document.documentElement.dataset.theme=t}catch(e){}
render();
initPlatform();
</script>
</body>
</html>
