import type { Category } from "./types";

// Fixed categorical order (slots 1-6 of the validated palette) — never
// reassigned based on which categories are present, so a category always
// reads as the same color everywhere in the app.
export const CATEGORY_COLORS: Record<Category, string> = {
  English: "#e34948", // red
  History: "#eb6834", // orange
  Humanities: "#1baf7a", // teal (not one Max named — picked to stay distinct)
  Language: "#eda100", // yellow
  Science: "#008300", // green
  Mathematics: "#2a78d6", // blue
  Arts: "#4a3aa7", // purple
  Electives: "#767672", // gray
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
