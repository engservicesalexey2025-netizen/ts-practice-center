"use strict";
const N={
PRJ:["Проект","Рабочая документация объекта (КЖ, АР, КР, ОВ, ВК, ЭМ, СС, АПС), ППР/ТК"],
ORG:["СН РК 1.03-00-2022","Строительное производство. Организация строительства предприятий, зданий и сооружений"],
NOK:["СП РК 5.03-107-2013","Несущие и ограждающие конструкции"],
SEI:["СП РК 2.03-30-2017","Строительство в сейсмических зонах"],
EC2:["СП РК EN 1992-1-1:2004/2011","Проектирование железобетонных конструкций. Общие правила"],
G34329:["ГОСТ 34329-2017","Опалубка. Общие технические условия"],
G10922:["ГОСТ 10922-2012","Арматурные и закладные изделия, их сварные, вязаные и механические соединения"],
G14098:["ГОСТ 14098-2014","Соединения сварные арматуры и закладных изделий"],
G34028:["ГОСТ 34028-2016","Прокат арматурный для железобетонных конструкций"],
G7473:["ГОСТ 7473-2010","Смеси бетонные. Технические условия"],
G18105:["ГОСТ 18105-2018","Бетоны. Правила контроля и оценки прочности"],
G10180:["ГОСТ 10180-2012","Бетоны. Методы определения прочности по контрольным образцам"],
G22690:["ГОСТ 22690-2015","Бетоны. Определение прочности механическими методами неразрушающего контроля"],
COR:["СН РК 2.01-01-2013","Защита строительных конструкций от коррозии"],
ROOF:["СП РК 3.02-137-2013","Крыши и кровли"],
FIN:["СНиП 3.04.01-87","Изоляционные и отделочные покрытия (в части, не противоречащей НТД РК)"],
TEP:["СП РК 2.04-107-2013","Строительная теплотехника"],
ZH:["СП РК 3.02-101-2012","Здания жилые многоквартирные"],
GAZ:["ГОСТ 31360-2007","Изделия стеновые неармированные из ячеистого бетона автоклавного твердения"],
G30971:["ГОСТ 30971-2012","Швы монтажные узлов примыкания оконных блоков к стеновым проёмам"],
G23166:["ГОСТ 23166-99","Блоки оконные. Общие технические условия"],
G30674:["ГОСТ 30674-99","Блоки оконные из поливинилхлоридных профилей"],
G24866:["ГОСТ 24866-2014","Стеклопакеты клееные. Технические условия"],
SPK:["ГОСТ 33079-2014","Конструкции фасадные светопрозрачные навесные"],
NVF:["ТС на НФС","Техническое свидетельство на навесную фасадную систему и альбом узлов"],
FIRE:["ТР «Общие требования к ПБ»","Технический регламент, утв. приказом МЧС РК от 17.08.2021 № 405"],
FSP:["СП РК 2.02-101-2014","Пожарная безопасность зданий и сооружений"],
OVK:["СП РК 4.02-101-2012","Отопление, вентиляция и кондиционирование воздуха"],
SAN:["СП РК 4.01-102-2013","Внутренние санитарно-технические системы"],
VK:["СП РК 4.01-101-2012","Внутренний водопровод и канализация зданий"],
PUE:["ПУЭ РК","Правила устройства электроустановок, утв. приказом МЭ РК от 20.03.2015 № 230"],
ELJ:["СП РК 4.04-106-2013","Электрооборудование жилых и общественных зданий"],
OT:["СН РК 1.03-05-2011","Охрана труда и техника безопасности в строительстве"]
};
const BASE_SEC=[["A","Монолит и опалубка","form"],["B","Армирование","mesh"],["C","Бетонные работы","conc"],["D","Гидроизоляция","wp"],["E","Кровля","roof"],["F","Кладка и газобетон","mason"],["G","Окна и СПК","win"],["H","Вентилируемый фасад","nvf"],["I","Отделочные работы","fin"],["J","ОВиК, электрика, СС, пожарная безопасность","mep"]];
let SEC=BASE_SEC.map(s=>s.slice());
const BASE=[];let LS=[],ALL=[];
function L(id,t,sc,kw,d,c,p,n,ok,a){BASE.push({id,t,sc,kw,d,c,p,n,ok,a,s:id.replace(/\d+$/,"")})}
const nm=k=>N[k]||[String(k),""];
const blobUrl=id=>"/_blob/"+id;
const byId=id=>LS.find(l=>l.id===id);
const secName=k=>(SEC.find(s=>s[0]===k)||[])[1]||"";
const enc=encodeURIComponent;
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));

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
