import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
}

// Toutes les tables à vider (sauf backups, audit_logs)
const ALL_TABLES = [
  // Tables principales
  'gallery_images',
  'videos',
  'events',
  'announcements',
  'homilies',
  'prayer_intentions',
  'daily_verses',
  'tutoriels',
  'advertisements',        // page /affiche
  'directory',             // page /directory
  'live_streams',          // page /admin/live
  'live_stats',
  'live_stream_sources',
  'user_activities',
  'user_suspensions',
  'admin_users',
  'messages',
  'chat_rooms',
  'chat_room_members',
  'chat_messages',
  'playlists',
  'playlist_items',
  'posts',
  'shares',
  'mass_schedules',
  'mass_intentions',
  'media_files',
  'content_reports',
  'content_approvals',
  'likes',
  'favorites',
  'comments',
  'notifications',
  'otp_codes',
  // Tables de config et contenus dynamiques
  'header_config',
  'footer_config',
  'page_hero_banners',
  'homepage_sections',
  'about_page_sections',
  'donations',
  'receipts',
  'campaigns',
  // Tables de docs et cartes
  'documents',
  'certificates',
  'member_cards',
  'document_settings'
]

// Buckets à vider
const ALL_BUCKETS = [
  'gallery', 'videos', 'logos', 'banners', 
  'avatars', 'documents', 'paroisses',
  'video-files', 'directory-images', 'paroisse-files'
]

Deno.serve(async (req) => {
  // Gérer CORS pour OPTIONS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  const startedAt = new Date().toISOString()

  try {
    // Récupération robuste du body
    let bodyData = {}
    try {
      const bodyText = await req.text()
      if (bodyText && bodyText.trim() !== '') {
        bodyData = JSON.parse(bodyText)
      }
    } catch (parseError) {
      console.warn("[factory-reset] Erreur parsing JSON, valeurs par défaut")
    }

    const { 
      dryRun = false, 
      keepSuperAdmin = true, 
      superAdminEmail = null,
      deleteAllUsers = false,
      skipBackup = false,
      launchSetupWizard = true
    } = bodyData

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    )

    const { data: { user } } = await supabase.auth.getUser()

    const results = {
      backup: null as any,
      db: {} as Record<string, number>,
      buckets: {} as Record<string, number>,
      profiles: { kept: 0, deleted: 0 }
    }

    // ÉTAPE 1 : SAUVEGARDE
    if (!dryRun && !skipBackup) {
      try {
        console.log("[factory-reset] Création d'une sauvegarde...")
        const backupResponse = await fetch(
          `${Deno.env.get("SUPABASE_URL")}/functions/v1/backup-full`,
          {
            method: 'POST',
            headers: { 
              Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
              'Content-Type': 'application/json'
            }
          }
        )
        results.backup = await backupResponse.json()
      } catch (backupError) {
        console.error("[factory-reset] Erreur sauvegarde:", backupError)
      }
    }

    // ÉTAPE 2 : VIDER TOUTES LES TABLES
    if (!dryRun) {
      console.log("[factory-reset] Nettoyage des tables...")
      
      for (const table of ALL_TABLES) {
        try {
          const { error, count } = await supabase
            .from(table)
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000')
            .select('*', { count: 'exact', head: true })
          
          if (!error) {
            results.db[table] = count || 0
            console.log(`[factory-reset] Table ${table} vidée (${results.db[table]} lignes)`)
          }
        } catch (e) {
          console.warn(`[factory-reset] Erreur sur table ${table}:`, e)
        }
      }
    }

    // ÉTAPE 3 : VIDER LES BUCKETS
    if (!dryRun) {
      console.log("[factory-reset] Nettoyage des buckets...")
      
      for (const bucket of ALL_BUCKETS) {
        try {
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
              console.log(`[factory-reset] Bucket ${bucket}: ${filesToDelete.length} fichiers supprimés`)
            }
          }
        } catch (bucketError) {
          console.error(`[factory-reset] Erreur bucket ${bucket}:`, bucketError)
        }
      }
    }

    // ÉTAPE 4 : GÉRER LES PROFILS (garder super_admin)
    if (!dryRun) {
      console.log("[factory-reset] Gestion des profils...")
      
      if (keepSuperAdmin || deleteAllUsers) {
        const { data: profiles, error: listError } = await supabase
          .from('profiles')
          .select('id, email, role')
        
        if (!listError && profiles) {
          const keepEmail = keepSuperAdmin && superAdminEmail
            ? superAdminEmail.toLowerCase().trim()
            : null
          for (const profile of profiles) {
            const isSuperAdmin = profile.role === 'super_admin'
            const matchesEmail = keepEmail && profile.email?.toLowerCase() === keepEmail
            const shouldKeep = keepSuperAdmin
              ? isSuperAdmin || matchesEmail
              : !deleteAllUsers && profile.id === user?.id
            
            if (shouldKeep) {
              results.profiles.kept++
            } else {
              try {
                await supabase.from('profiles').delete().eq('id', profile.id)
                results.profiles.deleted++
              } catch (e) {
                console.warn(`[factory-reset] Erreur suppression profil ${profile.id}:`, e)
              }
            }
          }
        }
      } else if (user) {
        await supabase.from('profiles').delete().neq('id', user.id)
        results.profiles.kept = 1
      }
    }

    const finishedAt = new Date().toISOString()

    // ÉTAPE 5 : JOURNALISER
    try {
      await supabase
        .from("audit_logs")
        .insert({
          action: "factory_reset",
          performed_by: user?.id ?? null,
          metadata: { 
            dryRun, 
            keepSuperAdmin,
            superAdminEmail,
            deleteAllUsers,
            launchSetupWizard,
            startedAt, 
            finishedAt,
            results 
          },
        })
    } catch (e) {
      console.warn("[factory-reset] audit logging failed", e)
    }

    const responseBody = {
      success: true,
      dryRun,
      startedAt,
      finishedAt,
      launchSetupWizard: launchSetupWizard && !dryRun,
      message: dryRun 
        ? "Simulation terminée. Aucune donnée n'a été supprimée."
        : "Factory reset terminé. Le site est vierge.",
      results
    }

    return new Response(JSON.stringify(responseBody), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })

  } catch (error: any) {
    console.error("[factory-reset] Unexpected error", error)
    return new Response(
      JSON.stringify({ 
        error: error?.message ?? "Unknown error",
        startedAt 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    )
  }
})