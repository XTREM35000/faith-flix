import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

// Tables créées par BackupRestore (format plat) -> mapping vers backup-full
const FLAT_TABLE_KEYS = ["homepage_sections", "header_config", "page_hero_banners"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })

  try {
    let body: { backupId?: string; restoreBuckets?: boolean; restoreDb?: boolean } = {}
    try {
      const text = await req.text()
      if (text && text.trim()) body = JSON.parse(text)
    } catch {
      throw new Error("Body JSON invalide")
    }

    const { backupId, restoreBuckets = true, restoreDb = true } = body
    if (!backupId) throw new Error("backupId requis")

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    )

    // 1. Récupérer la sauvegarde
    const { data: backup, error } = await supabase
      .from('backups')
      .select('*')
      .eq('id', backupId)
      .single()

    if (error || !backup) throw new Error("Sauvegarde introuvable")

    const results = {
      db: {} as Record<string, number>,
      buckets: {} as Record<string, number>
    }

    // Déterminer le format des données (backup-full: data.db, ou BackupRestore: data plat)
    let dbData: Record<string, any> = {}
    if (backup.data?.db && typeof backup.data.db === "object") {
      dbData = backup.data.db
    } else if (backup.data && typeof backup.data === "object") {
      for (const key of FLAT_TABLE_KEYS) {
        if (Array.isArray(backup.data[key])) dbData[key] = backup.data[key]
      }
    }

    // 2. Restaurer la base de données
    if (restoreDb && Object.keys(dbData).length > 0) {
      for (const [table, rows] of Object.entries(dbData)) {
        try {
          // Vider la table (delete all)
          const { error: delErr } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000')
          if (delErr) {
            // Fallback: certains schémas n'ont pas 'id' ou filtrent autrement
            const { data: all } = await supabase.from(table).select('id')
            if (all && all.length > 0) {
              for (const row of all) {
                if (row?.id) await supabase.from(table).delete().eq('id', row.id)
              }
            }
          }
        } catch (e) {
          console.warn(`[restore-full] delete ${table}:`, e)
        }

        if (Array.isArray(rows) && rows.length > 0) {
          try {
            const { data: inserted, error: insErr } = await supabase.from(table).insert(rows).select()
            if (insErr) {
              console.error(`[restore-full] insert ${table}:`, insErr)
              results.db[table] = 0
            } else {
              results.db[table] = inserted?.length ?? rows.length
            }
          } catch (e) {
            console.error(`[restore-full] insert ${table}:`, e)
            results.db[table] = 0
          }
        }
      }
    }

    // 3. Restaurer les buckets (vide les fichiers existants)
    if (restoreBuckets && backup.data?.buckets && typeof backup.data.buckets === "object") {
      const bucketsData = backup.data.buckets as Record<string, any[]>
      for (const [bucket, files] of Object.entries(bucketsData)) {
        try {
          const { data: currentFiles } = await supabase.storage.from(bucket).list('', { limit: 1000 })
          if (currentFiles && currentFiles.length > 0) {
            const toRemove = currentFiles.map(f => f.name)
            await supabase.storage.from(bucket).remove(toRemove)
          }
          results.buckets[bucket] = Array.isArray(files) ? files.length : 0
        } catch (e) {
          console.warn(`[restore-full] bucket ${bucket}:`, e)
          results.buckets[bucket] = 0
        }
      }
    }

    // 4. Journaliser (ne pas faire échouer la requête si la table n'existe pas)
    try {
      const authHeader = req.headers.get("Authorization")
      let performedBy: string | null = null
      if (authHeader?.startsWith("Bearer ")) {
        const token = authHeader.slice(7)
        const { data: { user } } = await supabase.auth.getUser(token)
        performedBy = user?.id ?? null
      }

      await supabase.from('audit_logs').insert({
        action: 'restore_full',
        performed_by: performedBy,
        metadata: { backupId, ...results }
      })
    } catch (e) {
      console.warn("[restore-full] audit_logs insert:", e)
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Restauration terminée",
        results
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )

  } catch (error: any) {
    console.error("[restore-full] Error:", error)
    return new Response(
      JSON.stringify({ error: error?.message ?? "Erreur inconnue" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})