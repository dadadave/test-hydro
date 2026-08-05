-- ════════════════════════════════════════════════════════════════════
--  Module TEST FUITE (étanchéité) — schéma Supabase
--  À exécuter dans Supabase → SQL Editor.
-- ════════════════════════════════════════════════════════════════════

-- Session de contrôle (une par lot validé)
create table if not exists public.fuite_sessions (
  id          uuid primary key default gen_random_uuid(),
  machine     text,
  bottle_type text,
  methode     text,               -- IMMERSION | MOUSSE | CAPTEUR
  pression    text,
  duree       text,
  operateur   text,
  date        date,
  created_at  timestamptz not null default now()
);

-- Bouteilles contrôlées (rattachées à une session)
create table if not exists public.fuite_bouteilles (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid not null references public.fuite_sessions(id) on delete cascade,
  num_serie   text,
  etanche     boolean not null,   -- true = étanche, false = fuite
  created_at  timestamptz not null default now()
);

create index if not exists idx_fuite_bouteilles_session on public.fuite_bouteilles(session_id);
create index if not exists idx_fuite_sessions_date       on public.fuite_sessions(date);

-- ── Row Level Security ──
-- L'application utilise la clé publique "anon" ; on autorise lecture + insertion.
alter table public.fuite_sessions   enable row level security;
alter table public.fuite_bouteilles enable row level security;

drop policy if exists fuite_sessions_read   on public.fuite_sessions;
drop policy if exists fuite_sessions_insert on public.fuite_sessions;
drop policy if exists fuite_bouteilles_read   on public.fuite_bouteilles;
drop policy if exists fuite_bouteilles_insert on public.fuite_bouteilles;

create policy fuite_sessions_read     on public.fuite_sessions   for select using (true);
create policy fuite_sessions_insert   on public.fuite_sessions   for insert with check (true);
create policy fuite_bouteilles_read   on public.fuite_bouteilles for select using (true);
create policy fuite_bouteilles_insert on public.fuite_bouteilles for insert with check (true);
