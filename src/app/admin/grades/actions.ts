"use server";

import { createAdminClient } from "@/lib/supabase/admin";

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
