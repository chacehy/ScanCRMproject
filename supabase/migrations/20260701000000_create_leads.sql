-- Inferred from application code (web/app/page.tsx, app/src/app/index.tsx, app/src/app/explore.tsx).
-- This has NOT been verified against the live Supabase project's actual schema/RLS policies.
-- Reconcile it before relying on it: `supabase link --project-ref gbxemgfdegzaglsrhawa`
-- then `supabase db pull` to diff this file against what's really deployed.

create table if not exists public.leads (
  id text primary key,
  type text not null,
  customer_name text not null,
  customer_phone text,
  customer_email text,
  status text not null default 'new' check (status in ('new', 'followed_up', 'hot', 'archived')),
  notes text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  user_id uuid not null references auth.users(id) on delete cascade
);

alter table public.leads enable row level security;

create policy "Users can view their own leads"
  on public.leads for select
  using (auth.uid() = user_id);

create policy "Users can insert their own leads"
  on public.leads for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own leads"
  on public.leads for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own leads"
  on public.leads for delete
  using (auth.uid() = user_id);

create index if not exists leads_user_id_idx on public.leads (user_id);
create index if not exists leads_created_at_idx on public.leads (created_at desc);
