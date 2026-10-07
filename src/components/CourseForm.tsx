"use client";

import { useMemo, useState } from "react";
import { CATEGORIES, LEVELS } from "@/lib/types";
import type { CatalogCourse, Category, Level, Semester } from "@/lib/types";

export default function CourseForm({
  catalog,
  action,
  defaultSchoolYear,
  initial,
  submitLabel = "Add course",
}: {
  catalog: CatalogCourse[];
  action: (formData: FormData) => void;
  defaultSchoolYear: string;
  initial?: {
    name: string;
    category: Category;
    level: Level;
    credits: number;
    whole_year: boolean;
    semester: Semester | null;
    school_year: string;
  };
  submitLabel?: string;
}) {
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<Category | "All">("All");
  const [name, setName] = useState(initial?.name ?? "");
  const [category, setCategory] = useState<Category>(initial?.category ?? "English");
  const [level, setLevel] = useState<Level>(initial?.level ?? "Regular");
  const [credits, setCredits] = useState(initial?.credits ?? 1);
  const [wholeYear, setWholeYear] = useState(initial?.whole_year ?? true);
  const [semester, setSemester] = useState<Semester>(initial?.semester ?? "Fall");
  const [schoolYear, setSchoolYear] = useState(initial?.school_year ?? defaultSchoolYear);

  const filtered = useMemo(() => {
    return catalog
      .filter((c) => categoryFilter === "All" || c.category === categoryFilter)
      .filter((c) => c.name.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 30);
  }, [catalog, categoryFilter, query]);

  function pickCatalogCourse(c: CatalogCourse) {
    setName(c.name);
    setCategory(c.category);
    setLevel(c.level);
    setCredits(c.credits);
    setQuery("");
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="card p-6">
        <h2 className="font-medium mb-1">Pick from the Commonwealth catalog</h2>
        <p className="text-sm text-ink-secondary mb-4">
          Optional — search, click a course to fill in the form, then adjust and save.
        </p>
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            placeholder="Search courses…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 rounded-lg border border-line bg-transparent px-3 py-2 text-sm"
          />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as Category | "All")}
            className="rounded-lg border border-line bg-transparent px-2 py-2 text-sm"
          >
            <option value="All">All</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <ul className="max-h-80 overflow-y-auto divide-y divide-line">
          {filtered.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => pickCatalogCourse(c)}
                className="w-full text-left py-2 text-sm hover:text-cat-english"
              >
                {c.name}
                <span className="text-ink-muted"> — {c.category} · {c.level} · {c.credits}cr</span>
              </button>
            </li>
          ))}
          {filtered.length === 0 && (
            <li className="py-4 text-sm text-ink-secondary">No matches.</li>
          )}
        </ul>
      </div>

      <form action={action} className="card p-6 space-y-4">
        <h2 className="font-medium">Course details</h2>

        <div>
          <label className="block text-sm mb-1">Name</label>
          <input
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full rounded-lg border border-line bg-transparent px-3 py-2 text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">Category</label>
            <select
              name="category"
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              className="w-full rounded-lg border border-line bg-transparent px-3 py-2 text-sm"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Level</label>
            <select
              name="level"
              value={level}
              onChange={(e) => setLevel(e.target.value as Level)}
              className="w-full rounded-lg border border-line bg-transparent px-3 py-2 text-sm"
            >
              {LEVELS.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">Credits</label>
            <input
              type="number"
              step="0.25"
              min="0"
              name="credits"
              value={credits}
              onChange={(e) => setCredits(Number(e.target.value))}
              className="w-full rounded-lg border border-line bg-transparent px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">School year</label>
            <input
              type="text"
              name="school_year"
              placeholder="2026-2027"
              value={schoolYear}
              onChange={(e) => setSchoolYear(e.target.value)}
              required
              className="w-full rounded-lg border border-line bg-transparent px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="whole_year"
            name="whole_year"
            checked={wholeYear}
            onChange={(e) => setWholeYear(e.target.checked)}
            className="h-4 w-4"
          />
          <label htmlFor="whole_year" className="text-sm">
            Whole Year course
          </label>
        </div>

        {!wholeYear && (
          <div>
            <label className="block text-sm mb-1">Semester</label>
            <select
              name="semester"
              value={semester}
              onChange={(e) => setSemester(e.target.value as Semester)}
              className="w-full rounded-lg border border-line bg-transparent px-3 py-2 text-sm"
            >
              <option value="Fall">Fall</option>
              <option value="Spring">Spring</option>
            </select>
          </div>
        )}

        <button
          type="submit"
          className="w-full rounded-lg bg-cat-english text-white py-2 text-sm font-medium"
        >
          {submitLabel}
        </button>
      </form>
    </div>
  );
}
