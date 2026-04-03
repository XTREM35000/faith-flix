# Supabase Scheduled Edge Functions: live-scheduler & replay-worker

This folder contains production-ready Supabase Edge Functions used to:

- `live-scheduler` — call `SELECT public.activate_scheduled_live()` every minute.
- `replay-worker` — call `SELECT public.process_replay_queue(p_limit)` every N minutes (default 5).
- `feast-reminders` — call `SELECT public.process_feast_reminders()` once per day (rappels J-7 / J-3 / J-1 pour les fêtes religieuses).

Both functions:

- use the Supabase Service Role key (`SUPABASE_SERVICE_ROLE_KEY`) for RPC operations
- optionally protect execution with a header secret `x-cron-secret` that must match env `CRON_SECRET` (recommended)
- return JSON `{ success: true }` (and additional metadata)

---

## Environment variables (set as project secrets)

- `SUPABASE_URL` (automatic in Supabase env)
- `SUPABASE_SERVICE_ROLE_KEY` (required)
- `CRON_SECRET` (optional but recommended)

Set them with the CLI:

```bash
# Set service role key (required)
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="<service-role-key>" --project-ref <PROJECT_REF>

# Set cron secret (recommended)
supabase secrets set CRON_SECRET="<a-strong-secret>" --project-ref <PROJECT_REF>
```

---

## Deploy functions

```bash
# Build & deploy each function
supabase functions deploy live-scheduler --project-ref <PROJECT_REF>
supabase functions deploy replay-worker --project-ref <PROJECT_REF>
supabase functions deploy feast-reminders --project-ref <PROJECT_REF>
```

> Use `--no-verify` if your environment requires it, or omit for normal deploy.

## Configure schedule (two options)

Option A — via `supabase.json` (recommended for infra-as-code):

Add to your `supabase.json`:

```json
{
  "functions": {
    "live-scheduler": { "enabled": true, "cron": "*/1 * * * *" },
    "replay-worker": { "enabled": true, "cron": "*/5 * * * *" },
    "feast-reminders": { "enabled": true, "cron": "0 6 * * *" }
  }
}
```

Then deploy the project (this will register the schedules):

```bash
supabase deploy --project-ref <PROJECT_REF>
```

Option B — via Supabase Dashboard:

- Open Project → Edge Functions → select function → Settings → Schedule → create new cron rule
- Add header `x-cron-secret: <your-secret>` if you use `CRON_SECRET`.

---

## Quick test (curl)

```bash
# If CRON_SECRET is set:
curl -X POST -H "x-cron-secret: <your-secret>" https://<project-ref>.functions.supabase.co/live-scheduler

# Without secret (only if CRON_SECRET not set):
curl -X POST https://<project-ref>.functions.supabase.co/live-scheduler
```

Expected JSON response: `{ "success": true }` (and extra metadata on `data` or `inserted`).

---

## Logs & troubleshooting

- View live logs

```bash
supabase functions logs live-scheduler --project-ref <PROJECT_REF>
```

- Check function invocation and RPC errors; ensure `SUPABASE_SERVICE_ROLE_KEY` is set and has sufficient privileges.

---

## Notes & best practices

- Keep `CRON_SECRET` strong and rotate periodically.
- Monitor execution time & errors; if `process_replay_queue` needs more time, increase `p_limit` or lower frequency.
- Respect RLS: these functions use the Service Role key and should be managed as sensitive server-side secrets only.

---

If you want, I can also add an example scheduled job definition or a small health-check endpoint to both functions.
