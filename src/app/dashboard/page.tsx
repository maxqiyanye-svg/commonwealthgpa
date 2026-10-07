import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Nav from "@/components/Nav";
import GpaTrendChart from "@/components/charts/GpaTrendChart";
import CategoryBarChart from "@/components/charts/CategoryBarChart";
import { buildTimeline, currentGpa, categoryBreakdown, assess } from "@/lib/analysis";
import type { Course, Grade } from "@/lib/types";

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: courses }, { data: grades }] = await Promise.all([
    supabase.from("courses").select("*").order("created_at", { ascending: true }),
    supabase.from("grades").select("*"),
  ]);

  const courseList = (courses ?? []) as Course[];
  const gradeList = (grades ?? []) as Grade[];

  const gpa = currentGpa(courseList, gradeList);
  const timeline = buildTimeline(courseList, gradeList);
  const breakdown = categoryBreakdown(courseList, gradeList);
  const assessment = assess(courseList, gradeList);

  return (
    <div>
      <Nav active="dashboard" />
      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        <div>
          <h1 className="text-lg font-semibold">
            Welcome{user?.user_metadata?.full_name ? `, ${user.user_metadata.full_name}` : ""}
          </h1>
          <p className="text-sm text-ink-secondary">
            Overview across {courseList.length} course{courseList.length === 1 ? "" : "s"}.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatTile label="Unweighted GPA" value={gpa.unweighted} />
          <StatTile label="Weighted GPA" value={gpa.weighted} />
          <StatTile label="Credits counted" value={gpa.creditsCounted} decimals={2} />
          <StatTile
            label="Overall trend"
            value={null}
            text={assessment.trend ? capitalize(assessment.trend) : "Not enough data"}
          />
        </div>

        <section className="card p-6">
          <h2 className="font-medium mb-4">GPA over time</h2>
          <GpaTrendChart data={timeline} />
        </section>

        <section className="card p-6">
          <h2 className="font-medium mb-4">Weighted GPA by category</h2>
          <CategoryBarChart data={breakdown} />
          {(assessment.strongest || assessment.weakest) && (
            <p className="mt-4 text-sm text-ink-secondary">
              Strongest subject: <span className="text-ink">{assessment.strongest ?? "—"}</span>.
              {"  "}
              Needs the most attention:{" "}
              <span className="text-ink">{assessment.weakest ?? "—"}</span>.
            </p>
          )}
        </section>

        <section className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-medium">Courses</h2>
            <Link href="/courses" className="text-sm text-cat-english underline">
              Manage courses →
            </Link>
          </div>
          {courseList.length === 0 ? (
            <p className="text-sm text-ink-secondary">
              You haven&apos;t added any courses yet.{" "}
              <Link href="/courses/new" className="text-cat-english underline">
                Add your first course
              </Link>
              .
            </p>
          ) : (
            <ul className="divide-y divide-line">
              {courseList.map((c) => (
                <li key={c.id} className="py-2 flex items-center justify-between text-sm">
                  <Link href={`/courses/${c.id}`} className="hover:underline">
                    {c.name}
                  </Link>
                  <span className="text-ink-secondary">
                    {c.category} · {c.level} · {c.whole_year ? "Whole Year" : c.semester}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}

function StatTile({
  label,
  value,
  text,
  decimals = 2,
}: {
  label: string;
  value: number | null;
  text?: string;
  decimals?: number;
}) {
  return (
    <div className="card p-4">
      <p className="text-xs text-ink-muted uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-semibold mt-1">
        {text ?? (value !== null ? value.toFixed(decimals) : "—")}
      </p>
    </div>
  );
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
