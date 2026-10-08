"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// This admin page is intentionally open (no login check) — it only edits
// the shared catalog_courses reference table, not anyone's personal data.

export async function addCatalogCourse(formData: FormData) {
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
  const supabase = createClient();
  await supabase.from("catalog_courses").delete().eq("id", id);
  revalidatePath("/admin");
  redirect("/admin");
}
