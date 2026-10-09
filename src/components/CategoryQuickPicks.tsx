"use client";

// Common syllabus-style grading categories, keyed to a reasonable starting
// weight — click one to fill the Add Category form instead of typing it.
// "Exam" is in here deliberately (separate from "Tests") since schools
// often weight midyear/final exams differently from regular unit tests.
const COMMON_CATEGORIES: { name: string; weight: string }[] = [
  { name: "Homework", weight: "20" },
  { name: "Quizzes", weight: "20" },
  { name: "Tests", weight: "25" },
  { name: "Exams", weight: "20" },
  { name: "Papers", weight: "15" },
  { name: "Discussion", weight: "10" },
  { name: "Participation", weight: "10" },
];

export default function CategoryQuickPicks({
  targetNameId,
  targetWeightId,
}: {
  targetNameId: string;
  targetWeightId: string;
}) {
  return (
    <div className="flex flex-wrap gap-1.5 mb-3">
      <span className="text-xs text-ink-muted self-center mr-1">Quick fill:</span>
      {COMMON_CATEGORIES.map(({ name, weight }) => (
        <button
          key={name}
          type="button"
          onClick={() => {
            const nameInput = document.getElementById(targetNameId) as HTMLInputElement | null;
            const weightInput = document.getElementById(targetWeightId) as HTMLInputElement | null;
            if (nameInput) nameInput.value = name;
            if (weightInput) weightInput.value = weight;
            nameInput?.focus();
          }}
          className="text-xs rounded-full border border-line px-2.5 py-1 text-ink-secondary hover:border-accent hover:text-accent"
        >
          {name}
        </button>
      ))}
    </div>
  );
}
