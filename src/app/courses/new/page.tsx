import Nav from "@/components/Nav";
import CourseForm from "@/components/CourseForm";
import { createClient } from "@/lib/supabase/server";
import { createCourse } from "../actions";
import type { CatalogCourse } from "@/lib/types";

function defaultSchoolYear(): string {
  const now = new Date();
  const y = now.getFullYear();
  return now.getMonth() >= 6 ? `${y}-${y + 1}` : `${y - 1}-${y}`;
}

export default async function NewCoursePage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const supabase = createClient();
  const { data: catalog } = await supabase
    .from("catalog_courses")
    .select("*")
    .order("category")
    .order("name");

  return (
    <div>
      <Nav active="courses" />
      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <h1 className="text-lg font-semibold">Add a course</h1>
        {searchParams.error && (
          <p className="text-sm text-status-critical">{searchParams.error}</p>
        )}
        <CourseForm
          catalog={(catalog ?? []) as CatalogCourse[]}
          action={createCourse}
          defaultSchoolYear={defaultSchoolYear()}
        />
      </main>
    </div>
  );
}
