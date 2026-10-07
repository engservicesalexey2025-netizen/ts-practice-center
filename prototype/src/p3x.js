
/* ----- форматирование лекции ----- */
function fmt(t){return esc(t).replace(/\*\*(.+?)\*\*/g,"<b>$1</b>")}
function textBlock(v){const out=[];let ul=[];const flush=()=>{if(ul.length){out.push(`<ul>${ul.map(x=>`<li>${fmt(x)}</li>`).join("")}</ul>`);ul=[]}};
  String(v||"").split("\n").forEach(s=>{if(/^\s*[-•]\s+/.test(s))ul.push(s.replace(/^\s*[-•]\s+/,""));else{flush();if(s.trim())out.push(`<p>${fmt(s)}</p>`)}});flush();return out.join("")}
function lecHTML(bl){return (bl||[]).map(b=>{
  if(b.t==="h")return b.v?`<h3 class="lec-h">${esc(b.v)}</h3>`:"";
  if(b.t==="p")return textBlock(b.v);
  if(b.t==="note")return b.v?`<div class="mentor-note"><b>Важно</b><div>${textBlock(b.v)}</div></div>`:"";
  if(b.t==="img")return b.id?`<figure class="lec-img"><img src="${blobUrl(b.id)}" data-z="1" alt="${esc(b.cap||"Фото")}" loading="lazy">${b.cap?`<figcaption>${esc(b.cap)}</figcaption>`:""}</figure>`:"";
  if(b.t==="link")return /^https?:\/\//.test(b.u||"")?`<p><a class="lec-link" target="_blank" rel="noopener" href="${esc(b.u)}">${esc(b.v||b.u)} ↗</a></p>`:"";
  return ""}).join("")}
const validLink=v=>v&&/^https?:\/\//.test(v[1]||"");
const host=u=>(String(u).match(/\/\/([^/]+)/)||[,""])[1].replace(/^www\./,"");
const editBtn=(l,tab)=>isMentor()?`<a class="btn edit no-print" href="#/mentor/edit/${l.id}/${tab}">✎ Изменить</a>`:"";

/* ----- свои вопросы наставника ----- */
function customQs(l,r){return (l.qz||[]).filter(q=>q[0]&&q[1]&&q.slice(2).some(Boolean)).map(q=>{const opts=shuffle([q[1],...q.slice(2).filter(Boolean)],r);return{q:q[0],opts,ans:opts.indexOf(q[1]),lid:l.id}})}
function lessonQuiz(l,r){const c=shuffle(customQs(l,r),r).slice(0,10);const need=Math.max(0,5-c.length);const auto=["viol","why","norm","chk","act"].slice(0,need).map(t=>buildQ(l,t,r)).filter(Boolean);return shuffle([...c,...auto],r)}
function tryPass(l,x){if(!x.p&&(x.q||0)>=80&&(CFG.needAll===false||!l.d.length||x.fall)){x.p=now();return true}return false}

function home(){
  const done=LS.filter(l=>isDone(l.id)).length;
  const ex=LS.find(l=>l.id==="B2")||LS[0];
  return `<section class="hero"><div>
  <h1>${esc(CFG.heroTitle||"Школа ТН ЖК")}</h1>
  <p>${esc(CFG.heroText||`${LS.length} визуальных уроков технадзора на строительстве жилых комплексов. Обучение глазами ТН: каждый урок — это узел, дефекты, норматив и готовое замечание.`)}</p>
  ${isMentor()?`<p><a class="btn edit" href="#/mentor/settings">✎ Изменить тексты главной</a></p>`:""}
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

function lessonPage(id){
  const l=(isMentor()?ALL:LS).find(x=>x.id===id);if(!l)return notFound();
  const i=LS.indexOf(l),prev=LS[i-1],next=LS[i+1];
  if(locked(l)){const sl=LS.filter(x=>x.s===l.s);const pv=sl[sl.indexOf(l)-1];return `<div class="blk"><h1 style="font-size:24px">Урок ${l.id} пока закрыт</h1><p>Уроки проходятся по порядку. Сначала пройдите урок ${pv.id} «${esc(pv.t)}»${CFG.needAll===false?"":": найдите все дефекты"} и сдайте блиц-тест на 80 % и выше.</p><a class="btn pri" href="#/l/${pv.id}">Перейти к уроку ${pv.id}</a></div>`}
  const f=st.desf||{},chk=st.chk[l.id]||[],x=st.lp[l.id]||{},auto=l.auto!==false;
  const B=[];
  B.push({k:"look",t:"Посмотри",tab:"main",h:`<div class="grid2"><figure>${cleanFig(l)}<figcaption>${l.okPhoto?"Эталон с объекта — как должно быть":"Учебная схема узла — эталон без дефектов"}</figcaption></figure>
    <div><div class="tbl-wrap"><table class="src">
    <tr><th>Фото / видео</th><td>Показывают, как выполняется работа. Не являются основанием для замечания.</td></tr>
    <tr><th>Проект</th><td>${esc(l.p||"—")}</td></tr>
    <tr><th>Норматив РК</th><td>${l.n.filter(n=>n[0]!=="PRJ").map(n=>`<span class="code">${esc(nm(n[0])[0])}</span>`).join(", ")||"по проекту"}</td></tr>
    <tr><th>ТН</th><td>Сверяет факт с проектом и НТД, фиксирует несоответствие в DES.</td></tr></table></div>
    ${(l.lnk||[]).filter(validLink).length||auto?`<div class="links">${(l.lnk||[]).filter(validLink).map(v=>`<a target="_blank" rel="noopener" href="${esc(v[1])}">${esc(v[0]||host(v[1]))} ↗</a>`).join("")}${auto?`<a target="_blank" rel="noopener" href="${lk.ya(l)}">Фото выполнения работ ↗</a><a target="_blank" rel="noopener" href="${lk.yad(l)}">Фото дефектов ↗</a><a target="_blank" rel="noopener" href="${lk.gg(l)}">Схемы узлов ↗</a>`:""}</div>`:""}
    </div></div>
    ${l.notes?`<div class="mentor-note"><b>Наставник: на что обратить внимание</b><div>${textBlock(l.notes)}</div></div>`:""}
    ${l.gal.length?`<h3 style="font-size:15px;margin:16px 0 8px">Фото-примеры с объектов</h3><div class="gal">${l.gal.map(g=>`<figure><img src="${blobUrl(g.id)}" alt="${esc(g.cap||"Фото с объекта")}" data-z="1" loading="lazy"><figcaption>${esc(g.cap||"")}</figcaption></figure>`).join("")}</div>`:""}`});
  if((l.lec&&l.lec.length)||isMentor())B.push({k:"lec",t:"Лекция",tab:"lec",h:l.lec&&l.lec.length?`<div class="lec">${lecHTML(l.lec)}</div>`:`<p class="mut">Лекция пока не подготовлена. Нажмите «Изменить», чтобы добавить текст, фото и ссылки — абитуриенты увидят этот раздел после сохранения.</p>`});
  const vids=(l.vids||[]).filter(validLink);
  B.push({k:"vid",t:"Видео и материалы",tab:"links",h:`${vids.length?`<h3 style="font-size:15px;margin-bottom:8px">Обязательно к просмотру</h3><div class="vids" style="margin-bottom:14px">${vids.map(v=>`<a class="vid" target="_blank" rel="noopener" href="${esc(v[1])}"><span class="pl"></span><span><b>${esc(v[0]||"Видео")}</b><small>${esc(host(v[1]))}</small></span></a>`).join("")}</div>`:""}
    ${auto?`<h3 style="font-size:15px;margin-bottom:8px">${vids.length?"Дополнительно: подборки по теме":"Подборки по теме"}</h3><div class="vids">
    <a class="vid" target="_blank" rel="noopener" href="${lk.yt(l)}"><span class="pl"></span><span><b>Технология выполнения</b><small>YouTube · поиск по теме</small></span></a>
    <a class="vid" target="_blank" rel="noopener" href="${lk.ytd(l)}"><span class="pl"></span><span><b>Типовые ошибки и дефекты</b><small>YouTube · поиск по теме</small></span></a>
    <a class="vid" target="_blank" rel="noopener" href="${lk.rt(l)}"><span class="pl"></span><span><b>Технология на русском</b><small>Rutube · поиск по теме</small></span></a></div>`:""}
    ${!vids.length&&!auto?`<p class="mut">Видео для этого урока не назначены.</p>`:""}
    <p class="note">Если в видео сделано иначе, чем в проекте, — на объекте действует проект и НТД РК.</p>`});
  B.push({k:"task",t:"Найди дефект",tab:"defect",h:l.d.length?`<p>Отметьте на ${l.photo?"фото":"схеме"} все места, где видите нарушение. Количество дефектов не указывается. Задание выполнено, когда найдены все дефекты.</p>
    <div class="grid2"><div class="task-wrap">${svgOf(l,"task","task")}</div>
    <div><textarea class="inp" id="myans" rows="5" style="width:100%" placeholder="Запишите, какие нарушения вы видите и почему (для разбора с наставником)"></textarea>
    <div class="row" style="margin-top:10px"><button class="btn pri" id="chkbtn">Проверить отметки</button><button class="btn" id="rstbtn">Сбросить и попробовать снова</button><button class="btn ${(x.fa||0)>=2||x.fall||x.seen?"":"hidden"}" id="giveup">Показать ответы</button></div>
    <div class="res ${x.fall||x.f?"":"hidden"}" id="fres">${x.fall?`Все дефекты найдены ${fd(x.fall)}.`:x.f?`Прошлая попытка: найдено ${x.f[0]} из ${x.f[1]}.`:""}</div></div></div>`:`<p class="mut">Наставник ещё не разметил дефекты для этого урока.</p>`});
  B.push({k:"ans",t:"Ответы",tab:"defect",h:`<div id="ansHide" class="${x.fall||x.seen||isMentor()?"hidden":""}"><p class="mut">Ответы откроются, когда вы найдёте все дефекты. После двух попыток можно открыть их кнопкой «Показать ответы».</p></div>
    <div id="ans" class="${x.fall||x.seen||isMentor()?"":"hidden"}"><div class="grid2"><figure>${svgOf(l,"answer")}</figure>
    <ol class="dlist">${l.d.map(d=>`<li><b>${esc(d[3])}</b><br><span class="mut">Почему нарушение:</span> ${esc(d[4])}</li>`).join("")}</ol></div></div>`});
  B.push({k:"chk",t:"Чек-лист ТН",tab:"check",h:`<div class="chk" id="chk">${l.c.map((c,k)=>`<label><input type="checkbox" data-k="${k}" ${chk[k]?"checked":""}><span>${esc(c)}</span></label>`).join("")}</div>`});
  B.push({k:"norm",t:"Норматив РК",tab:"norms",h:`<div class="tbl-wrap"><table class="nt"><tr><th>Документ</th><th>Пункт / раздел</th><th>Требование</th></tr>
    <tr><td><span class="code">Проект</span></td><td>${esc(l.p||"—")}</td><td>Требования проекта для конкретного объекта — основание замечания в пределах НТД</td></tr>
    ${l.n.filter(n=>n[0]!=="PRJ").map(n=>`<tr><td>${normLine(n)}</td><td>${esc(n[1])}</td><td>${esc(n[2])}</td></tr>`).join("")}</table></div>
    <p class="note">Перед записью в DES уточните номер пункта по действующей редакции на <a href="https://www.egfntd.kz/" target="_blank" rel="noopener">egfntd.kz</a>.</p>`});
  B.push({k:"rw",t:"Правильно / неправильно",tab:"ok",h:`<div class="rw"><div class="ok">${cleanFig(l)}<h3 style="color:var(--good)">Правильно</h3><ul>${l.ok.map(o=>`<li>${esc(o)}</li>`).join("")}</ul></div>
    <div class="no">${svgOf(l,"answer")}<h3 style="color:var(--bad)">Неправильно</h3><ul>${l.d.map(d=>`<li>${esc(d[3])}</li>`).join("")}</ul></div></div>`});
  B.push({k:"des",t:"Замечание DES",tab:"des",h:`<p class="mut sm">Заполните привязку — текст обновится. Снимите галочки с дефектов, которых нет на вашем объекте.</p>
    <div class="des-f"><input data-f="obj" placeholder="Объект (ЖК, очередь)" value="${esc(f.obj||st.prof&&st.prof.obj||"")}"><input data-f="sec" placeholder="Блок / секция" value="${esc(f.sec||"")}"><input data-f="ax" placeholder="Оси">
    <input data-f="lvl" placeholder="Этаж / отметка"><input data-f="con" placeholder="Подрядчик / ответственный" value="${esc(f.con||"")}"><input data-f="term" placeholder="Срок устранения"></div>
    <div class="row" id="dsel">${l.d.map((d,k)=>`<label class="pill"><input type="checkbox" data-d="${k}" checked> ${k+1}. ${esc(d[3])}</label>`).join("")}</div>
    <div class="des-pre" id="despre"></div><button class="btn pri" id="copydes">Копировать замечание</button>`});
  B.push({k:"quiz",t:"Блиц-тест",tab:"quiz",h:`<div id="quiz"></div><div class="row" style="margin-top:12px"><button class="btn pri" id="qsub">Проверить ответы</button><button class="btn" id="qnew">Новый вариант</button></div>
    <div class="res ${x.q!=null?"":"hidden"}" id="qres">${x.q!=null?`Лучший результат: ${x.q}% (${fd(x.qd)}).`:""}</div>`});
  return `<div class="crumbs"><a href="#/">Школа</a> / <a href="#/s/${l.s}">${esc(secName(l.s))}</a> / Урок ${l.id}</div>
  ${isMentor()?`<div class="mbar no-print">Вы в режиме наставника: абитуриенты видят этот урок без кнопок «Изменить».${l.hidden?" Урок скрыт от абитуриентов.":""} <a class="btn pri" href="#/mentor/edit/${l.id}/main">Редактор урока</a></div>`:""}
  <header class="lhead"><div class="lnum">${l.id}</div><div><h1>${esc(l.t)}</h1><div class="mut sm">Урок ${i+1} из ${LS.length} · начат ${fd(x.o)}${x.p?` · <span class="pill ok">Пройден ${fdd(x.p)}</span>`:""}</div></div></header>
  <nav class="steps no-print">${B.map((b,k)=>`<a href="#" data-jump="b-${b.k}"><b>${k+1}</b>${b.t}</a>`).join("")}</nav>
  ${B.map((b,k)=>`<section class="blk" id="b-${b.k}"><h2><span>${k+1}</span>${b.t}${editBtn(l,b.tab)}</h2>${b.h}</section>`).join("")}
  <div class="pager no-print">${prev?`<a class="btn" href="#/l/${prev.id}">← ${prev.id}. ${esc(prev.t)}</a>`:"<span></span>"}${next?`<a class="btn dark" href="#/l/${next.id}">${next.id}. ${esc(next.t)} →</a>`:""}</div>`;
}

function finder(svg,l){
  const k=geo(l).k,rad=d=>d[5]||52*k;let marks=[],nodes=[],lockd=false;
  svg.addEventListener("click",e=>{if(lockd)return;dirty=true;const p=svgPt(svg,e);marks.push(p);const c=document.createElementNS(NS,"circle");c.setAttribute("cx",p.x);c.setAttribute("cy",p.y);c.setAttribute("r",20*k);c.setAttribute("class","mark");c.style.strokeWidth=4*k;svg.appendChild(c);nodes.push(c)});
  const ring=(d,j,cls)=>{const g=document.createElementNS(NS,"g");g.innerHTML=ringNum(d[1],d[2],j+1,cls,k);svg.appendChild(g);nodes.push(g)};
  let hits=[];
  return{
    check(reveal){lockd=true;hits=l.d.map(d=>marks.some(m=>Math.hypot(m.x-d[1],m.y-d[2])<rad(d)));const extra=marks.filter(m=>!l.d.some(d=>Math.hypot(m.x-d[1],m.y-d[2])<rad(d))).length;
      l.d.forEach((d,j)=>{if(hits[j])ring(d,j,"ring-hit");else if(reveal)ring(d,j,"ring-miss")});const n=hits.filter(Boolean).length;return{hit:n,tot:l.d.length,extra,all:n===l.d.length}},
    reveal(){l.d.forEach((d,j)=>{if(!hits[j])ring(d,j,"ring-miss")});lockd=true},
    reset(){marks=[];hits=[];lockd=false;nodes.forEach(n=>n.remove());nodes=[]}};
}

function bindLesson(l){
  const x=lp(l.id);if(!x.o){x.o=now();save()}
  document.querySelectorAll("[data-jump]").forEach(a=>a.addEventListener("click",e=>{e.preventDefault();document.getElementById(a.dataset.jump).scrollIntoView({behavior:"smooth"})}));
  app.querySelectorAll("img[data-z]").forEach(i=>i.onclick=()=>lightbox(i.src));
  const open=()=>{document.getElementById("ans").classList.remove("hidden");document.getElementById("ansHide").classList.add("hidden")};
  const tk=document.getElementById("task");
  if(tk){const F=finder(tk,l),res=document.getElementById("fres"),gu=document.getElementById("giveup");
    document.getElementById("chkbtn").onclick=e=>{if(e.target.disabled)return;const r=F.check(false);e.target.disabled=true;x.f=[r.hit,r.tot,now()];x.fa=(x.fa||0)+1;st.tr.n++;st.tr.hit+=r.hit;st.tr.tot+=r.tot;res.classList.remove("hidden");
      if(r.all){if(!x.fall)x.fall=now();res.innerHTML=`Отлично: найдены все ${r.tot} дефекта(ов)${r.extra?`, лишних отметок: ${r.extra}`:""}. Разбор открыт в блоке «Ответы».${tryPass(l,x)?" Урок засчитан.":(x.q||0)>=80?"":" Теперь пройдите блиц-тест."}`;open()}
      else{res.innerHTML=`Найдено ${r.hit} из ${r.tot}${r.extra?`, лишних отметок: ${r.extra}`:""}. Найденные отмечены зелёным. Нажмите «Сбросить и попробовать снова» и найдите остальные.`;if(x.fa>=2)gu.classList.remove("hidden")}
      save();dirty=false};
    document.getElementById("rstbtn").onclick=()=>{F.reset();document.getElementById("chkbtn").disabled=false;res.classList.add("hidden")};
    gu.onclick=()=>{F.reveal();x.seen=x.seen||now();save();open();document.getElementById("b-ans").scrollIntoView({behavior:"smooth"})};}
  document.getElementById("chk").addEventListener("change",e=>{const k=+e.target.dataset.k;const a=st.chk[l.id]||[];a[k]=e.target.checked;st.chk[l.id]=a;save()});
  const f={},sel=l.d.map(()=>true);
  const upd=()=>{document.getElementById("despre").innerHTML=desText(l,f,sel)};
  document.querySelectorAll("[data-f]").forEach(i=>{f[i.dataset.f]=i.value;i.addEventListener("input",()=>{f[i.dataset.f]=i.value;st.desf={obj:f.obj,sec:f.sec,con:f.con};save();upd()})});
  document.getElementById("dsel").addEventListener("change",e=>{sel[+e.target.dataset.d]=e.target.checked;upd()});
  document.getElementById("copydes").onclick=e=>copyText(plain(desText(l,f,sel)),e.target);
  upd();
  let v=x.qv||0,qs;
  const mk=()=>{qs=lessonQuiz(l,rng(l.id+":"+v));document.getElementById("quiz").innerHTML=qs.length?quizHTML(qs,"q"):`<p class="mut">Для теста нужно заполнить чек-лист, дефекты и нормативы урока.</p>`;document.getElementById("qsub").disabled=!qs.length};
  mk();
  document.getElementById("quiz").addEventListener("change",()=>{dirty=true});
  document.getElementById("qsub").onclick=()=>{const g=gradeQuiz(document.getElementById("quiz"),qs,"q");const pc=pct(g.ok,qs.length);x.q=Math.max(x.q||0,pc);x.qd=now();x.qa=(x.qa||0)+1;const passed=tryPass(l,x);save();dirty=false;const el=document.getElementById("qres");el.classList.remove("hidden");
    el.innerHTML=`Результат: ${g.ok} из ${qs.length} (${pc}%). `+(x.p?(passed?"Урок засчитан — следующий урок открыт.":"Урок уже засчитан."):pc>=80?"Тест сдан. Для зачёта урока найдите все дефекты в задании «Найди дефект».":"Для зачёта нужно 80 %. Разберите ответы и пройдите новый вариант.");document.getElementById("qsub").disabled=true};
  document.getElementById("qnew").onclick=()=>{v++;x.qv=v;save();mk();document.getElementById("qres").classList.add("hidden")};
}

function trainerLoad(){
  const pool=LS.filter(l=>(TR.sec==="all"||l.s===TR.sec)&&!locked(l)).flatMap(l=>exAll(l).filter(e=>e.d.length).map(e=>Object.assign(e,{lid:l.id,lt:l.t,key:l.id+":"+e.i})));const box=document.getElementById("trbox");
  if(!pool.length){box.innerHTML=`<p class="mut">В этом разделе пока нет открытых уроков с разметкой дефектов.</p>`;return}
  let l;do{l=pool[Math.floor(Math.random()*pool.length)]}while(pool.length>1&&l.key===TR.cur);TR.cur=l.key;
  box.innerHTML=`<div class="blk"><h2 style="font-size:18px;margin-bottom:10px">${esc(l.lt)}${l.i?` · ${esc(l.t)}`:""}</h2><div class="grid2"><div class="task-wrap">${svgOf(l,"task","task")}</div><div><p>Отметьте нарушения.</p><div class="row"><button class="btn pri" id="trchk">Проверить</button><a class="btn" href="#/l/${l.lid}">Открыть урок ${l.lid}</a></div><div class="res hidden" id="trres"></div><ol class="dlist hidden" id="trans">${l.d.map(d=>`<li><b>${esc(d[3])}</b><br><span class="mut">${esc(d[4])}</span></li>`).join("")}</ol></div></div></div>`;
  const F=finder(document.getElementById("task"),l);
  document.getElementById("trchk").onclick=e=>{const r=F.check(true);e.target.disabled=true;st.tr.n++;st.tr.hit+=r.hit;st.tr.tot+=r.tot;save();const el=document.getElementById("trres");el.classList.remove("hidden");el.textContent=`Найдено ${r.hit} из ${r.tot}${r.extra?`, лишних отметок: ${r.extra}`:""}.`;document.getElementById("trans").classList.remove("hidden");dirty=false};
}

function examStart(){
  const secs=[...document.querySelectorAll(".exs:checked")].map(x=>x.value);if(!secs.length){alert("Выберите хотя бы один раздел.");return}
  const n=+document.getElementById("exn").value,r=rng("ex"+Date.now()),pool=LS.filter(l=>secs.includes(l.s)),types=["viol","why","norm","chk","act"];
  const cust=shuffle(pool.flatMap(l=>customQs(l,r)),r).slice(0,Math.floor(n/2));
  const qs=[...cust];const ls=shuffle(pool,r);for(let i=0;i<n*2&&qs.length<n;i++){const q=buildQ(ls[i%ls.length],types[(i+Math.floor(r()*5))%5],r);if(q)qs.push(q)}
  if(!qs.length){alert("В выбранных разделах нет уроков с вопросами.");return}
  EX={stage:"run",qs:shuffle(qs,r),secs,start:now(),end:Date.now()+qs.length*90000};dirty=true;render();
}
