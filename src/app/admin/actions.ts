"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdminAuthed } from "@/lib/adminAuth";
import { createAdminClient } from "@/lib/supabase/admin";
import { calendarSchoolYear } from "@/lib/schoolYear";

async function requireAdmin() {
  if (!(await isAdminAuthed())) {
    redirect("/admin");
  }
}

export async function addCatalogCourse(formData: FormData) {
  await requireAdmin();
  const supabase = createClient();

  const { error } = await supabase.from("catalog_courses").insert({
    name: String(formData.get("name") || "").trim(),
    category: String(formData.get("category")),
    level: String(formData.get("level")),
    credits: Number(formData.get("credits") || 1),
  });

  if (error) {
    redirect(`/admin?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin");
  redirect("/admin");
}

export async function updateCatalogCourse(id: string, formData: FormData) {
  await requireAdmin();
  const supabase = createClient();

  const { error } = await supabase
    .from("catalog_courses")
    .update({
      name: String(formData.get("name") || "").trim(),
      category: String(formData.get("category")),
      level: String(formData.get("level")),
      credits: Number(formData.get("credits") || 1),
    })
    .eq("id", id);

  if (error) {
    redirect(`/admin?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin");
  redirect("/admin");
}

export async function deleteCatalogCourse(id: string) {
  await requireAdmin();
  const supabase = createClient();
  await supabase.from("catalog_courses").delete().eq("id", id);
  revalidatePath("/admin");
  redirect("/admin");
}

export async function setSchoolYear(formData: FormData) {
  await requireAdmin();

  const next = String(formData.get("school_year") || "").trim();
  const moveExisting = formData.get("move_existing") === "yes";

  const match = /^(\d{4})-(\d{4})$/.exec(next);
  if (!match || Number(match[2]) !== Number(match[1]) + 1) {
    redirect(
      `/admin?msg=${encodeURIComponent("School year must look like 2026-2027 (second year is one more than the first).")}`
    );
  }

  const admin = createAdminClient();
  const { data: row } = await admin
    .from("app_settings")
    .select("value")
    .eq("key", "school_year")
    .maybeSingle();
  const previous = (row?.value as string | undefined) ?? calendarSchoolYear();

  const { error } = await admin.from("app_settings").upsert(
    { key: "school_year", value: next, updated_at: new Date().toISOString() },
    { onConflict: "key" }
  );
  if (error) {
    redirect(`/admin?msg=${encodeURIComponent(error.message)}`);
  }

  let moved = 0;
  if (moveExisting && previous !== next) {
    const { data: updated, error: moveError } = await admin
      .from("courses")
      .update({ school_year: next })
      .eq("school_year", previous)
      .select("id");
    if (moveError) {
      redirect(`/admin?msg=${encodeURIComponent(moveError.message)}`);
    }
    moved = updated?.length ?? 0;
  }

  for (const path of ["/admin", "/courses", "/courses/new", "/onboarding", "/grades", "/dashboard"]) {
    revalidatePath(path);
  }

  const note = moveExisting
    ? `School year set to ${next}. Re-tagged ${moved} course(s) from ${previous}.`
    : `School year set to ${next}. New courses will default to it.`;
  redirect(`/admin?msg=${encodeURIComponent(note)}`);
}
