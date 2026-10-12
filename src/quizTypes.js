/* Новые типы вопросов блиц-теста: сопоставление и упорядочивание.
   Вынесены в отдельный файл (а не в app.js), т.к. не требуют SVG-зависимостей —
   hotspot-вопрос (третий новый тип) остаётся в app.js, т.к. использует svgOf()/geo().
   Авторская и runtime-форма вопроса — см. CLAUDE.md после реализации. */
import { esc } from "./utils.js";

/* Та же перетасовка Фишера-Йетса, что в app.js — продублирована намеренно,
   чтобы не трогать существующие строки app.js ради одной shared-функции. */
function shuffle(a, r) {
  a = a.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ---------- сопоставление (match) ---------- */

export const validMatchQ = q =>
  q.q && String(q.q).trim() &&
  Array.isArray(q.pairs) &&
  q.pairs.filter(p => p && String(p[0] || "").trim() && String(p[1] || "").trim()).length >= 2;

export function buildMatchRuntime(q, l, r) {
  const idx = q.pairs.map((_, i) => i);
  const leftOrder = shuffle(idx, r), rightOrder = shuffle(idx, r);
  const left = leftOrder.map(i => q.pairs[i][0]);
  const right = rightOrder.map(i => q.pairs[i][1]);
  const ans = leftOrder.map(origIdx => rightOrder.indexOf(origIdx));
  return { type: "match", q: q.q, left, right, ans, lid: l.id };
}

export function renderMatch(q, i, name) {
  const opts = q.right.map((_, k) => `<option value="${k}">${k + 1}</option>`).join("");
  const rows = q.left.map((term, k) =>
    `<div class="match-row" data-k="${k}"><span>${esc(term)}</span><select class="inp" name="${name}${i}_${k}"><option value="">—</option>${opts}</select></div>`
  ).join("");
  const legend = q.right.map((def, k) => `<div class="mut sm">${k + 1}. ${esc(def)}</div>`).join("");
  return `<div class="q match" data-i="${i}"><p>${i + 1}. ${esc(q.q)}</p>${rows}<div class="match-legend">${legend}</div></div>`;
}

export function gradeMatch(root, q, i, name) {
  const box = root.querySelector(`.q[data-i="${i}"]`);
  let answered = true, correct = 0;
  q.left.forEach((_, k) => {
    const sel = box.querySelector(`select[name="${name}${i}_${k}"]`);
    const val = sel.value;
    if (val === "") answered = false;
    const row = box.querySelector(`.match-row[data-k="${k}"]`);
    row.classList.remove("right", "wrong");
    if (val !== "" && +val === q.ans[k]) { correct++; row.classList.add("right") }
    else if (val !== "") row.classList.add("wrong");
    sel.disabled = true;
  });
  const ok = answered && correct === q.left.length;
  return { ok, answered, score: q.left.length ? correct / q.left.length : 0 };
}

/* ---------- упорядочивание (order) ---------- */

export const validOrderQ = q =>
  q.q && String(q.q).trim() &&
  Array.isArray(q.steps) &&
  q.steps.filter(s => String(s || "").trim()).length >= 3;

export function buildOrderRuntime(q, l, r) {
  const n = q.steps.length;
  const perm = shuffle([...Array(n).keys()], r); // perm[позиция в выдаче] = исходный индекс
  const items = perm.map(origIdx => q.steps[origIdx]);
  const ans = new Array(n);
  perm.forEach((origIdx, displayPos) => { ans[origIdx] = displayPos });
  return { type: "order", q: q.q, items, ans, lid: l.id };
}

export function renderOrder(q, i, name) {
  const lis = q.items.map((text, k) =>
    `<li data-k="${k}"><span>${esc(text)}</span><span class="row" style="gap:4px"><button type="button" class="btn sm ord-up" aria-label="Сдвинуть выше">↑</button><button type="button" class="btn sm ord-down" aria-label="Сдвинуть ниже">↓</button></span></li>`
  ).join("");
  return `<div class="q order" data-i="${i}"><p>${i + 1}. ${esc(q.q)}</p><ol class="order-list" data-i="${i}">${lis}</ol></div>`;
}

export function bindOrderQ(root, q, i, name) {
  const ol = root.querySelector(`.order-list[data-i="${i}"]`); if (!ol) return;
  const box = ol.closest(".q");
  ol.addEventListener("click", e => {
    const li = e.target.closest("li"); if (!li) return;
    if (e.target.classList.contains("ord-up")) { const prev = li.previousElementSibling; if (prev) { ol.insertBefore(li, prev); box.dataset.touched = "1" } }
    else if (e.target.classList.contains("ord-down")) { const next = li.nextElementSibling; if (next) { ol.insertBefore(next, li); box.dataset.touched = "1" } }
  });
}

export function gradeOrder(root, q, i, name) {
  const box = root.querySelector(`.q[data-i="${i}"]`);
  const ol = box.querySelector(".order-list");
  const cur = [...ol.querySelectorAll("li")].map(li => +li.dataset.k);
  const answered = box.dataset.touched === "1";
  let correct = 0;
  cur.forEach((displayIdx, pos) => { if (displayIdx === q.ans[pos]) correct++ });
  const ok = cur.length === q.ans.length && correct === q.ans.length;
  cur.forEach((displayIdx, pos) => {
    const li = ol.children[pos];
    li.classList.remove("right", "wrong");
    li.classList.add(displayIdx === q.ans[pos] ? "right" : "wrong");
  });
  ol.querySelectorAll("button").forEach(b => b.disabled = true);
  return { ok, answered, score: q.ans.length ? correct / q.ans.length : 0 };
}
