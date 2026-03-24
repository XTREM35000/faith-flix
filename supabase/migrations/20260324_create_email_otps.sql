create table if not exists public.email_otps (
  email text primary key,
  user_id uuid null,
  code_hash text not null,
  attempts integer not null default 0,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

alter table public.email_otps enable row level security;

