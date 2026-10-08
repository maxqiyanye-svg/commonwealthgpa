import Link from "next/link";
import { signup } from "@/app/auth/actions";
import { GRADE_LEVELS } from "@/lib/types";

export default function SignupPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="card w-full max-w-sm p-8">
        <h1 className="text-xl font-semibold mb-1">Create your account</h1>
        <p className="text-sm text-ink-secondary mb-6">
          Track your courses, GPA, and grade trends.
        </p>

        {searchParams.error && (
          <p className="mb-4 text-sm text-status-critical">{searchParams.error}</p>
        )}

        <form action={signup} className="space-y-4">
          <div>
            <label className="block text-sm mb-1" htmlFor="full_name">
              Name
            </label>
            <input
              id="full_name"
              name="full_name"
              type="text"
              required
              className="w-full rounded-lg border border-line bg-transparent px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm mb-1" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="you@commschool.org"
              className="w-full rounded-lg border border-line bg-transparent px-3 py-2 text-sm"
            />
            <p className="mt-1 text-xs text-ink-muted">
              Please use your Commonwealth School email.
            </p>
          </div>
          <div>
            <label className="block text-sm mb-1" htmlFor="grade_level">
              Grade
            </label>
            <select
              id="grade_level"
              name="grade_level"
              required
              defaultValue=""
              className="w-full rounded-lg border border-line bg-transparent px-3 py-2 text-sm"
            >
              <option value="" disabled>
                Select your grade
              </option>
              {GRADE_LEVELS.map((g) => (
                <option key={g} value={g}>
                  {g}th grade
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
              className="w-full rounded-lg border border-line bg-transparent px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-lg bg-accent text-white py-2 text-sm font-medium"
          >
            Sign up
          </button>
        </form>

        <p className="mt-6 text-sm text-ink-secondary">
          Already have an account?{" "}
          <Link href="/login" className="text-accent underline">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
