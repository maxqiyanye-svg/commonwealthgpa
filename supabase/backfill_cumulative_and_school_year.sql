-- Commonwealth GPA: one-time update for full-year cumulative grades + school year setting.
-- Run in the Supabase SQL Editor (web), not the Terminal. Safe to run more than once.

-- 1) School year setting (everyone can read; the admin panel writes it)
create table if not exists public.app_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

alter table public.app_settings enable row level security;

drop policy if exists "app_settings_read_all" on public.app_settings;
create policy "app_settings_read_all" on public.app_settings
  for select using (true);

insert into public.app_settings (key, value)
values ('school_year', '2026-2027')
on conflict (key) do nothing;

-- 2) Recalculate every saved grade with cumulative periods:
--    Q2 and S1 = Q1 + Q2, Q3 = Q1..Q3, Q4 and S2 = Q1..Q4 (full-year cumulative).
with period_sources (period, src) as (
  values
    ('Q1', 'Q1'),
    ('Q2', 'Q1'), ('Q2', 'Q2'),
    ('S1', 'Q1'), ('S1', 'Q2'),
    ('Q3', 'Q1'), ('Q3', 'Q2'), ('Q3', 'Q3'),
    ('Q4', 'Q1'), ('Q4', 'Q2'), ('Q4', 'Q3'), ('Q4', 'Q4'),
    ('S2', 'Q1'), ('S2', 'Q2'), ('S2', 'Q3'), ('S2', 'Q4')
),
cat_scores as (
  select
    a.course_id,
    a.user_id,
    ps.period,
    gc.weight,
    sum(a.score) as earned,
    sum(a.points_possible) as possible
  from period_sources ps
  join public.assignments a on a.period = ps.src
  join public.grade_categories gc on gc.id = a.category_id
  group by a.course_id, a.user_id, ps.period, gc.id, gc.weight
  having sum(a.points_possible) > 0
),
cat_pct as (
  select
    course_id,
    user_id,
    period,
    weight,
    round((earned / possible * 100)::numeric, 2) as pct
  from cat_scores
),
course_pct as (
  select
    course_id,
    user_id,
    period,
    round((sum(pct * weight) / sum(weight))::numeric, 2) as score
  from cat_pct
  group by course_id, user_id, period
  having sum(weight) > 0
),
graded as (
  select
    course_id,
    user_id,
    period,
    score,
    case
      when score >= 97 then 'A+'
      when score >= 93 then 'A'
      when score >= 90 then 'A-'
      when score >= 87 then 'B+'
      when score >= 83 then 'B'
      when score >= 80 then 'B-'
      when score >= 77 then 'C+'
      when score >= 73 then 'C'
      when score >= 70 then 'C-'
      when score >= 67 then 'D+'
      when score >= 65 then 'D'
      when score >= 60 then 'D-'
      else 'F'
    end as letter
  from course_pct
),
removed as (
  delete from public.grades g
  where not exists (
    select 1 from graded x where x.course_id = g.course_id and x.period = g.period
  )
)
insert into public.grades (course_id, user_id, period, letter, score)
select course_id, user_id, period, letter, score from graded
on conflict (course_id, period) do update
  set letter = excluded.letter,
      score = excluded.score,
      updated_at = now();
