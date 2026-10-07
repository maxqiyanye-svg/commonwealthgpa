-- Commonwealth GPA — database schema
-- Run this once in your Supabase project's SQL Editor (Database > SQL Editor > New query),
-- then run supabase/seed.sql to load the Commonwealth course catalog.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- profiles: one row per signed-up user, auto-created on signup
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- Auto-create a profile row whenever a new auth user is created.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------------
-- catalog_courses: the reference Commonwealth course catalog (shared, read-only)
-- ---------------------------------------------------------------------------
create table if not exists public.catalog_courses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  level text not null check (level in ('Regular', 'H', 'AP', 'APE')),
  credits numeric not null default 1,
  category text not null check (
    category in ('English', 'History', 'Language', 'Science', 'Mathematics', 'Arts')
  )
);

alter table public.catalog_courses enable row level security;

create policy "catalog_select_all" on public.catalog_courses
  for select using (true);

-- ---------------------------------------------------------------------------
-- courses: a user's own schedule of courses, one row per course per year
-- ---------------------------------------------------------------------------
create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  category text not null check (
    category in ('English', 'History', 'Language', 'Science', 'Mathematics', 'Arts')
  ),
  level text not null check (level in ('Regular', 'H', 'AP', 'APE')),
  credits numeric not null default 1,
  whole_year boolean not null default true,
  semester text check (semester in ('Fall', 'Spring')),
  school_year text not null,
  created_at timestamptz not null default now(),
  constraint semester_required_unless_whole_year check (
    whole_year = true or semester is not null
  )
);

create index if not exists courses_user_id_idx on public.courses (user_id);

alter table public.courses enable row level security;

create policy "courses_select_own" on public.courses
  for select using (auth.uid() = user_id);
create policy "courses_insert_own" on public.courses
  for insert with check (auth.uid() = user_id);
create policy "courses_update_own" on public.courses
  for update using (auth.uid() = user_id);
create policy "courses_delete_own" on public.courses
  for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- grades: one row per course per grading period (quarters + semesters)
-- ---------------------------------------------------------------------------
create table if not exists public.grades (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  period text not null check (period in ('Q1', 'Q2', 'Q3', 'Q4', 'S1', 'S2')),
  letter text check (letter in ('A+','A','A-','B+','B','B-','C+','C','C-','D+','D','D-','F')),
  score numeric check (score >= 0 and score <= 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (course_id, period),
  constraint grade_has_value check (letter is not null or score is not null)
);

create index if not exists grades_user_id_idx on public.grades (user_id);
create index if not exists grades_course_id_idx on public.grades (course_id);

alter table public.grades enable row level security;

create policy "grades_select_own" on public.grades
  for select using (auth.uid() = user_id);
create policy "grades_insert_own" on public.grades
  for insert with check (auth.uid() = user_id);
create policy "grades_update_own" on public.grades
  for update using (auth.uid() = user_id);
create policy "grades_delete_own" on public.grades
  for delete using (auth.uid() = user_id);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists grades_set_updated_at on public.grades;
create trigger grades_set_updated_at
  before update on public.grades
  for each row execute procedure public.set_updated_at();
