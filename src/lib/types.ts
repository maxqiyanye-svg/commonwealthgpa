export type Category =
  | "English"
  | "History"
  | "Language"
  | "Science"
  | "Mathematics"
  | "Arts";

export const CATEGORIES: Category[] = [
  "English",
  "History",
  "Language",
  "Science",
  "Mathematics",
  "Arts",
];

export type Level = "Regular" | "H" | "AP" | "APE";

export const LEVELS: { value: Level; label: string }[] = [
  { value: "Regular", label: "Regular" },
  { value: "H", label: "Honors (H)" },
  { value: "AP", label: "Advanced Placement (AP)" },
  { value: "APE", label: "AP-equivalent or beyond (APE)" },
];

export type Semester = "Fall" | "Spring";

export type Period = "Q1" | "Q2" | "Q3" | "Q4" | "S1" | "S2";

export const QUARTERS: Period[] = ["Q1", "Q2", "Q3", "Q4"];
export const SEMESTER_PERIODS: Period[] = ["S1", "S2"];
export const ALL_PERIODS: Period[] = ["Q1", "Q2", "S1", "Q3", "Q4", "S2"];

export type Letter =
  | "A+"
  | "A"
  | "A-"
  | "B+"
  | "B"
  | "B-"
  | "C+"
  | "C"
  | "C-"
  | "D+"
  | "D"
  | "D-"
  | "F";

export const LETTERS: Letter[] = [
  "A+",
  "A",
  "A-",
  "B+",
  "B",
  "B-",
  "C+",
  "C",
  "C-",
  "D+",
  "D",
  "D-",
  "F",
];

export interface Course {
  id: string;
  user_id: string;
  name: string;
  category: Category;
  level: Level;
  credits: number;
  whole_year: boolean;
  semester: Semester | null;
  school_year: string; // e.g. "2026-2027"
  created_at: string;
}

export interface Grade {
  id: string;
  course_id: string;
  user_id: string;
  period: Period;
  letter: Letter | null;
  score: number | null;
  created_at: string;
  updated_at: string;
}

export interface CatalogCourse {
  id: string;
  name: string;
  level: Level;
  credits: number;
  category: Category;
}
