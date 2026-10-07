// Импорт наполненных материалов наставника из data-export/ в Supabase.
// Запуск: npm run import   (нужен .env с SUPABASE_SERVICE_ROLE_KEY и VITE_SUPABASE_URL)
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, extname } from "node:path";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Нужны VITE_SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY в .env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
const ROOT = join(process.cwd(), "data-export");

function walk(dir) {
  let out = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out = out.concat(walk(full));
    else out.push(full);
  }
  return out;
}

function skip(path) {
  return path.startsWith("trainees/") || path.startsWith("cms/main/access/");
}

async function importDocs() {
  const files = walk(ROOT).filter(f => extname(f) === ".json");
  for (const file of files) {
    const rel = relative(ROOT, file).split("\\").join("/"); // windows-safe
    const path = rel.replace(/\.json$/, "");
    if (skip(path)) { console.log("пропуск (тестовые данные):", path); continue }
    const data = JSON.parse(readFileSync(file, "utf8"));
    const { error } = await supabase.from("docs").upsert({ path, data }, { onConflict: "path" });
    if (error) console.error("ошибка", path, error.message);
    else console.log("docs:", path);
  }
}

async function importAssets() {
  const dir = join(ROOT, "assets");
  let files = [];
  try { files = readdirSync(dir) } catch { return }
  for (const name of files) {
    const id = name.replace(/\.[^.]+$/, "");
    const full = join(dir, name);
    const bytes = readFileSync(full);
    const ext = extname(name).toLowerCase();
    const contentType = ext === ".png" ? "image/png" : "image/jpeg";
    const { error } = await supabase.storage.from("assets").upload(id, bytes, { contentType, upsert: true });
    if (error) console.error("ошибка фото", name, error.message);
    else console.log("asset:", id);
  }
}

await importDocs();
await importAssets();
console.log("Готово.");
