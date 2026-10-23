"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function login(formData: FormData) {
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }
  redirect("/dashboard");
}

const REQUIRED_EMAIL_DOMAIN = "@commschool.org";

export async function signup(formData: FormData) {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const fullName = String(formData.get("full_name") || "");
  const gradeLevel = String(formData.get("grade_level") || "");

  if (!email.toLowerCase().endsWith(REQUIRED_EMAIL_DOMAIN)) {
    redirect(
      `/signup?error=${encodeURIComponent("Please use your Commonwealth School email.")}`
    );
  }

  // Create the account already confirmed, using the service-role key. This
  // sends no email at all, so Supabase's email rate limit never applies and
  // the "Confirm email" setting doesn't matter.
  const admin = createAdminClient();
  const { error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, grade_level: gradeLevel },
  });

  if (createError) {
    const msg = /already|registered|exists/i.test(createError.message)
      ? "That email already has an account. Try logging in."
      : createError.message;
    redirect(`/signup?error=${encodeURIComponent(msg)}`);
  }

  // Then sign them in normally so the session cookie is set.
  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }
  redirect("/dashboard");
}

export async function logout() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
