import Link from "next/link";
import { logout } from "@/app/auth/actions";

export default function Nav({ active }: { active: "dashboard" | "courses" }) {
  return (
    <header className="border-b border-line">
      <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <span className="font-semibold">Commonwealth GPA</span>
          <nav className="flex gap-4 text-sm">
            <Link
              href="/dashboard"
              className={active === "dashboard" ? "text-ink font-medium" : "text-ink-secondary"}
            >
              Dashboard
            </Link>
            <Link
              href="/courses"
              className={active === "courses" ? "text-ink font-medium" : "text-ink-secondary"}
            >
              Courses
            </Link>
          </nav>
        </div>
        <form action={logout}>
          <button type="submit" className="text-sm text-ink-secondary hover:text-ink">
            Log out
          </button>
        </form>
      </div>
    </header>
  );
}
