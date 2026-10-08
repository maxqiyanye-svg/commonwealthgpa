"use client";

import { useMemo, useState } from "react";
import { CATEGORIES, CATEGORY_LABELS } from "@/lib/types";
import type { CatalogCourse, Category, Semester } from "@/lib/types";

type Selected = Pick<CatalogCourse, "name" | "category" | "level" | "credits">;

export default function CourseForm({
  catalog,
  action,
  defaultSchoolYear,
  initial,
  submitLabel = "Add course",
  redirectTo,
}: {
  catalog: CatalogCourse[];
  action: (formData: FormData) => void;
  defaultSchoolYear: string;
  redirectTo?: "/dashboard" | "/courses";
  initial?: Selected & {
    whole_year: boolean;
    semester: Semester | null;
    school_year: string;
  };
  submitLabel?: string;
}) {
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<Category | "All">("All");
  const [selected, setSelected] = useState<Selected | null>(
    initial ? { name: initial.name, category: initial.category, level: initial.level, credits: initial.credits } : null
  );
  const [wholeYear, setWholeYear] = useState(initial?.whole_year ?? true);
  const [semester, setSemester] = useState<Semester>(initial?.semester ?? "Fall");
  const [schoolYear, setSchoolYear] = useState(initial?.school_year ?? defaultSchoolYear);

  const filtered = useMemo(() => {
    return catalog
      .filter((c) => categoryFilter === "All" || c.category === categoryFilter)
      .filter((c) => c.name.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 30);
  }, [catalog, categoryFilter, query]);

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="card p-6">
        <h2 className="font-medium mb-1">Pick a course from the Commonwealth catalog</h2>
        <p className="text-sm text-ink-secondary mb-4">
          Courses come from the catalog only — search, then click one to select it.
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
                {CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
        </div>
        <ul className="max-h-80 overflow-y-auto divide-y divide-line">
          {filtered.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() =>
                  setSelected({ name: c.name, category: c.category, level: c.level, credits: c.credits })
                }
                className={`w-full text-left py-2 text-sm hover:text-accent ${
                  selected?.name === c.name ? "text-accent font-medium" : ""
                }`}
              >
                {c.name}
                <span className="text-ink-muted">
                  {" "}
                  — {CATEGORY_LABELS[c.category]} · {c.level} · {c.credits}cr
                </span>
              </button>
            </li>
          ))}
          {filtered.length === 0 && (
            <li className="py-4 text-sm text-ink-secondary">No matches.</li>
          )}
        </ul>
      </div>

      <form action={action} className="card p-6 space-y-4">
        {redirectTo && <input type="hidden" name="redirect_to" value={redirectTo} />}

        {selected ? (
          <>
            <input type="hidden" name="name" value={selected.name} />
            <input type="hidden" name="category" value={selected.category} />
            <input type="hidden" name="level" value={selected.level} />
            <input type="hidden" name="credits" value={selected.credits} />
            <div>
              <p className="text-xs text-ink-muted uppercase tracking-wide mb-1">Selected course</p>
              <p className="font-medium">{selected.name}</p>
              <p className="text-sm text-ink-secondary">
                {CATEGORY_LABELS[selected.category]} · {selected.level} · {selected.credits} credit
                {selected.credits === 1 ? "" : "s"}
              </p>
            </div>
          </>
        ) : (
          <p className="text-sm text-ink-secondary">
            No course selected yet — pick one from the catalog on the left.
          </p>
        )}

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
          disabled={!selected}
          className="w-full rounded-lg bg-accent text-white py-2 text-sm font-medium disabled:opacity-40"
        >
          {submitLabel}
        </button>
      </form>
    </div>
  );
}
