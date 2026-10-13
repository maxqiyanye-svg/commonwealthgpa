import CourseForm from "@/components/CourseForm";
import { createClient } from "@/lib/supabase/server";
import { getSchoolYear } from "@/lib/schoolYear";
import { createCourse } from "../courses/actions";
import type { CatalogCourse } from "@/lib/types";
import { logout } from "@/app/auth/actions";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const supabase = createClient();
  const schoolYear = await getSchoolYear();
  const { data: catalog } = await supabase
    .from("catalog_courses")
    .select("*")
    .order("category")
    .order("name");

  return (
    <div>
      <header className="border-b border-line">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <span className="font-semibold">Commonwealth GPA</span>
          <form action={logout}>
            <button type="submit" className="text-sm text-ink-secondary hover:text-ink">
              Log out
            </button>
          </form>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-lg font-semibold">Let&apos;s add your first course</h1>
          <p className="text-sm text-ink-secondary">
            Pick one from the catalog or type your own — you can edit or add more later from
            Courses.
          </p>
        </div>

        {searchParams.error && (
          <p className="text-sm text-status-critical">{searchParams.error}</p>
        )}

        <CourseForm
          catalog={(catalog ?? []) as CatalogCourse[]}
          action={createCourse}
          defaultSchoolYear={schoolYear}
          redirectTo="/dashboard"
          submitLabel="Add course and continue"
        />
      </main>
    </div>
  );
}
