import { notFound } from "next/navigation";
import Nav from "@/components/Nav";
import CourseForm from "@/components/CourseForm";
import CourseTrendChart from "@/components/charts/CourseTrendChart";
import { createClient } from "@/lib/supabase/server";
import { updateCourse, deleteCourse, upsertGrade, deleteGrade } from "../actions";
import type { CatalogCourse, Course, Grade, Period } from "@/lib/types";
import { ALL_PERIODS, LETTERS } from "@/lib/types";
import { courseSeries } from "@/lib/analysis";
import { CATEGORY_COLORS } from "@/lib/chartColors";

const PERIOD_LABELS: Record<Period, string> = {
  Q1: "Quarter 1",
  Q2: "Quarter 2",
  S1: "Semester 1",
  Q3: "Quarter 3",
  Q4: "Quarter 4",
  S2: "Semester 2",
};

export default async function CourseDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { error?: string };
}) {
  const supabase = createClient();
  const [{ data: course }, { data: grades }, { data: catalog }] = await Promise.all([
    supabase.from("courses").select("*").eq("id", params.id).single(),
    supabase.from("grades").select("*").eq("course_id", params.id),
    supabase.from("catalog_courses").select("*").order("category").order("name"),
  ]);

  if (!course) notFound();

  const courseRow = course as Course;
  const gradeList = (grades ?? []) as Grade[];
  const series = courseSeries(courseRow, gradeList);
  const gradeByPeriod = new Map(gradeList.map((g) => [g.period, g]));

  return (
    <div>
      <Nav active="courses" />
      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">{courseRow.name}</h1>
            <p className="text-sm text-ink-secondary">
              {courseRow.category} · {courseRow.level} · {courseRow.school_year}
            </p>
          </div>
          <form action={deleteCourse.bind(null, courseRow.id)}>
            <button type="submit" className="text-sm text-status-critical">
              Remove course
            </button>
          </form>
        </div>

        {searchParams.error && (
          <p className="text-sm text-status-critical">{searchParams.error}</p>
        )}

        <section className="card p-6">
          <h2 className="font-medium mb-4">Grade over time</h2>
          <CourseTrendChart data={series} color={CATEGORY_COLORS[courseRow.category]} />
        </section>

        <section className="card p-6">
          <h2 className="font-medium mb-4">Grades by period</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {ALL_PERIODS.map((period) => {
              const existing = gradeByPeriod.get(period);
              return (
                <div key={period} className="rounded-lg border border-line p-3">
                  <p className="text-xs text-ink-muted uppercase tracking-wide mb-2">
                    {PERIOD_LABELS[period]}
                  </p>
                  <form action={upsertGrade.bind(null, courseRow.id)} className="space-y-2">
                    <input type="hidden" name="period" value={period} />
                    <select
                      name="letter"
                      defaultValue={existing?.letter ?? ""}
                      className="w-full rounded-md border border-line bg-transparent px-2 py-1.5 text-sm"
                    >
                      <option value="">Letter grade…</option>
                      {LETTERS.map((l) => (
                        <option key={l} value={l}>
                          {l}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      name="score"
                      step="0.1"
                      min="0"
                      max="100"
                      placeholder="or numeric score (0-100)"
                      defaultValue={existing?.score ?? ""}
                      className="w-full rounded-md border border-line bg-transparent px-2 py-1.5 text-sm"
                    />
                    <div className="flex items-center justify-between">
                      <button
                        type="submit"
                        className="text-xs rounded-md bg-cat-english text-white px-3 py-1.5"
                      >
                        {existing ? "Update" : "Save"}
                      </button>
                      {existing && (
                        <button
                          type="submit"
                          formAction={deleteGrade.bind(null, courseRow.id, existing.id)}
                          className="text-xs text-ink-muted hover:text-status-critical"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </form>
                </div>
              );
            })}
          </div>
        </section>

        <section>
          <h2 className="font-medium mb-4">Edit course details</h2>
          <CourseForm
            catalog={(catalog ?? []) as CatalogCourse[]}
            action={updateCourse.bind(null, courseRow.id)}
            defaultSchoolYear={courseRow.school_year}
            submitLabel="Save changes"
            initial={{
              name: courseRow.name,
              category: courseRow.category,
              level: courseRow.level,
              credits: courseRow.credits,
              whole_year: courseRow.whole_year,
              semester: courseRow.semester,
              school_year: courseRow.school_year,
            }}
          />
        </section>
      </main>
    </div>
  );
}
