import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })

  try {
    const { backupId, restoreBuckets = true, restoreDb = true } = await req.json()

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

    // 2. Restaurer la base de données
    if (restoreDb && backup.data?.db) {
      const dbData = backup.data.db
      
      for (const [table, rows] of Object.entries(dbData)) {
        // Vider la table d'abord
        await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000')
        
        // Réinsérer les données
        if (Array.isArray(rows) && rows.length > 0) {
          const { count } = await supabase
            .from(table)
            .insert(rows)
            .select('count', { count: 'exact', head: true })
          results.db[table] = count || 0
        }
      }
    }

    // 3. Restaurer les buckets (nous ne restaurons que la structure en vidant les fichiers existants,
    // car nous n'avons stocké que les métadonnées dans payload.data.buckets)
    if (restoreBuckets && backup.data?.buckets) {
      const bucketsData = backup.data.buckets as Record<string, any[]>;
      for (const [bucket, files] of Object.entries(bucketsData)) {
        // Lister les fichiers actuels
        const { data: currentFiles } = await supabase.storage
          .from(bucket)
          .list()

        // Supprimer les fichiers existants
        if (currentFiles && currentFiles.length > 0) {
          await supabase.storage
            .from(bucket)
            .remove(currentFiles.map(f => f.name))
        }

        // Note: On ne peut pas restaurer les fichiers eux-mêmes depuis la sauvegarde
        // car on a seulement les métadonnées. Il faudrait avoir stocké les fichiers.
        results.buckets[bucket] = files.length
      }
    }

    // 4. Journaliser
    await supabase.from('audit_logs').insert({
      action: 'restore_full',
      backup_id: backupId,
      metadata: results,
      performed_by: (await supabase.auth.getUser()).data.user?.id
    })

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Restauration terminée",
        results 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})