create extension if not exists pgcrypto;

create type public.verification_status as enum ('unverified','verified','outdated','unverifiable');
create type public.workflow_status as enum ('discovered','unverified','verified','draft','ready_for_review','approved','published','failed','archived');
create type public.job_status as enum ('pending','processing','completed','failed','cancelled');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role text not null default 'editor' check (role in ('admin','editor')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.categories (
  id uuid primary key default gen_random_uuid(), name text not null unique, slug text not null unique,
  active boolean not null default true, sort_order integer not null default 0, created_at timestamptz not null default now()
);
create table public.news_sources (
  id uuid primary key default gen_random_uuid(), name text not null, url text not null unique,
  source_type text not null default 'rss' check(source_type in ('rss','website','api','manual')),
  active boolean not null default true, last_checked_at timestamptz, created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.news_items (
  id uuid primary key default gen_random_uuid(), source_id uuid references public.news_sources(id) on delete set null,
  headline text not null, source_url text not null unique, canonical_url text, content_fingerprint text,
  summary text, thumbnail_url text, published_at timestamptz, discovered_at timestamptz not null default now(),
  category_id uuid references public.categories(id) on delete set null,
  verification_status public.verification_status not null default 'unverified', workflow_status public.workflow_status not null default 'discovered',
  verified_by uuid references public.profiles(id), verified_at timestamptz, raw_metadata jsonb not null default '{}',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.news_references (
  id uuid primary key default gen_random_uuid(), news_item_id uuid not null references public.news_items(id) on delete cascade,
  title text not null, url text not null, publisher text, published_at timestamptz, excerpt text, created_at timestamptz not null default now(),
  unique(news_item_id,url)
);
create table public.generated_posts (
  id uuid primary key default gen_random_uuid(), news_item_id uuid references public.news_items(id) on delete set null,
  platform text not null check(platform in ('facebook','blogger')), title text, body text not null, metadata jsonb not null default '{}',
  version integer not null default 1, workflow_status public.workflow_status not null default 'draft', created_by uuid references public.profiles(id),
  approved_by uuid references public.profiles(id), approved_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.generated_images (
  id uuid primary key default gen_random_uuid(), news_item_id uuid references public.news_items(id) on delete set null,
  storage_path text not null, public_url text, prompt text, template text not null, width integer not null, height integer not null,
  mime_type text not null default 'image/png', metadata jsonb not null default '{}', created_by uuid references public.profiles(id), created_at timestamptz not null default now()
);
create table public.video_projects (
  id uuid primary key default gen_random_uuid(), news_item_id uuid references public.news_items(id) on delete set null,
  title text not null, script text, voice_provider text, voice_id text, duration_seconds numeric(7,2), status public.job_status not null default 'pending',
  output_storage_path text, settings jsonb not null default '{}', created_by uuid references public.profiles(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.video_scenes (
  id uuid primary key default gen_random_uuid(), video_project_id uuid not null references public.video_projects(id) on delete cascade,
  position integer not null, narration text not null, subtitle text, image_storage_path text, duration_seconds numeric(7,2), settings jsonb not null default '{}',
  unique(video_project_id,position)
);
create table public.audio_assets (
  id uuid primary key default gen_random_uuid(), video_project_id uuid references public.video_projects(id) on delete cascade,
  kind text not null check(kind in ('narration','music','effect')), storage_path text not null, duration_seconds numeric(7,2), license_info text, created_at timestamptz not null default now()
);
create table public.publishing_accounts (
  id uuid primary key default gen_random_uuid(), provider text not null check(provider in ('facebook','blogger')), external_account_id text not null,
  display_name text, encrypted_credentials text not null, expires_at timestamptz, active boolean not null default true,
  created_by uuid references public.profiles(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(provider,external_account_id)
);
create table public.publishing_jobs (
  id uuid primary key default gen_random_uuid(), provider text not null, account_id uuid references public.publishing_accounts(id) on delete restrict,
  generated_post_id uuid references public.generated_posts(id) on delete set null, idempotency_key text not null unique, status public.job_status not null default 'pending',
  requested_by uuid references public.profiles(id), approved_by uuid references public.profiles(id), external_url text, error_message text,
  attempts integer not null default 0, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.publishing_logs (
  id uuid primary key default gen_random_uuid(), publishing_job_id uuid not null references public.publishing_jobs(id) on delete cascade,
  level text not null, message text not null, metadata jsonb not null default '{}', created_at timestamptz not null default now()
);
create table public.automation_jobs (
  id uuid primary key default gen_random_uuid(), job_type text not null, status public.job_status not null default 'pending',
  scheduled_for timestamptz, started_at timestamptz, finished_at timestamptz, error_message text, metrics jsonb not null default '{}', created_at timestamptz not null default now()
);
create table public.app_settings (
  key text primary key, value jsonb not null, is_secret boolean not null default false, updated_by uuid references public.profiles(id), updated_at timestamptz not null default now()
);
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(), actor_id uuid references public.profiles(id) on delete set null, action text not null,
  entity_type text not null, entity_id uuid, metadata jsonb not null default '{}', created_at timestamptz not null default now()
);

create index news_items_discovered_idx on public.news_items(discovered_at desc);
create index news_items_status_idx on public.news_items(verification_status, workflow_status);
create index news_items_fingerprint_idx on public.news_items(content_fingerprint) where content_fingerprint is not null;
create index generated_posts_item_idx on public.generated_posts(news_item_id, platform);
create index publishing_jobs_status_idx on public.publishing_jobs(status, created_at);
create index automation_jobs_status_idx on public.automation_jobs(status, scheduled_for);
create index audit_logs_entity_idx on public.audit_logs(entity_type, entity_id, created_at desc);

insert into public.categories(name,slug,sort_order) values
('வாழ்வியல்','lifestyle',10),('வரலாற்றுவியல்','history',20),('அரசியல்','politics',30),('சுற்றுலாவியல்','tourism',40),('உணவியல்','food',50),
('செய்திகள்','news',60),('கல்வி','education',70),('வேலைவாய்ப்பு','jobs',80),('ஆலயங்கள்','temples',90),('பண்பாடு','culture',100),
('விளையாட்டு','sports',110),('இளைஞர்கள்','youth',120),('நிகழ்வுகள்','events',130);

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.news_sources enable row level security;
alter table public.news_items enable row level security;
alter table public.news_references enable row level security;
alter table public.generated_posts enable row level security;
alter table public.generated_images enable row level security;
alter table public.video_projects enable row level security;
alter table public.video_scenes enable row level security;
alter table public.audio_assets enable row level security;
alter table public.publishing_accounts enable row level security;
alter table public.publishing_jobs enable row level security;
alter table public.publishing_logs enable row level security;
alter table public.automation_jobs enable row level security;
alter table public.app_settings enable row level security;
alter table public.audit_logs enable row level security;

create function public.is_staff() returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.profiles where id=auth.uid() and role in ('admin','editor'));
$$;
create function public.is_admin() returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.profiles where id=auth.uid() and role='admin');
$$;

create policy "profile self read" on public.profiles for select to authenticated using(id=auth.uid());
create policy "profile self update" on public.profiles for update to authenticated using(id=auth.uid()) with check(id=auth.uid());
create policy "staff categories read" on public.categories for select to authenticated using(public.is_staff());
create policy "admin categories write" on public.categories for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy "staff sources" on public.news_sources for all to authenticated using(public.is_staff()) with check(public.is_staff());
create policy "staff news" on public.news_items for all to authenticated using(public.is_staff()) with check(public.is_staff());
create policy "staff references" on public.news_references for all to authenticated using(public.is_staff()) with check(public.is_staff());
create policy "staff posts" on public.generated_posts for all to authenticated using(public.is_staff()) with check(public.is_staff());
create policy "staff images" on public.generated_images for all to authenticated using(public.is_staff()) with check(public.is_staff());
create policy "staff videos" on public.video_projects for all to authenticated using(public.is_staff()) with check(public.is_staff());
create policy "staff scenes" on public.video_scenes for all to authenticated using(public.is_staff()) with check(public.is_staff());
create policy "staff audio" on public.audio_assets for all to authenticated using(public.is_staff()) with check(public.is_staff());
create policy "admin accounts" on public.publishing_accounts for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy "staff publishing jobs" on public.publishing_jobs for all to authenticated using(public.is_staff()) with check(public.is_staff());
create policy "staff publishing logs" on public.publishing_logs for select to authenticated using(public.is_staff());
create policy "staff automation" on public.automation_jobs for select to authenticated using(public.is_staff());
create policy "admin settings" on public.app_settings for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy "admin audit" on public.audit_logs for select to authenticated using(public.is_admin());

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
('generated-images','generated-images',true,10485760,array['image/png','image/jpeg','image/webp']),
('video-assets','video-assets',false,524288000,array['video/mp4','audio/mpeg','audio/wav','image/png','image/jpeg'])
on conflict(id) do nothing;
create policy "staff image uploads" on storage.objects for insert to authenticated with check(bucket_id='generated-images' and public.is_staff());
create policy "public generated images" on storage.objects for select to public using(bucket_id='generated-images');
create policy "staff private media" on storage.objects for all to authenticated using(bucket_id='video-assets' and public.is_staff()) with check(bucket_id='video-assets' and public.is_staff());
