"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { compositeForPeriod } from "@/lib/gradeCompute";
import { ALL_PERIODS } from "@/lib/types";
import type { Assignment, GradeCategory, Period } from "@/lib/types";

/** Recompute one period's composite grade from categories+assignments and
 * write it into the `grades` table — this is what feeds the existing GPA
 * engine, so nothing else has to change when grading data changes. */
async function recomputeAndSave(
  supabase: ReturnType<typeof createClient>,
  courseId: string,
  userId: string,
  period: Period
) {
  const [{ data: categories }, { data: assignments }] = await Promise.all([
    supabase.from("grade_categories").select("*").eq("course_id", courseId),
    supabase.from("assignments").select("*").eq("course_id", courseId).eq("period", period),
  ]);

  const result = compositeForPeriod(
    (categories ?? []) as GradeCategory[],
    (assignments ?? []) as Assignment[],
    period
  );

  if (result.pct === null) {
    await supabase.from("grades").delete().eq("course_id", courseId).eq("period", period);
    return;
  }

  await supabase.from("grades").upsert(
    {
      course_id: courseId,
      user_id: userId,
      period,
      letter: result.letter,
      score: result.pct,
    },
    { onConflict: "course_id,period" }
  );
}

export async function addCategory(courseId: string, formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const name = String(formData.get("name") || "").trim();
  const weight = Number(formData.get("weight") || 0);

  if (!name || weight <= 0) {
    redirect(`/grades/${courseId}?error=${encodeURIComponent("Enter a category name and a weight above 0")}`);
  }

  const { error } = await supabase.from("grade_categories").insert({
    course_id: courseId,
    user_id: user!.id,
    name,
    weight,
  });

  if (error) {
    redirect(`/grades/${courseId}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(`/grades/${courseId}`);
  redirect(`/grades/${courseId}`);
}

export async function deleteCategory(courseId: string, categoryId: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase.from("grade_categories").delete().eq("id", categoryId);

  // That category's assignments are gone too (cascade) — every period's
  // composite may have changed, so recompute all of them.
  await Promise.all(ALL_PERIODS.map((p) => recomputeAndSave(supabase, courseId, user!.id, p)));

  revalidatePath(`/grades/${courseId}`);
  revalidatePath("/dashboard");
  redirect(`/grades/${courseId}`);
}

export async function addAssignment(courseId: string, formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const categoryId = String(formData.get("category_id") || "");
  const period = String(formData.get("period") || "") as Period;
  const name = String(formData.get("name") || "").trim();
  const score = Number(formData.get("score"));
  const pointsPossible = Number(formData.get("points_possible") || 100);

  if (!categoryId || !period || !name || Number.isNaN(score)) {
    redirect(`/grades/${courseId}?error=${encodeURIComponent("Fill in the assignment name, score, and category")}`);
  }

  const { error } = await supabase.from("assignments").insert({
    course_id: courseId,
    category_id: categoryId,
    user_id: user!.id,
    period,
    name,
    score,
    points_possible: pointsPossible,
  });

  if (error) {
    redirect(`/grades/${courseId}?error=${encodeURIComponent(error.message)}`);
  }

  await recomputeAndSave(supabase, courseId, user!.id, period);

  revalidatePath(`/grades/${courseId}`);
  revalidatePath(`/courses/${courseId}`);
  revalidatePath("/dashboard");
  redirect(`/grades/${courseId}?period=${period}`);
}

export async function deleteAssignment(courseId: string, assignmentId: string, period: Period) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase.from("assignments").delete().eq("id", assignmentId);
  await recomputeAndSave(supabase, courseId, user!.id, period);

  revalidatePath(`/grades/${courseId}`);
  revalidatePath(`/courses/${courseId}`);
  revalidatePath("/dashboard");
  redirect(`/grades/${courseId}?period=${period}`);
}
