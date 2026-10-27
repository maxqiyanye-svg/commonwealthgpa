import { createClient } from "@/lib/supabase/server";
import { quarterStarts } from "./schoolCalendar";

export type Quarter = "Q1" | "Q2" | "Q3" | "Q4";
export const QUARTER_LIST: Quarter[] = ["Q1", "Q2", "Q3", "Q4"];

/** Calendar guess from the approximate quarter start dates. */
export function calendarQuarter(schoolYear: string, now: Date = new Date()): Quarter {
  const s = quarterStarts(schoolYear);
  if (now >= s.Q4) return "Q4";
  if (now >= s.Q3) return "Q3";
  if (now >= s.Q2) return "Q2";
  return "Q1";
}

/** The quarter set in the admin panel, or the calendar guess if none is set. */
export async function getCurrentQuarter(schoolYear: string): Promise<Quarter> {
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "current_quarter")
      .maybeSingle();
    const value = (data as { value: string } | null)?.value as Quarter | undefined;
    if (value && QUARTER_LIST.includes(value)) return value;
  } catch {
    // fall through
  }
  return calendarQuarter(schoolYear);
}
