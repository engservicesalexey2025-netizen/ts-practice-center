
/* ================= УРОК ПО ШАГАМ ================= */
const STEP_T={look:"Посмотри",lec:"Лекция",vid:"Видео и материалы",task:"Найди дефект",ans:"Ответы",chk:"Чек-лист ТН",norm:"Норматив РК",rw:"Правильно / неправильно",des:"Замечание DES",quiz:"Блиц-тест"};
const STEP_TAB={look:"main",lec:"lec",vid:"links",task:"defect",ans:"defect",chk:"check",norm:"norms",rw:"ok",des:"des",quiz:"quiz"};
let PENDING_EXI=null;
function exAll(l){return [{t:l.et,photo:l.photo||null,sc:l.sc,d:l.d||[],main:true},...(l.ex||[]).map(e=>({t:e.t,photo:e.photo||null,sc:e.sc||"conc",d:e.d||[]}))].map((e,i)=>Object.assign(e,{i,t:e.t||`Упражнение ${i+1}`}))}
function exList(l){const a=exAll(l);return isMentor()?a:a.filter(e=>e.d.length)}
function exSt(x){return{fx:x.fx||(x.fall?{0:x.fall}:{}),sx:x.sx||(x.seen?{0:x.seen}:{})}}
function taskOK(l,x){const s=exSt(x);return exAll(l).filter(e=>e.d.length).every(e=>s.fx[e.i]||s.sx[e.i])}
function taskDone(l,x){const s=exSt(x);return exAll(l).filter(e=>e.d.length).every(e=>s.fx[e.i])}
function lessonSteps(l){const s=["look"];if((l.lec&&l.lec.length)||isMentor())s.push("lec");s.push("vid");if(exList(l).length)s.push("task");s.push("chk","norm","des","quiz");return s}
const stTitle=(l,k)=>(l.stt&&l.stt[k])||STEP_T[k];
const autoVids=l=>[["Технология выполнения — подборка YouTube",lk.yt(l)],["Типовые ошибки и дефекты — подборка YouTube",lk.ytd(l)],["Технология на русском — подборка Rutube",lk.rt(l)]];
const autoLnk=l=>[["Фото выполнения работ",lk.ya(l)],["Фото дефектов",lk.yad(l)],["Схемы узлов",lk.gg(l)]];
const effVids=l=>l.vidsSet?(l.vids||[]):[...(l.vids||[]).filter(validLink),...(l.auto===false?[]:autoVids(l))];
const effLnk=l=>l.lnkSet?(l.lnk||[]):[...(l.lnk||[]).filter(validLink),...(l.auto===false?[]:autoLnk(l))];
function needs(l,x){return{find:CFG.needAll===false||!exAll(l).some(e=>e.d.length)||taskDone(l,x),des:!l.d.length||!!x.dp,quiz:(x.q||0)>=80,vis:lessonSteps(l).every(k=>x.v&&x.v[k])}}
function tryPass(l,x){if(x.p)return false;const n=needs(l,x);if(n.vis&&n.find&&n.des&&n.quiz){x.p=now();return true}return false}
function stepOpen(l,x,k){if(isMentor())return true;const s=lessonSteps(l),i=s.indexOf(k);if(i<0)return false;
  for(let j=0;j<i;j++){const p=s[j];if(!(x.v&&x.v[p]))return false;if(p==="task"&&!taskOK(l,x))return false}return true}
function defaultStep(l,x){const s=lessonSteps(l);if(x.p)return s[0];for(const k of s){if(!(x.v&&x.v[k]))return stepOpen(l,x,k)?k:s[0];if(k==="task"&&!taskOK(l,x))return"task";if(k==="des"&&!x.dp&&l.d.length)return"des"}return"quiz"}
const secMastered=k=>secCnt(k)>0&&secDone(k)===secCnt(k);

/* ----- быстрые правки наставника ----- */
function lessonDoc(l){const o={};["ex","et","id","t","sc","kw","d","c","p","n","ok","a","notes","vids","lnk","auto","gal","lec","qz","photo","okPhoto","hidden","stt","sti","cap","vidsSet","lnkSet"].forEach(k=>{if(l[k]!==undefined)o[k]=clone(l[k])});o.upd=now();o.by=P.uid||"";return o}
async function quickSave(l,mut){const doc=lessonDoc(ALL.find(x=>x.id===l.id)||l);mut(doc);await P.db.doc("cms/main/lessons/"+l.id).set(doc)}
function modal(title,fields,onSave,opt={}){
  const d=document.createElement("div");d.className="lb";
  d.innerHTML=`<div class="mdl" role="dialog" aria-modal="true" aria-label="${esc(title)}"><h3 style="font-size:17px;margin-bottom:12px">${esc(title)}</h3><div class="form">${fields.map((f,i)=>`<label>${esc(f.label)}${f.type==="area"?`<textarea class="inp" rows="${f.rows||5}" data-mi="${i}" placeholder="${esc(f.ph||"")}">${esc(f.value||"")}</textarea>`:`<input class="inp" data-mi="${i}" value="${esc(f.value||"")}" placeholder="${esc(f.ph||"")}">`}</label>`).join("")}</div>
  <div class="row" style="margin-top:14px"><button class="btn pri" data-ms>Сохранить</button><button class="btn" data-mc>Отмена</button>${opt.del?`<button class="btn" data-md style="margin-left:auto">Удалить</button>`:""}</div><div class="sm" data-mm style="margin-top:8px;color:var(--bad)"></div></div>`;
  document.body.appendChild(d);const close=()=>d.remove();const msg=d.querySelector("[data-mm]");
  d.addEventListener("click",e=>{if(e.target===d)close()});d.querySelector("[data-mc]").onclick=close;
  d.addEventListener("keydown",e=>{if(e.key==="Escape")close()});
  const run=async fn=>{msg.style.color="var(--mut)";msg.textContent="Сохраняю…";try{const r=await fn();if(r===false){return}close()}catch(e){msg.style.color="var(--bad)";msg.textContent=typeof e==="string"?e:"Не сохранено: нет прав на запись (нужна роль «Редактор»)."}};
  d.querySelector("[data-ms]").onclick=()=>run(()=>onSave([...d.querySelectorAll("[data-mi]")].map(x=>x.value)));
  if(opt.del)d.querySelector("[data-md]").onclick=async()=>{if(await uiConfirm("Удалить?"))run(opt.del)};
  const first=d.querySelector("[data-mi]");if(first)first.focus();
}
const chkUrl=u=>{if(!/^https?:\/\//.test(u.trim()))throw"Ссылка должна начинаться с http:// или https://"};
function editStepHead(l,k){const look=k==="look";modal(`Шаг «${stTitle(l,k)}»`,[{label:"Название шага",value:stTitle(l,k)},{label:"Вступительный текст шага (что будет в этом шаге). Строки с «- » — список",type:"area",value:(l.sti&&l.sti[k])||"",rows:6},...(look?[{label:"Подпись под схемой / фото",value:l.cap||""}]:[])],
  async v=>{await quickSave(l,doc=>{doc.stt=Object.assign({},doc.stt||{},{[k]:v[0].trim()||STEP_T[k]});doc.sti=Object.assign({},doc.sti||{},{[k]:v[1]});if(look)doc.cap=v[2]})})}
function editLink(l,kind,i){const list=(kind==="v"?effVids:effLnk)(l).map(x=>x.slice());const isNew=i<0;const cur=isNew?["",""]:list[i];
  const put=doc=>{if(kind==="v"){doc.vids=list;doc.vidsSet=true}else{doc.lnk=list;doc.lnkSet=true}};
  modal(isNew?(kind==="v"?"Новое видео":"Новая ссылка"):(kind==="v"?"Изменить видео":"Изменить ссылку"),[{label:"Название (как увидит абитуриент)",value:cur[0]},{label:"Ссылка",value:cur[1],ph:"https://…"}],
   async v=>{chkUrl(v[1]);if(isNew)list.push([v[0].trim(),v[1].trim()]);else list[i]=[v[0].trim(),v[1].trim()];await quickSave(l,put)},
   isNew?{}:{del:async()=>{list.splice(i,1);await quickSave(l,put)}})}

/* ----- DES-тренажёр ----- */
function desTask(l,seed){
  const r=rng(l.id+":des:"+seed);const other=LS.filter(x=>x.s!==l.s&&x.d.length);
  const defs=shuffle([...l.d.map(d=>[d[3],1]),...shuffle(other.flatMap(x=>x.d),r).slice(0,2).map(d=>[d[3],0])],r);
  const own=l.n.filter(n=>n[0]!=="PRJ");const nlab=k=>nm(k)[1]?`${nm(k)[0]} «${nm(k)[1]}»`:nm(k)[0];
  const norms=shuffle([...own.map(n=>[nlab(n[0]),1]),...shuffle(Object.keys(N).filter(k=>k!=="PRJ"&&!own.some(n=>n[0]===k)),r).slice(0,3).map(k=>[nlab(k),0])],r);
  const whys=shuffle([...l.d.map(d=>[d[4],1]),...shuffle(other.flatMap(x=>x.d.map(d=>d[4])),r).slice(0,2).map(w=>[w,0])],r);
  const acts=shuffle([[l.a,1],...shuffle(WRONG_ACT,r).slice(0,3).map(a=>[a,0])],r);
  return{defs,norms,whys,acts};
}
function desTaskHTML(T){const grp=(id,title,arr,multi)=>`<fieldset class="dq" data-g="${id}"><legend>${title}</legend>${arr.map((o,i)=>`<label><input type="${multi?"checkbox":"radio"}" name="dg_${id}" value="${i}"><span>${esc(o[0])}</span></label>`).join("")}<div class="dqr sm"></div></fieldset>`;
  return `<div class="des-f"><input data-f="obj" placeholder="Объект (ЖК, очередь) *"><input data-f="sec" placeholder="Блок / секция"><input data-f="ax" placeholder="Оси / этаж / отметка *"><input data-f="con" placeholder="Подрядчик / ответственный"><input data-f="term" placeholder="Срок устранения"></div>
  ${grp("defs","Комментарий: отметьте все дефекты, выявленные в этом узле",T.defs,true)}
  ${grp("norms","Норматив: отметьте все документы-основания",T.norms,true)}
  ${grp("whys","Причина: отметьте верные объяснения нарушений",T.whys,true)}
  ${grp("acts","Действия: выберите корректную формулировку",T.acts,false)}`}
function gradeDes(root,T){let all=true;const res={};
  ["defs","norms","whys","acts"].forEach(g=>{const fs=root.querySelector(`[data-g="${g}"]`);const sel=new Set([...fs.querySelectorAll("input:checked")].map(i=>+i.value));const ok=T[g].every((o,i)=>!!o[1]===sel.has(i));res[g]=ok;if(!ok)all=false;
    fs.querySelectorAll("label").forEach((lb,i)=>{lb.classList.remove("right","wrong");if(T[g][i][1])lb.classList.add("right");else if(sel.has(i))lb.classList.add("wrong")});fs.querySelector(".dqr").textContent=ok?"✓ Верно":"✗ Есть ошибки — зелёным отмечены правильные варианты";fs.querySelector(".dqr").style.color=ok?"var(--good)":"var(--bad)";fs.querySelectorAll("input").forEach(i=>i.disabled=true)});
  return{all,res}}

/* ----- страница урока ----- */
function lessonPage(id,stepK,sub){
  const l=(isMentor()?ALL:LS).find(x=>x.id===id);if(!l)return notFound();
  if(locked(l)){const sl=LS.filter(x=>x.s===l.s);const pv=sl[sl.indexOf(l)-1];return `<div class="blk"><h1 style="font-size:24px">Урок ${l.id} пока закрыт</h1><p>Уроки раздела проходятся по порядку. Сначала завершите урок ${pv.id} «${esc(pv.t)}».</p><a class="btn pri" href="#/l/${pv.id}">Перейти к уроку ${pv.id}</a></div>`}
  const x=lp(l.id),S=lessonSteps(l);let k=S.includes(stepK)?stepK:defaultStep(l,x);
  if(!stepOpen(l,x,k))k=defaultStep(l,x);x.v=x.v||{};if(!x.o)x.o=now();if(!x.v[k])x.v[k]=now();
  const i=LS.indexOf(l),nextL=LS[i+1],si=S.indexOf(k),nx=needs(l,x),M=isMentor();
  const stIcon=s=>s==="task"?(x.fall?"✓":""):s==="des"?(x.dp?"✓":""):s==="quiz"?(nx.quiz?"✓":""):(x.v&&x.v[s]?"✓":"");
  const intro=l.sti&&l.sti[k]?`<div class="step-intro">${textBlock(l.sti[k])}</div>`:"";
  const head=`<h2><span>${si+1}</span>${esc(stTitle(l,k))}${k==="des"&&exAll(l).some(e=>e.d.length)?`<button class="btn sm" data-showtask="0" style="margin-left:10px">📷 Фото узла из «Найди дефект»</button>`:""}${M?`<button class="btn edit" data-ehead="${k}">✎ Изменить</button><a class="btn edit no-print" style="margin-left:auto" href="#/mentor/edit/${l.id}/${STEP_TAB[k]}">✎ Редактор шага</a>`:""}</h2>`;
  let body="";
  if(k==="look"){const links=effLnk(l);
    body=`<div class="grid2"><figure>${cleanFig(l)}<figcaption>${esc(l.cap||(l.okPhoto?"Эталон с объекта — как должно быть":"Учебная схема узла — эталон без дефектов"))}</figcaption></figure>
    <div><div class="tbl-wrap"><table class="src">
    <tr><th>Фото / видео</th><td>Показывают, как выполняется работа. Не являются основанием для замечания.</td></tr>
    <tr><th>Проект</th><td>${esc(l.p||"—")}</td></tr>
    <tr><th>Норматив РК</th><td>${l.n.filter(n=>n[0]!=="PRJ").map(n=>`<span class="code">${esc(nm(n[0])[0])}</span>`).join(", ")||"по проекту"}</td></tr>
    <tr><th>ТН</th><td>Сверяет факт с проектом и НТД, фиксирует несоответствие в DES.</td></tr></table></div>
    <div class="links">${links.map((v,j)=>`<span class="lnkw">${M?`<button class="btn edit sm" data-elnk="${j}">✎ Изменить</button>`:""}<a target="_blank" rel="noopener" href="${esc(v[1])}">${esc(v[0]||host(v[1]))} ↗</a></span>`).join("")}${M?`<span class="lnkw"><button class="btn edit" data-elnk="-1">＋ Ссылка</button></span>`:""}</div></div></div>
    ${l.notes?`<div class="mentor-note">${M?`<div class="lec-tools no-print"><button class="btn edit sm" data-lk="notes">✎ Изменить</button><button class="btn sm" data-lk="delnotes">Удалить блок</button></div>`:""}<b>Наставник: на что обратить внимание</b><div>${textBlock(l.notes)}</div></div>`:(M?`<p class="no-print"><button class="btn edit" data-lk="notes">＋ Подсказка наставника</button></p>`:"")}
    ${l.gal.length?`<h3 style="font-size:15px;margin:16px 0 8px">Фото-примеры с объектов${M?` <button class="btn sm no-print" data-lk="delgal">Удалить блок</button>`:""}</h3><div class="gal">${l.gal.map((g,j)=>`<figure><img src="${blobUrl(g.id)}" alt="${esc(g.cap||"Фото с объекта")}" data-z="1" loading="lazy"><figcaption>${esc(g.cap||"")}</figcaption>${M?`<button class="btn sm no-print" data-lk="delg:${j}">Удалить фото</button>`:""}</figure>`).join("")}</div>`:""}`}
  if(k==="lec")body=lecView(l);
  if(k==="vid"){const vs=effVids(l);body=`<div class="vids">${vs.map((v,j)=>`<div class="vidw">${M?`<button class="btn edit sm" data-evid="${j}">✎ Изменить</button>`:""}<a class="vid" target="_blank" rel="noopener" href="${esc(v[1])}"><span class="pl"></span><span><b>${esc(v[0]||"Видео")}</b><small>${esc(host(v[1]))}</small></span></a></div>`).join("")}${M?`<div class="vidw"><button class="btn edit" data-evid="-1">＋ Видео</button></div>`:""}</div>${vs.length?"":`<p class="mut">Видео для этого урока не назначены.</p>`}
    <p class="note">Если в видео сделано иначе, чем в проекте, — на объекте действует проект и НТД РК.</p>`}
  if(k==="task"){const E=exList(l),es=exSt(x);let ci=E.findIndex(e=>String(e.i)===String(sub));if(ci<0){ci=E.findIndex(e=>!(es.fx[e.i]||es.sx[e.i]));if(ci<0)ci=0}const ex=E[ci],nx2=E[ci+1];
    const ef=(x.ef||{})[ex.i],tries=(x.efa||{})[ex.i]||0;
    body=`${E.length>1||M?`<nav class="extabs no-print">${E.map((e,j)=>`<a href="#/l/${l.id}/task/${e.i}" class="${j===ci?"on":""}">${j+1}. ${esc(e.t)}${es.fx[e.i]?" ✓":es.sx[e.i]?" (ответы)":""}${M&&!e.d.length?" — нет отметок":""}</a>`).join("")}${M?`<button class="btn edit sm" data-exadd>＋ Упражнение</button>`:""}</nav>`:""}
    ${M?`<div class="row no-print" style="margin-bottom:10px"><button class="btn edit sm" data-exedit="${ex.i}">✎ Изменить упражнение «${esc(ex.t)}»</button>${ex.main?"":`<button class="btn sm" data-exdel="${ex.i}">Удалить упражнение</button>`}</div>`:""}
    ${ex.d.length?`<p>${E.length>1?`<b>Упражнение ${ci+1} из ${E.length}.</b> `:""}Отметьте на ${ex.photo?"фото":"схеме"} все места, где видите нарушение. Количество дефектов не указывается.</p>
    <div class="grid2"><div class="task-wrap" data-ex="${ex.i}">${svgOf(ex,"task","task")}</div>
    <div class="taskside"><div class="row"><button class="btn pri" id="chkbtn">Проверить отметки</button><button class="btn" id="rstbtn">Сбросить и попробовать снова</button><button class="btn ${tries>=1||es.fx[ex.i]||es.sx[ex.i]?"":"hidden"}" id="giveup">Показать ответы</button></div>
    <div class="res ${es.fx[ex.i]||ef?"":"hidden"}" id="fres">${es.fx[ex.i]?`Упражнение выполнено ${fd(es.fx[ex.i])}.`:ef?`Прошлая попытка: найдено ${ef[0]} из ${ef[1]}.`:""}</div>
    <div id="anslist" class="hidden"><h3 style="font-size:16px;margin:14px 0 4px">Ответы</h3><ol class="dlist" style="margin-top:0">${ex.d.map(d=>`<li><b>${esc(d[3])}</b><br><span class="mut">${esc(d[4])}</span></li>`).join("")}</ol></div>
    ${nx2?`<a class="btn dark hidden" id="nextex" href="#/l/${l.id}/task/${nx2.i}" style="margin-top:12px">Следующее упражнение: ${esc(nx2.t)} →</a>`:""}
    <textarea class="inp" id="myans" rows="4" style="width:100%;margin-top:14px" placeholder="Запишите, какие нарушения вы видите и почему (для разбора с наставником)"></textarea></div></div>`:`<p class="mut">В этом упражнении ещё нет отметок дефектов. Нажмите «Изменить упражнение», загрузите фото и отметьте дефекты.</p>`}`}
  if(k==="chk"){const chk=st.chk[l.id]||[];body=`<div class="chk" id="chk">${l.c.map((c,j)=>`<label><input type="checkbox" data-k="${j}" ${chk[j]?"checked":""}><span>${esc(c)}</span></label>`).join("")}</div>`}
  if(k==="norm")body=`<div class="tbl-wrap"><table class="nt"><tr><th>Документ</th><th>Пункт / раздел</th><th>Требование</th></tr>
    <tr><td><span class="code">Проект</span></td><td>${esc(l.p||"—")}</td><td>Требования проекта для конкретного объекта — основание замечания в пределах НТД</td></tr>
    ${l.n.filter(n=>n[0]!=="PRJ").map(n=>`<tr><td>${normLine(n)}</td><td>${esc(n[1])}</td><td>${esc(n[2])}</td></tr>`).join("")}</table></div>
    <p class="note">Перед записью в DES уточните номер пункта по действующей редакции на <a href="https://www.egfntd.kz/" target="_blank" rel="noopener">egfntd.kz</a>.</p>`;
  if(k==="rw")body=`<div class="rw"><div class="ok">${cleanFig(l)}<h3 style="color:var(--good)">Правильно</h3><ul>${l.ok.map(o=>`<li>${esc(o)}</li>`).join("")}</ul></div>
    <div class="no">${svgOf(l,"answer")}<h3 style="color:var(--bad)">Неправильно</h3><ul>${l.d.map(d=>`<li>${esc(d[3])}</li>`).join("")}</ul></div></div>`;
  if(k==="des")body=l.d.length?`<p>Составьте замечание по этому узлу так, как в DES: заполните привязку (примеры — под полями) и отметьте верные варианты. Нажмите «Создать» — программа проверит Комментарий, Норматив, Причину и Действия.</p>
    ${x.dp?`<div class="res" style="background:rgba(46,125,79,.16)">Замечание составлено верно ${fd(x.dp)}. Можно потренироваться ещё раз.</div>`:""}
    <div id="desbox"></div><div class="res hidden" id="dres"></div>
    <div id="desref" class="hidden"><h3 style="font-size:15px;margin:16px 0 8px">Эталонное замечание</h3><div class="des-pre" id="despre"></div><button class="btn pri" id="copydes">Копировать замечание</button></div>`:`<p class="mut">Для этого урока дефекты не размечены.</p>`;
  if(k==="quiz")body=`<div id="quiz"></div><div class="row" style="margin-top:12px"><button class="btn pri" id="qsub">Проверить ответы</button><button class="btn" id="qnew">Новый вариант</button></div>
    <div class="res ${x.q!=null?"":"hidden"}" id="qres">${x.q!=null?`Лучший результат: ${x.q}% (${fd(x.qd)}).`:""}</div>`;
  const prevK=S[si-1],nextK=S[si+1],nextOpen=nextK&&(M||(k==="task"?taskOK(l,x):true));
  return `<div class="crumbs"><a href="#/">Разделы</a> / <a href="#/s/${l.s}">${esc(secName(l.s))}</a> / Урок ${l.id}</div>
  ${M?`<div class="mbar no-print">Режим наставника: жёлтые кнопки «Изменить» видите только вы. Абитуриенты видят готовый результат.${l.hidden?" Урок скрыт от абитуриентов.":""} <a class="btn pri" href="#/mentor/edit/${l.id}/main">Полный редактор урока</a></div>`:""}
  <header class="lhead"><div class="lnum">${l.id}</div><div><h1>${esc(l.t)}</h1><div class="lstat sm"><span class="${nx.vis?"ok":""}">Шаги ${S.filter(s=>x.v&&x.v[s]).length}/${S.length}</span>${l.d.length?`<span class="${x.fall?"ok":""}">Найди дефект ${x.fall?"✓":"—"}</span><span class="${x.dp?"ok":""}">DES ${x.dp?"✓":"—"}</span>`:""}<span class="${nx.quiz?"ok":""}">Тест ${x.q!=null?x.q+"%":"—"}</span>${x.p?`<span class="pill ok">Урок освоен ${fdd(x.p)}</span>`:""}</div></div></header>
  <nav class="tabs no-print" aria-label="Шаги урока">${S.map((s,j)=>{const op=stepOpen(l,x,s);return op?`<a href="#/l/${l.id}/${s}" class="${s===k?"on":""}"><b>${j+1}</b>${esc(stTitle(l,s))}<i>${stIcon(s)}</i></a>`:`<span class="off" title="Откроется после предыдущих шагов"><b>${j+1}</b>${esc(stTitle(l,s))}<i>🔒</i></span>`}).join("")}</nav>
  <section class="blk step" id="b-${k}">${head}${intro}${body}</section>
  <div class="pager no-print">${prevK?`<a class="btn" href="#/l/${l.id}/${prevK}">← ${esc(stTitle(l,prevK))}</a>`:"<span></span>"}
  ${nextK?(nextOpen?`<a class="btn dark" id="nextstep" href="#/l/${l.id}/${nextK}">${esc(stTitle(l,nextK))} →</a>`:`<span class="mut sm" id="nextwait" data-href="#/l/${l.id}/${nextK}" data-t="${esc(stTitle(l,nextK))} →">Найдите все дефекты или откройте ответы, чтобы перейти дальше</span>`):(nextL&&x.p?`<a class="btn dark" href="#/l/${nextL.id}">Следующий урок: ${nextL.id} →</a>`:`<a class="btn" href="#/s/${l.s}">К разделу</a>`)}</div>`;
}

function bindLesson(l,k,sub){
  const x=lp(l.id);if(!x.o)x.o=now();const S=lessonSteps(l);if(!S.includes(k)||!stepOpen(l,x,k))k=defaultStep(l,x);
  x.v=x.v||{};if(!x.v[k]){x.v[k]=now()}tryPass(l,x);save();
  app.querySelectorAll("img[data-z]").forEach(i=>i.onclick=()=>lightbox(i.src));
  app.querySelectorAll("[data-ehead]").forEach(b=>b.onclick=()=>editStepHead(l,b.dataset.ehead));
  if(k==="lec"&&isMentor())bindLecture(l);
  if(isMentor())app.querySelectorAll("[data-lk]").forEach(b=>b.onclick=async()=>{const [op,j]=b.dataset.lk.split(":");try{
    if(op==="notes"){modal("Подсказка наставника",[{label:"На что обратить внимание. Строки с «- » — список",type:"area",rows:8,value:l.notes||""}],async v=>{await quickSave(l,d=>{d.notes=v[0]})});return}
    if(op==="delnotes"){if(await uiConfirm("Удалить блок «На что обратить внимание»?"))await quickSave(l,d=>{d.notes=""});return}
    if(op==="delgal"){if(await uiConfirm("Удалить все фото-примеры этого урока?"))await quickSave(l,d=>{d.gal=[]});return}
    if(op==="delg"){if(await uiConfirm(`Удалить фото ${+j+1}?`))await quickSave(l,d=>{d.gal.splice(+j,1)});return}
  }catch(e){uiAlert("Не сохранено: нет прав на запись (нужна роль «Редактор»).")}});
  app.querySelectorAll("[data-elnk]").forEach(b=>b.onclick=()=>editLink(l,"l",+b.dataset.elnk));
  app.querySelectorAll("[data-evid]").forEach(b=>b.onclick=()=>editLink(l,"v",+b.dataset.evid));
  const tk=document.getElementById("task");
  if(tk){const ei=+tk.closest(".task-wrap").dataset.ex,ex=exAll(l)[ei],F=finder(tk,ex),res=document.getElementById("fres"),gu=document.getElementById("giveup");
    const showAns=()=>{document.getElementById("anslist").classList.remove("hidden");const ne=document.getElementById("nextex");if(ne)ne.classList.remove("hidden");
      if(taskOK(l,x)){const w=document.getElementById("nextwait");if(w){const a=document.createElement("a");a.className="btn dark";a.id="nextstep";a.href=w.dataset.href;a.textContent=w.dataset.t;w.replaceWith(a)}}};
    document.getElementById("chkbtn").onclick=e=>{if(e.target.disabled)return;const r=F.check(false);e.target.disabled=true;
      x.ef=Object.assign({},x.ef,{[ei]:[r.hit,r.tot,now()]});x.efa=Object.assign({},x.efa,{[ei]:((x.efa||{})[ei]||0)+1});x.f=[r.hit,r.tot,now()];x.fa=(x.fa||0)+1;st.tr.n++;st.tr.hit+=r.hit;st.tr.tot+=r.tot;res.classList.remove("hidden");
      if(r.all){const s=exSt(x);x.fx=Object.assign({},s.fx);if(!x.fx[ei])x.fx[ei]=now();x.sx=Object.assign({},s.sx);if(taskDone(l,x)&&!x.fall)x.fall=now();tryPass(l,x);save();dirty=false;
        res.innerHTML=`Отлично: найдены все дефекты (${r.tot})${r.extra?`, лишних отметок: ${r.extra}`:""}.${taskDone(l,x)?" Все упражнения шага выполнены.":""}`;showAns();return}
      res.innerHTML=`Найдено ${r.hit} из ${r.tot}${r.extra?`, лишних отметок: ${r.extra}`:""}. Найденные отмечены зелёным. Нажмите «Сбросить и попробовать снова» или «Показать ответы».`;gu.classList.remove("hidden");save();dirty=false};
    document.getElementById("rstbtn").onclick=()=>{F.reset();document.getElementById("chkbtn").disabled=false;res.classList.add("hidden");document.getElementById("anslist").classList.add("hidden")};
    gu.onclick=()=>{F.reveal();document.getElementById("chkbtn").disabled=true;const s=exSt(x);x.fx=Object.assign({},s.fx);x.sx=Object.assign({},s.sx);if(!x.sx[ei])x.sx[ei]=now();x.seen=x.seen||now();save();
      if(!x.fx[ei]){res.classList.remove("hidden");res.innerHTML="Ответы показаны на фото: зелёным — найденные вами, красным — пропущенные. Упражнение засчитается, когда вы найдёте все дефекты сами — нажмите «Сбросить и попробовать снова»."}showAns()}}
  if(isMentor()){
    const ea=app.querySelector("[data-exadd]");if(ea)ea.onclick=async()=>{const before=(ALL.find(z=>z.id===l.id).ex||[]).length;try{await quickSave(l,d=>{d.ex=d.ex||[];d.ex.push({t:`Упражнение ${d.ex.length+2}`,sc:"conc",d:[],photo:null})})}catch(e){uiAlert("Не сохранено: нет прав на запись.");return}
      for(let t=0;t<30&&(ALL.find(z=>z.id===l.id).ex||[]).length<=before;t++)await new Promise(r=>setTimeout(r,100));PENDING_EXI=before+1;ED=null;location.hash=`#/mentor/edit/${l.id}/defect`};
    app.querySelectorAll("[data-exedit]").forEach(b=>b.onclick=()=>{PENDING_EXI=+b.dataset.exedit;ED=null;location.hash=`#/mentor/edit/${l.id}/defect`});
    app.querySelectorAll("[data-exdel]").forEach(b=>b.onclick=async()=>{const ei=+b.dataset.exdel;if(!await uiConfirm(`Удалить упражнение ${ei+1} вместе с фото и отметками?`))return;try{await quickSave(l,d=>{d.ex.splice(ei-1,1)});location.hash=`#/l/${l.id}/task`}catch(e){uiAlert("Не сохранено: нет прав на запись.")}});
  }
  const ch=document.getElementById("chk");if(ch)ch.addEventListener("change",e=>{const j=+e.target.dataset.k;const a=st.chk[l.id]||[];a[j]=e.target.checked;st.chk[l.id]=a;save()});
  app.querySelectorAll("h2 [data-showtask]").forEach(b=>b.onclick=()=>showTaskPhoto(l,+b.dataset.showtask));
  const db2=document.getElementById("desbox");
  if(db2){let seed=x.dv||0,T;const f={};
    const check=()=>{const el=document.getElementById("dres");el.classList.remove("hidden");
      if(!(f.obj||"").trim()||!(f.ax||"").trim()){el.textContent="Заполните привязку: «Выберите проект» и «Ось» — без неё замечание в DES не принимается. Примеры указаны под полями.";el.style.color="var(--bad)";el.scrollIntoView({behavior:"smooth",block:"center"});return}
      const g=gradeDes(db2,T);x.da=(x.da||0)+1;el.style.color="";
      if(g.all){if(!x.dp)x.dp=now();const passed=tryPass(l,x);el.innerHTML=`Замечание создано верно.${passed?" Урок освоен!":""} Ниже — эталонный текст для DES.`}
      else el.textContent=`Есть ошибки в полях: ${Object.keys(g.res).filter(z=>!g.res[z]).map(z=>({defs:"Комментарий",norms:"Норматив",whys:"Причина",acts:"Действия"})[z]).join(", ")}. Зелёным отмечены правильные варианты. Нажмите «Отмена», чтобы попробовать снова.`;
      save();dirty=false;document.getElementById("dsub").disabled=true;
      const ref=document.getElementById("desref");ref.classList.remove("hidden");const sel=l.d.map(()=>true);document.getElementById("despre").innerHTML=desText(l,f,sel);document.getElementById("copydes").onclick=e=>copyText(plain(desText(l,f,sel)),e.target);el.scrollIntoView({behavior:"smooth",block:"center"})};
    const mk=()=>{T=desTask(l,seed);db2.innerHTML=desTaskHTML(T,l);document.getElementById("dres").classList.add("hidden");document.getElementById("desref").classList.add("hidden");
      db2.querySelectorAll("[data-f]").forEach(i=>{const p=st.desf||{};if(p[i.dataset.f]&&["obj","nach","gen","sub","blk"].includes(i.dataset.f))i.value=p[i.dataset.f];if(i.dataset.f==="obj"&&!i.value&&st.prof&&st.prof.obj)i.value=st.prof.obj;f[i.dataset.f]=i.value;
        const upd=()=>{f[i.dataset.f]=i.value;st.desf={obj:f.obj,nach:f.nach,gen:f.gen,sub:f.sub,blk:f.blk}};i.addEventListener("input",upd);i.addEventListener("change",upd)});
      db2.addEventListener("change",()=>{dirty=true});
      document.getElementById("dsub").onclick=check;
      const again=()=>{seed++;x.dv=seed;save();mk()};document.getElementById("dnew").onclick=again;document.getElementById("dnew2").onclick=again;
      db2.querySelectorAll("[data-showtask]").forEach(b=>b.onclick=()=>showTaskPhoto(l,+b.dataset.showtask))};
    mk()}
  const qz=document.getElementById("quiz");
  if(qz){let v=x.qv||0,qs;
    const mk=()=>{qs=lessonQuiz(l,rng(l.id+":"+v));qz.innerHTML=qs.length?quizHTML(qs,"q"):`<p class="mut">Для теста нужно заполнить чек-лист, дефекты и нормативы урока.</p>`;document.getElementById("qsub").disabled=!qs.length};
    mk();qz.addEventListener("change",()=>{dirty=true});
    document.getElementById("qsub").onclick=()=>{const g=gradeQuiz(qz,qs,"q");const pc=pct(g.ok,qs.length);x.q=Math.max(x.q||0,pc);x.qd=now();x.qa=(x.qa||0)+1;const passed=tryPass(l,x);save();dirty=false;const el=document.getElementById("qres");el.classList.remove("hidden");const n=needs(l,x);
      el.innerHTML=`Результат: ${g.ok} из ${qs.length} (${pc}%). `+(x.p?(passed?"Урок освоен! Следующий урок открыт.":"Урок уже освоен."):pc>=80?`Тест сдан. Для освоения урока осталось: ${[!n.vis&&"пройти все шаги урока",!n.find&&"найти все дефекты",!n.des&&"верно составить замечание DES"].filter(Boolean).join(", ")}.`:"Для зачёта нужно 80 %. Разберите ответы и пройдите новый вариант.");document.getElementById("qsub").disabled=true};
    document.getElementById("qnew").onclick=()=>{v++;x.qv=v;save();mk();document.getElementById("qres").classList.add("hidden")}}
}
