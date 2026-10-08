// Edge Function: отправляет абитуриентам e-mail "вам назначен курс" через Resend.
// Деплой: Supabase Dashboard -> Edge Functions -> New function -> вставить этот код.
// Секреты функции (Dashboard -> Edge Functions -> Secrets): RESEND_API_KEY (обязателен),
// NOTIFY_FROM_EMAIL (опционально, иначе используется onboarding@resend.dev).
// SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY подставляются автоматически.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

Deno.serve(async (req) => {
  try {
    const { uids, category, siteUrl } = await req.json();
    if (!Array.isArray(uids) || !uids.length || !category) {
      return new Response(JSON.stringify({ error: "uids и category обязательны" }), { status: 400 });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const resendKey = Deno.env.get("RESEND_API_KEY");
    const fromEmail = Deno.env.get("NOTIFY_FROM_EMAIL") || "onboarding@resend.dev";
    if (!resendKey) {
      return new Response(JSON.stringify({ error: "RESEND_API_KEY не настроен в секретах функции" }), { status: 500 });
    }

    const authHeader = req.headers.get("Authorization") || "";
    const callerClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: userData } = await callerClient.auth.getUser();
    if (!userData || !userData.user) {
      return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });
    }

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: callerProfile } = await admin.from("profiles").select("role").eq("id", userData.user.id).maybeSingle();
    if (!callerProfile || !["owner", "mentor"].includes(callerProfile.role)) {
      return new Response(JSON.stringify({ error: "forbidden: нужна роль наставника" }), { status: 403 });
    }

    const { data: targets, error: tErr } = await admin.from("profiles").select("id,email").in("id", uids);
    if (tErr) return new Response(JSON.stringify({ error: tErr.message }), { status: 500 });

    const results = [];
    for (const t of targets || []) {
      if (!t.email) { results.push({ uid: t.id, ok: false, reason: "нет e-mail" }); continue }
      const subject = `Вам назначено прохождение курса — раздел «${category}»`;
      const html = `<p>Здравствуйте!</p><p>Вам назначено прохождение курса и аттестация по разделу «<b>${category}</b>».</p><p>Перейдите на сайт обучения: <a href="${siteUrl}">${siteUrl}</a></p>`;
      try {
        const r = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({ from: fromEmail, to: t.email, subject, html })
        });
        results.push({ uid: t.id, email: t.email, ok: r.ok, status: r.status });
      } catch (e) {
        results.push({ uid: t.id, email: t.email, ok: false, reason: String(e) });
      }
    }
    return new Response(JSON.stringify({ results }), { headers: { "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
});
