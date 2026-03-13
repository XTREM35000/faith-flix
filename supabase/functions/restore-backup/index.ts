import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

Deno.serve(async (req) => {
  // Gérer CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const { backupId } = await req.json()

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    )

    // 1. Récupérer la sauvegarde
    const { data: backup, error } = await supabase
      .from("backups")
      .select("*")
      .eq("id", backupId)
      .single()

    if (error || !backup) {
      return new Response(
        JSON.stringify({ error: "Sauvegarde introuvable" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const data = backup.data

    // 2. Restaurer les tables (dans l'ordre)
    if (data.homepage_sections) {
      await supabase.from("homepage_sections").delete().neq("id", "00000000-0000-0000-0000-000000000000")
      await supabase.from("homepage_sections").insert(data.homepage_sections)
    }

    if (data.header_config) {
      await supabase.from("header_config").delete().neq("id", "00000000-0000-0000-0000-000000000000")
      await supabase.from("header_config").insert(data.header_config)
    }

    if (data.page_hero_banners) {
      await supabase.from("page_hero_banners").delete().neq("id", "00000000-0000-0000-0000-000000000000")
      await supabase.from("page_hero_banners").insert(data.page_hero_banners)
    }

    // 3. Journaliser (optionnel mais recommandé)
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from("audit_logs").insert({
      action: "restore_backup",
      backup_id: backupId,
      performed_by: user?.id
    })

    return new Response(
      JSON.stringify({ success: true, message: "Restauration réussie" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})