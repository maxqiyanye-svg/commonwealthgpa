import type { Category } from "./types";

// Fixed categorical order (slots 1-6 of the validated palette) — never
// reassigned based on which categories are present, so a category always
// reads as the same color everywhere in the app.
export const CATEGORY_COLORS: Record<Category, string> = {
  English: "#2a78d6", // blue
  History: "#eb6834", // orange
  Humanities: "#1baf7a", // aqua
  Language: "#eda100", // yellow
  Science: "#e87ba4", // magenta
  Mathematics: "#008300", // green
  Arts: "#4a3aa7", // violet
  Specialty: "#e34948", // red
};

export const SERIES_UNWEIGHTED = "#2a78d6"; // blue
export const SERIES_WEIGHTED = "#4a3aa7"; // violet

export const CHART_INK = {
  grid: "#e1e0d9",
  axis: "#c3c2b7",
  muted: "#898781",
  secondary: "#52514e",
  primary: "#0b0b0b",
};
