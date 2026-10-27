import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CATEGORIES, CATEGORY_LABELS, LEVELS } from "@/lib/types";
import type { CatalogCourse, Category, Level } from "@/lib/types";
import { CATEGORY_COLORS } from "@/lib/chartColors";
import { addCatalogCourse, updateCatalogCourse, deleteCatalogCourse, setSchoolYear, setCurrentQuarter } from "./actions";
import { getCurrentQuarter, QUARTER_LIST } from "@/lib/currentQuarter";
import { getSchoolYear } from "@/lib/schoolYear";
import { isAdminAuthed, adminLogin, adminLogout } from "@/lib/adminAuth";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: { error?: string; msg?: string };
}) {
  const authed = await isAdminAuthed();

  if (!authed) {
    return (
      <div className="max-w-sm mx-auto px-4 py-20 space-y-4">
        <h1 className="text-lg font-semibold">Commonwealth GPA — Admin</h1>
        <p className="text-sm text-ink-secondary">
          Password-protected. Catalog editing and student grades both live behind this
          one login.
        </p>
        {searchParams.error && (
          <p className="text-sm text-status-critical">{searchParams.error}</p>
        )}
        <form action={adminLogin} className="space-y-3">
          <input type="hidden" name="redirect_to" value="/admin" />
          <input
            type="password"
            name="password"
            placeholder="Admin password"
            required
            autoFocus
            className="w-full rounded-lg border border-line bg-transparent px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="w-full rounded-lg bg-accent text-white py-2 text-sm font-medium"
          >
            Enter
          </button>
        </form>
      </div>
    );
  }

  const schoolYear = await getSchoolYear();
  const currentQuarter = await getCurrentQuarter(schoolYear);
  const supabase = createClient();
  const { data: catalog } = await supabase
    .from("catalog_courses")
    .select("*")
    .order("category")
    .order("name");

  const courses = (catalog ?? []) as CatalogCourse[];
  const byCategory = new Map<Category, CatalogCourse[]>();
  for (const c of courses) {
    const list = byCategory.get(c.category) ?? [];
    list.push(c);
    byCategory.set(c.category, list);
  }

  return (
    <div>
      <header className="border-b border-line">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <span className="font-semibold">Commonwealth GPA — Catalog Admin</span>
            <p className="text-xs text-ink-muted mt-1">
              Password-protected. Changes here update the shared catalog everyone picks
              from when adding a course — not anyone's personal grades.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/admin/stats" className="text-sm text-accent underline whitespace-nowrap">
              View stats →
            </Link>
            <Link href="/admin/grades" className="text-sm text-accent underline whitespace-nowrap">
              Student grades →
            </Link>
            <form action={adminLogout}>
              <button type="submit" className="text-sm text-ink-muted underline whitespace-nowrap">
                Log out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {searchParams.error && (
          <p className="text-sm text-status-critical">{searchParams.error}</p>
        )}

        <section className="card p-6">
          <h2 className="font-medium mb-1">School year</h2>
          <p className="text-xs text-ink-muted mb-4">
            Currently <strong className="text-ink">{schoolYear}</strong>. New courses default to this
            year for every student.
          </p>
          {searchParams.msg && (
            <p className="text-sm text-ink-secondary mb-4">{searchParams.msg}</p>
          )}
          <form action={setSchoolYear} className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-xs text-ink-muted mb-1">School year</label>
              <input
                name="school_year"
                required
                pattern="\d{4}-\d{4}"
                placeholder="2026-2027"
                defaultValue={schoolYear}
                className="w-40 rounded-lg border border-line bg-transparent px-3 py-2 text-sm"
              />
            </div>
            <label className="flex items-center gap-2 text-xs text-ink-secondary pb-2">
              <input type="checkbox" name="move_existing" value="yes" />
              Also re-tag existing courses from {schoolYear} to the new year (fixes mistakes only)
            </label>
            <button type="submit" className="rounded-lg bg-accent text-white text-sm px-4 py-2">
              Save year
            </button>
          </form>
        </section>

        <section className="card p-6">
          <h2 className="font-medium mb-1">Current quarter</h2>
          <p className="text-xs text-ink-muted mb-4">
            Currently <strong className="text-ink">{currentQuarter}</strong>. Every student&apos;s
            Grades page opens on this quarter. Switch it when the quarter changes.
          </p>
          <form action={setCurrentQuarter} className="flex flex-wrap gap-2 items-center">
            {QUARTER_LIST.map((q) => (
              <button
                key={q}
                type="submit"
                name="current_quarter"
                value={q}
                className={`text-sm rounded-full px-4 py-1.5 border ${
                  q === currentQuarter ? "bg-accent text-white border-accent" : "border-line text-ink-secondary"
                }`}
              >
                {q}
              </button>
            ))}
          </form>
        </section>

        <section className="card p-6">
          <h2 className="font-medium mb-4">Add a catalog course</h2>
          <form action={addCatalogCourse} className="grid sm:grid-cols-5 gap-3 items-end">
            <div className="sm:col-span-2">
              <label className="block text-xs text-ink-muted mb-1">Name</label>
              <input
                name="name"
                required
                className="w-full rounded-lg border border-line bg-transparent px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-ink-muted mb-1">Category</label>
              <select
                name="category"
                className="w-full rounded-lg border border-line bg-transparent px-3 py-2 text-sm"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {CATEGORY_LABELS[c]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-ink-muted mb-1">Level</label>
              <select
                name="level"
                className="w-full rounded-lg border border-line bg-transparent px-3 py-2 text-sm"
              >
                {LEVELS.map((l) => (
                  <option key={l.value} value={l.value}>
                    {l.value}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <input
                type="number"
                step="0.25"
                min="0"
                name="credits"
                defaultValue={1}
                className="w-20 rounded-lg border border-line bg-transparent px-3 py-2 text-sm"
              />
              <button
                type="submit"
                className="rounded-lg bg-accent text-white text-sm px-4 py-2 whitespace-nowrap"
              >
                Add
              </button>
            </div>
          </form>
        </section>

        {CATEGORIES.map((category) => {
          const list = byCategory.get(category) ?? [];
          if (list.length === 0) return null;
          return (
            <section key={category} className="card p-6">
              <h2 className="font-medium mb-4 flex items-center gap-2">
                <span
                  className="inline-block w-2.5 h-2.5 rounded-full"
                  style={{ background: CATEGORY_COLORS[category] }}
                />
                {CATEGORY_LABELS[category]}
                <span className="text-ink-muted font-normal text-sm">({list.length})</span>
              </h2>
              <div className="space-y-2">
                {list.map((c) => (
                  <CatalogRow key={c.id} course={c} />
                ))}
              </div>
            </section>
          );
        })}
      </main>
    </div>
  );
}

function CatalogRow({ course }: { course: CatalogCourse }) {
  const update = updateCatalogCourse.bind(null, course.id);
  const del = deleteCatalogCourse.bind(null, course.id);

  return (
    <div className="rounded-lg border border-line p-3 flex flex-wrap items-center gap-3">
      {/* Quick level toggle — click a pill to switch level immediately */}
      <form action={update} className="flex items-center gap-1 shrink-0">
        <input type="hidden" name="name" value={course.name} />
        <input type="hidden" name="category" value={course.category} />
        <input type="hidden" name="credits" value={course.credits} />
        {LEVELS.map((l) => (
          <button
            key={l.value}
            type="submit"
            name="level"
            value={l.value}
            className={`text-xs rounded-full px-2.5 py-1 border ${
              course.level === l.value
                ? "bg-accent text-white border-accent"
                : "border-line text-ink-secondary"
            }`}
          >
            {l.value}
          </button>
        ))}
      </form>

      <span className="text-sm flex-1 min-w-[12rem]">{course.name}</span>

      {/* Full edit — name / category / credits */}
      <form action={update} className="flex items-center gap-2 flex-wrap">
        <input type="hidden" name="level" value={course.level} />
        <input
          name="name"
          defaultValue={course.name}
          className="rounded-md border border-line bg-transparent px-2 py-1 text-xs w-40"
        />
        <select
          name="category"
          defaultValue={course.category}
          className="rounded-md border border-line bg-transparent px-2 py-1 text-xs"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {CATEGORY_LABELS[c]}
            </option>
          ))}
        </select>
        <input
          type="number"
          step="0.25"
          min="0"
          name="credits"
          defaultValue={course.credits}
          className="rounded-md border border-line bg-transparent px-2 py-1 text-xs w-16"
        />
        <button type="submit" className="text-xs rounded-md border border-line px-2 py-1">
          Save
        </button>
      </form>

      <form action={del}>
        <button type="submit" className="text-xs text-ink-muted hover:text-status-critical">
          Delete
        </button>
      </form>
    </div>
  );
}
