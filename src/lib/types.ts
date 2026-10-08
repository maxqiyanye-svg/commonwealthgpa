export type Category =
  | "English"
  | "History"
  | "Humanities"
  | "Language"
  | "Science"
  | "Mathematics"
  | "Arts"
  | "Electives";

export const CATEGORIES: Category[] = [
  "English",
  "History",
  "Humanities",
  "Language",
  "Science",
  "Mathematics",
  "Arts",
  "Electives",
];

// Short display labels — used anywhere a category is shown in the UI.
export const CATEGORY_LABELS: Record<Category, string> = {
  English: "English",
  History: "History",
  Humanities: "Human.",
  Language: "Lang",
  Science: "Sci",
  Mathematics: "Math",
  Arts: "Arts",
  Electives: "Elect.",
};

export type Level = "H" | "AP" | "APE";

export const LEVELS: { value: Level; label: string }[] = [
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

export interface GradeCategory {
  id: string;
  course_id: string;
  user_id: string;
  name: string;
  weight: number; // 0-100, percent of the course grade
  created_at: string;
}

export interface Assignment {
  id: string;
  category_id: string;
  course_id: string;
  user_id: string;
  period: Period;
  name: string;
  score: number; // points earned
  points_possible: number; // defaults to 100
  created_at: string;
}

// Grade 9-12, collected at signup for the aggregate /admin/stats view.
export type GradeLevel = 9 | 10 | 11 | 12;
export const GRADE_LEVELS: GradeLevel[] = [9, 10, 11, 12];
