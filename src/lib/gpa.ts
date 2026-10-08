import type { Letter, Level } from "./types";

// Unweighted 4.0-scale grade points, standard +/- scale (A+ capped at 4.0).
const UNWEIGHTED_POINTS: Record<Letter, number> = {
  "A+": 4.0,
  A: 4.0,
  "A-": 3.7,
  "B+": 3.3,
  B: 3.0,
  "B-": 2.7,
  "C+": 2.3,
  C: 2.0,
  "C-": 1.7,
  "D+": 1.3,
  D: 1.0,
  "D-": 0.7,
  F: 0.0,
};

// At Commonwealth, every course is Honors-level or above — every course
// gets at least the +0.5 floor. AP and AP-equivalent-or-beyond (APE)
// courses get the full +1.0 bonus.
const WEIGHT_BONUS: Record<Level, number> = {
  H: 0.5,
  AP: 1.0,
  APE: 1.0,
};

export function scoreToLetter(score: number): Letter {
  if (score >= 97) return "A+";
  if (score >= 93) return "A";
  if (score >= 90) return "A-";
  if (score >= 87) return "B+";
  if (score >= 83) return "B";
  if (score >= 80) return "B-";
  if (score >= 77) return "C+";
  if (score >= 73) return "C";
  if (score >= 70) return "C-";
  if (score >= 67) return "D+";
  if (score >= 65) return "D";
  if (score >= 60) return "D-";
  return "F";
}

export function letterToUnweightedPoints(letter: Letter): number {
  return UNWEIGHTED_POINTS[letter];
}

export function letterToWeightedPoints(letter: Letter, level: Level): number {
  return UNWEIGHTED_POINTS[letter] + WEIGHT_BONUS[level];
}

export function resolveLetter(letter: Letter | null, score: number | null): Letter | null {
  if (letter) return letter;
  if (score !== null && score !== undefined && !Number.isNaN(score)) {
    return scoreToLetter(score);
  }
  return null;
}

export interface GradeLike {
  letter: Letter | null;
  score: number | null;
}

export interface CourseLike {
  level: Level;
  credits: number;
}

/** Credit-weighted GPA (unweighted and weighted) across a set of (course, grade) pairs. */
export function computeGpa(
  entries: { course: CourseLike; grade: GradeLike }[]
): { unweighted: number | null; weighted: number | null; creditsCounted: number } {
  let unwSum = 0;
  let wSum = 0;
  let creditSum = 0;

  for (const { course, grade } of entries) {
    const letter = resolveLetter(grade.letter, grade.score);
    if (!letter || course.credits <= 0) continue;
    unwSum += letterToUnweightedPoints(letter) * course.credits;
    wSum += letterToWeightedPoints(letter, course.level) * course.credits;
    creditSum += course.credits;
  }

  if (creditSum === 0) {
    return { unweighted: null, weighted: null, creditsCounted: 0 };
  }

  return {
    unweighted: round2(unwSum / creditSum),
    weighted: round2(wSum / creditSum),
    creditsCounted: creditSum,
  };
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Simple linear-regression slope used to describe a trend as improving / declining / steady. */
export function trendSlope(points: number[]): number {
  const n = points.length;
  if (n < 2) return 0;
  const xs = points.map((_, i) => i);
  const xMean = xs.reduce((a, b) => a + b, 0) / n;
  const yMean = points.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - xMean) * (points[i] - yMean);
    den += (xs[i] - xMean) ** 2;
  }
  return den === 0 ? 0 : num / den;
}

export function describeTrend(slope: number): "improving" | "declining" | "steady" {
  if (slope > 0.05) return "improving";
  if (slope < -0.05) return "declining";
  return "steady";
}
