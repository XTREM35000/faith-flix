import { serve } from 'https://deno.land/std@0.131.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const CRON_SECRET = Deno.env.get('CRON_SECRET') ?? null;

serve(async (req: Request) => {
  try {
    if (CRON_SECRET) {
      const headerSecret = req.headers.get('x-cron-secret') || req.headers.get('x-supabase-cron-secret');
      if (!headerSecret || headerSecret !== CRON_SECRET) {
        console.warn('feast-reminders: unauthorized invocation');
        return new Response(JSON.stringify({ success: false, error: 'unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    } else {
      console.warn('feast-reminders: CRON_SECRET not set. Running without header protection.');
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error('feast-reminders: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing');
      return new Response(JSON.stringify({ success: false, error: 'server misconfiguration' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

    const { data, error } = await supabase.rpc('process_feast_reminders');

    if (error) {
      console.error('feast-reminders: rpc error', error);
      return new Response(JSON.stringify({ success: false, error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log('feast-reminders: process_feast_reminders', data);
    return new Response(JSON.stringify({ success: true, data }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('feast-reminders: unexpected error', err);
    return new Response(JSON.stringify({ success: false, error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
