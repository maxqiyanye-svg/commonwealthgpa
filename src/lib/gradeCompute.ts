import type { Assignment, GradeCategory, Period } from "./types";
import { scoreToLetter, round2 } from "./gpa";

export interface CategoryResult {
  category: GradeCategory;
  earned: number;
  possible: number;
  pct: number | null; // null when no assignments yet
}

/** Earned/possible points and percentage for one category, within one period. */
export function categoryResult(
  category: GradeCategory,
  assignments: Assignment[],
  period: Period
): CategoryResult {
  const inPeriod = assignments.filter(
    (a) => a.category_id === category.id && a.period === period
  );
  const earned = inPeriod.reduce((sum, a) => sum + a.score, 0);
  const possible = inPeriod.reduce((sum, a) => sum + a.points_possible, 0);
  const pct = possible > 0 ? round2((earned / possible) * 100) : null;
  return { category, earned, possible, pct };
}

export interface CompositeResult {
  pct: number | null;
  letter: ReturnType<typeof scoreToLetter> | null;
  categories: CategoryResult[];
}

/**
 * Weighted composite score for a course in one period, re-normalized over
 * only the categories that actually have assignments yet — so a period
 * with just homework graded so far still produces a sensible running grade
 * instead of waiting on every category to have data.
 */
export function compositeForPeriod(
  categories: GradeCategory[],
  assignments: Assignment[],
  period: Period
): CompositeResult {
  const results = categories.map((c) => categoryResult(c, assignments, period));
  const withData = results.filter((r) => r.pct !== null);

  if (withData.length === 0) {
    return { pct: null, letter: null, categories: results };
  }

  const totalWeight = withData.reduce((sum, r) => sum + r.category.weight, 0);
  if (totalWeight === 0) {
    return { pct: null, letter: null, categories: results };
  }

  const weighted = withData.reduce((sum, r) => sum + r.pct! * r.category.weight, 0);
  const pct = round2(weighted / totalWeight);

  return { pct, letter: scoreToLetter(pct), categories: results };
}
