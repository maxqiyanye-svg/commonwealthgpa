"use server";

import crypto from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";

const COOKIE_NAME = "admin_grades_auth";
// Effectively "remember this device forever" — the only way back to the
// password screen is clicking Log out, which deletes the cookie outright.
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365 * 10; // 10 years

function expectedToken(): string | null {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) return null;
  return crypto.createHmac("sha256", pw).update("commonwealth-gpa-admin-grades").digest("hex");
}

export async function isAdminGradesAuthed(): Promise<boolean> {
  const expected = expectedToken();
  if (!expected) return false;

  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return false;

  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export async function adminGradesLogin(formData: FormData) {
  const password = String(formData.get("password") || "");
  const expected = process.env.ADMIN_PASSWORD;

  if (!expected || password !== expected) {
    redirect(`/admin/grades?error=${encodeURIComponent("Wrong password.")}`);
  }

  cookies().set(COOKIE_NAME, expectedToken()!, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });

  redirect("/admin/grades");
}

export async function adminGradesLogout() {
  cookies().delete(COOKIE_NAME);
  redirect("/admin/grades");
}

export interface AdminGradeRow {
  student_name: string | null;
  student_email: string;
  grade_level: number | null;
  course_name: string;
  category: string;
  level: string;
  credits: number;
  school_year: string;
  period: string;
  letter: string | null;
  score: number | null;
}

export async function fetchAllGrades(): Promise<AdminGradeRow[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("admin_grades_detail");
  if (error) throw error;
  return (data ?? []) as AdminGradeRow[];
}
