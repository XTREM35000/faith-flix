-- Fix signup 500: auth.users trigger referenced non-existent columns (user_metadata/raw_user_meta)
-- Keep logic compatible with current Supabase auth.users schema.

create or replace function public.handle_auth_user_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_paroisse_id uuid;
  v_role text := 'membre';
  v_count bigint;
  v_requested_role text;
begin
  v_paroisse_id := null;
  if (coalesce(new.raw_user_meta_data, '{}'::jsonb)->>'paroisse_id') is not null
     and (coalesce(new.raw_user_meta_data, '{}'::jsonb)->>'paroisse_id') != '' then
    begin
      v_paroisse_id := (coalesce(new.raw_user_meta_data, '{}'::jsonb)->>'paroisse_id')::uuid;
    exception when others then
      v_paroisse_id := null;
    end;
  end if;

  v_requested_role := lower(coalesce(new.raw_user_meta_data->>'role', ''));
  if v_requested_role = 'super_admin' then
    v_role := 'super_admin';
  elsif v_paroisse_id is not null then
    select count(*) into v_count
    from public.profiles
    where paroisse_id = v_paroisse_id;
    if v_count = 0 then
      v_role := 'super_admin';
    end if;
  else
    select count(*) into v_count from public.profiles;
    if v_count = 0 then
      v_role := 'super_admin';
    end if;
  end if;

  begin
    insert into public.profiles (id, email, full_name, avatar_url, role, paroisse_id, created_at, updated_at)
    values (
      new.id,
      coalesce(new.email, ''),
      coalesce(new.raw_user_meta_data->>'full_name', split_part(coalesce(new.email, ''), '@', 1), 'Utilisateur'),
      coalesce(new.raw_user_meta_data->>'avatar_url', null),
      v_role,
      v_paroisse_id,
      now(),
      now()
    )
    on conflict (id) do update set updated_at = now();
  exception when others then
    raise notice 'handle_auth_user_created: failed for user %: %', new.id, sqlerrm;
  end;

  return new;
end;
$$;
