import { createClient } from "@supabase/supabase-js";

/* ============================================================
   Адаптер платформы: тот же интерфейс, что раньше давал
   window.claude.use(...) на claude.ai, но поверх Supabase.
   Контракт описан в CLAUDE.md -> "Контракт адаптера".
   ============================================================ */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

export const configured = !!(SUPABASE_URL && SUPABASE_ANON_KEY);

export const supabase = configured ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

export const blobUrl = id => id ? `${SUPABASE_URL}/storage/v1/object/public/assets/${id}` : "";

function wrapError(e) {
  if (!e) return { code: "unavailable" };
  const msg = e.message || String(e);
  if (e.name === "TypeError" || /network|fetch|failed to fetch/i.test(msg)) return { code: "unavailable", message: msg };
  return { code: "invalid_argument", message: msg };
}

function rowSnap(path, row) {
  const id = path.replace(/^.*\//, "");
  return { id, exists: !!row, data: () => (row ? JSON.parse(JSON.stringify(row.data)) : undefined) };
}

function doc(path) {
  const self = {
    async get() {
      const { data, error } = await supabase.from("docs").select("data").eq("path", path).maybeSingle();
      if (error) throw wrapError(error);
      return rowSnap(path, data);
    },
    async set(data) {
      const { error } = await supabase.from("docs").upsert({ path, data }, { onConflict: "path" });
      if (error) throw wrapError(error);
    },
    async update(patch) {
      const cur = await self.get();
      await self.set(Object.assign({}, cur.exists ? cur.data() : {}, patch));
    },
    async delete() {
      const { error } = await supabase.from("docs").delete().eq("path", path);
      if (error) throw wrapError(error);
    },
    onSnapshot(next, err) {
      let stopped = false;
      const pull = () => self.get().then(s => { if (!stopped) next(s) }).catch(e => err && err(wrapError(e)));
      pull();
      const channel = supabase
        .channel("doc:" + path)
        .on("postgres_changes", { event: "*", schema: "public", table: "docs", filter: `path=eq.${path}` }, pull)
        .subscribe();
      return () => { stopped = true; supabase.removeChannel(channel) };
    }
  };
  return self;
}

function collection(path) {
  let limitN = null;
  const self = {
    limit(n) { limitN = n; return self },
    async get() {
      let q = supabase.from("docs").select("path,data").eq("collection", path);
      if (limitN) q = q.limit(limitN);
      const { data, error } = await q;
      if (error) throw wrapError(error);
      const docs = (data || []).map(r => rowSnap(r.path, r));
      return { docs, size: docs.length, empty: docs.length === 0 };
    },
    onSnapshot(next, err) {
      let stopped = false;
      const pull = () => self.get().then(s => { if (!stopped) next(s) }).catch(e => err && err(wrapError(e)));
      pull();
      const channel = supabase
        .channel("col:" + path)
        .on("postgres_changes", { event: "*", schema: "public", table: "docs", filter: `collection=eq.${path}` }, pull)
        .subscribe();
      return () => { stopped = true; supabase.removeChannel(channel) };
    }
  };
  return self;
}

export const db = { doc, collection };

async function currentAuthUser() {
  const { data } = await supabase.auth.getUser();
  return data && data.user;
}

export const user = {
  id: async () => { const u = await currentAuthUser(); return u ? u.id : null },
  canEdit: async () => {
    const u = await currentAuthUser();
    if (!u) return false;
    const { data } = await supabase.from("profiles").select("role").eq("id", u.id).maybeSingle();
    return !!data && (data.role === "owner" || data.role === "mentor");
  }
};

function randomId() {
  return crypto.randomUUID().replace(/-/g, "");
}

export const assets = {
  async upload(blob) {
    const id = randomId();
    const { error } = await supabase.storage.from("assets").upload(id, blob, { contentType: blob.type || "image/jpeg", upsert: false });
    if (error) throw wrapError(error);
    return { id, url: blobUrl(id) };
  }
};

export const downloads = {
  async save({ filename, data }) {
    const blob = new Blob([data], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }
};

/* ---------- вход по e-mail (Supabase Auth) ---------- */

export function onAuthChange(cb) {
  if (!configured) { cb(null); return () => {} }
  supabase.auth.getSession().then(({ data }) => cb(data.session || null));
  const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => cb(session || null));
  return () => sub.subscription.unsubscribe();
}

export async function signOut() {
  await supabase.auth.signOut();
}

export function mountLoginScreen(container) {
  if (!configured) {
    container.innerHTML = `<div class="blk" style="max-width:520px;margin:40px auto">
      <h1 style="font-size:22px;margin-bottom:10px">Нужна настройка Supabase</h1>
      <p class="mut">Переменные <code>VITE_SUPABASE_URL</code> и <code>VITE_SUPABASE_ANON_KEY</code> не заданы в <code>.env</code>. Создайте проект на supabase.com, выполните <code>supabase/schema.sql</code> в SQL Editor и впишите ключи в <code>.env</code> (см. README-ЗАПУСК.md).</p></div>`;
    return;
  }
  let mode = "in"; // "in" | "up"
  const draw = (msg) => {
    container.innerHTML = `<div class="blk" style="max-width:420px;margin:40px auto">
      <h1 style="font-size:24px;margin-bottom:6px">Центр «Практика ТН»</h1>
      <p class="mut sm" style="margin-bottom:16px">${mode === "in" ? "Вход по e-mail" : "Регистрация"}</p>
      <div class="form">
        <label>E-mail<input class="inp" id="lgEmail" type="email" autocomplete="email"></label>
        <label>Пароль<input class="inp" id="lgPass" type="password" autocomplete="${mode === "in" ? "current-password" : "new-password"}"></label>
      </div>
      <div class="row" style="margin-top:16px">
        <button class="btn pri" id="lgGo">${mode === "in" ? "Войти" : "Зарегистрироваться"}</button>
      </div>
      <p class="sm" style="margin-top:14px">${mode === "in" ? `Нет аккаунта? <a href="#" id="lgSwitch">Зарегистрироваться</a>` : `Уже есть аккаунт? <a href="#" id="lgSwitch">Войти</a>`}</p>
      <div class="res hidden" id="lgMsg"></div>
    </div>`;
    const m = container.querySelector("#lgMsg");
    if (msg) { m.classList.remove("hidden"); m.textContent = msg }
    container.querySelector("#lgSwitch").onclick = (e) => { e.preventDefault(); mode = mode === "in" ? "up" : "in"; draw() };
    const go = async () => {
      const email = container.querySelector("#lgEmail").value.trim();
      const password = container.querySelector("#lgPass").value;
      if (!email || password.length < 6) { draw("Укажите e-mail и пароль не короче 6 символов."); return }
      m.classList.remove("hidden"); m.textContent = "Проверяю…";
      try {
        if (mode === "in") {
          const { error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) throw error;
        } else {
          const { error } = await supabase.auth.signUp({ email, password });
          if (error) throw error;
          draw("Готово. Если в проекте включено подтверждение e-mail — проверьте почту и перейдите по ссылке, затем войдите.");
          return;
        }
      } catch (e) {
        draw(e && e.message ? humanizeAuthError(e.message) : "Не удалось войти.");
      }
    };
    container.querySelector("#lgGo").onclick = go;
    container.querySelector("#lgPass").onkeydown = e => { if (e.key === "Enter") go() };
  };
  draw();
}

function humanizeAuthError(msg) {
  if (/invalid login credentials/i.test(msg)) return "Неверный e-mail или пароль.";
  if (/already registered/i.test(msg)) return "Этот e-mail уже зарегистрирован — войдите.";
  if (/password/i.test(msg) && /short|6/i.test(msg)) return "Пароль должен быть не короче 6 символов.";
  return msg;
}
