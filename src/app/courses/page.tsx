import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Nav from "@/components/Nav";
import type { Course } from "@/lib/types";
import { CATEGORIES } from "@/lib/types";
import { CATEGORY_COLORS } from "@/lib/chartColors";
import { deleteCourse } from "./actions";

export default async function CoursesPage() {
  const supabase = createClient();
  const { data: courses } = await supabase
    .from("courses")
    .select("*")
    .order("school_year", { ascending: false })
    .order("category", { ascending: true });

  const courseList = (courses ?? []) as Course[];
  const bySchoolYear = new Map<string, Course[]>();
  for (const c of courseList) {
    const list = bySchoolYear.get(c.school_year) ?? [];
    list.push(c);
    bySchoolYear.set(c.school_year, list);
  }

  return (
    <div>
      <Nav active="courses" />
      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold">Courses</h1>
          <Link
            href="/courses/new"
            className="rounded-lg bg-cat-english text-white text-sm px-4 py-2"
          >
            + Add course
          </Link>
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          {CATEGORIES.map((cat) => (
            <span key={cat} className="flex items-center gap-1.5 text-ink-secondary">
              <span
                className="inline-block w-2.5 h-2.5 rounded-full"
                style={{ background: CATEGORY_COLORS[cat] }}
              />
              {cat}
            </span>
          ))}
        </div>

        {courseList.length === 0 && (
          <p className="text-sm text-ink-secondary">No courses yet — add your first one above.</p>
        )}

        {[...bySchoolYear.entries()].map(([year, list]) => (
          <section key={year} className="card p-6">
            <h2 className="font-medium mb-4">{year}</h2>
            <ul className="divide-y divide-line">
              {list.map((c) => (
                <li key={c.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ background: CATEGORY_COLORS[c.category] }}
                    />
                    <div className="min-w-0">
                      <Link href={`/courses/${c.id}`} className="text-sm font-medium hover:underline">
                        {c.name}
                      </Link>
                      <p className="text-xs text-ink-secondary">
                        {c.category} · {c.level} · {c.credits} credit{c.credits === 1 ? "" : "s"} ·{" "}
                        {c.whole_year ? "Whole Year" : `${c.semester} semester`}
                      </p>
                    </div>
                  </div>
                  <form action={deleteCourse.bind(null, c.id)}>
                    <button
                      type="submit"
                      className="text-xs text-ink-muted hover:text-status-critical shrink-0"
                    >
                      Remove
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </main>
    </div>
  );
}
