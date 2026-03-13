import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
 
 const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    )

    // 1. Sauvegarder les données des tables essentielles
    const tables = [
      'homepage_sections',
      'header_config',
      'page_hero_banners',
      'footer_config',
      'profiles',
      'gallery_images',
      'videos',
      'events',
      'announcements',
      'homilies',
      'donations'
    ]

    const dbData: Record<string, any> = {}
    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
      if (!error) dbData[table] = data
    }

    // 2. Sauvegarder les métadonnées des buckets
    const buckets = ['gallery', 'videos', 'avatars', 'documents', 'logos', 'banners']
    const bucketsData: Record<string, any> = {}

    for (const bucket of buckets) {
      const { data: files, error } = await supabase.storage
        .from(bucket)
        .list('', { limit: 1000 })

      if (!error && files) {
        // Récupérer les URLs publiques
        const filesWithUrls = await Promise.all(
          files.map(async (file) => {
            const { data: urlData } = supabase.storage
              .from(bucket)
              .getPublicUrl(file.name)
            return {
              ...file,
              public_url: urlData.publicUrl
            }
          })
        )
        bucketsData[bucket] = filesWithUrls
      }
    }

    // 3. Créer l'entrée dans backups
    const payload = {
      db: dbData,
      buckets: bucketsData,
      timestamp: new Date().toISOString(),
      version: '1.0'
    }

    const size = new TextEncoder().encode(JSON.stringify(payload)).length

    const { data: backup, error: insertError } = await supabase
      .from('backups')
      .insert({
        name: `Sauvegarde complète - ${new Date().toLocaleString('fr-FR')}`,
        description: 'Sauvegarde automatique (DB + Buckets)',
        data: payload,
        size: size
      })
      .select()
      .single()

    if (insertError) throw insertError

    return new Response(
      JSON.stringify({ 
        success: true, 
        backup: backup,
        stats: {
          tables: Object.keys(dbData).length,
          buckets: Object.keys(bucketsData).length,
          total_files: Object.values(bucketsData).reduce((acc, files) => acc + files.length, 0),
          size: size
        }
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