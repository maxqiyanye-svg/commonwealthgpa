import Link from "next/link";
import Nav from "@/components/Nav";
import { createClient } from "@/lib/supabase/server";
import type { Course } from "@/lib/types";
import { CATEGORY_LABELS } from "@/lib/types";
import { CATEGORY_COLORS } from "@/lib/chartColors";

export default async function GradesPage() {
  const supabase = createClient();
  const { data: courses } = await supabase
    .from("courses")
    .select("*")
    .order("school_year", { ascending: false })
    .order("name");

  const courseList = (courses ?? []) as Course[];

  return (
    <div>
      <Nav active="grades" />
      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-lg font-semibold">Grades</h1>
          <p className="text-sm text-ink-secondary">
            Pick a course to set up its grading categories and log individual assignments.
          </p>
        </div>

        <div className="card p-4 border-l-4 border-l-accent">
          <p className="text-sm">
            <strong>Before you set up a course:</strong> consult your syllabus to see how your
            grade is divided — most Commonwealth courses weight things like homework, tests,
            quizzes, and participation differently. Enter those categories and their percentages
            first, then log each assignment under the right one as you get it back.
          </p>
        </div>

        {courseList.length === 0 ? (
          <p className="text-sm text-ink-secondary">
            You don&apos;t have any courses yet. <Link href="/courses/new" className="text-accent underline">Add one</Link> first.
          </p>
        ) : (
          <div className="card p-6">
            <ul className="divide-y divide-line">
              {courseList.map((c) => (
                <li key={c.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span
                      className="inline-block w-2.5 h-2.5 rounded-full"
                      style={{ background: CATEGORY_COLORS[c.category] }}
                    />
                    <div>
                      <Link href={`/grades/${c.id}`} className="text-sm font-medium hover:underline">
                        {c.name}
                      </Link>
                      <p className="text-xs text-ink-secondary">
                        {CATEGORY_LABELS[c.category]} · {c.school_year}
                      </p>
                    </div>
                  </div>
                  <Link href={`/grades/${c.id}`} className="text-sm text-accent underline">
                    Manage →
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>
    </div>
  );
}
