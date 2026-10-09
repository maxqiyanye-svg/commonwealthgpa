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
  grade_level int check (grade_level between 9 and 12),
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
  insert into public.profiles (id, full_name, grade_level)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    nullif(new.raw_user_meta_data ->> 'grade_level', '')::int
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------------
-- catalog_courses: the reference Commonwealth course catalog (shared).
-- Writable by the open, unauthenticated /admin page — see catalog_*_open
-- policies below. Tighten these later if /admin ever gets a login gate.
-- ---------------------------------------------------------------------------
create table if not exists public.catalog_courses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  level text not null check (level in ('H', 'AP', 'APE')),
  credits numeric not null default 1,
  category text not null check (
    category in ('English', 'History', 'Humanities', 'Language', 'Science', 'Mathematics', 'Arts', 'Electives')
  )
);

alter table public.catalog_courses enable row level security;

create policy "catalog_select_all" on public.catalog_courses
  for select using (true);
create policy "catalog_insert_open" on public.catalog_courses
  for insert with check (true);
create policy "catalog_update_open" on public.catalog_courses
  for update using (true);
create policy "catalog_delete_open" on public.catalog_courses
  for delete using (true);

-- ---------------------------------------------------------------------------
-- courses: a user's own schedule of courses, one row per course per year
-- ---------------------------------------------------------------------------
create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  category text not null check (
    category in ('English', 'History', 'Humanities', 'Language', 'Science', 'Mathematics', 'Arts', 'Electives')
  ),
  level text not null check (level in ('H', 'AP', 'APE')),
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

-- ---------------------------------------------------------------------------
-- grade_categories: a course's syllabus-defined weighting (e.g. Homework 20%,
-- Tests 50%, Quizzes 20%, Participation 10%)
-- ---------------------------------------------------------------------------
create table if not exists public.grade_categories (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  weight numeric not null check (weight >= 0 and weight <= 100),
  created_at timestamptz not null default now()
);

create index if not exists grade_categories_course_id_idx on public.grade_categories (course_id);

alter table public.grade_categories enable row level security;

create policy "grade_categories_select_own" on public.grade_categories
  for select using (auth.uid() = user_id);
create policy "grade_categories_insert_own" on public.grade_categories
  for insert with check (auth.uid() = user_id);
create policy "grade_categories_update_own" on public.grade_categories
  for update using (auth.uid() = user_id);
create policy "grade_categories_delete_own" on public.grade_categories
  for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- assignments: individual graded items, each filed under one category and
-- one grading period. These are what the period's grade is computed from.
-- ---------------------------------------------------------------------------
create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.grade_categories (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  period text not null check (period in ('Q1', 'Q2', 'Q3', 'Q4', 'S1', 'S2')),
  name text not null,
  score numeric not null check (score >= 0),
  points_possible numeric not null default 100 check (points_possible > 0),
  created_at timestamptz not null default now()
);

create index if not exists assignments_course_id_idx on public.assignments (course_id);
create index if not exists assignments_category_id_idx on public.assignments (category_id);

alter table public.assignments enable row level security;

create policy "assignments_select_own" on public.assignments
  for select using (auth.uid() = user_id);
create policy "assignments_insert_own" on public.assignments
  for insert with check (auth.uid() = user_id);
create policy "assignments_update_own" on public.assignments
  for update using (auth.uid() = user_id);
create policy "assignments_delete_own" on public.assignments
  for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- admin_stats(): aggregate-only stats for the open /admin/stats page. Runs
-- as the function owner (security definer) so it can see across all users,
-- but it only ever returns counts/averages — never a row tied to one
-- person's name, email, or id. Keep it that way if you extend it.
-- ---------------------------------------------------------------------------
create or replace function public.admin_stats()
returns json
language sql
security definer
set search_path = public
as $$
  select json_build_object(
    'total_users', (select count(*) from public.profiles),
    'users_by_grade', (
      select coalesce(json_object_agg(grade_level, cnt order by grade_level), '{}'::json)
      from (
        select grade_level, count(*) cnt
        from public.profiles
        where grade_level is not null
        group by grade_level
      ) t
    ),
    'total_courses', (select count(*) from public.courses),
    'total_grades', (select count(*) from public.grades),
    'avg_score', (select round(avg(score)::numeric, 2) from public.grades where score is not null),
    'letter_distribution', (
      select coalesce(json_object_agg(letter, cnt), '{}'::json)
      from (
        select letter, count(*) cnt
        from public.grades
        where letter is not null
        group by letter
      ) t
    ),
    'courses_by_category', (
      select coalesce(json_object_agg(category, cnt), '{}'::json)
      from (select category, count(*) cnt from public.courses group by category) t
    ),
    'most_common_courses', (
      select coalesce(json_agg(row_to_json(t)), '[]'::json)
      from (
        select name, count(*) as student_count
        from public.courses
        group by name
        order by student_count desc, name
        limit 15
      ) t
    )
  );
$$;

grant execute on function public.admin_stats() to anon, authenticated;

-- ---------------------------------------------------------------------------
-- admin_grades_detail(): every student's actual per-course, per-period
-- grades, for the password-gated /admin/grades page (teachers + research
-- use). Unlike admin_stats(), this returns real names/emails/grades, so it
-- is deliberately NOT granted to anon/authenticated — only the server-side
-- service-role client (which the Next.js app only calls after the admin
-- password check passes) can call it. Never grant this to anon.
-- ---------------------------------------------------------------------------
create or replace function public.admin_grades_detail()
returns table (
  student_name text,
  student_email text,
  grade_level int,
  course_name text,
  category text,
  level text,
  credits numeric,
  school_year text,
  period text,
  letter text,
  score numeric
)
language sql
security definer
set search_path = public
as $$
  select
    p.full_name,
    u.email,
    p.grade_level,
    c.name,
    c.category,
    c.level,
    c.credits,
    c.school_year,
    g.period,
    g.letter,
    g.score
  -- Starts from every signed-up user (left joins out to courses, then
  -- grades) so a student with no courses yet, or courses with no grades
  -- yet, still shows up — not just students who've entered data.
  from public.profiles p
  join auth.users u on u.id = p.id
  left join public.courses c on c.user_id = p.id
  left join public.grades g on g.course_id = c.id
  order by p.full_name, c.name, g.period;
$$;

revoke all on function public.admin_grades_detail() from public;
revoke all on function public.admin_grades_detail() from anon, authenticated;
grant execute on function public.admin_grades_detail() to service_role;

-- ---------------------------------------------------------------------------
-- course_quotes: per-course grade feedback (200 per course). Read-only for
-- everyone signed in; written only by scripts/upload_course_quotes.py using
-- the service-role key.
-- ---------------------------------------------------------------------------
create table if not exists public.course_quotes (
  id bigint generated always as identity primary key,
  course_name text not null,
  label text not null,
  min_pct numeric not null,
  max_pct numeric not null,
  body text not null
);

create index if not exists course_quotes_course_name_idx on public.course_quotes (course_name);

alter table public.course_quotes enable row level security;

create policy "course_quotes_read_all" on public.course_quotes
  for select using (true);
