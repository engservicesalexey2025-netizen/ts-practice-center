// Edge Function: наставник приглашает нового абитуриента по e-mail.
// Деплой: Supabase Dashboard -> Edge Functions -> New function -> вставить этот код
// (так же, как notify-assignment).
// Секреты функции (Dashboard -> Edge Functions -> Secrets): RESEND_API_KEY
// (уже настроен для notify-assignment — используется и здесь), NOTIFY_FROM_EMAIL
// (опционально). SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY
// подставляются автоматически.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

Deno.serve(async (req) => {
  try {
    const { email, fio, siteUrl } = await req.json();
    if (!email || !String(email).trim()) {
      return new Response(JSON.stringify({ error: "email обязателен" }), { status: 400 });
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

    const emailTrim = String(email).trim();
    let link = null;
    let mode = "invite";
    let genErr = null;
    {
      const r = await admin.auth.admin.generateLink({
        type: "invite",
        email: emailTrim,
        options: { redirectTo: siteUrl, data: fio ? { fio } : undefined }
      });
      link = r.data && r.data.properties && r.data.properties.action_link;
      genErr = r.error;
    }
    if (genErr) {
      // Уже зарегистрирован — отправим ссылку для входа вместо приглашения.
      mode = "magiclink";
      const r = await admin.auth.admin.generateLink({ type: "magiclink", email: emailTrim, options: { redirectTo: siteUrl } });
      link = r.data && r.data.properties && r.data.properties.action_link;
      if (r.error) return new Response(JSON.stringify({ error: r.error.message }), { status: 500 });
    }
    if (!link) return new Response(JSON.stringify({ error: "Не удалось сформировать ссылку приглашения." }), { status: 500 });

    const greet = fio ? String(fio).trim() : "";
    const subject = mode === "invite" ? "Приглашение в Центр «Практика ТН»" : "Ссылка для входа в Центр «Практика ТН»";
    const html = `<p>Здравствуйте${greet ? ", " + greet : ""}!</p>
      <p>${mode === "invite" ? "Вас пригласили пройти обучение в Центре «Практика ТН»." : "Вот ссылка для входа в Центр «Практика ТН»."}</p>
      <p><a href="${link}">${mode === "invite" ? "Принять приглашение и войти" : "Войти на сайт"}</a></p>
      <p>После входа заполните короткую анкету (ФИО, специальность, уровень) — после этого вы появитесь в журнале обучения.</p>`;

    try {
      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: fromEmail, to: emailTrim, subject, html })
      });
      return new Response(JSON.stringify({ ok: r.ok, status: r.status, mode }), { headers: { "Content-Type": "application/json" } });
    } catch (e) {
      return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
    }
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
});
