import { createClient } from "@/lib/supabase/server";

/** Calendar fallback: the school year flips over in July. */
export function calendarSchoolYear(now: Date = new Date()): string {
  const y = now.getFullYear();
  return now.getMonth() >= 6 ? `${y}-${y + 1}` : `${y - 1}-${y}`;
}

/** The school year set in the admin panel, or the calendar guess if none is set. */
export async function getSchoolYear(): Promise<string> {
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "school_year")
      .maybeSingle();
    const value = (data as { value: string } | null)?.value;
    if (value && /^\d{4}-\d{4}$/.test(value)) return value;
  } catch {
    // fall through to the calendar guess
  }
  return calendarSchoolYear();
}
