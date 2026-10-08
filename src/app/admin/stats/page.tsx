import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CATEGORIES, CATEGORY_LABELS, LETTERS } from "@/lib/types";

interface AdminStats {
  total_users: number;
  users_by_grade: Record<string, number>;
  total_courses: number;
  total_grades: number;
  avg_score: number | null;
  letter_distribution: Record<string, number>;
  courses_by_category: Record<string, number>;
  most_common_courses: { name: string; student_count: number }[];
}

export default async function AdminStatsPage() {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("admin_stats");
  const stats = (data ?? null) as AdminStats | null;

  return (
    <div>
      <header className="border-b border-line">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <span className="font-semibold">Commonwealth GPA — Aggregate Stats</span>
            <p className="text-xs text-ink-muted mt-1">
              Project &amp; study view. Counts and averages only — no names, emails, or
              individual records are exposed here.
            </p>
          </div>
          <Link href="/admin" className="text-sm text-accent underline whitespace-nowrap">
            ← Back to catalog admin
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {error && (
          <p className="text-sm text-status-critical">
            Couldn&apos;t load stats: {error.message}
          </p>
        )}

        {stats && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatTile label="Total users" value={stats.total_users} />
              <StatTile label="Total courses logged" value={stats.total_courses} />
              <StatTile label="Total grades logged" value={stats.total_grades} />
              <StatTile
                label="Avg score"
                value={stats.avg_score !== null ? stats.avg_score : "—"}
              />
            </div>

            <section className="card p-6">
              <h2 className="font-medium mb-4">Users by grade</h2>
              <ul className="space-y-1 text-sm">
                {[9, 10, 11, 12].map((g) => (
                  <li key={g} className="flex items-center justify-between">
                    <span className="text-ink-secondary">{g}th grade</span>
                    <span>{stats.users_by_grade?.[String(g)] ?? 0}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="card p-6">
              <h2 className="font-medium mb-4">Courses by category</h2>
              <ul className="space-y-1 text-sm">
                {CATEGORIES.map((c) => (
                  <li key={c} className="flex items-center justify-between">
                    <span className="text-ink-secondary">{CATEGORY_LABELS[c]}</span>
                    <span>{stats.courses_by_category?.[c] ?? 0}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="card p-6">
              <h2 className="font-medium mb-4">Letter grade distribution</h2>
              <ul className="space-y-1 text-sm">
                {LETTERS.map((l) => (
                  <li key={l} className="flex items-center justify-between">
                    <span className="text-ink-secondary">{l}</span>
                    <span>{stats.letter_distribution?.[l] ?? 0}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="card p-6">
              <h2 className="font-medium mb-4">Most common courses</h2>
              {stats.most_common_courses?.length ? (
                <ul className="divide-y divide-line">
                  {stats.most_common_courses.map((c) => (
                    <li key={c.name} className="py-2 flex items-center justify-between text-sm">
                      <span>{c.name}</span>
                      <span className="text-ink-secondary">
                        {c.student_count} student{c.student_count === 1 ? "" : "s"}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-ink-secondary">No data yet.</p>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="card p-4">
      <p className="text-xs text-ink-muted uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-semibold mt-1">{value}</p>
    </div>
  );
}
