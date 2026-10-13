import type { Period } from "./types";

/**
 * Approximate Commonwealth School quarter dates. Real dates shift a few days
 * each year; these are close enough to place grades on a timeline.
 * schoolYear looks like "2026-2027".
 */
export function quarterStarts(schoolYear: string): Record<"Q1" | "Q2" | "Q3" | "Q4" | "END", Date> {
  const first = parseInt(schoolYear.slice(0, 4), 10) || new Date().getFullYear();
  const next = first + 1;
  return {
    Q1: new Date(first, 8, 1), // Sep 1
    Q2: new Date(first, 9, 31), // Oct 31
    Q3: new Date(next, 0, 29), // Jan 29
    Q4: new Date(next, 2, 27), // Mar 27
    END: new Date(next, 5, 15), // mid-June
  };
}

const NEXT: Record<"Q1" | "Q2" | "Q3" | "Q4", "Q2" | "Q3" | "Q4" | "END"> = {
  Q1: "Q2",
  Q2: "Q3",
  Q3: "Q4",
  Q4: "END",
};

/** Clamp a date into the window of the quarter it was logged under. */
export function placeInQuarter(date: Date, period: Period, schoolYear: string): Date {
  if (period !== "Q1" && period !== "Q2" && period !== "Q3" && period !== "Q4") return date;
  const starts = quarterStarts(schoolYear);
  const lo = starts[period].getTime();
  const hi = starts[NEXT[period]].getTime() - 86_400_000;
  return new Date(Math.min(Math.max(date.getTime(), lo), hi));
}
