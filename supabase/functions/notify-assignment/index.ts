// Edge Function: отправляет абитуриентам e-mail "вам назначен курс" через Gmail SMTP.
// Деплой: Supabase Dashboard -> Edge Functions -> New function -> вставить этот код.
// Секреты функции (Dashboard -> Edge Functions -> Secrets): SMTP_USERNAME, SMTP_PASSWORD
// (Gmail App Password), SMTP_FROM (обычно совпадает с SMTP_USERNAME). Опционально:
// SMTP_HOSTNAME (по умолчанию smtp.gmail.com), SMTP_PORT (по умолчанию 465).
// SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY подставляются автоматически.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import nodemailer from "npm:nodemailer@^9";

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
    const smtpUser = Deno.env.get("SMTP_USERNAME");
    const smtpPass = Deno.env.get("SMTP_PASSWORD");
    const fromEmail = Deno.env.get("SMTP_FROM") || smtpUser || "";
    if (!smtpUser || !smtpPass) {
      return new Response(JSON.stringify({ error: "SMTP не настроен в секретах функции" }), { status: 500, headers: corsHeaders });
    }
    const transport = nodemailer.createTransport({
      host: Deno.env.get("SMTP_HOSTNAME") || "smtp.gmail.com",
      port: Number(Deno.env.get("SMTP_PORT") || 465),
      secure: true,
      auth: { user: smtpUser, pass: smtpPass },
    });

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
        await transport.sendMail({ from: fromEmail, to: t.email, subject, html });
        results.push({ uid: t.id, email: t.email, ok: true, status: 200 });
      } catch (e) {
        console.error("smtp error", e);
        results.push({ uid: t.id, email: t.email, ok: false, reason: String(e) });
      }
    }
    return new Response(JSON.stringify({ results }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: corsHeaders });
  }
});
