/* xlsx (SheetJS) грузится динамически — только когда наставник реально загружает файл,
   чтобы не раздувать бандл для абитуриентов, которые этим не пользуются. */

/* Банк вопросов аттестации: парсинг .xlsx (лист = раздел, строки = вопросы)
   и загрузка/сохранение через единый документ cms/examBank:
   { [раздел]: [{q,a,b,c,d,correct,normDoc,point,reason}] } */

const LETTER_MAP = { "A": "A", "а": "A", "А": "A", "B": "B", "в": "B", "В": "B", "C": "C", "с": "C", "С": "C", "D": "D", "д": "D", "Д": "D" };
function normLetter(v) {
  const s = String(v || "").trim();
  return LETTER_MAP[s] || LETTER_MAP[s.toUpperCase()] || s.toUpperCase().slice(0, 1);
}

function parseSheet(XLSX, ws) {
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
  let headerIdx = -1, qCol = -1;
  for (let i = 0; i < Math.min(rows.length, 6); i++) {
    const idx = rows[i].findIndex(c => String(c).trim() === "Вопрос");
    if (idx >= 0) { headerIdx = i; qCol = idx; break }
  }
  if (headerIdx < 0) return [];
  const header = rows[headerIdx];
  const ansCol = qCol + 5;
  const metaCols = [];
  for (let c = ansCol + 1; c < header.length; c++) {
    if (String(header[c] || "").trim()) metaCols.push({ c, label: String(header[c]).trim() });
  }
  const out = [];
  for (let r = headerIdx + 1; r < rows.length; r++) {
    const row = rows[r];
    const q = String(row[qCol] || "").trim();
    if (!q) continue;
    const meta = {};
    metaCols.forEach(({ c, label }) => { const v = String(row[c] || "").trim(); if (v) meta[label] = v });
    out.push({
      q,
      a: String(row[qCol + 1] || "").trim(),
      b: String(row[qCol + 2] || "").trim(),
      c: String(row[qCol + 3] || "").trim(),
      d: String(row[qCol + 4] || "").trim(),
      correct: normLetter(row[ansCol]),
      meta
    });
  }
  return out.filter(x => x.a && x.b && x.c && x.d && ["A", "B", "C", "D"].includes(x.correct));
}

export async function parseWorkbook(file) {
  const XLSX = await import("xlsx");
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const bank = {};
  for (const name of wb.SheetNames) {
    const qs = parseSheet(XLSX, wb.Sheets[name]);
    if (qs.length) bank[name.trim()] = qs;
  }
  return bank;
}

export function pickRandom(bank, categories, n, rng) {
  const pool = categories.flatMap(cat => (bank[cat] || []).map(q => Object.assign({ cat }, q)));
  const shuffled = pool.map(q => [rng(), q]).sort((a, b) => a[0] - b[0]).map(x => x[1]);
  return shuffled.slice(0, n).map(q => {
    const letters = ["A", "B", "C", "D"];
    const opts = letters.map(l => q[l.toLowerCase()]);
    const order = letters.map((l, i) => [rng(), l, opts[i]]).sort((a, b) => a[0] - b[0]);
    const finalOpts = order.map(o => o[2]);
    const ansIdx = order.findIndex(o => o[1] === q.correct);
    return { q: q.q, opts: finalOpts, ans: ansIdx, cat: q.cat, meta: q.meta };
  });
}
