

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });

type InviteBody = {
  email?: string;
  full_name?: string;
  role?: string;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });
  if (req.method !== "POST") return jsonResponse({ success: false, error: "Méthode non autorisée" }, 405);

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (!token) return jsonResponse({ success: false, error: "Utilisateur non authentifié" }, 401);

    const { data: callerData, error: callerError } = await supabaseAdmin.auth.getUser(token);
    if (callerError || !callerData.user) {
      return jsonResponse({ success: false, error: "Session invalide" }, 401);
    }

    const { data: callerProfile } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", callerData.user.id)
      .maybeSingle();

    const callerRole = String(callerProfile?.role ?? "").toLowerCase();
    if (!["admin", "super_admin", "developer"].includes(callerRole)) {
      return jsonResponse({ success: false, error: "Action non autorisée" }, 403);
    }

    const body = (await req.json().catch(() => ({}))) as InviteBody;
    const email = String(body.email ?? "").trim().toLowerCase();
    const fullName = String(body.full_name ?? "").trim();
    const role = String(body.role ?? "member").trim().toLowerCase() || "member";

    if (!email) return jsonResponse({ success: false, error: "Email requis" }, 400);

    const { data: existingUserData } = await (supabaseAdmin.auth.admin as any).getUserByEmail(email);
    if (existingUserData?.user) {
      return jsonResponse({ success: false, error: "Cet email est déjà utilisé", code: "EMAIL_EXISTS" }, 409);
    }

    const appUrl = String(Deno.env.get("INVITE_REDIRECT_URL") || Deno.env.get("SITE_URL") || "").replace(/\/+$/, "");
    const redirectTo = `${appUrl}/invite-confirmation?email=${encodeURIComponent(email)}`;

    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.generateLink({
      type: "invite",
      email,
      options: {
        redirectTo,
        data: {
          full_name: fullName,
          role,
          invited_by: callerData.user.id,
        },
      },
    });

    if (inviteError) {
      return jsonResponse({ success: false, error: inviteError.message }, 400);
    }

    const invitedUserId = inviteData?.user?.id ?? null;
    if (invitedUserId) {
      await supabaseAdmin.from("profiles").upsert(
        {
          id: invitedUserId,
          email,
          full_name: fullName || null,
          role,
          invited_by: callerData.user.id,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" },
      );
    }

    const actionLink = String(inviteData?.properties?.action_link ?? "");
    if (!actionLink) {
      return jsonResponse({ success: false, error: "Lien d'invitation introuvable" }, 500);
    }

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
      return jsonResponse({ success: false, error: "RESEND_API_KEY manquante" }, 500);
    }

    const resend = new Resend(resendKey);
    const from = Deno.env.get("INVITE_FROM_EMAIL") || "Paroisse <noreply@paroisse.org>";
    const subject = "Invitation a rejoindre la plateforme paroissiale";
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;line-height:1.5;color:#111827">
        <h2 style="margin-bottom:12px">Vous etes invite(e)</h2>
        <p>Bonjour ${fullName || ""},</p>
        <p>
          Vous avez ete invite a rejoindre la plateforme de votre paroisse.
          Cliquez sur le lien ci-dessous pour activer votre compte et definir votre mot de passe.
        </p>
        <p style="margin:24px 0">
          <a href="${actionLink}" style="background:#2563eb;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none">
            Activer mon compte
          </a>
        </p>
        <p style="font-size:12px;color:#6b7280">Si vous n'etes pas concerne(e), ignorez cet email.</p>
      </div>
    `;

    const { error: sendError } = await resend.emails.send({
      from,
      to: email,
      subject,
      html,
    });

    if (sendError) {
      return jsonResponse({ success: false, error: sendError.message }, 502);
    }

    return jsonResponse({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur serveur";
    return jsonResponse({ success: false, error: message }, 500);
  }
});

