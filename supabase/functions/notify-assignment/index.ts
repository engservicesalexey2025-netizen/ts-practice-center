// Edge Function: отправляет абитуриентам e-mail "вам назначен курс" через Resend.
// Деплой: Supabase Dashboard -> Edge Functions -> New function -> вставить этот код.
// Секреты функции (Dashboard -> Edge Functions -> Secrets): RESEND_API_KEY (обязателен),
// NOTIFY_FROM_EMAIL (опционально, иначе используется onboarding@resend.dev).
// SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY подставляются автоматически.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  try {
    const { uids, category, siteUrl, kind } = await req.json();
    if (!Array.isArray(uids) || !uids.length || !category) {
      return new Response(JSON.stringify({ error: "uids и category обязательны" }), { status: 400, headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const resendKey = Deno.env.get("RESEND_API_KEY");
    const fromEmail = Deno.env.get("NOTIFY_FROM_EMAIL") || "onboarding@resend.dev";
    if (!resendKey) {
      return new Response(JSON.stringify({ error: "RESEND_API_KEY не настроен в секретах функции" }), { status: 500, headers: corsHeaders });
    }

    const authHeader = req.headers.get("Authorization") || "";
    const callerClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: userData } = await callerClient.auth.getUser();
    if (!userData || !userData.user) {
      return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: callerProfile } = await admin.from("profiles").select("role").eq("id", userData.user.id).maybeSingle();
    if (!callerProfile || !["owner", "mentor"].includes(callerProfile.role)) {
      return new Response(JSON.stringify({ error: "forbidden: нужна роль наставника" }), { status: 403, headers: corsHeaders });
    }

    const { data: targets, error: tErr } = await admin.from("profiles").select("id,email").in("id", uids);
    if (tErr) return new Response(JSON.stringify({ error: tErr.message }), { status: 500, headers: corsHeaders });

    const results = [];
    for (const t of targets || []) {
      if (!t.email) { results.push({ uid: t.id, ok: false, reason: "нет e-mail" }); continue }
      const isRemind = kind === "remind";
      const subject = isRemind
        ? `Напоминание: пройдите аттестацию «${category}»`
        : `Вам назначено прохождение курса — раздел «${category}»`;
      const html = isRemind
        ? `<p>Здравствуйте!</p><p>Напоминаем, что вы ещё не прошли итоговую аттестацию «<b>${category}</b>».</p><p>Перейдите на сайт обучения и пройдите её: <a href="${siteUrl}">${siteUrl}</a></p>`
        : `<p>Здравствуйте!</p><p>Вам назначено прохождение курса и аттестация по разделу «<b>${category}</b>».</p><p>Перейдите на сайт обучения: <a href="${siteUrl}">${siteUrl}</a></p>`;
      try {
        const r = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({ from: fromEmail, to: t.email, subject, html })
        });
        let body = "";
        try { body = await r.text(); } catch (_) {}
        if (!r.ok) console.error("resend error", r.status, body);
        results.push({ uid: t.id, email: t.email, ok: r.ok, status: r.status, body });
      } catch (e) {
        results.push({ uid: t.id, email: t.email, ok: false, reason: String(e) });
      }
    }
    return new Response(JSON.stringify({ results }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: corsHeaders });
  }
});
