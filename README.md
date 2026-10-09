# Commonwealth GPA

A private GPA tracker: add your courses, enter grades by quarter/semester, and
see GPA (unweighted and weighted), category breakdowns, and grade trends over
time. Built with Next.js (App Router) + Supabase (Postgres + Auth), deployed
on Vercel.

## How GPA is calculated

- **Unweighted**: standard 4.0 scale (A = 4.0, A- = 3.7, B+ = 3.3, … F = 0),
  credit-weighted across your courses.
- **Weighted**: every Commonwealth course is Honors-level or above, so there
  are only three levels: **H** gets **+0.5**, **AP** and **APE**
  (AP-equivalent-or-beyond) get **+1.0**. So weighted GPA can run above 4.0 —
  a straight-A year of all AP/APE courses weights to 5.0.
- You can edit the bonus values in `src/lib/gpa.ts` (`WEIGHT_BONUS`) if you
  want a different scale.
- Both GPAs are computed from each course's **most recently entered grade**
  (so a course only shows up once it has at least one grade), credit-weighted.
- The GPA-over-time chart on the dashboard recomputes both GPAs as of each
  grading period in order (Q1, Q2, S1, Q3, Q4, S2), carrying forward the
  latest grade known at that point — that's what makes it a trend line
  instead of a single snapshot.

## Grading periods

Each course tracks six periods: **Q1, Q2, S1 (semester 1), Q3, Q4, S2
(semester 2)**. Enter whichever ones apply — a semester-only course just gets
grades in the periods it actually ran.

## The "Whole Year" toggle

When you add a course, toggling **Whole Year** off asks which semester (Fall
or Spring) it runs in. This doesn't block grade entry in any period — it's
there for your own bookkeeping, and future features (like only prompting for
relevant periods) can build on it.

## Categories

Every course is filed under one of eight categories, each with its own fixed
color everywhere in the app: **English** (red), **History** (orange),
**Humanities** (teal), **Language** (yellow), **Science** (green),
**Mathematics** (blue), **Arts** (purple), **Electives** (gray). Anywhere the
app displays a category it uses the short label (English, History, Human.,
Lang, Sci, Math, Arts, Elect.) — see `CATEGORY_LABELS` in `src/lib/types.ts`
if you want to change the abbreviations.

The app ships pre-seeded with the full Commonwealth 2026–2027 course catalog
(`data/catalog.json`, ~100 courses). Adding a course is **pure catalog
selection** — search/filter the catalog and click one; there's no manual
name/category/level/credits entry, so every course in the app is guaranteed
to match something in `/admin`'s shared catalog. The whole catalog
(including level: H / AP / APE) is editable from `/admin`.

How the catalog's own sections map onto those eight:
- **Economics, U.S. Politics in the 21st Century, and The City in Film** are
  filed under **Humanities**.
- **Jazz Theory, Music Theory, and Conducting** are filed under **Arts**
  (they're listed in the catalog's Humanities & Social Sciences section but
  are clearly music courses).
- **Ninth-Grade Seminar, The Purposes of Education, College and Senior
  Seminar, and Capstone Project** are filed under **Electives**.

## Signup and onboarding

Signup is restricted to `@commschool.org` email addresses (enforced in
`src/app/auth/actions.ts`); the form also shows a standing reminder to use a
Commonwealth School email, and asks for grade (9–12), stored on the profile
for the aggregate stats view. After signing up, a user with zero courses is
forced to `/onboarding` to add their first one before they can reach anything
else (enforced in `src/lib/supabase/middleware.ts`) — after that they're free
to add, edit, or remove courses normally.

Edit `data/catalog.json` and re-run `supabase/seed.sql` any time the catalog
changes.

## Grades tab: categories and assignments

Each course's grade is built up from individual assignments, not entered
directly. From a course page, **Manage grades →** takes you to `/grades/[id]`,
where you:

1. Set up **grade categories** for the course (e.g. "Homework" 20%,
   "Tests" 50%, "Participation" 30%) — the Grades tab reminds you to check
   your syllabus for how your teacher actually splits it up, since that
   varies by class.
2. Add assignments under a category, per period (e.g. "Mandarin 6 HW #3":
   94/100, filed under Homework, Q1).

The composite grade for a period is a weighted average across categories
that have at least one assignment logged — a category with no assignments
yet is excluded and the rest re-normalize, so grades still compute correctly
early in a term before every category has data (`src/lib/gradeCompute.ts`).
That composite is written into the same `grades` table the GPA engine
already reads, so GPA, trend charts, and the category breakdown all pick it
up automatically — no separate code path.

## Admin stats

`/admin/stats` (linked from `/admin`) shows aggregate-only numbers for the
whole app — total users, users by grade, total courses/grades logged,
average score, letter-grade distribution, courses by category, and the most
commonly added courses. It's backed by a Postgres function
(`admin_stats()` in `supabase/schema.sql`) that's deliberately aggregate-only
— no names, emails, or per-user rows are ever returned to this
unauthenticated page.

## Stack

- **Next.js 14** (App Router, TypeScript, Tailwind)
- **Supabase**: Postgres for data, built-in email/password auth — this is
  the "username + password" login. Row-Level Security means every user only
  ever sees their own courses and grades.
- **Recharts** for the GPA trend line, category bar chart, and per-course
  grade trend.

## One-time setup

### 1. Create a Supabase project

Go to [supabase.com](https://supabase.com), create a new project (free tier
is plenty), and wait for it to finish provisioning.

### 2. Run the database schema

In the Supabase dashboard: **SQL Editor → New query**. Paste in the contents
of `supabase/schema.sql` and run it. Then do the same with
`supabase/seed.sql` to load the course catalog.

### 3. Get your API keys

**Settings → API** in the Supabase dashboard gives you:
- `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
- `anon` `public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 4. Local development

```bash
cp .env.local.example .env.local
# paste in the two values from step 3
npm install
npm run dev
```

Visit `http://localhost:3000`, sign up with an email + password, and start
adding courses.

### 5. Push to GitHub

```bash
git remote add origin git@github.com:YOUR-USERNAME/commonwealth-gpa.git
git push -u origin main
```

(This repo is already initialized with an initial commit — you just need to
add your remote and push.)

### 6. Deploy to Vercel

Either via the dashboard (Import Project → pick the GitHub repo → it
auto-detects Next.js) or the CLI:

```bash
npm i -g vercel   # if you don't have it already
vercel link       # creates a new Vercel project
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
# (repeat with `preview` and `development` environments if you want those too)
vercel --prod
```

That's it — the app is stateless aside from Supabase, so there's nothing
else to configure on Vercel's end.

## Project structure

```
src/app/              Next.js App Router pages + server actions
src/components/       Shared UI (nav, course form, charts)
src/lib/              GPA math, trend/category analysis, Supabase clients, types
data/catalog.json     Source of truth for the seeded course catalog
supabase/schema.sql   Tables, RLS policies, triggers
supabase/seed.sql     Generated from data/catalog.json — catalog_courses rows
```

## Admin grades (password-protected)

`/admin/grades` shows every student's actual grades, course by course — for
teachers and research use. Unlike `/admin` and `/admin/stats`, this one is
behind a password (`ADMIN_PASSWORD`) because it returns real names, emails,
and grades.

The password check happens in the Next.js server action, but the real
protection is at the database level: `admin_grades_detail()` (in
`supabase/schema.sql`) is only granted to the Postgres `service_role`, never
to `anon`/`authenticated` — so even someone who finds the public anon key
can't call it directly. That's why this needs a second secret,
`SUPABASE_SERVICE_ROLE_KEY` (Settings → API → `service_role` in Supabase —
**never** put this one in a `NEXT_PUBLIC_` variable or client code).
