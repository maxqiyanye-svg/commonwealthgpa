import { createClient } from "@/lib/supabase/server";

type Client = ReturnType<typeof createClient>;

export interface PickedQuote {
  label: string;
  text: string;
}

/**
 * Picks the narrowest-range quote from the course_quotes table that covers
 * the student's score, then fills in their weakest category. Same course +
 * same seed always returns the same quote, so it doesn't flicker on reload.
 */
export async function pickCourseQuote(
  supabase: Client,
  courseName: string,
  pct: number,
  seed: string,
  weakest: string | null
): Promise<PickedQuote | null> {
  const { data, error } = await supabase
    .from("course_quotes")
    .select("label,min_pct,max_pct,body")
    .eq("course_name", courseName);

  if (error || !data || data.length === 0) return null;

  const pool = data.filter((q) => pct >= Number(q.min_pct) && pct < Number(q.max_pct));
  if (pool.length === 0) return null;

  const width = (q: { min_pct: unknown; max_pct: unknown }) =>
    Number(q.max_pct) - Number(q.min_pct);
  const narrowest = Math.min(...pool.map(width));
  const best = pool.filter((q) => width(q) === narrowest);

  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  const pick = best[hash % best.length];

  return {
    label: pick.label,
    text: pick.body.split("{weakest}").join(weakest ?? "your weakest category"),
  };
}
