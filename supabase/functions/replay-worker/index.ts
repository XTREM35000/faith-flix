import { serve } from 'https://deno.land/std@0.131.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const CRON_SECRET = Deno.env.get('CRON_SECRET') ?? null;

serve(async (req: Request) => {
  try {
    // Minimal protection via header secret if provided
    if (CRON_SECRET) {
      const headerSecret = req.headers.get('x-cron-secret') || req.headers.get('x-supabase-cron-secret');
      if (!headerSecret || headerSecret !== CRON_SECRET) {
        console.warn('replay-worker: unauthorized invocation');
        return new Response(JSON.stringify({ success: false, error: 'unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
      }
    } else {
      console.warn('replay-worker: CRON_SECRET not set. Running without header protection.');
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error('replay-worker: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing');
      return new Response(JSON.stringify({ success: false, error: 'server misconfiguration' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

    // You can pass a limit parameter if you want to process in batches
    const p_limit = 20;
    const { data, error } = await supabase.rpc('process_replay_queue', { p_limit });

    if (error) {
      console.error('replay-worker: rpc error', error);
      return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    console.log('replay-worker: process_replay_queue executed', { inserted: data });
    return new Response(JSON.stringify({ success: true, inserted: data }), { headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('replay-worker: unexpected error', err);
    return new Response(JSON.stringify({ success: false, error: String(err) }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
});
