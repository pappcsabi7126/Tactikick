-- CoachApp / Supabase schema
-- Run this once in Supabase SQL Editor.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  name text not null default '',
  role text not null default 'Head Coach',
  club text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.teams (
  id bigint primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  age text not null default '',
  color text not null default 'purple',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.players (
  id bigint primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  team_id bigint not null references public.teams(id) on delete cascade,
  name text not null,
  position text not null default '',
  birth_year integer,
  jersey_number integer,
  attendance numeric not null default 0,
  trainings integer not null default 0,
  present integer not null default 0,
  absent integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.trainings (
  id bigint primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  team_id bigint not null references public.teams(id) on delete cascade,
  date date not null,
  start_time time,
  end_time time,
  title text not null,
  color text not null default 'purple',
  calendar_type text not null default 'training',
  plan jsonb not null default '[]'::jsonb,
  attendance jsonb not null default '{}'::jsonb,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists teams_user_id_idx on public.teams(user_id);
create index if not exists players_user_id_idx on public.players(user_id);
create index if not exists players_team_id_idx on public.players(team_id);
create index if not exists trainings_user_id_idx on public.trainings(user_id);
create index if not exists trainings_team_date_idx on public.trainings(team_id, date);

-- =====================================================
-- Saved training templates / training library
-- =====================================================
create table if not exists public.training_templates (
  id bigint primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  team_id bigint references public.teams(id) on delete set null,
  name text not null,
  duration integer not null default 0,
  plan jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists training_templates_user_id_idx
  on public.training_templates(user_id);

create index if not exists training_templates_team_id_idx
  on public.training_templates(team_id);

alter table public.training_templates enable row level security;

drop policy if exists training_templates_all_own on public.training_templates;

create policy training_templates_all_own
on public.training_templates
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);


alter table public.profiles enable row level security;
alter table public.teams enable row level security;
alter table public.players enable row level security;
alter table public.trainings enable row level security;

-- Re-runnable policies.
drop policy if exists profiles_select_own on public.profiles;
drop policy if exists profiles_insert_own on public.profiles;
drop policy if exists profiles_update_own on public.profiles;
drop policy if exists teams_all_own on public.teams;
drop policy if exists players_all_own on public.players;
drop policy if exists trainings_all_own on public.trainings;

create policy profiles_select_own on public.profiles for select using (auth.uid() = id);
create policy profiles_insert_own on public.profiles for insert with check (auth.uid() = id);
create policy profiles_update_own on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

create policy teams_all_own on public.teams for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy players_all_own on public.players for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy trainings_all_own on public.trainings for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Profile row is created automatically for new users.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(coalesce(new.email, ''), '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();


-- =====================================================
-- Exercise image storage
-- =====================================================
-- Public bucket keeps image rendering simple in the CoachApp frontend.
-- The policies below restrict uploads/updates/deletes to the user's own
-- folder: <auth.uid()>/<training-id>/<exercise-id>.<ext>

insert into storage.buckets (id, name, public)
values ('exercise-images', 'exercise-images', true)
on conflict (id) do update set public = true;

drop policy if exists exercise_images_select on storage.objects;
drop policy if exists exercise_images_insert on storage.objects;
drop policy if exists exercise_images_update on storage.objects;
drop policy if exists exercise_images_delete on storage.objects;

create policy exercise_images_select
on storage.objects
for select
using (bucket_id = 'exercise-images');

create policy exercise_images_insert
on storage.objects
for insert
with check (
  bucket_id = 'exercise-images'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy exercise_images_update
on storage.objects
for update
using (
  bucket_id = 'exercise-images'
  and auth.uid()::text = (storage.foldername(name))[1]
)
with check (
  bucket_id = 'exercise-images'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy exercise_images_delete
on storage.objects
for delete
using (
  bucket_id = 'exercise-images'
  and auth.uid()::text = (storage.foldername(name))[1]
);
