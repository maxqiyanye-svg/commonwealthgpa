"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createCourse(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const wholeYear = formData.get("whole_year") === "on";

  const { error } = await supabase.from("courses").insert({
    user_id: user!.id,
    name: String(formData.get("name") || "").trim(),
    category: String(formData.get("category")),
    level: String(formData.get("level")),
    credits: Number(formData.get("credits") || 1),
    whole_year: wholeYear,
    semester: wholeYear ? null : String(formData.get("semester") || "Fall"),
    school_year: String(formData.get("school_year") || "").trim(),
  });

  if (error) {
    redirect(`/courses/new?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/courses");
  revalidatePath("/dashboard");
  redirect("/courses");
}

export async function updateCourse(courseId: string, formData: FormData) {
  const supabase = createClient();
  const wholeYear = formData.get("whole_year") === "on";

  const { error } = await supabase
    .from("courses")
    .update({
      name: String(formData.get("name") || "").trim(),
      category: String(formData.get("category")),
      level: String(formData.get("level")),
      credits: Number(formData.get("credits") || 1),
      whole_year: wholeYear,
      semester: wholeYear ? null : String(formData.get("semester") || "Fall"),
      school_year: String(formData.get("school_year") || "").trim(),
    })
    .eq("id", courseId);

  if (error) {
    redirect(`/courses/${courseId}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/courses");
  revalidatePath(`/courses/${courseId}`);
  revalidatePath("/dashboard");
  redirect(`/courses/${courseId}`);
}

export async function deleteCourse(courseId: string) {
  const supabase = createClient();
  await supabase.from("courses").delete().eq("id", courseId);
  revalidatePath("/courses");
  revalidatePath("/dashboard");
  redirect("/courses");
}

export async function upsertGrade(courseId: string, formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const period = String(formData.get("period"));
  const letterRaw = String(formData.get("letter") || "").trim();
  const scoreRaw = String(formData.get("score") || "").trim();

  const letter = letterRaw || null;
  const score = scoreRaw ? Number(scoreRaw) : null;

  if (!letter && score === null) {
    redirect(`/courses/${courseId}?error=${encodeURIComponent("Enter a letter grade or a numeric score")}`);
  }

  const { error } = await supabase.from("grades").upsert(
    {
      course_id: courseId,
      user_id: user!.id,
      period,
      letter,
      score,
    },
    { onConflict: "course_id,period" }
  );

  if (error) {
    redirect(`/courses/${courseId}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(`/courses/${courseId}`);
  revalidatePath("/dashboard");
  redirect(`/courses/${courseId}`);
}

export async function deleteGrade(courseId: string, gradeId: string) {
  const supabase = createClient();
  await supabase.from("grades").delete().eq("id", gradeId);
  revalidatePath(`/courses/${courseId}`);
  revalidatePath("/dashboard");
  redirect(`/courses/${courseId}`);
}
