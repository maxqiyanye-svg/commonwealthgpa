import Link from "next/link";
import { notFound } from "next/navigation";
import Nav from "@/components/Nav";
import { createClient } from "@/lib/supabase/server";
import { addCategory, deleteCategory, addAssignment, deleteAssignment } from "../actions";
import type { Assignment, Course, GradeCategory, Period } from "@/lib/types";
import { ALL_PERIODS, CATEGORY_LABELS } from "@/lib/types";
import { compositeForPeriod } from "@/lib/gradeCompute";
import { pickCommentary } from "@/lib/commentary";
import { pickCourseQuote } from "@/lib/courseQuotes";
import CategoryQuickPicks from "@/components/CategoryQuickPicks";

const TIER_LABELS: Record<string, string> = {
  excellent: "Excellent",
  good: "Good",
  needs_improvement: "Needs improvement",
  at_risk: "At risk",
};

const PERIOD_LABELS: Record<Period, string> = {
  Q1: "Quarter 1",
  Q2: "Quarter 2",
  S1: "Semester 1",
  Q3: "Quarter 3",
  Q4: "Quarter 4",
  S2: "Semester 2",
};

export default async function GradesCoursePage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { error?: string; period?: string };
}) {
  const supabase = createClient();
  const [{ data: course }, { data: categories }, { data: assignments }] = await Promise.all([
    supabase.from("courses").select("*").eq("id", params.id).single(),
    supabase.from("grade_categories").select("*").eq("course_id", params.id).order("created_at"),
    supabase.from("assignments").select("*").eq("course_id", params.id).order("created_at"),
  ]);

  if (!course) notFound();

  const courseRow = course as Course;
  const categoryList = (categories ?? []) as GradeCategory[];
  const assignmentList = (assignments ?? []) as Assignment[];

  const period = (ALL_PERIODS.includes(searchParams.period as Period)
    ? searchParams.period
    : "Q1") as Period;

  const weightSum = categoryList.reduce((sum, c) => sum + c.weight, 0);
  const composite = compositeForPeriod(categoryList, assignmentList, period);
  const assignmentsInPeriod = assignmentList.filter((a) => a.period === period);
  // Prefer a quote written for this exact course; fall back to the subject-wide pool.
  const seed = `${courseRow.id}:${period}`;
  const courseQuote =
    composite.pct !== null ? pickCourseQuote(courseRow.name, composite.pct, seed) : null;
  const fallback =
    !courseQuote && composite.pct !== null
      ? pickCommentary(courseRow.category, composite.pct, seed)
      : null;
  const commentaryLabel = courseQuote
    ? `Score ${courseQuote.label}`
    : fallback
      ? `${TIER_LABELS[fallback.tier]} — ${CATEGORY_LABELS[courseRow.category]}`
      : "";
  const commentaryText = courseQuote?.text ?? fallback?.text ?? null;

  return (
    <div>
      <Nav active="grades" />
      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">{courseRow.name}</h1>
            <p className="text-sm text-ink-secondary">{CATEGORY_LABELS[courseRow.category]}</p>
          </div>
          <Link href={`/courses/${courseRow.id}`} className="text-sm text-accent underline">
            ← Back to course
          </Link>
        </div>

        <div className="card p-4 border-l-4 border-l-accent">
          <p className="text-sm">
            <strong>Consult your syllabus</strong> for how this course divides up your grade (e.g.
            Homework 20%, Tests 50%, Quizzes 20%, Participation 10%), then set those up as
            categories below before logging assignments.
          </p>
        </div>

        {searchParams.error && (
          <p className="text-sm text-status-critical">{searchParams.error}</p>
        )}

        <section className="card p-6">
          <h2 className="font-medium mb-4">Grading categories</h2>
          {categoryList.length > 0 && (
            <ul className="divide-y divide-line mb-4">
              {categoryList.map((cat) => (
                <li key={cat.id} className="py-2 flex items-center justify-between text-sm">
                  <span>
                    {cat.name} — <span className="text-ink-secondary">{cat.weight}%</span>
                  </span>
                  <form action={deleteCategory.bind(null, courseRow.id, cat.id)}>
                    <button type="submit" className="text-xs text-ink-muted hover:text-status-critical">
                      Remove
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
          <p className={`text-xs mb-4 ${weightSum === 100 ? "text-ink-muted" : "text-status-warning"}`}>
            Weights add up to {weightSum}%{weightSum !== 100 ? " — should usually total 100%" : ""}.
          </p>
          {courseRow.category !== "Arts" && (
            <CategoryQuickPicks targetNameId="category-name-input" targetWeightId="category-weight-input" />
          )}
          <form action={addCategory.bind(null, courseRow.id)} className="flex gap-2 items-end">
            <div className="flex-1">
              <label className="block text-xs text-ink-muted mb-1">Category name</label>
              <input
                id="category-name-input"
                name="name"
                required
                placeholder="Homework"
                className="w-full rounded-lg border border-line bg-transparent px-3 py-2 text-sm"
              />
            </div>
            <div className="w-28">
              <label className="block text-xs text-ink-muted mb-1">Weight %</label>
              <input
                id="category-weight-input"
                type="number"
                name="weight"
                step="0.5"
                min="0"
                max="100"
                required
                className="w-full rounded-lg border border-line bg-transparent px-3 py-2 text-sm"
              />
            </div>
            <button type="submit" className="rounded-lg bg-accent text-white text-sm px-4 py-2">
              Add
            </button>
          </form>
        </section>

        <section className="card p-6">
          <div className="flex flex-wrap gap-2 mb-4">
            {ALL_PERIODS.map((p) => (
              <Link
                key={p}
                href={`/grades/${courseRow.id}?period=${p}`}
                className={`text-xs rounded-full px-3 py-1.5 border ${
                  period === p ? "bg-accent text-white border-accent" : "border-line text-ink-secondary"
                }`}
              >
                {PERIOD_LABELS[p]}
              </Link>
            ))}
          </div>

          <h2 className="font-medium mb-1">{PERIOD_LABELS[period]} assignments</h2>
          {composite.pct !== null ? (
            <p className="text-sm text-ink-secondary mb-4">
              Computed grade: <strong className="text-ink">{composite.letter}</strong> (
              {composite.pct}%)
            </p>
          ) : (
            <p className="text-sm text-ink-muted mb-4">No assignments logged for this period yet.</p>
          )}

          {commentaryText && (
            <div className="card p-4 border-l-4 border-l-accent mb-6">
              <p className="text-xs text-ink-muted mb-1">
                {commentaryLabel}
              </p>
              <p className="text-sm">{commentaryText}</p>
            </div>
          )}

          {categoryList.length === 0 ? (
            <p className="text-sm text-ink-secondary">Add a grading category above first.</p>
          ) : (
            <>
              <form
                action={addAssignment.bind(null, courseRow.id)}
                className="grid sm:grid-cols-5 gap-3 items-end mb-6"
              >
                <input type="hidden" name="period" value={period} />
                <div className="sm:col-span-2">
                  <label className="block text-xs text-ink-muted mb-1">Assignment name</label>
                  <input
                    name="name"
                    required
                    placeholder="HW 1"
                    className="w-full rounded-lg border border-line bg-transparent px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-ink-muted mb-1">Category</label>
                  <select
                    name="category_id"
                    required
                    className="w-full rounded-lg border border-line bg-transparent px-3 py-2 text-sm"
                  >
                    {categoryList.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-ink-muted mb-1">Score</label>
                  <input
                    type="number"
                    name="score"
                    step="0.1"
                    min="0"
                    required
                    placeholder="94"
                    className="w-full rounded-lg border border-line bg-transparent px-3 py-2 text-sm"
                  />
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-xs text-ink-muted mb-1">Out of</label>
                    <input
                      type="number"
                      name="points_possible"
                      step="0.1"
                      min="0.1"
                      defaultValue={100}
                      className="w-full rounded-lg border border-line bg-transparent px-3 py-2 text-sm"
                    />
                  </div>
                  <button
                    type="submit"
                    className="rounded-lg bg-accent text-white text-sm px-4 py-2 whitespace-nowrap"
                  >
                    Add
                  </button>
                </div>
              </form>

              {categoryList.map((cat) => {
                const catResult = composite.categories.find((r) => r.category.id === cat.id);
                const inCat = assignmentsInPeriod.filter((a) => a.category_id === cat.id);
                return (
                  <div key={cat.id} className="mb-5">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium">
                        {cat.name} <span className="text-ink-muted">({cat.weight}%)</span>
                      </h3>
                      <span className="text-sm text-ink-secondary">
                        {catResult?.pct !== null && catResult?.pct !== undefined
                          ? `${catResult.pct}% (${catResult.earned}/${catResult.possible})`
                          : "no grades yet"}
                      </span>
                    </div>
                    {inCat.length > 0 ? (
                      <ul className="divide-y divide-line">
                        {inCat.map((a) => (
                          <li key={a.id} className="py-1.5 flex items-center justify-between text-sm">
                            <span>
                              {a.name} — {a.score}/{a.points_possible}
                            </span>
                            <form action={deleteAssignment.bind(null, courseRow.id, a.id, period)}>
                              <button
                                type="submit"
                                className="text-xs text-ink-muted hover:text-status-critical"
                              >
                                Remove
                              </button>
                            </form>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-ink-muted">No assignments in this category yet.</p>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </section>
      </main>
    </div>
  );
}
