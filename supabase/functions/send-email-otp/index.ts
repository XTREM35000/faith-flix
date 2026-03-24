import { Resend } from "https://esm.sh/resend";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

async function sha256Hex(input: string) {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function generateOtp4() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });

  const requestId = crypto.randomUUID().slice(0, 8);
  try {
    if (req.method !== "POST") return jsonResponse({ error: "Méthode non autorisée" }, 405);

    const { email, user_id } = await req.json().catch(() => ({}));
    if (!email || typeof email !== "string") return jsonResponse({ error: "email requis" }, 400);

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const otp = generateOtp4();
    const code_hash = await sha256Hex(otp);
    const expires_at = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const { error: upsertError } = await supabaseAdmin.from("email_otps").upsert({
      email: email.toLowerCase().trim(),
      user_id: typeof user_id === "string" ? user_id : null,
      code_hash,
      expires_at,
      attempts: 0,
    });
    if (upsertError) {
      console.error(`[${requestId}] email_otps upsert error`, upsertError);
      return jsonResponse({ error: "Impossible de générer le code" }, 500);
    }

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) return jsonResponse({ error: "RESEND_API_KEY manquant" }, 500);

    const resend = new Resend(resendKey);
    const from = Deno.env.get("RESEND_FROM_EMAIL") || "don@paroisse.org";

    const subject = "Votre code de confirmation (OTP)";
    const html = `
      <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial; line-height: 1.5;">
        <h2 style="margin:0 0 12px 0;">Code de confirmation</h2>
        <p style="margin:0 0 12px 0;">Voici votre code OTP à 4 chiffres :</p>
        <div style="font-size: 32px; letter-spacing: 6px; font-weight: 700; padding: 12px 16px; display:inline-block; border: 1px solid #e5e7eb; border-radius: 10px; background:#f9fafb;">
          ${otp}
        </div>
        <p style="margin:12px 0 0 0; color:#6b7280; font-size: 12px;">
          Ce code expire dans 10 minutes. Si vous n’êtes pas à l’origine de cette demande, ignorez ce message.
        </p>
      </div>
    `;

    const { error: sendError } = await resend.emails.send({
      from,
      to: email,
      subject,
      html,
    });

    if (sendError) {
      console.error(`[${requestId}] resend error`, sendError);
      return jsonResponse({ error: "Échec de l'envoi de l'email" }, 502);
    }

    return jsonResponse({ success: true, requestId });
  } catch (error: any) {
    console.error(`[${requestId}] send-email-otp error`, error);
    return jsonResponse({ error: "Erreur serveur", details: error?.message }, 500);
  }
});

