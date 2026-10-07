
/* ----- собственные диалоги вместо confirm/prompt/alert (в окне claude.ai системные окна заблокированы) ----- */
function uiDialog(html,btns){return new Promise(res=>{
  const d=document.createElement("div");d.className="lb";
  d.innerHTML=`<div class="mdl" role="alertdialog" aria-modal="true">${html}<div class="row" style="margin-top:16px">${btns.map((b,i)=>`<button type="button" class="btn ${b.pri?"pri":""}" data-ub="${i}">${b.t}</button>`).join("")}</div></div>`;
  document.body.appendChild(d);let closed=false;const done=v=>{if(closed)return;closed=true;d.remove();res(v)};
  d.querySelectorAll("[data-ub]").forEach(b=>b.onclick=()=>done(btns[+b.dataset.ub].v(d)));
  d.addEventListener("click",e=>{if(e.target===d)done(btns[btns.length-1].v(null))});
  d.addEventListener("keydown",e=>{if(e.key==="Escape")done(btns[btns.length-1].v(null));if(e.key==="Enter"&&e.target.matches("input"))done(btns[0].v(d))});
  const f=d.querySelector("input")||d.querySelector("[data-ub]");if(f)f.focus();
})}
const uiConfirm=(msg,yes="Да")=>uiDialog(`<p style="margin:0;font-size:16px">${esc(msg)}</p>`,[{t:yes,pri:1,v:()=>true},{t:"Отмена",v:()=>false}]);
const uiPrompt=(msg,val="")=>uiDialog(`<label class="form"><span style="font-weight:700">${esc(msg)}</span><input class="inp" data-p value="${esc(val)}"></label>`,[{t:"Сохранить",pri:1,v:d=>d?d.querySelector("[data-p]").value:null},{t:"Отмена",v:()=>null}]);
const uiAlert=msg=>uiDialog(`<p style="margin:0;font-size:16px">${esc(msg)}</p>`,[{t:"Понятно",pri:1,v:()=>true}]);
