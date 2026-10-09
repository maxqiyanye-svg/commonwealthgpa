import Link from "next/link";
import {
  isAdminGradesAuthed,
  adminGradesLogin,
  adminGradesLogout,
  fetchAllGrades,
  type AdminGradeRow,
} from "./actions";

export default async function AdminGradesPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const authed = await isAdminGradesAuthed();

  if (!authed) {
    return (
      <div className="max-w-sm mx-auto px-4 py-20 space-y-4">
        <h1 className="text-lg font-semibold">Admin — grade data</h1>
        <p className="text-sm text-ink-secondary">
          Password-protected. Shows every student&apos;s actual grades — teacher and
          research use only.
        </p>
        {searchParams.error && (
          <p className="text-sm text-status-critical">{searchParams.error}</p>
        )}
        <form action={adminGradesLogin} className="space-y-3">
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
        <Link href="/admin" className="text-sm text-accent underline">
          ← Back to catalog admin
        </Link>
      </div>
    );
  }

  const rows = await fetchAllGrades();

  const byStudent = new Map<string, AdminGradeRow[]>();
  for (const row of rows) {
    const list = byStudent.get(row.student_email) ?? [];
    list.push(row);
    byStudent.set(row.student_email, list);
  }

  return (
    <div>
      <header className="border-b border-line">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <span className="font-semibold">Commonwealth GPA — Admin Grades</span>
            <p className="text-xs text-ink-muted mt-1">
              Password-protected. Real per-student grades — handle like the student
              records it is.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-sm text-accent underline whitespace-nowrap">
              ← Catalog admin
            </Link>
            <form action={adminGradesLogout}>
              <button type="submit" className="text-sm text-ink-muted underline">
                Log out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        <p className="text-sm text-ink-secondary">
          {rows.length} grade entries across {byStudent.size} student
          {byStudent.size === 1 ? "" : "s"}.
        </p>

        {rows.length === 0 && (
          <p className="text-sm text-ink-muted">No grades logged yet.</p>
        )}

        {[...byStudent.entries()].map(([email, studentRows]) => (
          <section key={email} className="card p-4">
            <h2 className="font-medium mb-3">
              {studentRows[0].student_name || "(no name)"}{" "}
              <span className="text-sm text-ink-muted font-normal">
                {email}
                {studentRows[0].grade_level ? ` · Grade ${studentRows[0].grade_level}` : ""}
              </span>
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="text-left text-ink-muted border-b border-line">
                    <th className="py-1 pr-4 font-normal">Course</th>
                    <th className="py-1 pr-4 font-normal">Category</th>
                    <th className="py-1 pr-4 font-normal">Level</th>
                    <th className="py-1 pr-4 font-normal">Year</th>
                    <th className="py-1 pr-4 font-normal">Period</th>
                    <th className="py-1 pr-4 font-normal">Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {studentRows.map((r, i) => (
                    <tr key={i} className="border-b border-line/50">
                      <td className="py-1 pr-4">{r.course_name}</td>
                      <td className="py-1 pr-4">{r.category}</td>
                      <td className="py-1 pr-4">{r.level}</td>
                      <td className="py-1 pr-4">{r.school_year}</td>
                      <td className="py-1 pr-4">{r.period}</td>
                      <td className="py-1 pr-4">{r.letter ?? r.score ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}
