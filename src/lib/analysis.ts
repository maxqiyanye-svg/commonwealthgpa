import { ALL_PERIODS } from "./types";
import type { Course, Grade, Period, Category } from "./types";
import {
  computeGpa,
  letterToWeightedPoints,
  resolveLetter,
  round2,
  trendSlope,
  describeTrend,
} from "./gpa";

function periodIndex(p: Period): number {
  return ALL_PERIODS.indexOf(p);
}

/** For each course, the most recent entered grade at or before `uptoIndex`. */
function latestGradesAsOf(
  courses: Course[],
  grades: Grade[],
  uptoIndex: number
): { course: Course; grade: Grade }[] {
  const byCourse = new Map<string, Grade[]>();
  for (const g of grades) {
    if (periodIndex(g.period) > uptoIndex) continue;
    const list = byCourse.get(g.course_id) ?? [];
    list.push(g);
    byCourse.set(g.course_id, list);
  }

  const result: { course: Course; grade: Grade }[] = [];
  for (const course of courses) {
    const list = byCourse.get(course.id);
    if (!list || list.length === 0) continue;
    list.sort((a, b) => periodIndex(a.period) - periodIndex(b.period));
    result.push({ course, grade: list[list.length - 1] });
  }
  return result;
}

export interface TimelinePoint {
  period: Period;
  unweighted: number | null;
  weighted: number | null;
}

export function buildTimeline(courses: Course[], grades: Grade[]): TimelinePoint[] {
  const points: TimelinePoint[] = [];
  for (let i = 0; i < ALL_PERIODS.length; i++) {
    const entries = latestGradesAsOf(courses, grades, i);
    if (entries.length === 0) continue;
    const { unweighted, weighted } = computeGpa(entries);
    points.push({ period: ALL_PERIODS[i], unweighted, weighted });
  }
  return points;
}

export interface CurrentGpa {
  unweighted: number | null;
  weighted: number | null;
  creditsCounted: number;
}

export function currentGpa(courses: Course[], grades: Grade[]): CurrentGpa {
  const entries = latestGradesAsOf(courses, grades, ALL_PERIODS.length - 1);
  return computeGpa(entries);
}

export interface CategoryPoint {
  category: Category;
  weighted: number | null;
  unweighted: number | null;
  courseCount: number;
}

export function categoryBreakdown(courses: Course[], grades: Grade[]): CategoryPoint[] {
  const entries = latestGradesAsOf(courses, grades, ALL_PERIODS.length - 1);
  const cats: Category[] = ["English", "History", "Language", "Science", "Mathematics", "Arts"];

  return cats.map((category) => {
    const inCat = entries.filter((e) => e.course.category === category);
    if (inCat.length === 0) {
      return { category, weighted: null, unweighted: null, courseCount: 0 };
    }
    const { unweighted, weighted } = computeGpa(inCat);
    return { category, weighted, unweighted, courseCount: inCat.length };
  });
}

export interface Assessment {
  strongest: Category | null;
  weakest: Category | null;
  trend: "improving" | "declining" | "steady" | null;
}

export function assess(courses: Course[], grades: Grade[]): Assessment {
  const cats = categoryBreakdown(courses, grades).filter((c) => c.weighted !== null);
  let strongest: Category | null = null;
  let weakest: Category | null = null;
  if (cats.length > 0) {
    const sorted = [...cats].sort((a, b) => (b.weighted! - a.weighted!));
    strongest = sorted[0].category;
    weakest = sorted[sorted.length - 1].category;
  }

  const timeline = buildTimeline(courses, grades)
    .map((p) => p.weighted)
    .filter((v): v is number => v !== null);
  const trend = timeline.length >= 2 ? describeTrend(trendSlope(timeline)) : null;

  return { strongest, weakest, trend };
}

/** Per-course grade-over-time series, for the course detail chart. */
export function courseSeries(course: Course, grades: Grade[]) {
  return ALL_PERIODS.map((period) => {
    const g = grades.find((x) => x.course_id === course.id && x.period === period);
    if (!g) return { period, points: null, letter: null as string | null };
    const letter = resolveLetter(g.letter, g.score);
    if (!letter) return { period, points: null, letter: null };
    return {
      period,
      points: round2(letterToWeightedPoints(letter, course.level)),
      letter,
    };
  });
}
