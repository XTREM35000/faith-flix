import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

// Tables non essentielles (contenu)
const CONTENT_TABLES = [
  'gallery_images',
  'videos',
  'events',
  'announcements',
  'homilies',
  'prayer_intentions',
  'daily_verses',
  'tutoriels',
  'advertisements',
  'chat_messages',
  'notifications',
  'comments',
  'donations',
  'receipts',
  'campaigns'
]

// Tables de configuration (optionnel)
const CONFIG_TABLES = [
  'header_config',
  'footer_config',
  'page_hero_banners',
  'homepage_sections'
]

// Buckets à vider
const BUCKETS = ['gallery', 'videos', 'logos', 'banners']

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })

  try {
    const { shouldResetConfig = false, createBackup = true } = await req.json()
    
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    )

    const results = {
      db: {} as Record<string, number>,
      buckets: {} as Record<string, number>
    }

    // 1. Créer une sauvegarde si demandé
    if (createBackup) {
      // Appeler la fonction de backup
      await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/backup-full`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}` }
      })
    }

    // 2. Vider les tables de contenu
    for (const table of CONTENT_TABLES) {
      const { count, error } = await supabase
        .from(table)
        .delete({ count: 'exact' })
        .neq('id', '00000000-0000-0000-0000-000000000000')
      
      if (!error) {
        results.db[table] = count || 0
      }
    }

    // 3. Réinitialiser la configuration si demandé
    if (shouldResetConfig) {
      for (const table of CONFIG_TABLES) {
        const { count, error } = await supabase
          .from(table)
          .delete({ count: 'exact' })
          .neq('id', '00000000-0000-0000-0000-000000000000')
        
        if (!error) {
          results.db[table] = (results.db[table] || 0) + (count || 0)
        }
      }
    }

    // 4. Vider les buckets
    for (const bucket of BUCKETS) {
      const { data: files, error: listError } = await supabase.storage
        .from(bucket)
        .list('', { limit: 1000 })
      
      if (!listError && files && files.length > 0) {
        const filesToDelete = files.map(f => f.name)
        const { error: deleteError } = await supabase.storage
          .from(bucket)
          .remove(filesToDelete)
        
        if (!deleteError) {
          results.buckets[bucket] = filesToDelete.length
        }
      }
    }

    // 5. Journaliser
    await supabase.from('audit_logs').insert({
      action: 'cleanup_full',
      metadata: results,
      performed_by: (await supabase.auth.getUser()).data.user?.id
    })

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Nettoyage terminé",
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