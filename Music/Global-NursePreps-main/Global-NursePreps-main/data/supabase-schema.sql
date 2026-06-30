-- Global NursePrep Supabase schema
-- Run this in the Supabase SQL editor after creating a project.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    full_name text not null default '',
    role text not null default 'student',
    email text not null default '',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.courses (
    id text primary key,
    title text not null,
    category text not null,
    difficulty text not null default 'Beginner',
    badge text not null default 'New',
    duration_hours integer not null default 0,
    questions integer not null default 0,
    exams integer not null default 0,
    format text not null default 'Self-paced',
    summary text not null default '',
    image text not null default '',
    module_count integer not null default 1,
    access text not null default 'free',
    price numeric not null default 0,
    lecturer text not null default '',
    lecturer_id text not null default '',
    content_notes text not null default '',
    uploaded_document jsonb,
    source text not null default 'supabase',
    updated_at timestamptz not null default now()
);

create table if not exists public.learning_states (
    user_id uuid primary key references auth.users(id) on delete cascade,
    state_json jsonb not null default '{}'::jsonb,
    updated_at timestamptz not null default now()
);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists touch_profiles_updated_at on public.profiles;
create trigger touch_profiles_updated_at
before update on public.profiles
for each row execute function public.touch_updated_at();

drop trigger if exists touch_courses_updated_at on public.courses;
create trigger touch_courses_updated_at
before update on public.courses
for each row execute function public.touch_updated_at();

drop trigger if exists touch_learning_states_updated_at on public.learning_states;
create trigger touch_learning_states_updated_at
before update on public.learning_states
for each row execute function public.touch_updated_at();

alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.learning_states enable row level security;

drop policy if exists "Profiles are readable by authenticated users" on public.profiles;
create policy "Profiles are readable by authenticated users"
on public.profiles
for select
to authenticated
using (true);

drop policy if exists "Users can manage own profile" on public.profiles;
create policy "Users can manage own profile"
on public.profiles
for all
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "Courses are publicly readable" on public.courses;
create policy "Courses are publicly readable"
on public.courses
for select
to anon, authenticated
using (true);

drop policy if exists "Authenticated users can manage courses" on public.courses;
create policy "Authenticated users can manage courses"
on public.courses
for all
to authenticated
using (true)
with check (true);

drop policy if exists "Learning states are private to owner" on public.learning_states;
create policy "Learning states are private to owner"
on public.learning_states
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create index if not exists profiles_role_idx on public.profiles(role);
create index if not exists courses_category_idx on public.courses(category);
create index if not exists learning_states_updated_at_idx on public.learning_states(updated_at desc);
