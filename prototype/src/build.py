import re
def cut(src,name):
    m=re.search(r'^(async )?function '+re.escape(name)+r'\(',src,re.M)
    assert m,name
    a=m.start()
    n=re.search(r'^(function |async function |let |const |/\*)',src[a+10:],re.M)
    b=a+10+n.start() if n else len(src)
    return src[:a]+src[b:]
p3=open('p3b.js',encoding='utf-8').read()
for f in ['home','lessonPage','finder','bindLesson','trainerLoad','examStart']: p3=cut(p3,f)
p3+=open('p3x.js',encoding='utf-8').read()
p4=open('p4b.js',encoding='utf-8').read()
a=p4.index('/* ----- редактор урока ----- */');b=p4.index('/* ----- журнал абитуриентов ----- */')
p4=p4[:a]+open('p4x.js',encoding='utf-8').read()+p4[b:]
# settings page extension
p4=p4.replace('''<label class="row"><input type="checkbox" id="seq" ${CFG.seq?"checked":""}> Открывать уроки раздела по порядку: следующий — после зачёта блиц-теста предыдущего (80 %)</label></div>''',
'''<label class="row"><input type="checkbox" id="seq" ${CFG.seq?"checked":""}> Открывать уроки раздела по порядку: следующий — после зачёта предыдущего</label>
  <label class="row" style="margin-top:8px"><input type="checkbox" id="needall" ${CFG.needAll!==false?"checked":""}> Для зачёта урока нужно найти все дефекты в задании «Найди дефект» и сдать блиц-тест на 80 %</label></div>
  <div class="blk"><h2 style="font-size:17px">Тексты главной страницы</h2><div class="form"><label>Заголовок<input class="inp" id="htitle" value="${esc(CFG.heroTitle||"Школа ТН ЖК")}"></label><label>Описание<textarea class="inp" rows="3" id="htext" placeholder="Оставьте пустым — будет стандартный текст">${esc(CFG.heroText||"")}</textarea></label></div><button class="btn pri" id="hsave" style="margin-top:10px">Сохранить тексты</button></div>''')
p4=p4.replace('''    if(a==="settings"){''','''    if(a==="settings"){
      document.getElementById("needall").onchange=async e=>{try{await P.db.doc("cms/main").set(Object.assign({},CFG,{needAll:e.target.checked}));FLASH="Настройка сохранена."}catch(er){alert("Нет прав на запись.")}};
      document.getElementById("hsave").onclick=async()=>{try{await P.db.doc("cms/main").set(Object.assign({},CFG,{heroTitle:document.getElementById("htitle").value.trim(),heroText:document.getElementById("htext").value.trim()}));FLASH="Тексты главной сохранены."}catch(er){alert("Нет прав на запись.")}};''')
# routing with tab
p4=p4.replace('const h=(location.hash||"#/").replace(/^#\\/?/,"");const [p,a,b]=h.split("/");','const h=(location.hash||"#/").replace(/^#\\/?/,"");const [p,a,b,c]=h.split("/");')
p4=p4.replace('''else if(a==="new"){if(SEC.some(s=>s[0]===b)){edStart(null,b);history.replaceState(null,"","#/mentor/edit/"+ED.id);html=editorPage()}else html=notFound()}
    else if(a==="edit"){if((ED&&ED.id===b)||edStart(b))html=editorPage();else html=notFound()}''','''else if(a==="new"){if(SEC.some(s=>s[0]===b)){edStart(null,b);history.replaceState(null,"","#/mentor/edit/"+ED.id+"/main");lastHash=location.hash;html=editorPage("main")}else html=notFound()}
    else if(a==="edit"){if((ED&&ED.id===b)||edStart(b))html=editorPage(c);else html=notFound()}''')
p4=p4.replace('bindPage(p,a,b);','bindPage(p,a,b,c);').replace('function bindPage(p,a,b){','function bindPage(p,a,b,c){')
p4=p4.replace('    if(a==="edit"||a==="new")bindEditor();','    if(a==="edit")bindEditor(c||"main");if(a==="new")bindEditor("main");')
p4=p4.replace('  if(p==="l"&&LS.find(x=>x.id===a)&&!locked(LS.find(x=>x.id===a)))bindLesson(LS.find(x=>x.id===a));','  {const L0=(isMentor()?ALL:LS).find(x=>x.id===a);if(p==="l"&&L0&&!locked(L0))bindLesson(L0)}')
p4=p4.replace('    else{ED=null;html=mentorDash()}','    else{html=mentorDash()}')
# hashchange guard
p4=p4.replace('window.addEventListener("hashchange",()=>{FLASH="";render()});','''let lastHash=location.hash,skipHash=false;
window.addEventListener("hashchange",()=>{
  if(skipHash){skipHash=false;lastHash=location.hash;return}
  const stay=ED&&location.hash.startsWith("#/mentor/edit/"+ED.id+"/");
  if(ED&&ED._ch&&!stay){if(!confirm("Есть несохранённые изменения урока. Уйти без сохранения?")){skipHash=true;location.hash=lastHash;return}ED=null}
  else if(ED&&!stay)ED=null;
  if(!stay)FLASH="";lastHash=location.hash;render()});
window.addEventListener("beforeunload",e=>{if(ED&&ED._ch){e.preventDefault();e.returnValue=""}});''')
# header patches (from earlier hotfix)
p4=p4.replace('  document.querySelectorAll("#nav a").forEach(x=>x.classList.toggle("on",x.dataset.r===(p==="s"||p==="l"?"":p)));',
 '  document.querySelectorAll("#nav a").forEach(x=>x.classList.toggle("on",x.dataset.r===(p==="s"||p==="l"?"":p)));\n  const nb=document.getElementById("navm");nb.classList.toggle("on",p==="mentor");nb.textContent=isMentor()?"Кабинет наставника":"Вход наставника";')
p4=p4.replace('render();\ninitPlatform();','try{const tb=document.querySelector(".top");const sh=()=>{if(getComputedStyle(tb).position==="sticky")document.documentElement.style.setProperty("--hh",tb.offsetHeight+"px")};new ResizeObserver(sh).observe(tb);sh()}catch(e){}\nrender();\ninitPlatform();')
p3=p3.replace('<p class="mut sm" style="margin-top:14px">${P.db?','<p class="sm" style="margin-top:14px">Вы наставник? <a href="#/mentor">Войти в режим наставника</a></p><p class="mut sm" style="margin-top:6px">${P.db?')
p1=open('p1b.html',encoding='utf-8').read()
p1=p1.replace('<a href="#/mentor" data-r="mentor" id="navm">Наставник</a>','')
p1=p1.replace('<a class="who hidden" id="who" href="#/progress"></a>','<a class="who hidden" id="who" href="#/progress"></a><a class="mbtn" id="navm" href="#/mentor">Вход наставника</a>')
p1=p1.replace('.who{','.mbtn{background:var(--acc);color:#22262A;text-decoration:none;font-weight:800;font-size:13px;padding:7px 12px;border-radius:6px;white-space:nowrap}.mbtn.on{outline:2px solid #fff}\n.who{')
p1=p1.replace('.nav{display:flex;gap:4px;overflow-x:auto;flex:1;scrollbar-width:none}','.nav{display:flex;gap:4px;flex-wrap:wrap;flex:1}\n@media (max-width:860px){.nav{flex-wrap:nowrap;overflow-x:auto;order:3;flex-basis:100%;scrollbar-width:none}}')
p1=p1.replace('.steps{position:sticky;top:calc(env(safe-area-inset-top,0px) + 60px);','.steps{position:sticky;top:calc(env(safe-area-inset-top,0px) + var(--hh,60px));')
p1=p1.replace('@media (max-width:860px){.nav{','@media (max-width:860px){.top{position:static}:root{--hh:0px!important}.nav{')
p1=p1.replace('html{scroll-padding-top:calc(env(safe-area-inset-top,0px) + 120px)','html{scroll-padding-top:calc(env(safe-area-inset-top,0px) + var(--hh,60px) + 60px)')
p1=p1.replace('<footer>Схемы в уроках — учебные иллюстрации узлов, а не фото конкретного объекта.','<footer>Схемы в базовых уроках — учебные иллюстрации узлов; фото-задания, лекции и примеры добавляют наставники.')
p1=p1.replace('.btn.disabled{','''.blk>h2 .edit{margin-left:auto;font-family:var(--fb);font-size:13px;padding:5px 10px;background:var(--acc);border-color:var(--acc);color:#22262A}
.btn.edit{background:var(--acc);border-color:var(--acc);color:#22262A}
.mbar{background:var(--ink);color:var(--bg);border-radius:8px;padding:10px 14px;margin-bottom:12px;display:flex;gap:12px;align-items:center;flex-wrap:wrap;font-size:14px}
.zone{fill:rgba(242,183,5,.18);stroke:#F2B705;stroke-width:3;stroke-dasharray:8 6}
.lec{font-size:16.5px;line-height:1.65;max-width:75ch}.lec p{margin:0 0 12px}.lec ul{margin:0 0 12px;padding-left:22px}.lec-h{font-size:18px;margin:18px 0 8px}.lec-img{margin:14px 0}.lec-img img{max-width:100%;border-radius:8px;cursor:zoom-in}.lec-img figcaption{font-size:14px}
.lecb{border:1px solid var(--line);border-radius:8px;padding:12px;margin-bottom:10px;background:var(--soft);display:grid;gap:8px}
.btn.disabled{''')
html=p1+open('p2b.js',encoding='utf-8').read()+"\n"+open('data.js',encoding='utf-8').read()+p3+p4
open('/mnt/user-data/outputs/shkola-tn-zhk.html','w',encoding='utf-8').write(html)
open('check.js','w',encoding='utf-8').write(html[html.index('<script>')+8:html.rindex('</script>')])
for need in ['needall','mbtn','lastHash','lessonQuiz','editorPage(c)','bindEditor(c||']:
    assert need in html, need
print(len(html))

# ===== v4 patches =====
import base64
html=open('/mnt/user-data/outputs/shkola-tn-zhk.html',encoding='utf-8').read()
def sl(src,name): return cut(src,name)
# rebuild p3 with p3y
p3=open('p3b.js',encoding='utf-8').read()
for f in ['home','lessonPage','finder','bindLesson','trainerLoad','examStart']: p3=cut(p3,f)
p3x=open('p3x.js',encoding='utf-8').read()
for f in ['lessonPage','bindLesson','tryPass','lecHTML','home','customQs','lessonQuiz']: p3x=cut(p3x,f)
p3y=open('p3y.js',encoding='utf-8').read()
for f in ['desTask','desTaskHTML']: p3y=cut(p3y,f)
p3=open('p0ui.js',encoding='utf-8').read()+p3+p3x+p3y+open('p3z.js',encoding='utf-8').read()+open('p5.js',encoding='utf-8').read()
p3=p3.replace('<p class="mut sm" style="margin-top:14px">${P.db?','<p class="sm" style="margin-top:14px">Вы наставник? <a href="#/mentor">Войти в режим наставника</a></p><p class="mut sm" style="margin-top:6px">${P.db?')
p3=p3.replace('else if(["","s","video","norms","des","progress","mentor"].includes(p))render();','else if(["","s","video","norms","des","progress","mentor"].includes(p)||(p==="l"&&isMentor()))render();')
# section page badges
p3=p3.replace('<p class="mut">${ls.length} уроков.${CFG.seq?" Следующий урок открывается после зачёта блиц-теста предыдущего (от 80 %).":""}</p>',
 '<p class="mut">${ls.length} уроков. Урок осваивается, когда пройдены все шаги, найдены все дефекты, верно составлено замечание DES и сдан блиц-тест (от 80 %). Раздел закрыт, когда освоены все его уроки.</p>${secMastered(k)?`<p><span class="pill ok">Раздел освоен</span></p>`:""}')
p3=p3.replace('<div class="crumbs"><a href="#/">Школа</a> / ${esc(secName(k))}</div>','<div class="crumbs"><a href="#/">Разделы</a> / ${esc(secName(k))}</div>')
p3=p3.replace('isDone(l.id)?`Пройден ${fdd(x.p)}`','isDone(l.id)?`Освоен ${fdd(x.p)}`')
p3=p3.replace('<span class="mut sm">${n} уроков · пройдено ${d}</span>','<span class="mut sm">${n} уроков · освоено ${d}${secMastered(s[0])?" · <b style=\'color:var(--good)\'>раздел закрыт ✓</b>":""}</span>')
# home branding
p3=p3.replace('<h1>${esc(CFG.heroTitle||"Школа ТН ЖК")}</h1>','<img class="hero-logo" src="${LOGO_FULL}" alt="Engineering Services"><h1>${esc(CFG.heroTitle||"Центр «Практика ТН»")}</h1>')
p3=p3.replace('`${LS.length} визуальных уроков технадзора на строительстве жилых комплексов. Обучение глазами ТН: каждый урок — это узел, дефекты, норматив и готовое замечание.`','`Учебный центр технического надзора Engineering Services: ${LS.length} визуальных уроков по строительству жилых комплексов. Наставник готовит материал, абитуриент проходит урок и подтверждает знания.`')
p3=p3.replace('<h2 style="font-size:20px">Разделы курса</h2>','<h2 style="font-size:20px">Разделы</h2>')
# progress page: exam button + DES col
p3=p3.replace('<a class="btn" href="#/register">Изменить данные</a></div>','<div class="row"><a class="btn pri" href="#/exam">Пройти аттестацию</a><a class="btn" href="#/register">Изменить данные</a></div></div>')
p3=p3.replace('<th>Урок</th><th>Начат</th><th>Найди дефект</th><th>Тест</th><th>Пройден</th>','<th>Урок</th><th>Начат</th><th>Найди дефект</th><th>DES</th><th>Тест</th><th>Освоен</th>')
p3=p3.replace('<td>${x.f?`${x.f[0]}/${x.f[1]}`:"—"}</td><td>${x.q!=null?x.q+"%":"—"}</td><td>${x.p?fdd(x.p):"—"}</td>','<td>${x.fall?"✓ "+fdd(x.fall):x.f?`${x.f[0]}/${x.f[1]}`:"—"}</td><td>${x.dp?"✓ "+fdd(x.dp):x.da?"ошибки":"—"}</td><td>${x.q!=null?x.q+"%":"—"}</td><td>${x.p?fdd(x.p):"—"}</td>')
p3=p3.replace('<h2 style="font-size:16px">${s[0]}. ${esc(s[1])} · ${secDone(s[0])}/${secCnt(s[0])}</h2>','<h2 style="font-size:16px">${s[0]}. ${esc(s[1])} · ${secDone(s[0])}/${secCnt(s[0])}${secMastered(s[0])?" · раздел освоен ✓":""}</h2>')
p3=p3.replace('<div><b>${done}</b>уроков пройдено из ${LS.length}</div>','<div><b>${done}</b>уроков освоено из ${LS.length}</div><div><b>${SEC.filter(s=>secMastered(s[0])).length}</b>разделов закрыто из ${SEC.length}</div>')
# p4
p4=open('p4b.js',encoding='utf-8').read()
a=p4.index('/* ----- редактор урока ----- */');b=p4.index('/* ----- журнал абитуриентов ----- */')
p4x=open('p4x.js',encoding='utf-8').read()
p4x=p4x.replace('data-ln="vids" placeholder="Монтаж окна по ГОСТ 30971 | https://www.youtube.com/watch?v=…">${esc(linkLines(l.vids))}','data-ln="vids" placeholder="Монтаж окна по ГОСТ 30971 | https://www.youtube.com/watch?v=…">${esc(linkLines(effVids(l)))}')
p4x=p4x.replace('data-ln="lnk" placeholder="Альбом узлов производителя | https://…">${esc(linkLines(l.lnk))}','data-ln="lnk" placeholder="Альбом узлов производителя | https://…">${esc(linkLines(effLnk(l)))}')
p4x=p4x.replace('Видео «Обязательно к просмотру» — по одному на строку: Название | ссылка','Видео шага «Видео и материалы» — по одному на строку: Название | ссылка. Порядок строк = порядок на странице')
p4x=p4x.replace('Ссылки для обзора в блоке «Посмотри» (фото, статьи, документы): Название | ссылка','Ссылки шага «Посмотри» (фото, статьи, документы): Название | ссылка')
p4x=p4x.replace('''   <label class="row"><input type="checkbox" data-b="auto" ${l.auto!==false?"checked":""}> Показывать автоматические подборки (поиск YouTube, Rutube, Яндекс по ключевым словам)</label></div>''','''   <p class="mut sm">Сюда уже подставлены автоматические подборки поиска. Замените их своими ссылками или удалите строки.</p></div>''')
p4x=p4x.replace('on("[data-ln]","input",e=>{ED[e.target.dataset.ln]=parseLinks(e.target.value);mark()});','on("[data-ln]","input",e=>{const k=e.target.dataset.ln;ED[k]=parseLinks(e.target.value);ED[k+"Set"]=true;mark()});')
p4x=p4x.replace('vids:ED.vids.filter(validLink),lnk:ED.lnk.filter(validLink),auto:ED.auto!==false,','vids:ED.vids.filter(validLink),lnk:ED.lnk.filter(validLink),auto:ED.auto!==false,vidsSet:!!ED.vidsSet,lnkSet:!!ED.lnkSet,stt:ED.stt||{},sti:ED.sti||{},cap:ED.cap||"",')
p4x=p4x.replace('const badL=[...ED.vids,...ED.lnk]','const badL=[...(ED.vidsSet?ED.vids:[]),...(ED.lnkSet?ED.lnk:[])]')
p4=p4[:a]+p4x+p4[b:]
# settings page extension
p4=p4.replace('''<label class="row"><input type="checkbox" id="seq" ${CFG.seq?"checked":""}> Открывать уроки раздела по порядку: следующий — после зачёта блиц-теста предыдущего (80 %)</label></div>''',
'''<label class="row"><input type="checkbox" id="seq" ${CFG.seq?"checked":""}> Открывать уроки раздела по порядку: следующий — после зачёта предыдущего</label>
  <label class="row" style="margin-top:8px"><input type="checkbox" id="needall" ${CFG.needAll!==false?"checked":""}> Для зачёта урока нужно найти все дефекты в задании «Найди дефект» и сдать блиц-тест на 80 %</label></div>
  <div class="blk"><h2 style="font-size:17px">Тексты главной страницы</h2><div class="form"><label>Заголовок<input class="inp" id="htitle" value="${esc(CFG.heroTitle||"Школа ТН ЖК")}"></label><label>Описание<textarea class="inp" rows="3" id="htext" placeholder="Оставьте пустым — будет стандартный текст">${esc(CFG.heroText||"")}</textarea></label></div><button class="btn pri" id="hsave" style="margin-top:10px">Сохранить тексты</button></div>''')
p4=p4.replace('''    if(a==="settings"){''','''    if(a==="settings"){
      document.getElementById("needall").onchange=async e=>{try{await P.db.doc("cms/main").set(Object.assign({},CFG,{needAll:e.target.checked}));FLASH="Настройка сохранена."}catch(er){alert("Нет прав на запись.")}};
      document.getElementById("hsave").onclick=async()=>{try{await P.db.doc("cms/main").set(Object.assign({},CFG,{heroTitle:document.getElementById("htitle").value.trim(),heroText:document.getElementById("htext").value.trim()}));FLASH="Тексты главной сохранены."}catch(er){alert("Нет прав на запись.")}};''')
p4=p4.replace('''  <div class="blk"><h2 style="font-size:17px">Тексты главной страницы</h2>''','''  <div class="blk"><h2 style="font-size:17px">Доступ новых абитуриентов</h2>
  <label class="row"><input type="radio" name="accdef" value="all" ${CFG.accDef!=="none"?"checked":""}> Открывать все разделы сразу после регистрации</label>
  <label class="row" style="margin-top:6px"><input type="radio" name="accdef" value="none" ${CFG.accDef==="none"?"checked":""}> Закрывать все разделы — наставник открывает их в журнале («Доступ к разделам»)</label></div>
  <div class="blk"><h2 style="font-size:17px">Тексты главной страницы</h2>''',1)
p4=p4.replace('const h=(location.hash||"#/").replace(/^#\\/?/,"");const [p,a,b]=h.split("/");','const h=(location.hash||"#/").replace(/^#\\/?/,"");const [p,a,b,c]=h.split("/");')
p4=p4.replace('''else if(a==="new"){if(SEC.some(s=>s[0]===b)){edStart(null,b);history.replaceState(null,"","#/mentor/edit/"+ED.id);html=editorPage()}else html=notFound()}
    else if(a==="edit"){if((ED&&ED.id===b)||edStart(b))html=editorPage();else html=notFound()}''','''else if(a==="new"){if(SEC.some(s=>s[0]===b)){edStart(null,b);history.replaceState(null,"","#/mentor/edit/"+ED.id+"/main");lastHash=location.hash;html=editorPage("main")}else html=notFound()}
    else if(a==="edit"){if((ED&&ED.id===b)||edStart(b))html=editorPage(c);else html=notFound()}''')
p4=p4.replace('bindPage(p,a,b);','bindPage(p,a,b,c);').replace('function bindPage(p,a,b){','function bindPage(p,a,b,c){')
p4=p4.replace('    if(a==="edit"||a==="new")bindEditor();','    if(a==="edit")bindEditor(c||"main");if(a==="new")bindEditor("main");')
p4=p4.replace('  if(p==="l"&&LS.find(x=>x.id===a)&&!locked(LS.find(x=>x.id===a)))bindLesson(LS.find(x=>x.id===a));','  {const L0=(isMentor()?ALL:LS).find(x=>x.id===a);if(p==="l"&&L0&&!locked(L0))bindLesson(L0,b,c)}')
p4=p4.replace('else if(p==="l")html=lessonPage(a);','else if(p==="l")html=lessonPage(a,b,c);')
p4=p4.replace('    else{ED=null;html=mentorDash()}','    else{html=mentorDash()}')
p4=p4.replace('window.addEventListener("hashchange",()=>{FLASH="";render()});','''let lastHash=location.hash,skipHash=false;
window.addEventListener("hashchange",()=>{
  if(skipHash){skipHash=false;lastHash=location.hash;return}
  const stay=ED&&location.hash.startsWith("#/mentor/edit/"+ED.id+"/");
  if(ED&&ED._ch&&!stay){const target=location.hash;skipHash=true;location.hash=lastHash;uiConfirm("Есть несохранённые изменения урока. Уйти без сохранения?","Уйти").then(ok=>{if(ok){ED=null;location.hash=target}});return}
  else if(ED&&!stay)ED=null;
  if(!stay)FLASH="";lastHash=location.hash;render()});
window.addEventListener("beforeunload",e=>{if(ED&&ED._ch){e.preventDefault();e.returnValue=""}});''')
p4=p4.replace('  document.querySelectorAll("#nav a").forEach(x=>x.classList.toggle("on",x.dataset.r===(p==="s"||p==="l"?"":p)));',
 '  document.querySelectorAll("#nav a").forEach(x=>x.classList.toggle("on",x.dataset.r===(p==="s"||p==="l"?"":p)));\n  const nb=document.getElementById("navm");nb.classList.toggle("on",p==="mentor");nb.textContent=isMentor()?"Кабинет наставника":"Вход наставника";')
p4=p4.replace('render();\ninitPlatform();','try{const tb=document.querySelector(".top");const sh=()=>{if(getComputedStyle(tb).position==="sticky")document.documentElement.style.setProperty("--hh",tb.offsetHeight+"px")};new ResizeObserver(sh).observe(tb);sh()}catch(e){}\nrender();\ninitPlatform();')
# journal
p4=p4.replace('const ex=(r.ex||[]).slice(-1)[0];return{done,','const ex=(r.ex||[]).slice(-1)[0];const ms=SEC.filter(s=>{const ls=LS.filter(l=>l.s===s[0]);return ls.length&&ls.every(l=>lp2[l.id]&&lp2[l.id].p)}).length;return{ms,done,')
p4=p4.replace('<th>Пройдено</th><th>Ср. тест</th>','<th>Уроков освоено</th><th>Разделов закрыто</th><th>Ср. тест</th>')
p4=p4.replace('<td>${s.done}/${LS.length}</td><td>${s.avg!=null?s.avg+"%":"—"}</td><td>${s.fp!=null?s.fp+"%":"—"}</td><td>${fd(s.last)}</td>','<td>${s.done}/${LS.length}</td><td>${s.ms}/${SEC.length}</td><td>${s.avg!=null?s.avg+"%":"—"}</td><td>${s.fp!=null?s.fp+"%":"—"}</td><td>${fd(s.last)}</td>')
p4=p4.replace('colspan="9"','colspan="10"')
p4=p4.replace('<th>Урок</th><th>Начат</th><th>Найди дефект</th><th>Тест (попыток)</th><th>Пройден</th>','<th>Урок</th><th>Начат</th><th>Шаги</th><th>Найди дефект</th><th>DES</th><th>Тест (попыток)</th><th>Освоен</th>')
p4=p4.replace('<td>${fd(x.o)}</td><td>${x.f?`${x.f[0]}/${x.f[1]} · ${fdd(x.f[2])}`:"—"}</td><td>${x.q!=null?`${x.q}% (${x.qa||1})`:"—"}</td>','<td>${fd(x.o)}</td><td>${lessonSteps(l).filter(s=>x.v&&x.v[s]).length}/${lessonSteps(l).length}</td><td>${x.fall?"✓ "+fdd(x.fall):x.f?`${x.f[0]}/${x.f[1]}`:"—"}${x.seen&&!x.fall?" · смотрел ответы":""}</td><td>${x.dp?"✓ "+fdd(x.dp):x.da?`ошибки (${x.da})`:"—"}</td><td>${x.q!=null?`${x.q}% (${x.qa||1})`:"—"}</td>')
p4=p4.replace('<h2 style="font-size:16px">${sc[0]}. ${esc(sc[1])}</h2><div class="tbl-wrap"><table class="nt"><tr><th>Урок</th><th>Начат</th><th>Шаги</th>','<h2 style="font-size:16px">${sc[0]}. ${esc(sc[1])}${LS.filter(l=>l.s===sc[0]).every(l=>lp2[l.id]&&lp2[l.id].p)?" · раздел освоен ✓":""}</h2><div class="tbl-wrap"><table class="nt"><tr><th>Урок</th><th>Начат</th><th>Шаги</th>')
p4=p4.replace('''  <button class="btn dark" id="addsec">＋ Новый раздел</button>`;''','''  <div class="row"><button class="btn dark" id="addsec">＋ Новый раздел</button><a class="btn" href="#/des">Библиотека DES-замечаний</a><a class="btn" href="#/exam">Аттестация</a></div>`;''')
p4=p4.replace('''const head=["ФИО","Специальность","Уровень","Объект","В школе с","Пройдено уроков",''','''const head=["ФИО","Специальность","Уровень","Объект","В школе с","Освоено уроков",''')
# p1 header/branding
small="data:image/jpeg;base64,"+base64.b64encode(open('es_small.jpg','rb').read()).decode()
full="data:image/jpeg;base64,"+base64.b64encode(open('es_full.jpg','rb').read()).decode()
p1=p1.replace('<title>Школа ТН ЖК — 100 визуальных уроков технадзора</title>','<title>Центр «Практика ТН» — Engineering Services</title>')
p1=p1.replace('<a class="logo" href="#/"><i>ТН</i>Школа ТН ЖК</a>',f'<a class="logo" href="#/"><img src="{small}" alt="ES" width="40" height="33"><span>ЦЕНТР<br>«ПРАКТИКА ТН»</span></a>')
p1=p1.replace('<a href="#/" data-r="">Уроки</a><a href="#/trainer" data-r="trainer">Тренажёр дефектов</a><a href="#/video" data-r="video">Видеотека</a><a href="#/norms" data-r="norms">Нормативная база</a><a href="#/des" data-r="des">DES-замечания</a><a href="#/exam" data-r="exam">Аттестация</a><a href="#/progress" data-r="progress">Мой прогресс</a>',
 '<a href="#/" data-r="">Раздел</a><a href="#/trainer" data-r="trainer">Тренажёр дефектов</a><a href="#/video" data-r="video">Видеотека</a><a href="#/norms" data-r="norms">Нормативная база</a><a href="#/progress" data-r="progress">Мой прогресс</a>')
p1=p1.replace('<script>\n',f'<script>\nconst LOGO_FULL="{full}";\n',1)
css='''
:root{--acc:#C81130;--acc2:#E0A800;--brand:#C81130}
.logo img{border-radius:6px;display:block}.logo span{font:800 13px/1.15 var(--fh);letter-spacing:.02em}
.top .tape{background:repeating-linear-gradient(-45deg,var(--brand) 0 14px,#22262A 14px 28px)}
.nav a.on{background:var(--brand);color:#fff}
.mbtn{background:#F2B705;color:#22262A;text-decoration:none;font-weight:800;font-size:13px;padding:7px 12px;border-radius:6px;white-space:nowrap}.mbtn.on{outline:2px solid #fff}
.btn.pri{background:var(--brand);border-color:var(--brand);color:#fff}
.lnum{background:var(--brand);color:#fff}.princ div:last-child{background:var(--brand);color:#fff}
.hero-logo{width:96px;height:auto;display:block;margin-bottom:14px;border-radius:6px}
.tabs{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0 4px}
.tabs a,.tabs span{display:inline-flex;align-items:center;gap:6px;text-decoration:none;color:var(--ink);background:var(--card);border:1px solid var(--line);border-radius:20px;padding:6px 12px 6px 6px;font-size:13.5px;font-weight:600}
.tabs b{display:inline-grid;place-items:center;width:22px;height:22px;border-radius:50%;background:var(--ink);color:#fff;font-size:11px}
.tabs i{font-style:normal;color:var(--good);font-weight:800}
.tabs a.on{background:var(--brand);border-color:var(--brand);color:#fff}.tabs a.on b{background:#fff;color:var(--brand)}.tabs a.on i{color:#fff}
.tabs span.off{opacity:.5;cursor:not-allowed}
.lstat{display:flex;flex-wrap:wrap;gap:6px;margin-top:6px}.lstat>span{background:var(--soft);border:1px solid var(--line);border-radius:14px;padding:2px 10px}.lstat>span.ok{background:rgba(46,125,79,.15);border-color:var(--good);color:var(--good);font-weight:700}
.step-intro{border-left:4px solid var(--brand);background:var(--soft);padding:10px 14px;border-radius:0 8px 8px 0;margin-bottom:14px}.step-intro p{margin:0 0 6px}
.lnkw,.vidw{display:inline-flex;flex-direction:column;gap:4px;align-items:flex-start}.vidw{display:flex}.vidw .vid{width:100%}
.btn.sm{padding:3px 8px;font-size:12px}
.mdl{background:var(--card);color:var(--ink);border-radius:12px;padding:20px;width:min(560px,100%);max-height:90vh;overflow:auto;cursor:default}
.lb:has(.mdl){cursor:default}
fieldset.dq{border:1px solid var(--line);border-radius:8px;padding:10px 12px;margin:12px 0}fieldset.dq legend{font-weight:800;padding:0 6px}
fieldset.dq label{display:flex;gap:10px;padding:6px 8px;border-radius:6px;cursor:pointer;align-items:flex-start}fieldset.dq label.right{background:rgba(46,125,79,.18)}fieldset.dq label.wrong{background:rgba(210,58,46,.18)}
.blk.step{min-height:300px}
.btn.edit,.blk>h2 .btn.edit{background:#F2B705;border-color:#F2B705;color:#22262A;font-family:var(--fb);font-size:13px;padding:5px 10px}.btn.edit.sm{font-size:12px;padding:3px 8px}
.nav{min-width:0}.who{max-width:180px}.blk>h2 .edit[data-ehead]{margin-left:12px}
.sld{margin:16px 0}.sld-view{position:relative;background:#15171a;border-radius:10px;overflow:hidden;aspect-ratio:16/10}
.sld-view img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;opacity:0;transition:opacity .35s;pointer-events:none}.sld-view img.on{opacity:1;pointer-events:auto}
.zoom{position:absolute;top:10px;right:10px;width:44px;height:44px;border-radius:50%;border:2px solid rgba(255,255,255,.8);background:rgba(0,0,0,.55);color:#fff;display:grid;place-items:center;cursor:pointer;z-index:2}
.zoom:hover{background:var(--brand)}
.sld.full .zplus{d:path('M7.5 10.5h6')}
.dots{position:absolute;left:0;right:0;bottom:12px;display:flex;justify-content:center;gap:4px;z-index:2}
.dot{width:26px;height:26px;padding:0;border:0;background:transparent;cursor:pointer;display:grid;place-items:center}
.dot::after{content:"";width:12px;height:12px;border-radius:50%;border:2px solid #fff;background:rgba(255,255,255,.3);box-shadow:0 0 0 1px rgba(0,0,0,.35)}
.dot.on::after{background:#fff;transform:scale(1.15)}
.sld-n{position:absolute;left:12px;top:12px;background:rgba(0,0,0,.55);color:#fff;font-size:12px;font-weight:700;padding:3px 8px;border-radius:12px;z-index:2}
.sld figcaption{min-height:1.2em}
.sld.full{position:fixed;inset:0;z-index:80;margin:0;background:#000;display:flex;flex-direction:column;padding:env(safe-area-inset-top,0px) 0 env(safe-area-inset-bottom,0px)}
.sld.full .sld-view{flex:1;aspect-ratio:auto;border-radius:0}.sld.full .sld-view img.on{cursor:zoom-out}
.sld.full .zoom{top:calc(12px + env(safe-area-inset-top,0px));right:14px}
.sld.full figcaption{color:#ddd;padding:8px 16px;text-align:center}
body.noscroll{overflow:hidden}
.strip-track{position:relative}.strip-item.hid{display:none}
.strip-item.appear{animation:stripIn .5s ease}@keyframes stripIn{from{opacity:0;transform:translateX(40px)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion:reduce){.strip-item.appear{animation:none}}
.strip-more{flex:0 0 170px;scroll-snap-align:start;border:2px dashed var(--brand);border-radius:8px;background:rgba(200,17,48,.06);color:var(--ink);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;cursor:pointer;font:inherit;aspect-ratio:auto;align-self:stretch;max-height:260px}
.strip-more:hover{background:rgba(200,17,48,.14)}.strip-more .sm-arrow{width:44px;height:44px;border-radius:50%;background:var(--brand);color:#fff;font-size:28px;display:grid;place-items:center;line-height:1}
.strip-more .sm-n{font-size:13px;color:var(--mut)}
.strip-item .ph img{cursor:pointer}
.strip[data-all="0"] .strip-nav{display:none}
.extabs{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px}.extabs a,.extabs>button:not(.btn){text-decoration:none;color:var(--ink);background:var(--soft);border:1px solid var(--line);border-radius:8px;padding:6px 12px;font:600 14px var(--fb);cursor:pointer}.extabs a.on,.extabs>button.on{background:var(--ink);color:var(--bg);border-color:var(--ink)}
.taskside .dlist li{padding-top:8px;padding-bottom:8px}
.pgs-head{display:flex;align-items:center;gap:10px;padding:10px 0 12px;border-bottom:1px solid var(--line);margin-bottom:12px}.pgs-head h3{font-size:18px}
.pgs{display:grid;grid-template-columns:1fr 1fr;gap:12px;align-items:start}.pgs-col{display:grid;gap:12px}
.pcard{border:1px solid var(--line);border-radius:10px;padding:12px 14px;background:var(--card)}.pcard h4{font-size:14px;font-weight:800;margin:0 0 10px;font-family:var(--fb)}
.pgrid2{display:grid;grid-template-columns:1fr 1fr;gap:10px}.pgrid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px}
.pf{display:grid;gap:4px;font-size:13px;margin-bottom:8px}.pf>span{color:var(--mut)}.pf .inp{width:100%;font-size:14px}.pf small{font-size:12px}.req{color:var(--bad);font-style:normal}
.pcard fieldset.dq{margin:0 0 10px}
.pdrop{border:2px dashed var(--line);border-radius:10px;padding:10px;display:flex;flex-wrap:wrap;gap:10px;align-items:center}
.pthumb{width:150px;border:1px solid var(--line);border-radius:8px;background:var(--bg);padding:4px;cursor:zoom-in;display:grid;gap:4px;text-align:left;font:inherit;color:inherit}.pthumb svg{border-radius:6px}.pthumb small{font-size:11px}
.viewer{width:min(1100px,100%)}.viewer-img svg{width:100%;height:auto;max-height:70vh;border-radius:8px;background:#111}
.nrows{display:grid;gap:8px}.nrow{display:grid;grid-template-columns:1.2fr .8fr 2fr auto;gap:8px;align-items:start}.nhead{font-size:12px;color:var(--mut);font-weight:700}
.dqe{border:1px solid var(--line);border-radius:10px;padding:10px 12px;margin:10px 0}.dqe h4{font-size:14px;margin:0 0 8px;font-family:var(--fb)}.dqrow{margin-bottom:6px;align-items:flex-start;flex-wrap:nowrap}
.qopt{margin:6px 0;flex-wrap:nowrap}
.hbw{border:1px dashed #E0A800;border-radius:10px;padding:10px 12px;margin:0 0 14px}
.hero.rev>div:first-child{order:2}.hero.noimg{grid-template-columns:1fr}.hero-img{width:100%;border-radius:8px;display:block}
.hb-text{margin:0 0 20px;max-width:80ch}.hb-text h2{font-size:22px;margin-bottom:8px}
.hb-img{margin:0 0 20px}.hb-img img{width:100%;border-radius:10px;display:block;cursor:zoom-in}.hb-half{max-width:50%}.hb-third{max-width:33%}
.hb-gal{margin-bottom:20px}.hb-hr{border:0;border-top:2px solid var(--line);margin:20px 0}
.secw{display:flex;flex-direction:column}.secadd{display:grid;place-items:center;align-content:center;gap:6px;min-height:180px;border:2px dashed #E0A800;background:rgba(242,183,5,.08);cursor:pointer;font:inherit;color:var(--ink)}.secadd span{font-size:34px;line-height:1}
@media (max-width:860px){.pgs,.pgrid2,.pgrid3,.nrow{grid-template-columns:1fr}.hb-half,.hb-third{max-width:100%}}
.ansbox{margin-top:20px;padding-top:16px;border-top:2px solid var(--line)}.ansbox h3{font-size:17px;margin-bottom:12px}
.strip{position:relative;margin:16px 0}
.strip-track{display:flex;gap:12px;overflow-x:auto;scroll-snap-type:x mandatory;padding-bottom:8px;scrollbar-width:thin}
.strip-item{flex:0 0 calc((100% - 24px)/3);scroll-snap-align:start;margin:0;min-width:0}
.strip-item .ph{position:relative;aspect-ratio:4/3;border-radius:8px;overflow:hidden;background:#15171a}
.strip-item img{width:100%;height:100%;object-fit:cover;display:block}
.strip-item .zoom{width:38px;height:38px;top:8px;right:8px}
.strip-item figcaption{font-size:14px;margin-top:6px}
.strip-num{position:absolute;left:8px;top:8px;background:var(--brand);color:#fff;font-weight:800;font-size:12px;width:24px;height:24px;border-radius:50%;display:grid;place-items:center}
.strip-nav{position:absolute;top:calc(50% - 40px);width:40px;height:40px;border-radius:50%;border:0;background:rgba(0,0,0,.6);color:#fff;font-size:26px;line-height:1;cursor:pointer;z-index:3}
.strip-nav.prev{left:-6px}.strip-nav.next{right:-6px}.strip-nav:hover{background:var(--brand)}
@media (max-width:700px){.strip-item{flex-basis:82%}}
.lec{max-width:none!important}.lec>p,.lec>ul,.lec>.lec-h,.lec>.mentor-note,.lecw>p,.lecw>ul,.lecw>.lec-h,.lecw>.mentor-note{max-width:75ch}
.lecw{border:1px dashed #E0A800;border-radius:10px;padding:10px 12px;margin:0 0 12px}
.lec-tools{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-bottom:8px}
.lec-add{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-top:16px;padding:14px;border:2px dashed #E0A800;border-radius:10px;background:rgba(242,183,5,.08)}
@media (max-width:1180px){.who{display:none}}
'''
p1=p1.replace('</style>',css+'</style>',1)
p1=p1.replace('<footer>',f'<footer><img src="{full}" alt="Engineering Services" style="width:64px;display:block;margin-bottom:8px;border-radius:4px">',1)
p4=p4.replace('function render(){','function render(){rebuild();',1)
p4=p4.replace('  if(p==="trainer"){','  if(!p)bindHome();\n  if(p==="trainer"){',1)
import re as _re
p4=p4.replace('const k=bt.dataset.ren;const n=prompt(','const k=bt.dataset.ren;const n=await uiPrompt(').replace('const n=prompt("Название нового раздела")','const n=await uiPrompt("Название нового раздела")')
p4=p4.replace('if(!confirm(`Удалить раздел','if(!await uiConfirm(`Удалить раздел')
p4=p4.replace('e.onclick=()=>{const left=','e.onclick=async()=>{const left=').replace('if(left&&!confirm(','if(left&&!await uiConfirm(')
p4=p4.replace('document.getElementById("updgo").onclick=()=>{if(dirty&&!confirm(','document.getElementById("updgo").onclick=async()=>{if(dirty&&!await uiConfirm(')
p3=_re.sub(r'(?<![\w.])alert\(','uiAlert(',p3);p4=_re.sub(r'(?<![\w.])alert\(','uiAlert(',p4)
html=p1+open('p2b.js',encoding='utf-8').read()+"\n"+open('data.js',encoding='utf-8').read()+p3+p4
open('/mnt/user-data/outputs/shkola-tn-zhk.html','w',encoding='utf-8').write(html)
open('check.js','w',encoding='utf-8').write(html[html.index('<script>')+8:html.rindex('</script>')])
for need in ['bindHome();','function showTaskPhoto','data-dqon','data-qok','data-nadd','function render(){rebuild();','id="needall"','name="accdef"','id="hsave"','accMatrix','secAllowed','lessonPage(a,b,c)','bindLesson(L0,b,c)','function TG()','data-exadd','stripMore','data-smore','sliderHTML','bindLecture(l)','.sld.full{','class="zone"' if False else '.zone{','.mbar{','--hh','Раздел</a>','secMastered','LOGO_FULL','vidsSet:!!ED.vidsSet','Разделов закрыто','#/exam">Аттестация']:
    assert need in html, need
print("v4",len(html))
