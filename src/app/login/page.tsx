import Link from "next/link";
import { login } from "@/app/auth/actions";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="card w-full max-w-sm p-8">
        <h1 className="text-xl font-semibold mb-1">Commonwealth GPA</h1>
        <p className="text-sm text-ink-secondary mb-6">Log in to your account.</p>

        {searchParams.error && (
          <p className="mb-4 text-sm text-status-critical">{searchParams.error}</p>
        )}

        <form action={login} className="space-y-4">
          <div>
            <label className="block text-sm mb-1" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full rounded-lg border border-line bg-transparent px-3 py-2 text-sm"
            />
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
              className="w-full rounded-lg border border-line bg-transparent px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-lg bg-accent text-white py-2 text-sm font-medium"
          >
            Log in
          </button>
        </form>

        <p className="mt-6 text-sm text-ink-secondary">
          No account yet?{" "}
          <Link href="/signup" className="text-accent underline">
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}
