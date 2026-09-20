-- Pokémon Card AR
-- Optional backend foundation. The AR prototype works without Supabase.

create table if not exists public.ar_cards (
  id uuid primary key default gen_random_uuid(),
  card_key text unique not null,
  pokemon_id integer,
  pokemon_name text,
  target_path text,
  model_url text,
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.ar_scans (
  id uuid primary key default gen_random_uuid(),
  card_id uuid references public.ar_cards(id) on delete set null,
  pokemon_id integer,
  device_class text,
  browser text,
  found_at timestamptz not null default now()
);

alter table public.ar_cards enable row level security;
alter table public.ar_scans enable row level security;

-- Public card catalog: safe for a personal fan project.
create policy "public can read enabled AR cards"
on public.ar_cards
for select
to anon
using (enabled = true);

-- Scans are intentionally not writable from the public client yet.
-- Add a restricted RPC or authenticated policy later if telemetry is needed.
