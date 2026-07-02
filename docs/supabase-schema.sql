-- PAQ Product Launch OS v0.4 Supabase schema
-- Run in Supabase SQL Editor. Review before production.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  avatar_url text,
  role text not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_role_check check (role in ('user', 'developer', 'admin'))
);

alter table public.profiles add column if not exists role text not null default 'user';
alter table public.profiles alter column role set default 'user';
update public.profiles set role = 'user' where role is null;
alter table public.profiles alter column role set not null;
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_role_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_role_check check (role in ('user', 'developer', 'admin'));
  end if;
end $$;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  category text,
  features text,
  cost numeric,
  target_price numeric,
  target_audience text,
  brand_style text,
  sales_channels jsonb not null default '[]'::jsonb,
  lifecycle_status text not null default 'idea',
  source text not null default 'manual',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_opened_at timestamptz,
  archived_at timestamptz
);

create table if not exists public.product_drafts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid references public.products(id) on delete cascade,
  draft_key text not null,
  form_data jsonb not null,
  current_step text,
  completion_percent numeric,
  autosaved_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.launch_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  report jsonb not null,
  provider text,
  model text,
  is_fallback boolean not null default false,
  validation_passed boolean not null default false,
  generated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.report_translations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  report_id uuid references public.launch_reports(id) on delete cascade,
  source_locale text not null,
  target_locale text not null,
  translation jsonb not null,
  provider text,
  model text,
  is_fallback boolean not null default false,
  validation_passed boolean not null default false,
  translated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workspace_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid references public.products(id) on delete cascade,
  event_type text not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists products_user_updated_idx on public.products(user_id, updated_at desc);
create index if not exists products_user_lifecycle_idx on public.products(user_id, lifecycle_status);
create index if not exists product_drafts_user_autosaved_idx on public.product_drafts(user_id, autosaved_at desc);
create index if not exists product_drafts_user_key_idx on public.product_drafts(user_id, draft_key);
create index if not exists launch_reports_user_product_created_idx on public.launch_reports(user_id, product_id, created_at desc);
create index if not exists report_translations_user_product_locale_idx on public.report_translations(user_id, product_id, target_locale);
create index if not exists workspace_events_user_created_idx on public.workspace_events(user_id, created_at desc);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'products_lifecycle_status_check'
      and conrelid = 'public.products'::regclass
  ) then
    alter table public.products
      add constraint products_lifecycle_status_check
      check (lifecycle_status in ('idea', 'research', 'positioning', 'packaging', 'listing', 'marketing', 'launched', 'optimizing', 'archived'));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'product_drafts_user_draft_key_unique'
      and conrelid = 'public.product_drafts'::regclass
  ) then
    alter table public.product_drafts
      add constraint product_drafts_user_draft_key_unique unique (user_id, draft_key);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'product_drafts_completion_percent_check'
      and conrelid = 'public.product_drafts'::regclass
  ) then
    alter table public.product_drafts
      add constraint product_drafts_completion_percent_check
      check (completion_percent is null or (completion_percent >= 0 and completion_percent <= 100));
  end if;
end $$;

alter table public.products add column if not exists encrypted_confidential_data jsonb;
alter table public.product_drafts add column if not exists encrypted_form_data jsonb;
alter table public.launch_reports add column if not exists encrypted_report jsonb;
alter table public.report_translations add column if not exists encrypted_translation jsonb;

comment on column public.product_drafts.form_data is 'Deprecated for sensitive draft contents after v0.4.5. Prefer encrypted_form_data.';
comment on column public.launch_reports.report is 'Deprecated for sensitive launch reports after v0.4.5. Prefer encrypted_report.';
comment on column public.report_translations.translation is 'Deprecated for sensitive translations after v0.4.5. Prefer encrypted_translation.';

create table if not exists public.export_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  report_type text not null,
  status text not null,
  format text not null,
  product_ids uuid[] not null default '{}',
  file_name text,
  file_path text,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  failed_at timestamptz,
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  constraint export_jobs_status_check check (status in ('queued', 'processing', 'completed', 'failed', 'expired')),
  constraint export_jobs_format_check check (format in ('markdown', 'json', 'html', 'csv', 'zip'))
);

create table if not exists public.report_collections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  product_ids uuid[] not null default '{}',
  template_id text,
  encrypted_collection_report jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create table if not exists public.user_security_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  event_type text not null,
  ip_hash text,
  user_agent_hash text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.data_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  request_type text not null,
  status text not null,
  requested_at timestamptz not null default now(),
  completed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  constraint data_requests_type_check check (request_type in ('export_data', 'delete_account')),
  constraint data_requests_status_check check (status in ('requested', 'processing', 'completed', 'rejected'))
);

create index if not exists export_jobs_user_created_idx on public.export_jobs(user_id, created_at desc);
create index if not exists export_jobs_user_status_idx on public.export_jobs(user_id, status);
create index if not exists report_collections_user_updated_idx on public.report_collections(user_id, updated_at desc);
create index if not exists user_security_events_user_created_idx on public.user_security_events(user_id, created_at desc);
create index if not exists data_requests_user_requested_idx on public.data_requests(user_id, requested_at desc);

alter table public.export_jobs enable row level security;
alter table public.report_collections enable row level security;
alter table public.user_security_events enable row level security;
alter table public.data_requests enable row level security;

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.product_drafts enable row level security;
alter table public.launch_reports enable row level security;
alter table public.report_translations enable row level security;
alter table public.workspace_events enable row level security;

grant usage on schema public to authenticated;
revoke insert, update, delete on public.profiles from authenticated;
grant select on public.profiles to authenticated;
grant update (display_name, avatar_url, updated_at) on public.profiles to authenticated;
grant select, insert, update, delete on public.products to authenticated;
grant select, insert, update, delete on public.product_drafts to authenticated;
grant select, insert, update, delete on public.launch_reports to authenticated;
grant select, insert, update, delete on public.report_translations to authenticated;
grant select, insert, update, delete on public.workspace_events to authenticated;
grant select, insert, update, delete on public.export_jobs to authenticated;
grant select, insert, update, delete on public.report_collections to authenticated;
grant select, insert, update, delete on public.user_security_events to authenticated;
grant select, insert, update, delete on public.data_requests to authenticated;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select to authenticated
using ((select auth.uid()) = id);
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "profiles_update_display_fields_own" on public.profiles;
create policy "profiles_update_display_fields_own" on public.profiles for update to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

drop policy if exists "products_select_own" on public.products;
create policy "products_select_own" on public.products for select to authenticated
using ((select auth.uid()) = user_id);
drop policy if exists "products_insert_own" on public.products;
create policy "products_insert_own" on public.products for insert to authenticated
with check ((select auth.uid()) = user_id);
drop policy if exists "products_update_own" on public.products;
create policy "products_update_own" on public.products for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
drop policy if exists "products_delete_own" on public.products;
create policy "products_delete_own" on public.products for delete to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "product_drafts_owner_all" on public.product_drafts;
create policy "product_drafts_owner_all" on public.product_drafts for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "launch_reports_owner_all" on public.launch_reports;
create policy "launch_reports_owner_all" on public.launch_reports for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "report_translations_owner_all" on public.report_translations;
create policy "report_translations_owner_all" on public.report_translations for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "workspace_events_owner_all" on public.workspace_events;
create policy "workspace_events_owner_all" on public.workspace_events for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "export_jobs_owner_all" on public.export_jobs;
create policy "export_jobs_owner_all" on public.export_jobs for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "report_collections_owner_all" on public.report_collections;
create policy "report_collections_owner_all" on public.report_collections for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "user_security_events_owner_select" on public.user_security_events;
create policy "user_security_events_owner_select" on public.user_security_events for select to authenticated
using ((select auth.uid()) = user_id);
drop policy if exists "user_security_events_owner_insert" on public.user_security_events;
create policy "user_security_events_owner_insert" on public.user_security_events for insert to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "data_requests_owner_all" on public.data_requests;
create policy "data_requests_owner_all" on public.data_requests for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
