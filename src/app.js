/* ====================================================================
   Основной код приложения: инструктаж, упражнения, редактор, журнал,
   маршрутизация. Перенесено из prototype/index.html (движок +
   страницы) практически без изменений логики; изменено: подключение
   к Supabase вместо window.claude.use, убран экран пароля наставника
   (роль теперь определяется profiles.role), blobUrl ведёт в Supabase
   Storage, LOGO_FULL — файл из public/.
   ==================================================================== */
import { N, BASE_SEC, BASE, nm } from "./data/lessons.js";
import { esc, enc } from "./utils.js";
import { uiConfirm, uiPrompt, uiAlert } from "./ui/dialogs.js";
import { db as platformDb, user as platformUser, assets as platformAssets, downloads as platformDownloads, blobUrl, onAuthChange, signOut, mountLoginScreen, notifyAssignment, listProfiles, setProfileRole, updatePassword } from "./platform.js";
import { parseWorkbook, pickRandom } from "./examBank.js";

const LOGO_FULL="/logo-full.jpg";
let SEC=BASE_SEC.map(s=>s.slice());
let LS=[],ALL=[];
const secName=k=>(SEC.find(s=>s[0]===k)||[])[1]||"";

/* ---------- scenes ---------- */
const V=n=>`var(--${n})`;
const R=(x,y,w,h,f,e="")=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${f}" ${e}/>`;
const Ln=(a,b,c,d,s,w=2,e="")=>`<line x1="${a}" y1="${b}" x2="${c}" y2="${d}" stroke="${s}" stroke-width="${w}" ${e}/>`;
const rep=(n,f)=>Array.from({length:n},(_,i)=>f(i)).join("");
const SC={
form:()=>R(0,0,600,360,V("sky"))+R(0,320,600,40,V("con2"))+rep(4,i=>R(60+i*120,40,120,280,V("ply"),'stroke="#7a4a1f" stroke-width="2"'))+rep(3,i=>Ln(60,100+i*80,540,100+i*80,"#5d6166",5))+rep(3,j=>rep(4,i=>`<circle cx="${120+i*120}" cy="${90+j*80}" r="5" fill="#3a3d40"/>`))+Ln(62,150,8,320,"#4b4f53",6)+Ln(538,150,592,320,"#4b4f53",6)+Ln(60,22,540,22,"#E0A800",4)+rep(5,i=>Ln(60+i*120,22,60+i*120,40,"#E0A800",3)),
slab:()=>R(0,0,600,360,V("sky"))+R(0,320,600,40,V("con2"))+rep(9,i=>Ln(30+i*24,30,30+i*24,100,"#7b3f1d",3))+R(40,100,520,14,V("ply"),'stroke="#7a4a1f"')+R(40,114,520,8,"#C79A3A")+rep(7,i=>Ln(70+i*77,122,70+i*77,316,"#5b6066",7)+Ln(58+i*77,316,82+i*77,316,"#3a3d40",4)+Ln(62+i*77,126,78+i*77,126,"#3a3d40",4)),
mesh:()=>R(0,0,600,360,V("ply"))+rep(11,i=>Ln(20,30+i*30,580,30+i*30,"#7b3f1d",4))+rep(19,i=>Ln(30+i*30,15,30+i*30,345,"#8a4a22",4))+rep(11,j=>rep(19,i=>`<circle cx="${30+i*30}" cy="${30+j*30}" r="2.2" fill="#2b2b2b"/>`)),
cage:()=>R(0,0,600,360,V("sky"))+R(0,310,600,50,V("ply"),'stroke="#7a4a1f"')+rep(4,i=>Ln(245+i*37,10,245+i*37,330,"#7b3f1d",6))+rep(10,i=>`<rect x="236" y="${32+i*29}" width="128" height="4" fill="#5a2e14"/>`)+Ln(245,10,215,0,"#7b3f1d",6)+Ln(356,10,386,0,"#7b3f1d",6)+rep(6,i=>Ln(40+i*28,40,40+i*28,310,"#9a5a2e",3))+rep(6,i=>Ln(424+i*28,40,424+i*28,310,"#9a5a2e",3)),
conc:()=>R(0,0,600,360,V("con"))+Ln(150,0,150,330,"#9a9b96",1.5)+Ln(300,0,300,330,"#9a9b96",1.5)+Ln(450,0,450,330,"#9a9b96",1.5)+Ln(0,180,600,180,"#a3a49f",1.2)+rep(3,j=>rep(4,i=>`<circle cx="${75+i*150}" cy="${70+j*100}" r="6" fill="#8f908b"/>`))+R(0,330,600,30,V("con2")),
pour:()=>R(0,0,600,360,V("sky"))+R(0,320,600,40,V("con2"))+R(222,40,14,282,V("ply"))+R(364,40,14,282,V("ply"))+R(236,200,128,120,V("con"))+Ln(262,40,262,320,"#7b3f1d",3)+Ln(338,40,338,320,"#7b3f1d",3)+`<path d="M600 10 C470 10 320 0 300 40 L300 70" fill="none" stroke="#2f3337" stroke-width="16"/>`+Ln(160,90,222,110,"#4b4f53",5)+Ln(440,90,378,110,"#4b4f53",5),
cubes:()=>R(0,0,600,360,V("sky"))+R(80,232,440,14,"#8b6b4a")+Ln(100,246,100,330,"#6b5034",8)+Ln(500,246,500,330,"#6b5034",8)+R(0,330,600,30,V("con2"))+rep(3,i=>R(120+i*150,172,60,60,V("con"),'stroke="#555" stroke-width="2"')),
wp:()=>R(0,0,600,360,V("sky"))+R(0,60,274,300,V("soil"))+rep(12,i=>Ln(0,80+i*24,40+i*20,60,"#6f5538",1.5))+R(280,40,60,262,V("con"))+R(280,300,320,38,V("con"))+R(274,40,6,302,"#232323")+R(274,338,326,5,"#232323")+R(270,343,330,17,"#9a9a94")+Ln(0,60,274,60,"#4f7a2f",4),
wet:()=>R(0,0,600,360,V("tile"))+rep(6,i=>Ln(0,40+i*40,600,40+i*40,"#c2ccd1",1))+R(30,198,540,60,"#5c6670","opacity=\".75\"")+R(30,254,540,10,"#5c6670")+R(0,264,600,96,V("con"))+R(412,0,16,262,"#cfd5da",'stroke="#9aa3ab"')+`<circle cx="250" cy="259" r="9" fill="#9aa3ab" stroke="#555"/>`+Ln(30,0,30,264,"#9aa3ab",2)+Ln(570,0,570,264,"#9aa3ab",2),
roof:()=>R(0,0,600,360,V("sky"))+R(0,280,600,32,V("con"))+R(0,274,500,5,"#3d4a57")+R(0,230,500,44,V("ins"))+rep(6,i=>Ln(80+i*80,230,80+i*80,274,"#c9a63f",1.5))+R(0,214,500,16,"#a9a7a1")+R(0,207,500,7,"#2b2b2b")+R(500,58,50,254,V("con"))+R(494,130,6,84,"#2b2b2b")+R(490,128,14,5,"#7d858c")+R(494,50,62,8,"#9aa3ab")+`<path d="M160 207 L180 228 L200 207" fill="#555"/>`+R(176,228,8,84,"#666"),
mason:()=>R(0,0,600,360,V("sky"))+R(0,0,600,30,V("con"))+R(0,330,600,30,V("con"))+R(20,30,60,300,V("con"))+rep(10,j=>rep(8,i=>{const x=80+i*75-(j%2?37:0),y=30+j*30;if(x+75<=80||x>=600)return"";if(x>=380&&x<520&&y>=140)return"";const xx=Math.max(80,x),w=Math.min(x+75,600)-xx;return R(xx,y,w,30,V("blk"),'stroke="#c8c0b0" stroke-width="1.5"')}))+R(380,140,140,190,"#cfd8de")+R(370,114,170,26,"#8d8f92"),
win:()=>R(0,0,600,360,V("paint"))+R(180,60,240,220,"#2a2a2a")+R(190,70,220,200,V("wht"),'stroke="#b8bcc0"')+R(202,82,92,176,V("gls"))+R(306,82,92,176,V("gls"))+R(296,70,8,200,V("wht"))+R(286,160,6,20,"#9aa3ab")+R(170,280,260,12,V("wht"),'stroke="#b8bcc0"')+R(0,330,600,30,"#b9ab95"),
nvf:()=>R(0,0,600,360,V("con"))+R(40,20,360,330,V("ins"),'opacity=".92"')+rep(4,j=>rep(4,i=>R(114+i*120,50+j*80,12,20,"#9aa1a8",'stroke="#6b7177"')))+rep(5,j=>rep(3,i=>`<circle cx="${70+i*120}" cy="${40+j*70}" r="5" fill="#f4f4f4" stroke="#999"/>`))+rep(3,i=>R(116+i*120,10,8,340,"#b8bec4"))+rep(4,j=>rep(2,i=>R(404+i*90,20+j*82,84,76,V("tile2"))))+R(0,350,600,10,"#6b6f74"),
fin:()=>R(0,0,600,280,V("paint"))+R(0,0,600,14,"#d8d3c9")+rep(4,j=>rep(7,i=>R(20+i*40,152+j*32,38,30,V("tile"),'stroke="#b9c4c9"')))+R(416,76,88,204,"#e2dccf")+R(424,84,72,196,"#8b6a4a")+`<circle cx="486" cy="184" r="4" fill="#d9c37a"/>`+R(0,280,600,80,"#b9ab95"),
floor:()=>R(0,0,600,360,"#ECE8DF")+R(0,30,60,232,V("con"))+R(0,262,600,48,V("con"))+R(64,242,536,20,"#d8d0a6")+R(64,212,536,30,"#a9a7a1")+R(64,202,536,10,V("tile"))+rep(8,i=>Ln(124+i*60,202,124+i*60,212,"#8a9499",1.5))+R(60,202,4,60,"#4a90c2"),
mep:()=>R(0,0,600,360,"#E6E3DC")+R(0,0,600,20,V("con"))+R(296,20,10,300,"#c9c4b8")+Ln(0,60,600,60,"#c0392b",10)+Ln(0,82,600,82,"#2471a3",10)+rep(4,i=>Ln(80+i*140,20,80+i*140,88,"#555",2))+R(40,110,360,40,"#b7bec5",'stroke="#8d959c"')+R(40,192,400,7,"#8e959c")+rep(4,i=>Ln(40,186-i*2.5,440,186-i*2.5,["#222","#333","#c0392b","#2c3e50"][i],2))+R(450,150,100,150,"#d4d8dc",'stroke="#8d959c" stroke-width="2"')+Ln(500,150,500,300,"#8d959c",1.5)+R(0,320,600,40,V("con"))+`<circle cx="160" cy="24" r="7" fill="#f2f2f2" stroke="#999"/><circle cx="440" cy="24" r="7" fill="#f2f2f2" stroke="#999"/>`
};
const DF={
crack:(x,y)=>`<path d="M${x-30} ${y-18} l10 8 l-4 9 l12 6 l-3 10 l11 5 l8 12" fill="none" stroke="#2a2522" stroke-width="2.4"/>`,
honey:(x,y)=>[[0,0,5],[9,4,4],[-8,6,3.5],[4,-9,4],[-11,-5,3],[14,-6,3],[-3,11,4],[10,12,3],[-14,10,2.5],[2,3,2]].map(([a,b,r])=>`<circle cx="${x+a}" cy="${y+b}" r="${r}" fill="#3b3631"/>`).join(""),
rust:(x,y)=>`<ellipse cx="${x}" cy="${y}" rx="22" ry="12" fill="#9a4a1c" opacity=".78"/><path d="M${x-4} ${y+8} q2 18 -2 30 M${x+6} ${y+8} q-1 12 3 22" stroke="#8a3f16" stroke-width="3" fill="none" opacity=".7"/>`,
gap:(x,y)=>`<rect x="${x-22}" y="${y-3}" width="44" height="7" fill="#151515"/>`,
wire:(x,y)=>`<path d="M${x} ${y} l18 -14 M${x} ${y} l-14 -16 M${x} ${y} l4 20 M${x} ${y} l20 6" stroke="#4a4a4a" stroke-width="1.8"/>`,
puddle:(x,y)=>`<ellipse cx="${x}" cy="${y}" rx="38" ry="7" fill="#4f9fd0" opacity=".75"/>`,
bubble:(x,y)=>`<ellipse cx="${x}" cy="${y-4}" rx="20" ry="9" fill="#2b2b2b"/><ellipse cx="${x-5}" cy="${y-7}" rx="7" ry="3" fill="#777"/>`,
sag:(x,y)=>`<path d="M${x-50} ${y} Q${x} ${y+30} ${x+50} ${y}" fill="none" stroke="#2f2f2f" stroke-width="3.5"/>`,
debris:(x,y)=>`<path d="M${x-20} ${y} l8 -10 l9 4 l3 6z" fill="#6b5a46"/><rect x="${x+2}" y="${y-8}" width="14" height="5" fill="#a07a4a" transform="rotate(20 ${x+9} ${y-5})"/><circle cx="${x+18}" cy="${y-2}" r="4" fill="#555"/><path d="M${x-6} ${y+2} l6 -5 l5 5z" fill="#777"/>`,
tilt:(x,y)=>`<line x1="${x-14}" y1="${y+40}" x2="${x+14}" y2="${y-40}" stroke="#3a3a3a" stroke-width="6"/>`,
foam:(x,y)=>`<path d="M${x-18} ${y} q-4 -12 8 -14 q4 -10 14 -3 q12 -4 12 8 q8 8 -4 14 q-6 8 -16 2 q-12 4 -14 -7z" fill="#E6C24A" stroke="#c9a531"/>`,
holes:(x,y)=>[-14,0,14].map(d=>`<circle cx="${x+d}" cy="${y}" r="4" fill="#111" stroke="#999" stroke-width="1"/>`).join(""),
cable:(x,y)=>`<path d="M${x-40} ${y-10} C${x-20} ${y+30} ${x+20} ${y+30} ${x+40} ${y-10}" fill="none" stroke="#1d1d1d" stroke-width="3"/><path d="M${x-36} ${y-8} C${x-16} ${y+34} ${x+16} ${y+36} ${x+36} ${y-6}" fill="none" stroke="#c0392b" stroke-width="2"/>`,
flap:(x,y)=>`<path d="M${x-14} ${y} L${x+16} ${y} L${x+6} ${y-22} z" fill="#3a3a3a" stroke="#aaa" stroke-width="1"/>`,
wave:(x,y)=>`<path d="M${x-45} ${y} q11 -9 22 0 t22 0 t22 0 t22 0" fill="none" stroke="#333" stroke-width="2.6"/>`,
hole:(x,y)=>`<circle cx="${x}" cy="${y}" r="16" fill="#0d0d0d"/><circle cx="${x}" cy="${y}" r="9" fill="#9aa3ab" stroke="#555"/>`,
joint:(x,y)=>`<rect x="${x-50}" y="${y-5}" width="100" height="10" fill="#d9d2c3" stroke="#a69c88"/>`,
stain:(x,y)=>`<path d="M${x-20} ${y} q-2 -14 12 -16 q14 -6 22 6 q10 10 -2 18 q-14 8 -26 2 q-8 -2 -6 -10z" fill="#4f4b45" opacity=".6"/>`,
bar:(x,y)=>`<line x1="${x-45}" y1="${y+6}" x2="${x+45}" y2="${y-6}" stroke="#6e3b1e" stroke-width="5" stroke-linecap="round"/>`,
spacing:(x,y)=>[-24,-18,-4,22].map(d=>`<line x1="${x+d}" y1="${y-40}" x2="${x+d}" y2="${y+40}" stroke="#6e3b1e" stroke-width="4"/>`).join(""),
bulge:(x,y)=>`<path d="M${x-10} ${y-60} Q${x+24} ${y} ${x-10} ${y+60}" fill="none" stroke="#2b2b2b" stroke-width="3.5"/>`,
chip:(x,y)=>`<path d="M${x-14} ${y-10} l20 -4 l8 14 l-12 12 l-18 -6z" fill="#3f3a35" opacity=".88"/>`,
burn:(x,y)=>`<ellipse cx="${x}" cy="${y}" rx="28" ry="12" fill="#3b2a1a" opacity=".4"/><ellipse cx="${x}" cy="${y}" rx="17" ry="7" fill="#111" opacity=".85"/>`
};
function geo(l){if(l.photo){return{W:1000,H:Math.round(1000*l.photo.h/l.photo.w),k:1000/600}}return{W:600,H:360,k:1}}
function svgOf(l,mode,id){
  const g=geo(l);
  let s=`<svg ${id?`id="${id}"`:""} class="scn" viewBox="0 0 ${g.W} ${g.H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(l.t||"Схема")}">`;
  if(l.photo)s+=`<image href="${blobUrl(l.photo.id)}" x="0" y="0" width="${g.W}" height="${g.H}" preserveAspectRatio="none"/>`;
  else{s+=(SC[l.sc]||SC.conc)();if(mode!=="clean")(l.d||[]).forEach(d=>{if(DF[d[0]])s+=DF[d[0]](d[1],d[2])})}
  if(mode==="answer")(l.d||[]).forEach((d,i)=>{s+=ringNum(d[1],d[2],i+1,"ring-miss",g.k)});
  return s+"</svg>";
}
function ringNum(x,y,n,cls,k=1){return `<circle cx="${x}" cy="${y}" r="${30*k}" class="${cls}" style="stroke-width:${4*k}"/><g class="badge"><circle cx="${x+26*k}" cy="${y-26*k}" r="${12*k}"/><text x="${x+26*k}" y="${y-22*k}" style="font-size:${13*k}px">${n}</text></g>`}
function cleanFig(l){if(l.okPhoto)return `<img class="scn" src="${blobUrl(l.okPhoto.id)}" alt="Эталон: ${esc(l.t)}">`;if(!l.photo&&l.sc)return svgOf(l,"clean");return `<div class="scn ph-empty">Эталонное фото «как правильно» наставник ещё не загрузил</div>`}

/* ---------- random ---------- */
function rng(seed){let h=1779033703;for(const c of String(seed))h=Math.imul(h^c.charCodeAt(0),3432918353),h=h<<13|h>>>19;return()=>{h=Math.imul(h^h>>>16,2246822507);h=Math.imul(h^h>>>13,3266489909);h^=h>>>16;return(h>>>0)/4294967296}}
function shuffle(a,r){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
const pick=(a,r)=>a[Math.floor(r()*a.length)];

/* ---------- quiz ---------- */
const WRONG_ACT=["Принять работы, дефект устранить на этапе отделки","Принять по устному подтверждению прораба","Ограничиться фото в мессенджере без записи в DES","Принять при наличии гарантийного письма подрядчика","Разрешить следующий этап, а дефект закрыть «потом»","Потребовать выполнить по рекламному буклету производителя без ссылки на проект и НТД"];
const WRONG_CHK=["Проверить только подпись прораба в журнале работ","Сверять работы с каталогом производителя вместо проекта","Принять скрытые работы после их закрытия по фото подрядчика","Не проверять, если работы ведёт «проверенная» бригада","Сверять с проектом соседней секции «по аналогии»","Осмотреть один участок и принять весь этаж"];
function genQ(l,type,r){
  const same=LS.filter(x=>x.s===l.s&&x.id!==l.id),others=LS.filter(x=>x.id!==l.id);
  if(type==="why"){if(!l.d.length)return null;const d=pick(l.d,r);let pool=same.flatMap(x=>x.d.map(z=>z[4])).filter(w=>w&&w!==d[4]);if(pool.length<3)pool=others.flatMap(x=>x.d.map(z=>z[4])).filter(w=>w&&w!==d[4]);if(!d[4]||pool.length<3)return null;return{q:`Почему это нарушение: «${d[3]}»?`,a:d[4],o:shuffle(pool,r).slice(0,3)}}
  if(type==="viol"){if(!l.d.length||l.ok.length<3)return null;const d=pick(l.d,r);return{q:`Тема «${l.t}». Что из перечисленного является нарушением?`,a:d[3],o:shuffle(l.ok,r).slice(0,3)}}
  if(type==="norm"){const own=l.n.filter(n=>n[0]!=="PRJ");if(!own.length)return null;const m=pick(own,r);const others2=shuffle(Object.keys(N).filter(k=>k!=="PRJ"&&!l.n.some(z=>z[0]===k)),r).slice(0,3);const lab=k=>nm(k)[1]?`${nm(k)[0]} «${nm(k)[1]}»`:nm(k)[0];return{q:`Какой документ — нормативное основание по теме «${l.t}»?`,a:lab(m[0]),o:others2.map(lab)}}
  if(type==="chk"){if(!l.c.length)return null;return{q:`Что ТН обязан выполнить при приёмке: «${l.t}»?`,a:pick(l.c,r),o:shuffle(WRONG_CHK,r).slice(0,3)}}
  if(!l.a)return null;return{q:`Какое действие корректно записать в замечание DES по теме «${l.t}»?`,a:l.a,o:shuffle(WRONG_ACT,r).slice(0,3)};
}
function buildQ(l,type,r){const order=[type,"viol","why","norm","chk","act"];let g=null;for(const t of order){g=genQ(l,t,r);if(g)break}if(!g)return null;const opts=shuffle([g.a,...g.o],r);return{q:g.q,opts,ans:opts.indexOf(g.a),lid:l.id}}
function quizHTML(qs,name){return qs.map((q,i)=>`<div class="q" data-i="${i}"><p>${i+1}. ${esc(q.q)}</p>${q.opts.map((o,j)=>`<label><input type="radio" name="${name}${i}" value="${j}"><span>${esc(o)}</span></label>`).join("")}</div>`).join("")}
function gradeQuiz(root,qs,name){let ok=0,answered=0;qs.forEach((q,i)=>{const box=root.querySelector(`.q[data-i="${i}"]`);const sel=box.querySelector(`input[name="${name}${i}"]:checked`);if(sel)answered++;box.querySelectorAll("label").forEach((lb,j)=>{lb.classList.remove("right","wrong");if(j===q.ans)lb.classList.add("right");else if(sel&&+sel.value===j)lb.classList.add("wrong")});box.querySelectorAll("input").forEach(x=>x.disabled=true);if(sel&&+sel.value===q.ans)ok++});return{ok,answered}}

/* ---------- links ---------- */
const lk={
yt:l=>`https://www.youtube.com/results?search_query=${enc(l.kw+" технология выполнения")}`,
ytd:l=>`https://www.youtube.com/results?search_query=${enc(l.kw+" ошибки дефекты технадзор")}`,
rt:l=>`https://rutube.ru/search/?query=${enc(l.kw)}`,
ya:l=>`https://yandex.kz/images/search?text=${enc(l.kw+" выполнение работ")}`,
yad:l=>`https://yandex.kz/images/search?text=${enc(l.kw+" дефект нарушение")}`,
gg:l=>`https://www.google.com/search?tbm=isch&q=${enc(l.kw+" узел схема")}`
};

/* ================= ПЛАТФОРМА: общая база, роли ================= */
const P={db:null,user:null,assets:null,dl:null,uid:null,canEdit:false,role:null,ready:false,authed:false,dataReady:false,writeFail:false};
let CFG={seq:true},OVR={},CSEC={},ACC=null,EXAMBANK={},EXR=null;
const KEY="tnSchool.v2";

/* ---------- специальности, уровни, матрица допуска к аттестации -----------
   Значения по умолчанию взяты из "Матрица_тестирования_инженеров.xlsx":
   строки — должности (= "Специальность" в анкете), столбцы — разделы банка
   вопросов аттестации (должны совпадать с названиями листов Excel при
   загрузке банка в "Кабинет наставника → Банк вопросов аттестации"). */
const DEFAULT_LEVELS=["Абитуриент (стажёр)","Технический надзор","Ведущий ТН","Главный специалист ТН"];
const DEFAULT_SPECS=["Инженер ТН по Общестрою","Инженер ТН по ОВиВК","Инженер ТН по ЭСиСС","Инженер ТН по Лифтам","Инженер ТН по Гидроизоляции","Инженер ТН по Фасаду и СПОК","Инженер-геодезист","Инженер-универсал Инж.сети"];
const DEFAULT_SPEC_MATRIX={
"Инженер ТН по Общестрою":["Общестроительные работы","Благоустройство","Гидроизоляция","Фасады и СПОК"],
"Инженер ТН по ОВиВК":["ОВиВК"],
"Инженер ТН по ЭСиСС":["ЭСиСС","Технологическое оборудование/Лифты"],
"Инженер ТН по Лифтам":["Технологическое оборудование/Лифты"],
"Инженер ТН по Гидроизоляции":["Общестроительные работы","Гидроизоляция"],
"Инженер ТН по Фасаду и СПОК":["Фасады и СПОК"],
"Инженер-геодезист":["Геодезия"],
"Инженер-универсал Инж.сети":["ОВиВК","ЭСиСС","Технологическое оборудование/Лифты"]
};
const specsList=()=>(CFG.specialties&&CFG.specialties.length?CFG.specialties:DEFAULT_SPECS);
const levelsList=()=>(CFG.levels&&CFG.levels.length?CFG.levels:DEFAULT_LEVELS);
const specMatrix=()=>(CFG.specMatrix&&Object.keys(CFG.specMatrix).length?CFG.specMatrix:DEFAULT_SPEC_MATRIX);
const allowedCats=spec=>{const m=specMatrix();return Object.prototype.hasOwnProperty.call(m,spec)?m[spec]:null};
const passPct=()=>CFG.examPassPct||70;
const blank=()=>({prof:null,lp:{},ex:[],tr:{n:0,hit:0,tot:0},chk:{},desf:{},examUnlockUsed:null});
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
  else if(["","s","video","norms","des","progress","mentor"].includes(p)||(p==="l"&&isMentor()))render();
}
let authUidInFlight=null;
function initPlatform(){
  onAuthChange(async session=>{
    if(!session){
      authUidInFlight=null;
      P.ready=true;P.authed=false;P.dataReady=false;P.db=null;P.user=null;P.uid=null;P.canEdit=false;P.role=null;P.assets=null;P.dl=null;
      render();return;
    }
    if(authUidInFlight===session.user.id)return;
    authUidInFlight=session.user.id;
    P.db=platformDb;P.user=platformUser;P.uid=session.user.id;P.assets=platformAssets;P.dl=platformDownloads;
    P.canEdit=await platformUser.canEdit();P.role=await platformUser.role();
    P.authed=true;P.ready=true;
    try{const s=await P.db.doc("trainees/"+P.uid).get();if(s.exists){st=Object.assign(blank(),clone(s.data()));try{localStorage.setItem(KEY,JSON.stringify(st))}catch(e){}}else if(st.prof)save()}catch(e){}
    firstSnaps=0;
    const fin=()=>{if(++firstSnaps===3){P.dataReady=true;softRender(true)}else if(firstSnaps>3)softRender()};
    P.db.doc("cms/main").onSnapshot(s=>{CFG=Object.assign({seq:true},s.exists?clone(s.data()):{});fin()},()=>fin());
    P.db.collection("cms/main/lessons").onSnapshot(s=>{OVR={};s.docs.forEach(d=>{OVR[d.id]=clone(d.data())});rebuild();fin()},()=>fin());
    P.db.doc("cms/main/access/"+P.uid).onSnapshot(s=>{ACC=s.exists?clone(s.data()):null;rebuild();if(firstSnaps>=3)softRender()},()=>{});
    P.db.collection("cms/main/sections").onSnapshot(s=>{CSEC={};s.docs.forEach(d=>{CSEC[d.id]=clone(d.data())});rebuild();fin()},()=>fin());
    P.db.doc("cms/main/examBank").onSnapshot(s=>{EXAMBANK=s.exists?clone(s.data()):{};if(firstSnaps>=3)softRender()},()=>{});
    P.db.doc("cms/main/examRetake/"+P.uid).onSnapshot(s=>{EXR=s.exists?clone(s.data()):null;if(firstSnaps>=3)softRender()},()=>{});
    render();
  });
}

const isMentor=()=>!!P.canEdit;
const isOwner=()=>P.role==="owner";
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
  <h1 style="font-size:clamp(22px,4vw,30px);margin-bottom:6px">Добро пожаловать в Практику ТН ЖК</h1>
  <p class="mut">Укажите свои данные. Они фиксируются в журнале обучения вместе с датами прохождения лекций, тестов и аттестаций.</p>
  <div class="form">
   <label>ФИО<input class="inp" id="rf" value="${esc(p.fio||"")}" placeholder="Иванов Иван Иванович" autocomplete="name"></label>
   <label>Специальность<select class="inp" id="rs">${(p.spec&&!specsList().includes(p.spec)?[p.spec,...specsList()]:specsList()).map(x=>`<option ${p.spec===x?"selected":""}>${esc(x)}</option>`).join("")}</select></label>
   <label>Уровень ТН<select class="inp" id="rl">${(p.lvl&&!levelsList().includes(p.lvl)?[p.lvl,...levelsList()]:levelsList()).map(x=>`<option ${p.lvl===x?"selected":""}>${esc(x)}</option>`).join("")}</select></label>
   <label>Объект / подразделение (необязательно)<input class="inp" id="ro" value="${esc(p.obj||"")}"></label>
  </div>
  <div class="row" style="margin-top:16px"><button class="btn pri" id="rgo">${st.prof?"Сохранить данные":"Начать обучение"}</button>${st.prof?`<a class="btn" href="#/progress">Отмена</a><button class="btn" id="pwchange2">Сменить пароль</button>`:""}</div>
  <p class="mut sm" style="margin-top:14px">Ваши результаты сохраняются в общей базе практики и видны наставнику.</p></div>`;
}

function secPage(k){
  const ls=LS.filter(l=>l.s===k);if(!SEC.some(s=>s[0]===k))return notFound();
  return `<div class="crumbs"><a href="#/">Разделы</a> / ${esc(secName(k))}</div>
  <h1 style="font-size:clamp(24px,4vw,36px);margin-bottom:6px">${k}. ${esc(secName(k))}</h1>
  <p class="mut">${ls.length} лекций. Лекция осваивается, когда пройдены все шаги, найдены все дефекты, верно составлено замечание DES и сдан блиц-тест (от 80 %). Раздел закрыт, когда освоены все его лекции.</p>${secMastered(k)?`<p><span class="pill ok">Раздел освоен</span></p>`:""}
  <div class="lcards">${ls.map(l=>{const lk2=locked(l),x=st.lp[l.id]||{};return `<a class="lcard ${lk2?"is-locked":""}" href="#/l/${l.id}">${cleanFig(l)}<div class="bd"><b>Лекция ${l.id}</b><div style="font-weight:700;margin:4px 0">${esc(l.t)}</div><span class="pill ${isDone(l.id)?"ok":""}">${lk2?"Закрыт — пройдите предыдущий":isDone(l.id)?`Освоен ${fdd(x.p)}`:x.o?"В процессе":"Не начат"}${x.q!=null?` · тест ${x.q}%`:""}</span></div></a>`}).join("")||`<p class="mut">В разделе пока нет лекций.</p>`}</div>`;
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
function lightbox(src){const d=document.createElement("div");d.className="lb";d.innerHTML=`<img src="${src}" alt="">`;d.onclick=()=>d.remove();document.body.appendChild(d)}

/* ---------- тренажёр ---------- */
let TR={sec:"all",cur:null,des:null};
function trainerPage(){
  return `<h1 style="font-size:clamp(24px,4vw,36px)">Тренажёр дефектов</h1>
  <p class="mut">Случайный узел из открытых вам лекций. Отметьте все нарушения, проверьте себя и переходите к следующему.</p>
  <div class="row" style="margin:12px 0"><select class="inp" id="trsec"><option value="all">Все разделы</option>${SEC.map(s=>`<option value="${s[0]}" ${TR.sec===s[0]?"selected":""}>${s[0]}. ${esc(s[1])}</option>`).join("")}</select><button class="btn dark" id="trnext">Следующий узел</button><span class="mut sm">Проверок: ${st.tr.n} · найдено ${st.tr.hit} из ${st.tr.tot}</span></div><div id="trbox"></div>`;
}
function videoPage(){
  return `<h1 style="font-size:clamp(24px,4vw,36px)">Видеотека</h1><p class="mut">Видео, рекомендованные наставником, и подборки по технологии и типовым ошибкам для каждой лекции.</p>
  ${SEC.map(s=>`<div class="blk"><h2 style="font-size:17px">${s[0]}. ${esc(s[1])}</h2><div class="tbl-wrap"><table class="nt">${LS.filter(l=>l.s===s[0]).map(l=>`<tr><td style="width:60px"><b>${l.id}</b></td><td><a href="#/l/${l.id}">${esc(l.t)}</a>${l.vids.length?`<div class="sm">${l.vids.map(v=>`<a target="_blank" rel="noopener" href="${esc(v[1])}">▶ ${esc(v[0]||"Видео наставника")}</a>`).join(" · ")}</div>`:""}</td><td style="white-space:nowrap"><a target="_blank" rel="noopener" href="${lk.yt(l)}">Технология</a> · <a target="_blank" rel="noopener" href="${lk.ytd(l)}">Ошибки</a> · <a target="_blank" rel="noopener" href="${lk.rt(l)}">Rutube</a></td></tr>`).join("")}</table></div></div>`).join("")}`;
}
function normsPage(){
  const use={};LS.forEach(l=>l.n.forEach(n=>{(use[n[0]]=use[n[0]]||new Set()).add(l.id)}));
  const keys=[...new Set([...Object.keys(N),...Object.keys(use)])];
  return `<h1 style="font-size:clamp(24px,4vw,36px)">Нормативная база</h1>
  <p class="note">Иерархия на объекте: проект, прошедший экспертизу → действующие НТД РК (СН РК, СП РК) → межгосударственные ГОСТ, применяемые в РК → документация производителя (справочно, не основание для замечания, если не включена в проект). Статус и пункты проверяйте на <a href="https://prg.kz/" target="_blank" rel="noopener">prg.kz</a> и <a href="https://adilet.zan.kz/" target="_blank" rel="noopener">adilet.zan.kz</a>.</p>
  <div class="blk"><div class="tbl-wrap"><table class="nt"><tr><th>Документ</th><th>Наименование</th><th>Лекции</th></tr>
  ${keys.map(k=>`<tr><td><span class="code">${esc(nm(k)[0])}</span></td><td>${esc(nm(k)[1])}</td><td>${[...(use[k]||[])].map(id=>`<a href="#/l/${id}">${id}</a>`).join(", ")||"—"}</td></tr>`).join("")}</table></div></div>`;
}
function desPage(){
  const k=TR.des&&SEC.some(s=>s[0]===TR.des)?TR.des:SEC[0][0];
  return `<h1 style="font-size:clamp(24px,4vw,36px)">Библиотека DES-замечаний</h1><p class="mut">Готовые замечания по формату «Комментарий — Норматив — Причина — Действия».</p>
  <div class="row" style="margin:12px 0"><select class="inp" id="dessec">${SEC.map(s=>`<option value="${s[0]}" ${k===s[0]?"selected":""}>${s[0]}. ${esc(s[1])}</option>`).join("")}</select></div>
  ${LS.filter(l=>l.s===k).map(l=>`<div class="blk"><h2 style="font-size:16px">${l.id}. ${esc(l.t)}</h2><div class="des-pre">${desText(l,st.desf||{},l.d.map(()=>true))}</div><div class="row"><button class="btn pri" data-copy="${l.id}">Копировать</button><a class="btn" href="#/l/${l.id}">Открыть лекцию</a></div></div>`).join("")}`;
}

/* ---------- аттестация ---------- */
let EX=null;
function examRetakeLocked(){
  if(!st.ex.length)return false;
  const d=EXR&&EXR.date;
  if(!d)return true;
  const today=new Date().toISOString().slice(0,10);
  if(d>today)return true;
  if(st.examUnlockUsed===d)return true;
  return false;
}
function examRetakeMsg(){
  const d=EXR&&EXR.date;
  if(!d)return "Результат аттестации зафиксирован. Повторное прохождение станет доступно, когда наставник назначит дату пересдачи.";
  const today=new Date().toISOString().slice(0,10);
  if(d>today)return `Повторное прохождение аттестации назначено на ${fdd(d)}.`;
  return "Эта дата пересдачи уже использована. Обратитесь к наставнику за новой датой.";
}
function examPage(){
  if(EX&&EX.stage==="run")return examRun();
  if(EX&&EX.stage==="done")return examResult();
  const allCats=Object.keys(EXAMBANK).sort((a,b)=>a.localeCompare(b,"ru"));
  const allow=allowedCats(st.prof.spec);
  const cats=allow?allCats.filter(c=>allow.includes(c)):allCats;
  const locked=examRetakeLocked();
  return `<h1 style="font-size:clamp(24px,4vw,36px)">Аттестация ТН</h1>
  <p class="mut">Все вопросы из выбранных разделов нормативной базы, которые загрузил наставник, в случайном порядке. Порог зачёта — ${passPct()} %. Время — 1,5 минуты на вопрос. Результат сохраняется в журнале с датой.</p>
  ${!allCats.length?`<div class="note">Наставник ещё не загрузил банк вопросов аттестации.</div>`:!cats.length?`<div class="note">Для вашей специальности («${esc(st.prof.spec||"")}») в банке аттестации пока нет доступных разделов. Обратитесь к наставнику.</div>`:locked?`<div class="note">${examRetakeMsg()}</div>`:`
  <div class="blk"><p>Аттестуемый: <b>${esc(st.prof.fio)}</b> · ${esc(st.prof.spec||"")} · ${esc(st.prof.lvl||"")}</p>
  <div class="chk">${cats.map(cat=>`<label><input type="checkbox" class="exs" value="${esc(cat)}" checked><span>${esc(cat)} <span class="mut sm">(${EXAMBANK[cat].length} вопросов)</span></span></label>`).join("")}</div>
  <div class="row" style="margin-top:14px"><button class="btn pri" id="exgo">Начать аттестацию</button></div></div>`}
  ${st.ex.length?`<div class="blk"><h2 style="font-size:17px">Мои аттестации</h2><div class="tbl-wrap"><table class="nt"><tr><th>Дата</th><th>Разделы</th><th>Результат</th></tr>${st.ex.slice().reverse().map(e=>`<tr><td>${fd(e.date)}</td><td>${esc(e.secs)}</td><td><span class="pill ${e.pc>=passPct()?"ok":"no"}">${e.pc}% · ${e.ok}/${e.n}</span></td></tr>`).join("")}</table></div></div>`:""}`;
}
function examRun(){return `<h1 style="font-size:clamp(22px,3.5vw,30px)">Аттестация: ${esc(st.prof.fio)}</h1><div class="row" style="justify-content:space-between;margin:8px 0"><span class="mut">${EX.qs.length} вопросов · порог ${passPct()} %</span><span class="timer" id="timer"></span></div><div class="blk" id="exq">${quizHTML(EX.qs,"e")}</div><button class="btn pri" id="exend">Завершить и получить результат</button>`}
function examFinish(){
  const root=document.getElementById("exq");const g=gradeQuiz(root,EX.qs,"e");EX.ans=[...root.querySelectorAll(".q")].map(q=>{const s=q.querySelector("input:checked");return s?+s.value:-1});
  EX.ok=g.ok;EX.pc=pct(g.ok,EX.qs.length);EX.stage="done";EX.date=now();
  st.ex.push({date:EX.date,start:EX.start,secs:EX.secs.join(", "),n:EX.qs.length,ok:EX.ok,pc:EX.pc});if(st.ex.length>60)st.ex=st.ex.slice(-60);save();clearInterval(EX.t);dirty=false;render();
}
function examResult(){
  const wrong=EX.qs.map((q,i)=>({q,i,a:EX.ans[i]})).filter(x=>x.a!==x.q.ans);
  const bySec={};EX.qs.forEach((q,i)=>{const s=q.cat;bySec[s]=bySec[s]||[0,0];bySec[s][1]++;if(EX.ans[i]===q.ans)bySec[s][0]++});
  return `<div class="blk"><h1 style="font-size:clamp(22px,3.5vw,30px)">Протокол аттестации ТН</h1>
  <p>ФИО: <b>${esc(st.prof.fio)}</b><br>Специальность: ${esc(st.prof.spec||"—")}<br>Уровень: ${esc(st.prof.lvl||"—")}<br>Дата: ${fd(EX.date)}<br>Разделы: ${esc(EX.secs.join(", "))}</p>
  <div class="stat"><div><b>${EX.pc}%</b>результат</div><div><b>${EX.ok}/${EX.qs.length}</b>верных ответов</div><div><b style="color:${EX.pc>=passPct()?"var(--good)":"var(--bad)"}">${EX.pc>=passPct()?"Зачёт":"Незачёт"}</b>порог ${passPct()} %</div></div>
  <div class="tbl-wrap"><table class="nt"><tr><th>Раздел</th><th>Верно</th></tr>${Object.keys(bySec).sort().map(s=>`<tr><td>${esc(s)}</td><td>${bySec[s][0]} из ${bySec[s][1]}</td></tr>`).join("")}</table></div>
  ${wrong.length?`<h2 style="font-size:17px;margin:18px 0 8px">Ошибки и правильные ответы</h2>${wrong.map(x=>`<div class="q"><p>${x.i+1}. ${esc(x.q.q)}</p><div class="mut sm">Ответ: ${x.a<0?"нет ответа":esc(x.q.opts[x.a])}</div><div style="color:var(--good)">Правильно: ${esc(x.q.opts[x.q.ans])}</div>${x.q.meta&&Object.keys(x.q.meta).length?`<div class="mut sm">${Object.entries(x.q.meta).map(([k,v])=>`${esc(k)}: ${esc(v)}`).join(" · ")}</div>`:""}</div>`).join("")}`:""}
  <p style="margin-top:20px">Подпись аттестуемого ____________ &nbsp;&nbsp; Подпись наставника ____________</p>
  <div class="row no-print"><button class="btn pri" id="exprint">Печать протокола</button><button class="btn" id="exagain">Новая аттестация</button></div></div>`;
}

/* ---------- прогресс ---------- */
function progressPage(){
  const done=LS.filter(l=>isDone(l.id)).length,qv=LS.map(l=>st.lp[l.id]&&st.lp[l.id].q).filter(x=>x!=null),avg=qv.length?Math.round(qv.reduce((a,b)=>a+b,0)/qv.length):0;
  return `<h1 style="font-size:clamp(24px,4vw,36px)">Мой прогресс</h1>
  <div class="blk"><div class="row" style="justify-content:space-between"><div><b>${esc(st.prof.fio)}</b><br><span class="mut">${esc(st.prof.spec||"")} · ${esc(st.prof.lvl||"")}${st.prof.obj?" · "+esc(st.prof.obj):""} · лекции с ${fdd(st.prof.reg)}</span></div><div class="row"><a class="btn pri" href="#/exam">Пройти аттестацию</a><a class="btn" href="#/register">Изменить данные</a><button class="btn" id="pwchange">Сменить пароль</button></div></div>
  ${P.writeFail?`<p class="note">Результаты не удалось записать в общую базу — проверьте подключение к интернету и обновите страницу. Пока данные сохраняются в этом браузере.</p>`:""}</div>
  <div class="stat"><div><b>${done}</b>лекций освоено из ${LS.length}</div><div><b>${SEC.filter(s=>secMastered(s[0])).length}</b>разделов закрыто из ${SEC.length}</div><div><b>${avg}%</b>средний балл блиц-тестов</div><div><b>${pct(st.tr.hit,st.tr.tot)}%</b>дефектов найдено</div><div><b>${st.ex.length}</b>аттестаций</div></div>
  ${SEC.map(s=>`<div class="blk"><h2 style="font-size:16px">${s[0]}. ${esc(s[1])} · ${secDone(s[0])}/${secCnt(s[0])}${secMastered(s[0])?" · раздел освоен ✓":""}</h2><div class="tbl-wrap"><table class="nt"><tr><th>Лекция</th><th>Начат</th><th>Найди дефект</th><th>DES</th><th>Тест</th><th>Освоен</th></tr>${LS.filter(l=>l.s===s[0]).map(l=>{const x=st.lp[l.id]||{};return `<tr><td><a href="#/l/${l.id}">${l.id}. ${esc(l.t)}</a></td><td>${fdd(x.o)}</td><td>${x.fall?"✓ "+fdd(x.fall):x.f?`${x.f[0]}/${x.f[1]}`:"—"}</td><td>${x.dp?"✓ "+fdd(x.dp):x.da?"ошибки":"—"}</td><td>${x.q!=null?x.q+"%":"—"}</td><td>${x.p?fdd(x.p):"—"}</td></tr>`}).join("")}</table></div></div>`).join("")}`;
}
function notFound(){return `<div class="blk"><h1 style="font-size:24px">Страница не найдена</h1><p><a href="#/">Вернуться к лекциям</a></p></div>`}

/* ----- форматирование конспекта ----- */
function fmt(t){return esc(t).replace(/\*\*(.+?)\*\*/g,"<b>$1</b>")}
function textBlock(v){const out=[];let ul=[];const flush=()=>{if(ul.length){out.push(`<ul>${ul.map(x=>`<li>${fmt(x)}</li>`).join("")}</ul>`);ul=[]}};
  String(v||"").split("\n").forEach(s=>{if(/^\s*[-•]\s+/.test(s))ul.push(s.replace(/^\s*[-•]\s+/,""));else{flush();if(s.trim())out.push(`<p>${fmt(s)}</p>`)}});flush();return out.join("")}
const validLink=v=>v&&/^https?:\/\//.test(v[1]||"");
const host=u=>(String(u).match(/\/\/([^/]+)/)||[,""])[1].replace(/^www\./,"");
const editBtn=(l,tab)=>isMentor()?`<a class="btn edit no-print" href="#/mentor/edit/${l.id}/${tab}">✎ Изменить</a>`:"";

/* ----- свои вопросы наставника ----- */
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

function trainerLoad(){
  const pool=LS.filter(l=>(TR.sec==="all"||l.s===TR.sec)&&!locked(l)).flatMap(l=>exAll(l).filter(e=>e.d.length).map(e=>Object.assign(e,{lid:l.id,lt:l.t,key:l.id+":"+e.i})));const box=document.getElementById("trbox");
  if(!pool.length){box.innerHTML=`<p class="mut">В этом разделе пока нет открытых лекций с разметкой дефектов.</p>`;return}
  let l;do{l=pool[Math.floor(Math.random()*pool.length)]}while(pool.length>1&&l.key===TR.cur);TR.cur=l.key;
  box.innerHTML=`<div class="blk"><h2 style="font-size:18px;margin-bottom:10px">${esc(l.lt)}${l.i?` · ${esc(l.t)}`:""}</h2><div class="grid2"><div class="task-wrap">${svgOf(l,"task","task")}</div><div><p>Отметьте нарушения.</p><div class="row"><button class="btn pri" id="trchk">Проверить</button><a class="btn" href="#/l/${l.lid}">Открыть лекцию ${l.lid}</a></div><div class="res hidden" id="trres"></div><ol class="dlist hidden" id="trans">${l.d.map(d=>`<li><b>${esc(d[3])}</b><br><span class="mut">${esc(d[4])}</span></li>`).join("")}</ol></div></div></div>`;
  const F=finder(document.getElementById("task"),l);
  document.getElementById("trchk").onclick=e=>{const r=F.check(true);e.target.disabled=true;st.tr.n++;st.tr.hit+=r.hit;st.tr.tot+=r.tot;save();const el=document.getElementById("trres");el.classList.remove("hidden");el.textContent=`Найдено ${r.hit} из ${r.tot}${r.extra?`, лишних отметок: ${r.extra}`:""}.`;document.getElementById("trans").classList.remove("hidden");dirty=false};
}

function examStart(){
  if(examRetakeLocked())return;
  const secs=[...document.querySelectorAll(".exs:checked")].map(x=>x.value);if(!secs.length){uiAlert("Выберите хотя бы один раздел.");return}
  const r=rng("ex"+Date.now());
  const qs=pickRandom(EXAMBANK,secs,null,r);
  if(!qs.length){uiAlert("В выбранных разделах нет вопросов.");return}
  if(st.ex.length&&EXR&&EXR.date){st.examUnlockUsed=EXR.date;save()}
  EX={stage:"run",qs,secs,start:now(),end:Date.now()+qs.length*90000};dirty=true;render();
}

/* ================= УРОК ПО ШАГАМ ================= */
const STEP_T={look:"Посмотри",lec:"Конспект",vid:"Видео и материалы",task:"Найди дефект",ans:"Ответы",chk:"Чек-лист ТН",norm:"Норматив РК",rw:"Правильно / неправильно",des:"Замечание DES",quiz:"Блиц-тест"};
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
  d.innerHTML=`<div class="mdl" role="dialog" aria-modal="true" aria-label="${esc(title)}"><h3 style="font-size:17px;margin-bottom:12px">${esc(title)}</h3><div class="form">${fields.map((f,i)=>`<label>${esc(f.label)}${f.type==="area"?`<textarea class="inp" rows="${f.rows||5}" data-mi="${i}" placeholder="${esc(f.ph||"")}">${esc(f.value||"")}</textarea>`:`<input class="inp" type="${f.type==="password"?"password":"text"}" data-mi="${i}" value="${esc(f.value||"")}" placeholder="${esc(f.ph||"")}" autocomplete="${f.type==="password"?"new-password":"off"}">`}</label>`).join("")}</div>
  <div class="row" style="margin-top:14px"><button class="btn pri" data-ms>Сохранить</button><button class="btn" data-mc>Отмена</button>${opt.del?`<button class="btn" data-md style="margin-left:auto">Удалить</button>`:""}</div><div class="sm" data-mm style="margin-top:8px;color:var(--bad)"></div></div>`;
  document.body.appendChild(d);const close=()=>d.remove();const msg=d.querySelector("[data-mm]");
  d.addEventListener("click",e=>{if(e.target===d)close()});d.querySelector("[data-mc]").onclick=close;
  d.addEventListener("keydown",e=>{if(e.key==="Escape")close()});
  const run=async fn=>{msg.style.color="var(--mut)";msg.textContent="Сохраняю…";try{const r=await fn();if(r===false){return}close()}catch(e){msg.style.color="var(--bad)";msg.textContent=typeof e==="string"?e:(e&&e.message)?e.message:"Не сохранено: нет прав на запись (нужна роль «Наставник»)."}};
  d.querySelector("[data-ms]").onclick=()=>run(()=>onSave([...d.querySelectorAll("[data-mi]")].map(x=>x.value)));
  if(opt.del)d.querySelector("[data-md]").onclick=async()=>{if(await uiConfirm("Удалить?"))run(opt.del)};
  const first=d.querySelector("[data-mi]");if(first)first.focus();
}
const chkUrl=u=>{if(!/^https?:\/\//.test(u.trim()))throw"Ссылка должна начинаться с http:// или https://"};
function openPasswordModal(){modal("Смена пароля",[{label:"Новый пароль (не короче 6 символов)",type:"password"},{label:"Повторите новый пароль",type:"password"}],
  async v=>{if(v[0].length<6){uiAlert("Пароль должен быть не короче 6 символов.");return false}if(v[0]!==v[1]){uiAlert("Пароли не совпадают.");return false}await updatePassword(v[0]);uiAlert("Пароль изменён.")})}
function editStepHead(l,k){const look=k==="look";modal(`Шаг «${stTitle(l,k)}»`,[{label:"Название шага",value:stTitle(l,k)},{label:"Вступительный текст шага (что будет в этом шаге). Строки с «- » — список",type:"area",value:(l.sti&&l.sti[k])||"",rows:6},...(look?[{label:"Подпись под схемой / фото",value:l.cap||""}]:[])],
  async v=>{await quickSave(l,doc=>{doc.stt=Object.assign({},doc.stt||{},{[k]:v[0].trim()||STEP_T[k]});doc.sti=Object.assign({},doc.sti||{},{[k]:v[1]});if(look)doc.cap=v[2]})})}
function editLink(l,kind,i){const list=(kind==="v"?effVids:effLnk)(l).map(x=>x.slice());const isNew=i<0;const cur=isNew?["",""]:list[i];
  const put=doc=>{if(kind==="v"){doc.vids=list;doc.vidsSet=true}else{doc.lnk=list;doc.lnkSet=true}};
  modal(isNew?(kind==="v"?"Новое видео":"Новая ссылка"):(kind==="v"?"Изменить видео":"Изменить ссылку"),[{label:"Название (как увидит абитуриент)",value:cur[0]},{label:"Ссылка",value:cur[1],ph:"https://…"}],
   async v=>{chkUrl(v[1]);if(isNew)list.push([v[0].trim(),v[1].trim()]);else list[i]=[v[0].trim(),v[1].trim()];await quickSave(l,put)},
   isNew?{}:{del:async()=>{list.splice(i,1);await quickSave(l,put)}})}

/* ----- DES-тренажёр ----- */
function gradeDes(root,T){let all=true;const res={};
  ["defs","norms","whys","acts"].forEach(g=>{const fs=root.querySelector(`[data-g="${g}"]`);const sel=new Set([...fs.querySelectorAll("input:checked")].map(i=>+i.value));const ok=T[g].every((o,i)=>!!o[1]===sel.has(i));res[g]=ok;if(!ok)all=false;
    fs.querySelectorAll("label").forEach((lb,i)=>{lb.classList.remove("right","wrong");if(T[g][i][1])lb.classList.add("right");else if(sel.has(i))lb.classList.add("wrong")});fs.querySelector(".dqr").textContent=ok?"✓ Верно":"✗ Есть ошибки — зелёным отмечены правильные варианты";fs.querySelector(".dqr").style.color=ok?"var(--good)":"var(--bad)";fs.querySelectorAll("input").forEach(i=>i.disabled=true)});
  return{all,res}}

/* ----- страница лекции ----- */
function lessonPage(id,stepK,sub){
  const l=(isMentor()?ALL:LS).find(x=>x.id===id);if(!l)return notFound();
  if(locked(l)){const sl=LS.filter(x=>x.s===l.s);const pv=sl[sl.indexOf(l)-1];return `<div class="blk"><h1 style="font-size:24px">Лекция ${l.id} пока закрыта</h1><p>Лекции раздела проходятся по порядку. Сначала завершите лекцию ${pv.id} «${esc(pv.t)}».</p><a class="btn pri" href="#/l/${pv.id}">Перейти к лекции ${pv.id}</a></div>`}
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
  if(k==="vid"){const vs=effVids(l);body=`<div class="vids">${vs.map((v,j)=>`<div class="vidw">${M?`<button class="btn edit sm" data-evid="${j}">✎ Изменить</button>`:""}<a class="vid" target="_blank" rel="noopener" href="${esc(v[1])}"><span class="pl"></span><span><b>${esc(v[0]||"Видео")}</b><small>${esc(host(v[1]))}</small></span></a></div>`).join("")}${M?`<div class="vidw"><button class="btn edit" data-evid="-1">＋ Видео</button></div>`:""}</div>${vs.length?"":`<p class="mut">Видео для этой лекции не назначены.</p>`}
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
    <p class="note">Перед записью в DES уточните номер пункта по действующей редакции на <a href="https://prg.kz/" target="_blank" rel="noopener">prg.kz</a>.</p>`;
  if(k==="rw")body=`<div class="rw"><div class="ok">${cleanFig(l)}<h3 style="color:var(--good)">Правильно</h3><ul>${l.ok.map(o=>`<li>${esc(o)}</li>`).join("")}</ul></div>
    <div class="no">${svgOf(l,"answer")}<h3 style="color:var(--bad)">Неправильно</h3><ul>${l.d.map(d=>`<li>${esc(d[3])}</li>`).join("")}</ul></div></div>`;
  if(k==="des")body=l.d.length?`<p>Составьте замечание по этому узлу так, как в DES: заполните привязку (примеры — под полями) и отметьте верные варианты. Нажмите «Создать» — программа проверит Комментарий, Норматив, Причину и Действия.</p>
    ${x.dp?`<div class="res" style="background:rgba(46,125,79,.16)">Замечание составлено верно ${fd(x.dp)}. Можно потренироваться ещё раз.</div>`:""}
    <div id="desbox"></div><div class="res hidden" id="dres"></div>
    <div id="desref" class="hidden"><h3 style="font-size:15px;margin:16px 0 8px">Эталонное замечание</h3><div class="des-pre" id="despre"></div><button class="btn pri" id="copydes">Копировать замечание</button></div>`:`<p class="mut">Для этой лекции дефекты не размечены.</p>`;
  if(k==="quiz")body=`<div id="quiz"></div><div class="row" style="margin-top:12px"><button class="btn pri" id="qsub">Проверить ответы</button><button class="btn" id="qnew">Новый вариант</button></div>
    <div class="res ${x.q!=null?"":"hidden"}" id="qres">${x.q!=null?`Лучший результат: ${x.q}% (${fd(x.qd)}).`:""}</div>`;
  const prevK=S[si-1],nextK=S[si+1],nextOpen=nextK&&(M||(k==="task"?taskOK(l,x):true));
  return `<div class="crumbs"><a href="#/">Разделы</a> / <a href="#/s/${l.s}">${esc(secName(l.s))}</a> / Лекция ${l.id}</div>
  ${M?`<div class="mbar no-print">Режим наставника: жёлтые кнопки «Изменить» видите только вы. Абитуриенты видят готовый результат.${l.hidden?" Лекция скрыта от абитуриентов.":""} <a class="btn pri" href="#/mentor/edit/${l.id}/main">Полный редактор лекции</a></div>`:""}
  <header class="lhead"><div class="lnum">${l.id}</div><div><h1>${esc(l.t)}</h1><div class="lstat sm"><span class="${nx.vis?"ok":""}">Шаги ${S.filter(s=>x.v&&x.v[s]).length}/${S.length}</span>${l.d.length?`<span class="${x.fall?"ok":""}">Найди дефект ${x.fall?"✓":"—"}</span><span class="${x.dp?"ok":""}">DES ${x.dp?"✓":"—"}</span>`:""}<span class="${nx.quiz?"ok":""}">Тест ${x.q!=null?x.q+"%":"—"}</span>${x.p?`<span class="pill ok">Лекция освоен ${fdd(x.p)}</span>`:""}</div></div></header>
  <nav class="tabs no-print" aria-label="Шаги лекции">${S.map((s,j)=>{const op=stepOpen(l,x,s);return op?`<a href="#/l/${l.id}/${s}" class="${s===k?"on":""}"><b>${j+1}</b>${esc(stTitle(l,s))}<i>${stIcon(s)}</i></a>`:`<span class="off" title="Откроется после предыдущих шагов"><b>${j+1}</b>${esc(stTitle(l,s))}<i>🔒</i></span>`}).join("")}</nav>
  <section class="blk step" id="b-${k}">${head}${intro}${body}</section>
  <div class="pager no-print">${prevK?`<a class="btn" href="#/l/${l.id}/${prevK}">← ${esc(stTitle(l,prevK))}</a>`:"<span></span>"}
  ${nextK?(nextOpen?`<a class="btn dark" id="nextstep" href="#/l/${l.id}/${nextK}">${esc(stTitle(l,nextK))} →</a>`:`<span class="mut sm" id="nextwait" data-href="#/l/${l.id}/${nextK}" data-t="${esc(stTitle(l,nextK))} →">Найдите все дефекты или откройте ответы, чтобы перейти дальше</span>`):(nextL&&x.p?`<a class="btn dark" href="#/l/${nextL.id}">Следующая лекция: ${nextL.id} →</a>`:`<a class="btn" href="#/s/${l.s}">К разделу</a>`)}</div>`;
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
    if(op==="delgal"){if(await uiConfirm("Удалить все фото-примеры этой лекции?"))await quickSave(l,d=>{d.gal=[]});return}
    if(op==="delg"){if(await uiConfirm(`Удалить фото ${+j+1}?`))await quickSave(l,d=>{d.gal.splice(+j,1)});return}
  }catch(e){uiAlert("Не сохранено: нет прав на запись (нужна роль «Наставник»).")}});
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
      if(g.all){if(!x.dp)x.dp=now();const passed=tryPass(l,x);el.innerHTML=`Замечание создано верно.${passed?" Лекция освоена!":""} Ниже — эталонный текст для DES.`}
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
    const mk=()=>{qs=lessonQuiz(l,rng(l.id+":"+v));qz.innerHTML=qs.length?quizHTML(qs,"q"):`<p class="mut">Для теста нужно заполнить чек-лист, дефекты и нормативы лекции.</p>`;document.getElementById("qsub").disabled=!qs.length};
    mk();qz.addEventListener("change",()=>{dirty=true});
    document.getElementById("qsub").onclick=()=>{const g=gradeQuiz(qz,qs,"q");const pc=pct(g.ok,qs.length);x.q=Math.max(x.q||0,pc);x.qd=now();x.qa=(x.qa||0)+1;const passed=tryPass(l,x);save();dirty=false;const el=document.getElementById("qres");el.classList.remove("hidden");const n=needs(l,x);
      el.innerHTML=`Результат: ${g.ok} из ${qs.length} (${pc}%). `+(x.p?(passed?"Лекция освоена! Следующая лекция открыта.":"Лекция уже освоена."):pc>=80?`Тест сдан. Для освоения лекции осталось: ${[!n.vis&&"пройти все шаги лекции",!n.find&&"найти все дефекты",!n.des&&"верно составить замечание DES"].filter(Boolean).join(", ")}.`:"Для зачёта нужно 80 %. Разберите ответы и пройдите новый вариант.");document.getElementById("qsub").disabled=true};
    document.getElementById("qnew").onclick=()=>{v++;x.qv=v;save();mk();document.getElementById("qres").classList.add("hidden")}}
}

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
  if(!M)return bl.length?`<div class="lec">${lecHTML(bl)}</div>`:`<p class="mut">Конспект пока не подготовлен.</p>`;
  return `<div class="lec">${bl.map((b,i)=>`<div class="lecw"><div class="lec-tools no-print"><span class="mut sm">${i+1}. ${LEC_NAME[b.t]||""}</span>
     <button class="btn edit sm" data-lq="edit:${i}">✎ Изменить</button>
     ${b.t==="row"?`<label class="btn edit sm ${up?"":"disabled"}">＋ Фото в ленту (справа)<input type="file" accept="image/*" multiple hidden data-lqadd="${i}" ${up?"":"disabled"}></label>`:""}${b.t==="img"?`<label class="btn edit sm ${up?"":"disabled"}">＋ Фото в слайдер<input type="file" accept="image/*" multiple hidden data-lqadd="${i}" ${up?"":"disabled"}></label>${imgsOf(b).length>1?`<button class="btn sm" data-lq="delimg:${i}">Удалить показанное фото</button>`:""}`:""}
     <button class="btn sm" data-lq="up:${i}" aria-label="Выше" ${i?"":"disabled"}>↑</button><button class="btn sm" data-lq="down:${i}" aria-label="Ниже" ${i<bl.length-1?"":"disabled"}>↓</button><button class="btn sm" data-lq="del:${i}">Удалить блок</button></div>
     ${lecBlock(b,i,true)||`<p class="mut">(пустой блок)</p>`}</div>`).join("")||`<p class="mut">Конспект пустой. Добавьте первый блок кнопками ниже.</p>`}</div>
  <div class="lec-add no-print"><b>Добавить в конец конспекта:</b>
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
      if(op==="del"){if(!await uiConfirm("Удалить этот блок конспекта?"))return;await lecSave(l,a=>a.splice(i,1));return}
      if(op==="delrow"){const j=+a2;if(!await uiConfirm(`Удалить фото ${j+1} из ленты?`))return;await lecSave(l,a=>{a[i].imgs.splice(j,1)});return}
      if(op==="mvrow"){const j=+a2,k2=j+(+a3);await lecSave(l,a=>{const m=a[i].imgs;if(k2<0||k2>=m.length)return;[m[j],m[k2]]=[m[k2],m[j]]});return}
      if(op==="delimg"){const f=btn.closest(".lecw").querySelector(".sld");const k=+(f&&f.dataset.i||0);if(!await uiConfirm(`Удалить фото ${k+1} из слайдера?`))return;await lecSave(l,a=>{a[i].imgs.splice(k,1)});return}
    }catch(e){uiAlert("Не сохранено: нет прав на запись (нужна роль «Наставник»).")}
  });
  app.querySelectorAll("[data-lqadd]").forEach(inp=>inp.onchange=async()=>{const i=+inp.dataset.lqadd;const add=await uploadMany(inp.files);if(!add.length)return;try{await lecSave(l,a=>{a[i].imgs=imgsOf(a[i]).concat(add)})}catch(e){uiAlert("Не сохранено.")}});
  const rw=document.getElementById("lqrow");if(rw)rw.onchange=async()=>{const add=await uploadMany(rw.files);if(!add.length)return;try{await lecSave(l,a=>a.push({t:"row",imgs:add}))}catch(e){uiAlert("Не сохранено.")}};
  const nw=document.getElementById("lqnew");if(nw)nw.onchange=async()=>{const add=await uploadMany(nw.files);if(!add.length)return;try{await lecSave(l,a=>a.push({t:"img",imgs:add}))}catch(e){uiAlert("Не сохранено.")}};
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
  {t:"hero",logo:true,title:CFG.heroTitle||"Центр «Практика ТН»",text:CFG.heroText||"Учебный центр технического надзора Engineering Services: визуальные лекции по строительству жилых комплексов. Наставник готовит материал, абитуриент проходит лекцию и подтверждает знания.",img:null,noimg:false,pos:"right",cap:"Пример задания «Найди дефект»"},
  {t:"route",items:["Посмотри","Найди дефект","Объясни нарушение","Найди норматив","Реши, что делать","Напиши замечание в DES"]},
  {t:"princ",items:[["Фото и видео","показывают, как выполняется работа"],["Проект","определяет, как должно быть на конкретном объекте"],["Норматив РК","— обязательное требование"],["ТН","сверяет факт с проектом и НТД и фиксирует несоответствие"]]},
  {t:"secs",title:"Разделы"}]}
const homeBlocks=()=>Array.isArray(CFG.home)&&CFG.home.length?CFG.home:DEFAULT_HOME();
async function homeSave(fn){const h=clone(homeBlocks());fn(h);await P.db.doc("cms/main").set(Object.assign({},CFG,{home:h}))}
async function secSave(k,patch){await P.db.doc("cms/main/sections/"+k).set(Object.assign({k,name:secName(k)||k,hidden:false},CSEC[k]||{},patch))}
function secsGrid(b,M){
  const done=LS.filter(l=>isDone(l.id)).length;
  return `<div class="row" style="justify-content:space-between;margin-bottom:12px"><h2 style="font-size:20px">${esc(b.title||"Разделы")}</h2><span class="mut">Освоено ${done} из ${LS.length} лекций${CFG.seq?" · лекции открываются по порядку":""}</span></div>
  ${SEC.length?"":`<div class="note">Наставник ещё не открыл вам разделы для обучения. Как только он отметит доступные разделы в журнале, они появятся здесь.</div>`}
  <div class="secs">${SEC.map(s=>{const d=secDone(s[0]),n=secCnt(s[0]),first=LS.find(l=>l.s===s[0]),cov=CSEC[s[0]]&&CSEC[s[0]].img;
   return `<div class="secw"><a class="sec" href="#/s/${s[0]}"><div class="th">${cov?`<img src="${blobUrl(cov)}" alt="" style="width:100%;height:100%;object-fit:cover">`:first?cleanFig(first):""}</div><div class="bd"><h3>${s[0]}. ${esc(s[1])}</h3><span class="mut sm">${n} лекций · освоено ${d}${secMastered(s[0])?" · <b style='color:var(--good)'>раздел закрыт ✓</b>":""}</span><div class="prog"><i style="width:${pct(d,n)}%"></i></div></div></a>
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
  const err=()=>uiAlert("Не сохранено: нет прав на запись (нужна роль «Наставник»).");
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
  app.querySelectorAll("[data-shide]").forEach(b=>b.onclick=async()=>{const k=b.dataset.shide;if(!await uiConfirm(`Удалить раздел «${secName(k)}» с сайта? Его лекции скроются у абитуриентов. Вернуть раздел можно в «Кабинет наставника → Лекции и разделы».`))return;try{await secSave(k,{hidden:true})}catch(e){err()}});
  const sa=app.querySelector("[data-sadd]");if(sa)sa.onclick=async()=>{const n=await uiPrompt("Название нового раздела");if(!n||!n.trim())return;const used=new Set([...BASE_SEC.map(s=>s[0]),...Object.keys(CSEC)]);const k="KLMNOPQRSTUVWXYZ".split("").find(c=>!used.has(c));if(!k){uiAlert("Достигнут предел разделов.");return}try{await P.db.doc("cms/main/sections/"+k).set({k,name:n.trim(),hidden:false})}catch(e){err()}};
}

/* ================= НАСТАВНИК ================= */
const DFN={crack:"Трещина",honey:"Раковины",rust:"Ржавчина",gap:"Щель / разрыв",wire:"Проволока",puddle:"Вода",bubble:"Вздутие",sag:"Провис",debris:"Мусор",tilt:"Наклон",foam:"Пена",holes:"Отверстия",cable:"Кабель",flap:"Отклейка",wave:"Неровность",hole:"Проходка",joint:"Толстый шов",stain:"Пятно",bar:"Стержень",spacing:"Шаг стержней",bulge:"Выпучивание",chip:"Скол",burn:"Прожог"};
const SCN={form:"Опалубка стен",slab:"Опалубка перекрытия",mesh:"Сетка армирования",cage:"Каркас колонны",conc:"Бетонная поверхность",pour:"Бетонирование",cubes:"Образцы бетона",wp:"Гидроизоляция подземной части",wet:"Санузел",roof:"Кровля",mason:"Кладка",win:"Окно",nvf:"Вентфасад",fin:"Отделка стены",floor:"Пол",mep:"Инженерные системы"};
let ED=null,JR=null,FLASH="";

function mentorGate(){
  if(!P.dataReady)return `<div class="blk"><p>Подключение к базе практики…</p></div>`;
  return `<div class="blk"><h1 style="font-size:24px">Режим наставника</h1><p>У вашей учётной записи нет роли «Наставник» в этой практике. Попросите владельца назначить роль в базе данных (таблица profiles).</p></div>`;
}
function mNav(cur){const f=FLASH;return `${f?`<div class="res" style="background:rgba(46,125,79,.18)">${esc(f)}</div>`:""}<div class="mtabs no-print"><a href="#/mentor" class="${cur==="d"?"on":""}">Лекции и разделы</a><a href="#/mentor/journal" class="${cur==="j"?"on":""}">Журнал абитуриентов</a><a href="#/mentor/exam" class="${cur==="e"?"on":""}">Банк аттестации</a><a href="#/mentor/settings" class="${cur==="s"?"on":""}">Настройки</a><button class="btn" id="mout">Выйти из аккаунта</button></div>`}

function mentorDash(){
  return `<h1 style="font-size:clamp(24px,4vw,34px)">Кабинет наставника</h1>${mNav("d")}
  <p class="mut">Изменения сохраняются в общую базу и сразу видны всем абитуриентам. Базовые лекции можно изменить и вернуть к исходной версии.</p>
  ${SEC.map(s=>`<div class="blk"><div class="row" style="justify-content:space-between"><h2 style="font-size:17px">${s[0]}. ${esc(s[1])}</h2><div class="row"><button class="btn" data-ren="${s[0]}">Переименовать</button><button class="btn" data-hidesec="${s[0]}">Удалить раздел</button><a class="btn pri" href="#/mentor/new/${s[0]}">＋ Лекция</a></div></div>
  <div class="tbl-wrap"><table class="nt">${ALL.filter(l=>l.s===s[0]).map(l=>`<tr><td style="width:60px"><b>${l.id}</b></td><td>${esc(l.t||"(без названия)")} ${l.hidden?'<span class="pill no">Скрыт</span>':""} ${l.edited?(l.base?'<span class="pill">Изменён</span>':'<span class="pill ok">Новый</span>'):""} ${l.photo?'<span class="pill">Фото-задание</span>':""}</td><td style="white-space:nowrap"><a class="btn" href="#/mentor/edit/${l.id}">Редактировать</a></td></tr>`).join("")}</table></div></div>`).join("")}
  ${Object.values(CSEC).filter(c=>c.hidden).length?`<div class="blk"><h2 style="font-size:17px">Удалённые (скрытые) разделы</h2>${Object.values(CSEC).filter(c=>c.hidden).map(c=>`<div class="row" style="margin:6px 0"><b>${c.k}.</b> ${esc(c.name||(BASE_SEC.find(z=>z[0]===c.k)||[,c.k])[1])} <button class="btn sm" data-unhide="${c.k}">Вернуть раздел</button></div>`).join("")}</div>`:""}
  <div class="row"><button class="btn dark" id="addsec">＋ Новый раздел</button><a class="btn" href="#/des">Библиотека DES-замечаний</a><a class="btn" href="#/exam">Аттестация</a></div>`;
}

function mentorSettings(){
  return `<h1 style="font-size:clamp(24px,4vw,34px)">Настройки практики</h1>${mNav("s")}
  <div class="blk"><h2 style="font-size:17px">Порядок прохождения</h2><label class="row"><input type="checkbox" id="seq" ${CFG.seq?"checked":""}> Открывать лекции раздела по порядку: следующий — после зачёта предыдущего</label>
  <label class="row" style="margin-top:8px"><input type="checkbox" id="needall" ${CFG.needAll!==false?"checked":""}> Для зачёта лекции нужно найти все дефекты в задании «Найди дефект» и сдать блиц-тест на 80 %</label></div>
  <div class="blk"><h2 style="font-size:17px">Доступ новых абитуриентов</h2>
  <label class="row"><input type="radio" name="accdef" value="all" ${CFG.accDef!=="none"?"checked":""}> Открывать все разделы сразу после регистрации</label>
  <label class="row" style="margin-top:6px"><input type="radio" name="accdef" value="none" ${CFG.accDef==="none"?"checked":""}> Закрывать все разделы — наставник открывает их в журнале («Доступ к разделам»)</label></div>
  <div class="blk"><h2 style="font-size:17px">Логотип в шапке сайта</h2>
  <p class="mut sm">Показывается рядом с названием в шапке и в подвале сайта.</p>
  <div class="row" style="align-items:center;gap:14px"><img src="${CFG.logo?blobUrl(CFG.logo):"/logo-small.jpg"}" alt="Логотип" style="width:48px;height:48px;object-fit:contain;border-radius:4px;background:#fff">
  <label class="btn">Загрузить логотип<input type="file" accept="image/*" hidden id="hlogo"></label>${CFG.logo?`<button class="btn" id="hlogodefault">Вернуть логотип по умолчанию</button>`:""}<span class="sm" id="hlogomsg"></span></div></div>
  <div class="blk"><h2 style="font-size:17px">Тексты главной страницы</h2><div class="form"><label>Название в шапке сайта (рядом с логотипом)<input class="inp" id="hsite" value="${esc(CFG.siteName||"ЦЕНТР «ПРАКТИКА ТН»")}"></label><label>Заголовок<input class="inp" id="htitle" value="${esc(CFG.heroTitle||"Практика ТН ЖК")}"></label><label>Описание<textarea class="inp" rows="3" id="htext" placeholder="Оставьте пустым — будет стандартный текст">${esc(CFG.heroText||"")}</textarea></label></div><button class="btn pri" id="hsave" style="margin-top:10px">Сохранить тексты</button></div>
  <div class="blk"><h2 style="font-size:17px">Порог зачёта аттестации</h2>
  <p class="mut sm">Результат аттестации от этого значения и выше считается «Зачёт». Применяется сразу ко всем новым и уже сданным попыткам (журнал и печать протокола пересчитываются на лету).</p>
  <label class="row">Порог, %<input class="inp" type="number" min="0" max="100" id="passpct" value="${passPct()}" style="max-width:100px"></label>
  <button class="btn pri" id="passsave" style="margin-top:10px">Сохранить порог</button></div>
  <div class="blk"><h2 style="font-size:17px">Специальности и уровни ТН</h2>
  <p class="mut sm">По одному значению на строке. Эти списки показываются в анкете абитуриента (поля «Специальность» и «Уровень ТН»).</p>
  <div class="form"><label>Специальности<textarea class="inp" rows="8" id="specsta">${esc(specsList().join("\n"))}</textarea></label>
  <label>Уровни ТН<textarea class="inp" rows="4" id="levelsta">${esc(levelsList().join("\n"))}</textarea></label></div>
  <button class="btn pri" id="specsave" style="margin-top:10px">Сохранить списки</button></div>
  <div class="blk"><h2 style="font-size:17px">Матрица допуска к аттестации</h2>
  <p class="mut sm">Отметьте, какие разделы банка аттестации может проходить каждая специальность. Абитуриенту без отмеченных разделов аттестация будет недоступна, пока наставник не загрузит вопросы и не отметит разделы здесь.</p>
  ${!Object.keys(EXAMBANK).length?`<p class="note">Сначала загрузите банк вопросов аттестации — разделы появятся здесь автоматически по названиям листов Excel.</p>`:`
  <div class="tbl-wrap"><table class="nt acc"><tr><th>Специальность</th>${Object.keys(EXAMBANK).sort((a,b)=>a.localeCompare(b,"ru")).map(c=>`<th style="text-align:center;white-space:nowrap">${esc(c)}</th>`).join("")}</tr>
  ${specsList().map(s=>`<tr><td>${esc(s)}</td>${Object.keys(EXAMBANK).sort((a,b)=>a.localeCompare(b,"ru")).map(c=>`<td style="text-align:center"><input type="checkbox" class="smx" data-s="${esc(s)}" data-c="${esc(c)}" ${(allowedCats(s)||[]).includes(c)?"checked":""}></td>`).join("")}</tr>`).join("")}
  </table></div><div class="row" style="margin-top:10px"><span class="sm" id="smxmsg"></span></div>`}</div>
  <p class="mut sm">Доступ в кабинет наставника определяется ролью учётной записи (<code>profiles.role</code> в базе данных) — отдельный пароль не нужен.</p>
  ${isOwner()?teamSection():""}`;
}
let TEAM=null;
const roleLabel=r=>({owner:"Владелец",mentor:"Наставник",trainee:"Абитуриент"}[r]||r);
async function loadTeam(){try{TEAM=await listProfiles()}catch(e){TEAM=[]}if(location.hash.startsWith("#/mentor/settings"))render()}
function teamSection(){
  if(!TEAM){loadTeam();return `<div class="blk"><h2 style="font-size:17px">Доступ наставников</h2><p>Загрузка…</p></div>`}
  return `<div class="blk"><h2 style="font-size:17px">Доступ наставников</h2>
  <p class="mut sm">Назначьте роль «Наставник» другим специалистам — они получат полный доступ к редактированию материалов, журналу и назначению курсов.</p>
  <div class="tbl-wrap"><table class="nt"><tr><th>E-mail</th><th>Роль</th><th></th></tr>
  ${TEAM.map(p=>`<tr><td>${esc(p.email||p.id)}</td><td><span class="pill ${p.role!=="trainee"?"ok":""}">${esc(roleLabel(p.role))}</span></td><td>${p.id===P.uid?`<span class="mut sm">это вы</span>`:p.role==="owner"?"":`<button class="btn sm" data-rolebtn="${esc(p.id)}" data-role="${p.role==="mentor"?"trainee":"mentor"}">${p.role==="mentor"?"Снять права наставника":"Сделать наставником"}</button>`}</td></tr>`).join("")}
  </table></div><p class="sm" id="teammsg"></p></div>`;
}

/* ================= БАНК ВОПРОСОВ АТТЕСТАЦИИ (загрузка из Excel) ================= */
function examQRow(cat,i,q){
  return `<div class="q" style="padding:10px 0"><p>${i+1}. ${esc(q.q)}</p>
  <div class="mut sm">A) ${esc(q.a)} · B) ${esc(q.b)} · C) ${esc(q.c)} · D) ${esc(q.d)} — верно: ${esc(q.correct)}</div>
  ${q.meta&&Object.keys(q.meta).length?`<div class="mut sm">${Object.entries(q.meta).map(([k,v])=>`${esc(k)}: ${esc(v)}`).join(" · ")}</div>`:""}
  <div class="row" style="margin-top:4px"><button class="btn sm" data-ebedit="${esc(cat)}:${i}">✎ Изменить</button><button class="btn sm" data-ebdelq="${esc(cat)}:${i}">Удалить</button></div></div>`;
}
function examBankPage(){
  const cats=Object.keys(EXAMBANK).sort((a,b)=>a.localeCompare(b,"ru"));
  return `<h1 style="font-size:clamp(24px,4vw,34px)">Банк вопросов аттестации</h1>${mNav("e")}
  <div class="blk"><h2 style="font-size:17px">Загрузить из Excel</h2>
  <p class="mut sm">Загрузите .xlsx — каждый лист книги станет отдельным разделом аттестации. Формат листа: столбец «Вопрос», затем 4 варианта ответа, затем «Правильный ответ» (A–D). Загрузка заменяет вопросы только для разделов (листов), присутствующих в файле — остальные разделы банка не затрагиваются.</p>
  <label class="btn pri">Выбрать файл .xlsx<input type="file" accept=".xlsx,.xls" hidden id="ebfile"></label><span class="sm" id="ebmsg" style="margin-left:10px"></span></div>
  ${cats.length?cats.map(cat=>`<div class="blk"><div class="row" style="justify-content:space-between"><h2 style="font-size:16px">${esc(cat)} · ${EXAMBANK[cat].length} вопросов</h2><div class="row"><button class="btn sm" data-ebadd="${esc(cat)}">＋ Вопрос</button><button class="btn sm" data-ebdelcat="${esc(cat)}">Удалить раздел</button></div></div>
  <details><summary>Показать вопросы</summary>${EXAMBANK[cat].map((q,i)=>examQRow(cat,i,q)).join("")}</details></div>`).join(""):`<p class="mut">Банк пуст. Загрузите файл выше или добавьте раздел вручную.</p>`}
  <button class="btn" id="ebnewcat">＋ Новый раздел вручную</button>`;
}
function ebQuestionModal(cat,i){
  const isNew=i==null;const q=isNew?{q:"",a:"",b:"",c:"",d:"",correct:"A"}:EXAMBANK[cat][i];
  modal(isNew?`Новый вопрос — ${cat}`:`Вопрос ${i+1} — ${cat}`,[
    {label:"Текст вопроса",type:"area",rows:3,value:q.q},
    {label:"Вариант A",value:q.a},{label:"Вариант B",value:q.b},{label:"Вариант C",value:q.c},{label:"Вариант D",value:q.d},
    {label:"Правильный вариант (A, B, C или D)",value:q.correct}
  ],async v=>{
    const correct=v[5].trim().toUpperCase();
    if(!["A","B","C","D"].includes(correct)){uiAlert("Правильный вариант должен быть A, B, C или D.");return false}
    if(!v[0].trim()||!v[1].trim()||!v[2].trim()||!v[3].trim()||!v[4].trim()){uiAlert("Заполните вопрос и все 4 варианта ответа.");return false}
    const nq={q:v[0].trim(),a:v[1].trim(),b:v[2].trim(),c:v[3].trim(),d:v[4].trim(),correct,meta:q.meta||{}};
    const merged=Object.assign({},EXAMBANK);merged[cat]=(merged[cat]||[]).slice();
    if(isNew)merged[cat].push(nq);else merged[cat][i]=nq;
    await P.db.doc("cms/main/examBank").set(merged);
  },isNew?{}:{del:async()=>{const merged=Object.assign({},EXAMBANK);merged[cat]=merged[cat].slice();merged[cat].splice(i,1);await P.db.doc("cms/main/examBank").set(merged)}});
}
function bindExamBank(){
  const f=document.getElementById("ebfile");
  if(f)f.onchange=async()=>{
    const file=f.files[0];if(!file)return;const m=document.getElementById("ebmsg");m.textContent="Разбираю файл…";
    try{
      const parsed=await parseWorkbook(file);
      const cats=Object.keys(parsed);
      if(!cats.length){m.textContent="Не нашёл ни одного распознанного вопроса в файле — проверьте формат столбцов.";return}
      const merged=Object.assign({},EXAMBANK,parsed);
      await P.db.doc("cms/main/examBank").set(merged);
      m.textContent=`Загружено разделов: ${cats.length} (${cats.reduce((n,c)=>n+parsed[c].length,0)} вопросов).`;
    }catch(e){m.textContent="Не удалось прочитать файл: "+(e&&e.message?e.message:e)}
    f.value="";
  };
  app.querySelectorAll("[data-ebdelcat]").forEach(b=>b.onclick=async()=>{
    const cat=b.dataset.ebdelcat;if(!await uiConfirm(`Удалить весь раздел «${cat}» из банка аттестации вместе со всеми вопросами?`))return;
    const merged=Object.assign({},EXAMBANK);delete merged[cat];
    try{await P.db.doc("cms/main/examBank").set(merged)}catch(e){uiAlert("Нет прав на запись.")}
  });
  app.querySelectorAll("[data-ebdelq]").forEach(b=>b.onclick=async()=>{
    const [cat,i]=b.dataset.ebdelq.split(":");
    if(!await uiConfirm("Удалить этот вопрос?"))return;
    const merged=Object.assign({},EXAMBANK);merged[cat]=merged[cat].slice();merged[cat].splice(+i,1);
    try{await P.db.doc("cms/main/examBank").set(merged)}catch(e){uiAlert("Нет прав на запись.")}
  });
  app.querySelectorAll("[data-ebedit]").forEach(b=>b.onclick=()=>{const [cat,i]=b.dataset.ebedit.split(":");ebQuestionModal(cat,+i)});
  app.querySelectorAll("[data-ebadd]").forEach(b=>b.onclick=()=>ebQuestionModal(b.dataset.ebadd,null));
  const nc=document.getElementById("ebnewcat");if(nc)nc.onclick=async()=>{
    const name=await uiPrompt("Название нового раздела аттестации");if(!name||!name.trim())return;
    const merged=Object.assign({},EXAMBANK);if(!merged[name.trim()])merged[name.trim()]=[];
    try{await P.db.doc("cms/main/examBank").set(merged);ebQuestionModal(name.trim(),null)}catch(e){uiAlert("Нет прав на запись.")}
  };
}

/* ----- редактор лекции ----- */
const ETABS=[["main","Основное"],["lec","Конспект"],["defect","Найди дефект (упражнения)"],["links","Видео, ссылки, фото"],["check","Чек-лист"],["norms","Норматив РК"],["ok","Эталон «Посмотри»"],["des","Замечание DES"],["quiz","Блиц-тест"]];
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
   <label>Название лекции<input class="inp" data-e="t" value="${esc(l.t)}"></label>
   <label>Что смотреть в проекте<input class="inp" data-e="p" value="${esc(l.p)}" placeholder="АР — узел примыкания, лист…"></label>
   <label>Ключевые слова для автоматических подборок видео и фото<input class="inp" data-e="kw" value="${esc(l.kw)}" placeholder="например: монтаж оконного блока ПВХ"></label>
   <label>Наставник: на что обратить внимание (блок «Посмотри»). Строки, начинающиеся с «- », станут списком; **текст** — жирным<textarea class="inp" rows="6" data-e="notes">${esc(l.notes)}</textarea></label>
   <label class="row"><input type="checkbox" data-b="hidden" ${l.hidden?"checked":""}> Скрыть лекцию от абитуриентов</label></div>`;
  t.lec=`<p class="mut sm">Конспект показывается абитуриенту отдельным разделом сразу после «Посмотри». Добавляйте блоки в нужном порядке.</p>
   <div id="leclist">${l.lec.map((b,i)=>`<div class="lecb"><div class="row" style="justify-content:space-between"><b>${{h:"Заголовок",p:"Текст",note:"Важно",img:"Слайдер фото",row:"Лента фото (слева направо)",link:"Ссылка"}[b.t]}</b><span class="row"><button class="btn" data-lmv="${i}:-1" aria-label="Выше">↑</button><button class="btn" data-lmv="${i}:1" aria-label="Ниже">↓</button><button class="btn" data-ldel="${i}">Удалить</button></span></div>
     ${b.t==="h"?`<input class="inp" data-lb="${i}" data-lk="v" value="${esc(b.v||"")}" placeholder="Заголовок раздела">`:""}
     ${b.t==="p"||b.t==="note"?`<textarea class="inp" rows="${b.t==="p"?6:3}" data-lb="${i}" data-lk="v" placeholder="Текст. Строки с «- » станут списком, **так** — жирный">${esc(b.v||"")}</textarea>`:""}
     ${b.t==="img"||b.t==="row"?`<div class="gal">${imgsOf(b).map((g,j)=>`<figure><img src="${blobUrl(g.id)}" alt=""><input class="inp" data-lbi="${i}:${j}" value="${esc(g.cap||"")}" placeholder="Подпись к фото ${j+1}"><button class="btn sm" data-lbd="${i}:${j}">Удалить фото</button></figure>`).join("")}</div><label class="btn ${up?"":"disabled"}" style="justify-self:start">＋ Фото в этот блок<input type="file" accept="image/*" multiple hidden data-lba="${i}" ${up?"":"disabled"}></label>`:""}
     ${b.t==="link"?`<div class="form"><input class="inp" data-lb="${i}" data-lk="v" value="${esc(b.v||"")}" placeholder="Текст ссылки"><input class="inp" data-lb="${i}" data-lk="u" value="${esc(b.u||"")}" placeholder="https://…"></div>`:""}</div>`).join("")||`<p class="mut">Конспект пустой.</p>`}</div>
   <div class="row" style="margin-top:10px"><button class="btn" data-ladd="h">＋ Заголовок</button><button class="btn" data-ladd="p">＋ Текст</button><button class="btn" data-ladd="note">＋ Важно</button><label class="btn ${up?"":"disabled"}">＋ Слайдер фото<input type="file" accept="image/*" multiple hidden id="lecimg" ${up?"":"disabled"}></label><label class="btn ${up?"":"disabled"}">＋ Лента фото<input type="file" accept="image/*" multiple hidden id="lecrow" ${up?"":"disabled"}></label><button class="btn" data-ladd="link">＋ Ссылка</button></div>
   <details style="margin-top:14px"><summary>Предпросмотр конспекта</summary><div class="lec blk">${lecHTML(l.lec)||"<p class='mut'>Пусто</p>"}</div></details>`;
  t.defect=`<div class="extabs">${[{t:ED.et||"Упражнение 1"},...ED.ex].map((e,k)=>`<button type="button" class="${k===ED.exi?"on":""}" data-exsel="${k}">${k+1}. ${esc(e.t||`Упражнение ${k+1}`)} (${(k?e.d:ED.d).length})</button>`).join("")}<button type="button" class="btn edit sm" data-exnew>＋ Упражнение</button></div>
   <div class="row" style="margin:8px 0 12px"><label style="flex:1">Название упражнения <input class="inp" data-ext value="${esc(ED.exi?TG().t||"":ED.et||"")}" placeholder="Упражнение ${ED.exi+1}" style="width:100%"></label>${ED.exi?`<button class="btn" data-exdel2>Удалить упражнение</button>`:""}</div>
   <div class="row" style="margin-bottom:10px">
    <label class="btn ${up?"":"disabled"}">${TG().photo?"Заменить фото":"Заменить схему на фото с объекта"}<input type="file" accept="image/*" hidden id="edph" ${up?"":"disabled"}></label>
    ${TG().photo?`<button class="btn" id="edphdel">Вернуться к учебной схеме</button>`:`<label>Схема: <select class="inp" id="edsc">${Object.keys(SCN).map(k=>`<option value="${k}" ${TG().sc===k?"selected":""}>${SCN[k]}</option>`).join("")}</select></label>
    <label>Рисунок новой отметки: <select class="inp" id="edtype">${Object.keys(DFN).map(k=>`<option value="${k}" ${l.dtype===k?"selected":""}>${DFN[k]}</option>`).join("")}</select></label>`}</div>
   <p class="mut sm"><b>Щелчок по пустому месту</b> — новая отметка дефекта. <b>Перетащите номер</b>, чтобы сдвинуть отметку. Пунктирный круг — зона, куда должен попасть абитуриент. ${TG().photo?"Абитуриент увидит фото без отметок.":"На схеме дефект рисуется в месте отметки."}</p>
   <div id="edcanvas"></div><div class="res hidden" id="edup"></div>`;
  t.links=`<div class="form">
   <label>Видео шага «Видео и материалы» — по одному на строку: Название | ссылка. Порядок строк = порядок на странице<textarea class="inp" rows="4" data-ln="vids" placeholder="Монтаж окна по ГОСТ 30971 | https://www.youtube.com/watch?v=…">${esc(linkLines(effVids(l)))}</textarea></label>
   <label>Ссылки шага «Посмотри» (фото, статьи, документы): Название | ссылка<textarea class="inp" rows="4" data-ln="lnk" placeholder="Альбом узлов производителя | https://…">${esc(linkLines(effLnk(l)))}</textarea></label>
   <p class="mut sm">Сюда уже подставлены автоматические подборки поиска. Замените их своими ссылками или удалите строки.</p></div>
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
   :`<p class="mut sm">Сейчас варианты создаются автоматически из дефектов, нормативов и действий лекции (плюс ложные варианты из других лекций).</p><button class="btn edit" data-dqon>✎ Заполнить и редактировать вручную</button>`}
   <p class="mut sm" style="margin-top:14px">Предпросмотр эталонного замечания:</p><div class="des-pre" id="edes">${desText(l,{},l.d.map(()=>true))}</div>`;
  t.quiz=`<p class="mut sm">Напишите вопросы и варианты ответов, отметьте правильный кружком. При прохождении программа сравнит ответ абитуриента с отмеченным вами — засчитывается только правильный.</p>
   <label class="row" style="margin:6px 0 12px"><input type="checkbox" data-b="qauto" ${ED.qauto?"checked":""}> Дополнять тест автоматическими вопросами, если моих вопросов меньше 5</label>
   <div id="qzlist">${ED.qz.map((q,i)=>`<div class="lecb"><div class="row" style="justify-content:space-between"><b>Вопрос ${i+1}</b><button class="btn sm" data-qdel="${i}">Удалить вопрос</button></div>
     <textarea class="inp" rows="2" data-qq="${i}" placeholder="Текст вопроса">${esc(q.q)}</textarea>
     ${q.opts.map((o,j)=>`<div class="row qopt"><label class="row sm" style="gap:4px"><input type="radio" name="qok_${i}" data-qok="${i}:${j}" ${q.ok===j?"checked":""}> правильный</label><input class="inp" style="flex:1" data-qo="${i}:${j}" value="${esc(o)}" placeholder="Вариант ответа ${j+1}">${q.opts.length>2?`<button class="btn sm" data-qodel="${i}:${j}" aria-label="Удалить вариант">✕</button>`:""}</div>`).join("")}
     <button class="btn sm" data-qoadd="${i}">＋ Вариант ответа</button></div>`).join("")||`<p class="mut">Своих вопросов пока нет — тест создаётся автоматически.</p>`}</div>
   <button class="btn edit" id="qzadd" style="margin-top:10px">＋ Добавить вопрос</button>`;
  return `<div class="crumbs"><a href="#/mentor">Кабинет наставника</a> / ${l.isNew?"Новая лекция":"Редактирование"} ${l.id}</div>
  <h1 style="font-size:clamp(22px,3.5vw,30px);margin-bottom:12px">${l.isNew?"Новая лекция":"Лекция"} ${l.id}${l.t?": "+esc(l.t):""}</h1>
  ${up?"":`<p class="note">Загрузка фото доступна только наставникам (роль mentor/owner).</p>`}
  <nav class="mtabs">${ETABS.map(x=>`<a href="#/mentor/edit/${l.id}/${x[0]}" class="${x[0]===tab?"on":""}">${x[1]}</a>`).join("")}</nav>
  <div class="blk">${t[tab]}</div>
  <div class="row edbar no-print"><button class="btn pri" id="edsave">Сохранить лекцию</button>${l.isNew?"":`<a class="btn" href="#/l/${l.id}">Посмотреть лекцию</a>`}${l.base&&l.edited?`<button class="btn" id="edrev">Вернуть базовую версию</button>`:""}<a class="btn" href="#/mentor">К списку лекций</a><span class="sm" id="edmsg">${l._ch?"Есть несохранённые изменения":esc(FLASH)}</span></div>`;
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
  catch(e){const t={too_large:"Файл слишком большой.",unsupported_type:"Этот формат не поддерживается.",quota_or_state:"Хранилище фото заполнено — удалите ненужные фото.",rate_limited:"Слишком много загрузок подряд — подождите минуту."}[e&&e.code]||"Фото не загрузилось. Попробуйте ещё раз.";if(m){m.classList.remove("hidden");m.textContent=t}else uiAlert(t);return null}
}
function rescale(oldG,newG){TG().d.forEach(d=>{d[1]=Math.round(d[1]*newG.W/oldG.W);d[2]=Math.round(d[2]*newG.H/oldG.H);if(d[5])d[5]=Math.round(d[5]*newG.k/oldG.k)})}
function bindEditor(tab){
  if(tab==="defect")edCanvas();
  const on=(sel,ev,fn)=>app.querySelectorAll(sel).forEach(el=>el.addEventListener(ev,fn));
  on("[data-e]","input",e=>{ED[e.target.dataset.e]=e.target.value;mark();const p=document.getElementById("edes");if(p)p.innerHTML=desText(ED,{},ED.d.map(()=>true))});
  on("[data-b]","change",e=>{ED[e.target.dataset.b]=e.target.checked;mark()});
  on("[data-l]","input",e=>{const ls=e.target.value.split("\n").map(x=>x.trim()).filter(Boolean);const k=e.target.dataset.l;ED[k]=k==="n"?ls.map(parseNorm).filter(Boolean):ls;mark()});
  on("[data-ln]","input",e=>{const k=e.target.dataset.ln;ED[k]=parseLinks(e.target.value);ED[k+"Set"]=true;mark()});
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
  // конспект
  on("[data-ladd]","click",e=>{const t=e.target.dataset.ladd;ED.lec.push(t==="link"?{t,v:"",u:""}:{t,v:""});mark();render()});
  on("[data-lb]","input",e=>{ED.lec[+e.target.dataset.lb][e.target.dataset.lk]=e.target.value;mark()});
  on("[data-ldel]","click",async e=>{if(!await uiConfirm("Удалить блок конспекта?"))return;ED.lec.splice(+e.target.dataset.ldel,1);mark();render()});
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
  const rv=document.getElementById("edrev");if(rv)rv.onclick=async()=>{if(!await uiConfirm("Удалить все изменения наставника и вернуть исходную версию лекции?"))return;try{await P.db.doc("cms/main/lessons/"+ED.id).delete();ED=null;FLASH="Лекция возвращена к базовой версии.";location.hash="#/mentor"}catch(e){uiAlert("Не удалось: нет прав на запись.")}};
}
async function edSave(){
  const msg=document.getElementById("edmsg");
  if(!ED.t.trim()){uiAlert("Введите название лекции (вкладка «Основное»).");return}
  const exs=[ED.d,...ED.ex.map(e=>e.d)];for(let q=0;q<exs.length;q++){const bad=exs[q].findIndex(d=>!d[3].trim());if(bad>=0){uiAlert(`Упражнение ${q+1}: заполните название дефекта № ${bad+1} (вкладка «Найди дефект»).`);ED.exi=q;return}}
  const badL=[...(ED.vidsSet?ED.vids:[]),...(ED.lnkSet?ED.lnk:[])].find(v=>v[1]&&!/^https?:\/\//.test(v[1]));if(badL){uiAlert(`Ссылка должна начинаться с http:// или https:// — проверьте: ${badL[1]}`);return}
  const badQ=ED.qz.findIndex(q=>(q.q.trim()||q.opts.some(o=>String(o).trim()))&&!validQ(q));if(badQ>=0){uiAlert(`Вопрос ${badQ+1}: нужен текст вопроса, минимум два варианта ответа и отмеченный правильный вариант.`);return}
  if(ED.desq){const g=DES_G.find(([g])=>!(ED.desq[g]||[]).some(o=>o[1]&&String(o[0]).trim()));if(g){uiAlert(`В замечании DES, поле «${g[1].split(":")[0]}»: отметьте хотя бы один верный вариант.`);return}}
  ED.n=ED.n.filter(n=>String(n[0]).trim());
  const out={ex:ED.ex.map(e=>({t:e.t||"",sc:e.sc||"conc",d:e.d||[],photo:e.photo||null})),et:ED.et||"",id:ED.id,t:ED.t.trim(),sc:ED.sc||"conc",kw:ED.kw||ED.t,d:ED.d,c:ED.c,p:ED.p,n:ED.n,ok:ED.ok,a:ED.a,notes:ED.notes,vids:ED.vids.filter(validLink),lnk:ED.lnk.filter(validLink),auto:ED.auto!==false,vidsSet:!!ED.vidsSet,lnkSet:!!ED.lnkSet,stt:ED.stt||{},sti:ED.sti||{},cap:ED.cap||"",gal:ED.gal,lec:ED.lec,qz:ED.qz.map(normQ).filter(validQ),qauto:!!ED.qauto,desq:ED.desq?Object.fromEntries(DES_G.map(([g])=>[g,(ED.desq[g]||[]).filter(o=>String(o[0]).trim())])):null,desex:ED.desex||{},photo:ED.photo||null,okPhoto:ED.okPhoto||null,hidden:!!ED.hidden,upd:now(),by:P.uid||""};
  msg.textContent="Сохраняю…";
  try{await P.db.doc("cms/main/lessons/"+ED.id).set(clone(out));FLASH="Лекция сохранена "+new Date().toLocaleTimeString("ru-RU")+" — изменения уже видны абитуриентам.";ED._ch=false;dirty=false;ED.isNew=false;ED.edited=true;msg.textContent=FLASH}
  catch(e){msg.textContent=e&&e.code==="quota_exceeded"?"База заполнена — удалите ненужные лекции.":"Не сохранено: нет прав на запись (нужна роль «Наставник»)."}
}

/* ----- журнал абитуриентов ----- */
async function loadJournal(){
  JR={loading:true,rows:[]};
  try{
    const s=await P.db.collection("trainees").limit(1000).get();
    JR={rows:s.docs.map(d=>Object.assign({uid:d.id},clone(d.data()))).filter(r=>r.prof),acc:{},retake:{}};
    try{const a=await P.db.collection("cms/main/access").limit(1000).get();a.docs.forEach(d=>{JR.acc[d.id]=clone(d.data())})}catch(e){}
    try{const rt=await P.db.collection("cms/main/examRetake").limit(1000).get();rt.docs.forEach(d=>{JR.retake[d.id]=clone(d.data())})}catch(e){}
  }catch(e){JR={rows:[],acc:{},retake:{},err:true}}
  if(location.hash.startsWith("#/mentor/journal")||location.hash.startsWith("#/mentor/t/"))render();
}
const retakeOf=uid=>(JR&&JR.retake&&JR.retake[uid]&&JR.retake[uid].date)||"";
async function setRetakeDate(uid,date,msgEl){
  try{await P.db.doc("cms/main/examRetake/"+uid).set({date:date||null,upd:now(),by:P.uid||""});JR.retake[uid]={date:date||null};if(msgEl)msgEl.textContent=date?"Дата пересдачи назначена: "+fdd(date):"Дата пересдачи снята.";return true}
  catch(e){if(msgEl)msgEl.textContent="Не сохранено: нет прав на запись.";return false}
}
function tStats(r){const ids=LS.map(l=>l.id),lp2=r.lp||{};const done=ids.filter(id=>lp2[id]&&lp2[id].p).length;const qs=ids.map(id=>lp2[id]&&lp2[id].q).filter(x=>x!=null);const last=[r.upd,...Object.values(lp2).flatMap(x=>[x.o,x.qd,x.p,x.f&&x.f[2]])].filter(Boolean).sort().pop();const ex=(r.ex||[]).slice(-1)[0];const ms=SEC.filter(s=>{const ls=LS.filter(l=>l.s===s[0]);return ls.length&&ls.every(l=>lp2[l.id]&&lp2[l.id].p)}).length;return{ms,done,avg:qs.length?Math.round(qs.reduce((a,b)=>a+b,0)/qs.length):null,last,ex,fp:r.tr&&r.tr.tot?pct(r.tr.hit,r.tr.tot):null}}
function accOf(uid){const a=JR&&JR.acc&&JR.acc[uid];if(a&&Array.isArray(a.secs))return a.secs;return CFG.accDef==="none"?[]:SEC.map(s=>s[0])}
async function accSet(uid,secs,msgEl){try{await P.db.doc("cms/main/access/"+uid).set({secs,upd:now(),by:P.uid||""});JR.acc[uid]={secs};if(msgEl){msgEl.textContent="Сохранено "+new Date().toLocaleTimeString("ru-RU")}return true}catch(e){if(msgEl)msgEl.textContent="Не сохранено: нет прав на запись.";return false}}
function accMatrix(rows){return `<p class="mut sm">Отметьте, какие разделы видит и проходит каждый абитуриент. Изменения сохраняются сразу — абитуриент увидит новый набор разделов без перезагрузки страницы. Новым абитуриентам по умолчанию ${CFG.accDef==="none"?"<b>закрыты все разделы</b>":"<b>открыты все разделы</b>"} (меняется в «Настройках»).</p>
  <div class="blk"><div class="tbl-wrap"><table class="nt acc"><tr><th>ФИО</th>${SEC.map(s=>`<th title="${esc(s[1])}" style="text-align:center;white-space:nowrap">${esc(s[1])}</th>`).join("")}<th>Быстро</th></tr>
  ${rows.map(r=>{const a=accOf(r.uid);return `<tr><td>${esc(r.prof.fio)}<div class="mut sm">${esc(r.prof.spec||"")}</div></td>${SEC.map(s=>`<td style="text-align:center"><input type="checkbox" class="accb" data-u="${esc(r.uid)}" data-s="${s[0]}" ${a.includes(s[0])?"checked":""} aria-label="${esc(r.prof.fio)}: раздел ${esc(s[1])}"></td>`).join("")}<td style="white-space:nowrap"><button class="btn sm" data-accall="${esc(r.uid)}">Все</button> <button class="btn sm" data-accnone="${esc(r.uid)}">Снять</button></td></tr>`}).join("")||`<tr><td colspan="${SEC.length+2}" class="mut">Пока никто не зарегистрировался.</td></tr>`}</table></div>
  <div class="row" style="margin-top:10px"><span class="sm" id="accmsg"></span></div></div>`}
function journalPage(){
  if(!JR){loadJournal();return `<h1 style="font-size:clamp(24px,4vw,34px)">Журнал абитуриентов</h1>${mNav("j")}<p>Загрузка…</p>`}
  if(JR.loading)return `<h1 style="font-size:clamp(24px,4vw,34px)">Журнал абитуриентов</h1>${mNav("j")}<p>Загрузка…</p>`;
  const q=(JR.q||"").toLowerCase();const rows=JR.rows.filter(r=>!q||[r.prof.fio,r.prof.spec,r.prof.lvl,r.prof.obj].join(" ").toLowerCase().includes(q)).sort((a,b)=>(a.prof.fio||"").localeCompare(b.prof.fio||"","ru"));
  return `<h1 style="font-size:clamp(24px,4vw,34px)">Журнал абитуриентов</h1>${mNav("j")}
  ${JR.err?`<p class="note">Журнал не загрузился. Обновите страницу.</p>`:""}
  <div class="row" style="margin:10px 0"><input class="inp" id="jq" placeholder="Поиск по ФИО, специальности, объекту" value="${esc(JR.q||"")}" style="min-width:280px"><button class="btn" id="jre">Обновить</button>${P.dl?`<button class="btn pri" id="jcsv">Скачать журнал (CSV для Excel)</button>`:""}<button class="btn" id="jpr">Печать</button></div>
  <div class="extabs"><button type="button" class="${JR.view==="acc"?"":"on"}" data-jv="list">Журнал</button><button type="button" class="${JR.view==="acc"?"on":""}" data-jv="acc">Доступ к разделам ✓</button></div>
  <p class="mut sm">Абитуриентов: ${JR.rows.length}. Лекций в курсе: ${LS.length}.</p>${JR.view==="acc"?accMatrix(rows):`
  <div class="blk no-print"><h2 style="font-size:16px">Назначить курс</h2><p class="mut sm">Отметьте абитуриентов в таблице ниже, выберите раздел и нажмите «Назначить» — им откроется доступ к разделу, и (если настроена отправка писем) придёт e-mail со ссылкой на сайт.</p>
  <div class="row"><select class="inp" id="asgsec">${SEC.map(s=>`<option value="${s[0]}">${esc(s[1])}</option>`).join("")}</select><button class="btn pri" id="asggo">Назначить выбранным</button><span class="sm" id="asgmsg"></span></div></div>
  <div class="blk"><div class="tbl-wrap"><table class="nt"><tr><th></th><th>ФИО</th><th>Специальность</th><th>Уровень</th><th>Лекции с</th><th>Лекций освоено</th><th>Разделов закрыто</th><th>Ср. тест</th><th>Дефекты</th><th>Посл. активность</th><th>Аттестация</th><th>Открыто разделов</th><th></th></tr>
  ${rows.map(r=>{const s=tStats(r);return `<tr><td><input type="checkbox" class="trsel" value="${esc(r.uid)}"></td><td><a href="#/mentor/t/${encodeURIComponent(r.uid)}">${esc(r.prof.fio)}</a></td><td>${esc(r.prof.spec||"")}</td><td>${esc(r.prof.lvl||"")}</td><td>${fdd(r.prof.reg)}</td><td>${s.done}/${LS.length}</td><td>${s.ms}/${SEC.length}</td><td>${s.avg!=null?s.avg+"%":"—"}</td><td>${s.fp!=null?s.fp+"%":"—"}</td><td>${fd(s.last)}</td><td>${s.ex?`<span class="pill ${s.ex.pc>=passPct()?"ok":"no"}">${s.ex.pc}% · ${fdd(s.ex.date)}</span>`:"—"}</td><td>${accOf(r.uid).length}/${SEC.length}</td><td><button class="btn sm" data-deltr="${esc(r.uid)}" title="Удалить абитуриента">✕</button></td></tr>`}).join("")||`<tr><td colspan="13" class="mut">Пока никто не зарегистрировался. Поделитесь ссылкой на практику с абитуриентами.</td></tr>`}</table></div></div>`}`;
}
async function assignCourse(uids,secKey,msgEl){
  const secLabel=secName(secKey)||secKey;
  msgEl.textContent="Назначаю доступ…";
  for(const uid of uids){
    const cur=accOf(uid);
    if(!cur.includes(secKey))await accSet(uid,[...cur,secKey]);
  }
  msgEl.textContent="Доступ назначен. Отправляю уведомления…";
  try{
    const r=await notifyAssignment({uids,category:secLabel,siteUrl:location.origin});
    const ok=(r&&r.results||[]).filter(x=>x.ok).length;
    msgEl.textContent=`Доступ назначен (${uids.length}). Писем отправлено: ${ok} из ${uids.length}.`;
  }catch(e){
    msgEl.textContent=`Доступ назначен (${uids.length}). Письма не отправлены: функция уведомлений ещё не настроена.`;
  }
}
async function deleteTrainee(uid,fio){
  if(!await uiConfirm(`Удалить абитуриента «${fio}» из журнала вместе со всем прогрессом? Это необратимо.`,"Удалить"))return false;
  try{await P.db.doc("trainees/"+uid).delete();try{await P.db.doc("cms/main/access/"+uid).delete()}catch(e){}return true}
  catch(e){uiAlert("Не удалось удалить: нет прав на запись.");return false}
}
function traineePage(uid){
  if(!JR||JR.loading){if(!JR)loadJournal();return `<p>Загрузка…</p>`}
  const r=JR.rows.find(x=>x.uid===uid);if(!r)return notFound();const lp2=r.lp||{},s=tStats(r);
  return `<div class="crumbs no-print"><a href="#/mentor/journal">Журнал абитуриентов</a> / ${esc(r.prof.fio)}</div>
  <div class="blk"><h1 style="font-size:clamp(22px,3.5vw,30px)">${esc(r.prof.fio)}</h1><p class="mut">${esc(r.prof.spec||"")} · ${esc(r.prof.lvl||"")}${r.prof.obj?" · "+esc(r.prof.obj):""} · лекции с ${fd(r.prof.reg)}</p>
  <div class="stat"><div><b>${s.done}/${LS.length}</b>лекций пройдено</div><div><b>${s.avg!=null?s.avg+"%":"—"}</b>средний балл тестов</div><div><b>${s.fp!=null?s.fp+"%":"—"}</b>дефектов найдено</div><div><b>${(r.ex||[]).length}</b>аттестаций</div></div>
  <button class="btn no-print" id="jpr">Печать карточки</button> <button class="btn no-print" data-deltr="${esc(uid)}" title="Удалить абитуриента">Удалить абитуриента</button></div>
  <div class="blk no-print"><h2 style="font-size:16px;margin-bottom:8px">Доступ к разделам</h2><p class="mut sm">Отмеченные разделы абитуриент видит на экране и может проходить.</p>
  <div class="chk">${SEC.map(sc=>`<label><input type="checkbox" class="accb" data-u="${esc(uid)}" data-s="${sc[0]}" ${accOf(uid).includes(sc[0])?"checked":""}><span>${sc[0]}. ${esc(sc[1])}</span></label>`).join("")}</div>
  <div class="row" style="margin-top:8px"><button class="btn sm" data-accall="${esc(uid)}">Открыть все</button><button class="btn sm" data-accnone="${esc(uid)}">Закрыть все</button><span class="sm" id="accmsg"></span></div></div>
  ${(r.ex||[]).length?`<div class="blk"><h2 style="font-size:16px">Аттестации</h2>
  <p class="mut sm">После каждой аттестации повторное прохождение заблокировано, пока вы не назначите дату пересдачи.</p>
  <div class="row no-print"><label>Дата пересдачи<input type="date" class="inp" id="retakedate" value="${esc(retakeOf(uid))}"></label><button class="btn pri" id="retakesave" data-u="${esc(uid)}">Назначить</button><span class="sm" id="retakemsg">${retakeOf(uid)?"Назначено: "+fdd(retakeOf(uid)):"Не назначено — повторный допуск закрыт"}</span></div>
  <div class="tbl-wrap"><table class="nt"><tr><th>Дата</th><th>Разделы</th><th>Результат</th></tr>${r.ex.slice().reverse().map(e=>`<tr><td>${fd(e.date)}</td><td>${esc(e.secs)}</td><td><span class="pill ${e.pc>=passPct()?"ok":"no"}">${e.pc}% · ${e.ok}/${e.n}</span></td></tr>`).join("")}</table></div></div>`:""}
  ${SEC.map(sc=>`<div class="blk"><h2 style="font-size:16px">${sc[0]}. ${esc(sc[1])}${LS.filter(l=>l.s===sc[0]).every(l=>lp2[l.id]&&lp2[l.id].p)?" · раздел освоен ✓":""}</h2><div class="tbl-wrap"><table class="nt"><tr><th>Лекция</th><th>Начат</th><th>Шаги</th><th>Найди дефект</th><th>DES</th><th>Тест (попыток)</th><th>Освоен</th></tr>${LS.filter(l=>l.s===sc[0]).map(l=>{const x=lp2[l.id]||{};return `<tr><td>${l.id}. ${esc(l.t)}</td><td>${fd(x.o)}</td><td>${lessonSteps(l).filter(s=>x.v&&x.v[s]).length}/${lessonSteps(l).length}</td><td>${x.fall?"✓ "+fdd(x.fall):x.f?`${x.f[0]}/${x.f[1]}`:"—"}${x.seen&&!x.fall?" · смотрел ответы":""}</td><td>${x.dp?"✓ "+fdd(x.dp):x.da?`ошибки (${x.da})`:"—"}</td><td>${x.q!=null?`${x.q}% (${x.qa||1})`:"—"}</td><td>${x.p?fd(x.p):"—"}</td></tr>`}).join("")}</table></div></div>`).join("")}`;
}
async function journalCsv(btn){
  const q=v=>`"${String(v==null?"":v).replace(/"/g,'""')}"`;
  const head=["ФИО","Специальность","Уровень","Объект","Лекции с","Освоено лекций","Всего лекций","Средний балл тестов","Найдено дефектов %","Последняя активность","Последняя аттестация %","Результат аттестации","Дата аттестации","Открытые разделы",...LS.map(l=>"Пройден "+l.id)];
  const body=JR.rows.map(r=>{const s=tStats(r),lp2=r.lp||{};return[r.prof.fio,r.prof.spec,r.prof.lvl,r.prof.obj,fdd(r.prof.reg),s.done,LS.length,s.avg,s.fp,fd(s.last),s.ex?s.ex.pc:"",s.ex?(s.ex.pc>=passPct()?"Зачёт":"Незачёт"):"",s.ex?fdd(s.ex.date):"",accOf(r.uid).join(" "),...LS.map(l=>lp2[l.id]&&lp2[l.id].p?fdd(lp2[l.id].p):"")].map(q).join(";")});
  try{await P.dl.save({filename:"zhurnal-praktika-tn-"+new Date().toISOString().slice(0,10)+".csv",data:"\ufeff"+[head.map(q).join(";"),...body].join("\r\n")})}catch(e){if(e&&e.code!=="cancelled")uiAlert("Скачивание недоступно в этом окне.")}
}

/* ================= МАРШРУТИЗАЦИЯ ================= */
function render(){
  const top=document.querySelector(".top"),foot=document.querySelector("footer"),signout=document.getElementById("signout");
  if(!P.ready){if(top)top.classList.add("hidden");if(foot)foot.classList.add("hidden");app.innerHTML=`<div class="blk"><p>Загрузка…</p></div>`;return}
  if(!P.authed){if(top)top.classList.add("hidden");if(foot)foot.classList.add("hidden");app.innerHTML="";mountLoginScreen(app);return}
  if(top)top.classList.remove("hidden");if(foot)foot.classList.remove("hidden");if(signout)signout.classList.remove("hidden");
  const sn=document.getElementById("sitename");if(sn)sn.textContent=CFG.siteName||"ЦЕНТР «ПРАКТИКА ТН»";
  const li=document.getElementById("logo-img");if(li)li.src=CFG.logo?blobUrl(CFG.logo):"/logo-small.jpg";
  rebuild();
  const h=(location.hash||"#/").replace(/^#\/?/,"");const [p,a,b,c]=h.split("/");
  document.getElementById("upd").classList.add("hidden");
  document.querySelectorAll("#nav a").forEach(x=>x.classList.toggle("on",x.dataset.r===(p==="s"||p==="l"?"":p)));
  const nb=document.getElementById("navm");nb.classList.toggle("on",p==="mentor");nb.classList.toggle("hidden",!isMentor());
  if(EX&&EX.t&&p!=="exam"){clearInterval(EX.t);EX=null}
  const who=document.getElementById("who");who.textContent=st.prof?st.prof.fio.split(" ").slice(0,2).join(" ")+(isMentor()?" · наставник":""):"";who.classList.toggle("hidden",!st.prof);
  dirty=false;let html;
  if(!P.dataReady)html=`<div class="blk"><p>Подключение к базе практики…</p></div>`;
  else if(p==="mentor"){
    if(!isMentor())html=mentorGate();
    else if(a==="new"){if(SEC.some(s=>s[0]===b)){edStart(null,b);history.replaceState(null,"","#/mentor/edit/"+ED.id+"/main");lastHash=location.hash;html=editorPage("main")}else html=notFound()}
    else if(a==="edit"){if((ED&&ED.id===b)||edStart(b))html=editorPage(c);else html=notFound()}
    else if(a==="journal")html=journalPage();
    else if(a==="t")html=traineePage(decodeURIComponent(b||""));
    else if(a==="exam")html=examBankPage();
    else if(a==="settings")html=mentorSettings();
    else{html=mentorDash()}
  }
  else if(!st.prof||p==="register")html=registerPage();
  else if(!p)html=home();else if(p==="s")html=secPage(a);else if(p==="l")html=lessonPage(a,b,c);else if(p==="trainer")html=trainerPage();else if(p==="video")html=videoPage();else if(p==="norms")html=normsPage();else if(p==="des")html=desPage();else if(p==="exam")html=examPage();else if(p==="progress")html=progressPage();else html=notFound();
  app.innerHTML=html;window.scrollTo(0,0);
  bindPage(p,a,b,c);
}
function bindPage(p,a,b,c){
  if(!P.dataReady)return;
  if(p==="mentor"){
    const mo=document.getElementById("mout");if(mo)mo.onclick=()=>signOut();
    if(a==="edit")bindEditor(c||"main");if(a==="new")bindEditor("main");
    if(a==="exam")bindExamBank();
    if(!a){
      app.querySelectorAll("[data-ren]").forEach(bt=>bt.onclick=async()=>{const k=bt.dataset.ren;const n=await uiPrompt("Новое название раздела",secName(k));if(!n)return;try{await P.db.doc("cms/main/sections/"+k).set({k,name:n.trim(),hidden:false})}catch(e){uiAlert("Нет прав на запись.")}});
      app.querySelectorAll("[data-hidesec]").forEach(bt=>bt.onclick=async()=>{const k=bt.dataset.hidesec;if(!await uiConfirm(`Удалить раздел ${k}? Его лекции перестанут показываться абитуриентам.`))return;try{await P.db.doc("cms/main/sections/"+k).set({k,name:secName(k),hidden:true})}catch(e){uiAlert("Нет прав на запись.")}});
      app.querySelectorAll("[data-unhide]").forEach(bt=>bt.onclick=async()=>{const k=bt.dataset.unhide;try{await P.db.doc("cms/main/sections/"+k).set(Object.assign({},CSEC[k],{hidden:false}))}catch(e){uiAlert("Нет прав на запись.")}});
      const as=document.getElementById("addsec");if(as)as.onclick=async()=>{const n=await uiPrompt("Название нового раздела");if(!n)return;const used=new Set([...BASE_SEC.map(s=>s[0]),...Object.keys(CSEC)]);const k="KLMNOPQRSTUVWXYZ".split("").find(c=>!used.has(c));if(!k){uiAlert("Достигнут предел разделов.");return}try{await P.db.doc("cms/main/sections/"+k).set({k,name:n.trim(),hidden:false})}catch(e){uiAlert("Нет прав на запись.")}};
    }
    if(a==="settings"){
      document.getElementById("needall").onchange=async e=>{try{await P.db.doc("cms/main").set(Object.assign({},CFG,{needAll:e.target.checked}));FLASH="Настройка сохранена."}catch(er){uiAlert("Нет прав на запись.")}};
      document.getElementById("hsave").onclick=async()=>{try{await P.db.doc("cms/main").set(Object.assign({},CFG,{siteName:document.getElementById("hsite").value.trim(),heroTitle:document.getElementById("htitle").value.trim(),heroText:document.getElementById("htext").value.trim()}));FLASH="Тексты главной сохранены."}catch(er){uiAlert("Нет прав на запись.")}};
      document.getElementById("seq").onchange=async e=>{try{await P.db.doc("cms/main").set(Object.assign({},CFG,{seq:e.target.checked}));FLASH="Настройка сохранена."}catch(er){uiAlert("Нет прав на запись.")}};
      const hl=document.getElementById("hlogo");if(hl)hl.onchange=async()=>{
        const f=hl.files[0];if(!f)return;const m=document.getElementById("hlogomsg");m.textContent="Загружаю логотип…";
        const s=await shrink(f,400);if(!s){m.textContent="Не удалось прочитать файл — выберите JPG или PNG.";return}
        try{const r=await P.assets.upload(dataUrlToBlob(s.url));await P.db.doc("cms/main").set(Object.assign({},CFG,{logo:r.id}));m.textContent="Логотип сохранён."}
        catch(e){m.textContent="Не сохранено: нет прав на запись."}
        hl.value="";
      };
      const hld=document.getElementById("hlogodefault");if(hld)hld.onclick=async()=>{try{await P.db.doc("cms/main").set(Object.assign({},CFG,{logo:null}))}catch(e){uiAlert("Нет прав на запись.")}};
      const psave=document.getElementById("passsave");if(psave)psave.onclick=async()=>{
        const v=+document.getElementById("passpct").value;
        if(!Number.isFinite(v)||v<0||v>100){uiAlert("Введите число от 0 до 100.");return}
        try{await P.db.doc("cms/main").set(Object.assign({},CFG,{examPassPct:v}));FLASH="Порог сохранён."}catch(e){uiAlert("Нет прав на запись.")}
      };
      const ssave=document.getElementById("specsave");if(ssave)ssave.onclick=async()=>{
        const specialties=document.getElementById("specsta").value.split("\n").map(x=>x.trim()).filter(Boolean);
        const levels=document.getElementById("levelsta").value.split("\n").map(x=>x.trim()).filter(Boolean);
        try{await P.db.doc("cms/main").set(Object.assign({},CFG,{specialties,levels}));FLASH="Списки сохранены."}catch(e){uiAlert("Нет прав на запись.")}
      };
      app.querySelectorAll(".smx").forEach(cb=>cb.onchange=async()=>{
        const spec=cb.dataset.s,cat=cb.dataset.c,m=Object.assign({},specMatrix());
        const cur=new Set(m[spec]||[]);if(cb.checked)cur.add(cat);else cur.delete(cat);m[spec]=[...cur];
        const msg=document.getElementById("smxmsg");
        try{await P.db.doc("cms/main").set(Object.assign({},CFG,{specMatrix:m}));if(msg)msg.textContent="Сохранено "+new Date().toLocaleTimeString("ru-RU")}
        catch(e){if(msg)msg.textContent="Не сохранено: нет прав на запись.";cb.checked=!cb.checked}
      });
      app.querySelectorAll("[data-rolebtn]").forEach(b=>b.onclick=async()=>{
        const uid=b.dataset.rolebtn,role=b.dataset.role,p=TEAM.find(x=>x.id===uid),m=document.getElementById("teammsg");
        if(!await uiConfirm(`${role==="mentor"?"Назначить":"Снять"} права наставника для ${p?esc(p.email||p.id):uid}?`))return;
        try{await setProfileRole(uid,role);p.role=role;render()}catch(e){if(m)m.textContent="Не удалось изменить роль: нет прав."}
      });
    }
    const accSave=async(uid,msg)=>{const secs=[...app.querySelectorAll(`.accb[data-u="${CSS.escape(uid)}"]`)].filter(x=>x.checked).map(x=>x.dataset.s);await accSet(uid,secs,msg)};
    app.querySelectorAll(".accb").forEach(cb=>cb.onchange=()=>accSave(cb.dataset.u,document.getElementById("accmsg")));
    app.querySelectorAll("[data-accall],[data-accnone]").forEach(bt=>bt.onclick=()=>{const uid=bt.dataset.accall||bt.dataset.accnone,on=!!bt.dataset.accall;app.querySelectorAll(`.accb[data-u="${CSS.escape(uid)}"]`).forEach(x=>x.checked=on);accSave(uid,document.getElementById("accmsg"))});
    app.querySelectorAll("[data-jv]").forEach(bt=>bt.onclick=()=>{JR.view=bt.dataset.jv;render()});
    const rts=document.getElementById("retakesave");if(rts)rts.onclick=async()=>{const uid=rts.dataset.u,val=document.getElementById("retakedate").value;await setRetakeDate(uid,val||null,document.getElementById("retakemsg"))};
    app.querySelectorAll('input[name="accdef"]').forEach(r=>r.onchange=async()=>{try{await P.db.doc("cms/main").set(Object.assign({},CFG,{accDef:r.value}));FLASH="Настройка доступа сохранена."}catch(e){uiAlert("Нет прав на запись.")}});
    if(a==="journal"&&JR&&!JR.loading){const jq=document.getElementById("jq");jq.oninput=()=>{JR.q=jq.value;const pos=jq.selectionStart;render();const n=document.getElementById("jq");n.focus();n.setSelectionRange(pos,pos)};document.getElementById("jre").onclick=()=>{JR=null;render()};const c=document.getElementById("jcsv");if(c)c.onclick=()=>journalCsv(c)
      const ag=document.getElementById("asggo");if(ag)ag.onclick=async()=>{
        const uids=[...app.querySelectorAll(".trsel:checked")].map(x=>x.value);const m=document.getElementById("asgmsg");
        if(!uids.length){m.textContent="Отметьте хотя бы одного абитуриента.";return}
        const sec=document.getElementById("asgsec").value;
        if(!await uiConfirm(`Назначить раздел «${secName(sec)}» выбранным абитуриентам (${uids.length})?`))return;
        await assignCourse(uids,sec,m);
      };}
    const jp=document.getElementById("jpr");if(jp)jp.onclick=()=>window.print();
    app.querySelectorAll("[data-deltr]").forEach(bt=>bt.onclick=async()=>{
      const uid=bt.dataset.deltr;const row=JR&&JR.rows.find(x=>x.uid===uid);const fio=row?row.prof.fio:"абитуриента";
      if(await deleteTrainee(uid,fio)){JR=null;location.hash="#/mentor/journal"}});
    return;
  }
  if(!st.prof||p==="register"){document.getElementById("rgo").onclick=()=>{const fio=document.getElementById("rf").value.trim();if(fio.split(/\s+/).length<2){uiAlert("Введите фамилию и имя полностью.");return}st.prof={fio,spec:document.getElementById("rs").value.trim(),lvl:document.getElementById("rl").value,obj:document.getElementById("ro").value.trim(),reg:(st.prof&&st.prof.reg)||now()};save();location.hash=p==="register"?"#/progress":"#/";render()};const pw2=document.getElementById("pwchange2");if(pw2)pw2.onclick=openPasswordModal;return}
  {const L0=(isMentor()?ALL:LS).find(x=>x.id===a);if(p==="l"&&L0&&!locked(L0))bindLesson(L0,b,c)}
  if(!p)bindHome();
  if(p==="trainer"){document.getElementById("trsec").onchange=e=>{TR.sec=e.target.value;trainerLoad()};document.getElementById("trnext").onclick=trainerLoad;trainerLoad()}
  if(p==="des"){document.getElementById("dessec").onchange=e=>{TR.des=e.target.value;render()};document.querySelectorAll("[data-copy]").forEach(bt=>bt.onclick=()=>{const l=LS.find(x=>x.id===bt.dataset.copy);copyText(plain(desText(l,st.desf||{},l.d.map(()=>true))),bt)})}
  if(p==="progress"){const pw=document.getElementById("pwchange");if(pw)pw.onclick=openPasswordModal}
  if(p==="exam"){
    const g=document.getElementById("exgo");if(g)g.onclick=examStart;
    const e=document.getElementById("exend");if(e)e.onclick=async()=>{const left=EX.qs.length-document.querySelectorAll("#exq input:checked").length;if(left&&!await uiConfirm(`Без ответа осталось вопросов: ${left}. Завершить?`))return;examFinish()};
    if(EX&&EX.stage==="run"){dirty=true;const tick=()=>{const s=Math.max(0,Math.round((EX.end-Date.now())/1000));const el=document.getElementById("timer");if(el)el.textContent=`${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`;if(s<=0)examFinish()};clearInterval(EX.t);EX.t=setInterval(tick,1000);tick()}
    const pr=document.getElementById("exprint");if(pr)pr.onclick=()=>window.print();
    const ag=document.getElementById("exagain");if(ag)ag.onclick=()=>{EX=null;render()};
  }
}
let lastHash=location.hash,skipHash=false;
window.addEventListener("hashchange",()=>{
  if(skipHash){skipHash=false;lastHash=location.hash;return}
  const stay=ED&&location.hash.startsWith("#/mentor/edit/"+ED.id+"/");
  if(ED&&ED._ch&&!stay){const target=location.hash;skipHash=true;location.hash=lastHash;uiConfirm("Есть несохранённые изменения лекции. Уйти без сохранения?","Уйти").then(ok=>{if(ok){ED=null;location.hash=target}});return}
  else if(ED&&!stay)ED=null;
  if(!stay)FLASH="";lastHash=location.hash;render()});
window.addEventListener("beforeunload",e=>{if(ED&&ED._ch){e.preventDefault();e.returnValue=""}});
document.getElementById("updgo").onclick=async()=>{if(dirty&&!await uiConfirm("Несохранённые изменения на этой странице пропадут. Обновить?"))return;dirty=false;render()};
document.getElementById("thm").onclick=()=>{const r=document.documentElement;const dark=r.dataset.theme?r.dataset.theme==="dark":matchMedia("(prefers-color-scheme: dark)").matches;r.dataset.theme=dark?"light":"dark";try{localStorage.setItem("tnTheme",r.dataset.theme)}catch(e){}};
document.getElementById("signout").onclick=()=>signOut();
try{const t=localStorage.getItem("tnTheme");if(t)document.documentElement.dataset.theme=t}catch(e){}
try{const tb=document.querySelector(".top");const sh=()=>{if(getComputedStyle(tb).position==="sticky")document.documentElement.style.setProperty("--hh",tb.offsetHeight+"px")};new ResizeObserver(sh).observe(tb);sh()}catch(e){}
render();
initPlatform();
