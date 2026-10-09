#!/usr/bin/env python3
"""Generates 15 course-specific grade quotes for every catalog course.

Reads the course names + categories from supabase/seed.sql and writes
src/lib/courseQuotes.ts. Each course gets exactly 15 quotes, split across
the four grade bands (4 excellent, 4 good, 4 needs_improvement, 3 at_risk).
Every quote names the course itself, so the note reads as about that class
rather than the subject area in general.

Deterministic: the same seed.sql always produces the same output file.
"""
import json
import pathlib
import random
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent
SEED = ROOT / "supabase" / "seed.sql"
OUT = ROOT / "src" / "lib" / "courseQuotes.ts"

# (band name, how many quotes per course in this band)
BANDS = [
    ("excellent", 4),
    ("good", 4),
    ("needs_improvement", 4),
    ("at_risk", 3),
]

# What students in each subject actually get graded on, used to make the
# quotes concrete. Same spirit as scripts/gen_commentary.py.
ITEMS = {
    "English": ["essays", "in-class writing", "reading quizzes", "annotations",
                "vocabulary tests", "Harkness discussion", "revisions", "close readings"],
    "History": ["primary-source analysis", "DBQ essays", "map quizzes", "timelines",
                "research papers", "class debates", "reading responses", "unit exams"],
    "Humanities": ["seminar discussion", "position papers", "case studies", "policy analysis",
                   "presentations", "current-events reflections", "debates", "response papers"],
    "Language": ["vocabulary quizzes", "oral participation", "translation homework",
                 "listening comprehension", "composition writing", "grammar drills",
                 "conjugation practice", "culture projects"],
    "Science": ["lab reports", "lab technique", "problem sets", "unit tests",
                "data analysis", "scientific-method write-ups", "diagrams", "reading quizzes"],
    "Mathematics": ["problem sets", "showing work step by step", "quizzes", "unit tests",
                    "proofs", "timed assessments", "practice problems", "concept checks"],
    "Arts": ["technique practice", "portfolio pieces", "rehearsal", "critique participation",
             "sketchbook entries", "projects", "ensemble attendance", "compositions"],
    "Electives": ["class engagement", "reflections", "project milestones", "presentations",
                  "participation", "self-directed work", "peer feedback", "final deliverables"],
}

SKILL = {
    "English": "writing and textual analysis",
    "History": "argument-building from evidence",
    "Humanities": "synthesizing multiple perspectives",
    "Language": "active recall and speaking practice",
    "Science": "connecting data to concepts",
    "Mathematics": "procedural fluency and showing work",
    "Arts": "deliberate, repeated practice",
    "Electives": "self-direction and follow-through",
}

# Six templates per band. {course}, {item}, {skill} are filled per course.
# Each course uses 3-4 of the six per band, so no two quotes in one course
# repeat a template.
TEMPLATES = {
    "excellent": [
        "You're performing at a high level in {course}. Keep up the habits behind {item}, and use the margin to take on something harder.",
        "{course} is one of your strongest classes right now. Don't let {item} slip just because the grade is safe.",
        "This is strong work in {course}. Helping a classmate with {item} would sharpen your own {skill}.",
        "Your {course} grade reflects real command of the material. Consider going deeper on {item} instead of coasting.",
        "You're clearly on top of {course} this quarter. Keep documenting what works for {item} so you can repeat it.",
        "{course} is in good shape. Use any flexibility you have to aim higher on {item} than what's asked.",
    ],
    "good": [
        "You're in solid shape in {course}. A little more care on {item} would likely close the gap to the next grade band.",
        "Your {course} grade is healthy, just short of your ceiling. Look back at recent {item} for a pattern in where points slip.",
        "This is a respectable grade in {course}. Small, consistent gains on {item} are worth more right now than one big push.",
        "You're doing well in {course} overall. Read the feedback on recent {item} closely, not just the score.",
        "{course} is comfortable right now. Budget a bit more time for {item}, the most common soft spot at this level.",
        "You're close to the next band in {course}. Fixing careless errors on {item} could be the whole difference.",
    ],
    "needs_improvement": [
        "{course} is slipping below where your effort should put it. Rebuild a steady routine around {item}.",
        "There's a real gap to close in {course}. Ask for feedback on {item} directly instead of guessing what went wrong.",
        "{course} needs more deliberate attention this quarter. Focus on {skill}, which is usually the root cause at this level.",
        "Treat {item} as the priority in {course} this quarter, even if it means cutting time elsewhere.",
        "Your {course} grade suggests some basics are shaky. Go back over old {item} and sort out understanding from execution.",
        "Set a fixed weekly time for {item} in {course} instead of doing it whenever time is left over.",
    ],
    "at_risk": [
        "{course} needs a real reset, starting now. Talk to your teacher this week about {item}.",
        "This grade in {course} puts you at real risk for the semester. Get outside help focused on {item}.",
        "Break {item} in {course} into smaller pieces and finish them one at a time.",
        "Ask whether makeup or extra-credit {item} are available in {course} while you rebuild the basics.",
        "This is a serious gap in {course} that won't close on its own. Prioritize stabilizing {item} before anything else.",
        "{course} is worth a direct conversation with your teacher about what is going wrong with {item}.",
    ],
}


def parse_courses():
    text = SEED.read_text(encoding="utf-8")
    rows = re.findall(r"^  \('((?:[^']|'')+)', '(?:H|AP|APE)', [\d.]+, '(\w+)'\)", text, re.M)
    if not rows:
        raise SystemExit("No courses found in supabase/seed.sql — check the file format.")
    return [(name.replace("''", "'"), category) for name, category in rows]


def quotes_for(course, category, rng):
    items = ITEMS[category]
    skill = SKILL[category]
    out = []
    for band, count in BANDS:
        templates = rng.sample(TEMPLATES[band], count)
        chosen_items = rng.sample(items, count)
        for template, item in zip(templates, chosen_items):
            text = template.format(course=course, item=item, skill=skill)
            out.append({"tier": band, "text": text})
    return out


def main():
    courses = parse_courses()
    lines = [
        "// AUTO-GENERATED by scripts/gen_course_quotes.py — do not hand-edit.",
        "// Regenerate with: python3 scripts/gen_course_quotes.py",
        "",
        "export type QuoteTier = \"excellent\" | \"good\" | \"needs_improvement\" | \"at_risk\";",
        "",
        "export interface CourseQuote {",
        "  tier: QuoteTier;",
        "  text: string;",
        "}",
        "",
        "export const COURSE_QUOTES: Record<string, CourseQuote[]> = {",
    ]

    seen_names = set()
    for course, category in courses:
        if course in seen_names:
            raise SystemExit(f"Duplicate course name in seed: {course}")
        seen_names.add(course)
        rng = random.Random(course)
        quotes = quotes_for(course, category, rng)
        assert len(quotes) == 15, course
        assert len({q["text"] for q in quotes}) == 15, f"repeat text in {course}"
        lines.append(f"  {json.dumps(course)}: [")
        for q in quotes:
            lines.append(f"    {{ tier: {json.dumps(q['tier'])}, text: {json.dumps(q['text'])} }},")
        lines.append("  ],")

    lines += [
        "};",
        "",
        "const BAND_FOR_TIER: Record<QuoteTier, [number, number]> = {",
        "  excellent: [90, 100.01],",
        "  good: [80, 90],",
        "  needs_improvement: [70, 80],",
        "  at_risk: [0, 70],",
        "};",
        "",
        "/**",
        " * Deterministically pick one of a course's quotes for the score band",
        " * the student is currently in. Same course + same seed always shows the",
        " * same quote, so it doesn't flicker between reloads.",
        " */",
        "export function pickCourseQuote(",
        "  courseName: string,",
        "  pct: number,",
        "  seed: string",
        "): CourseQuote | null {",
        "  const all = COURSE_QUOTES[courseName];",
        "  if (!all) return null;",
        "  const pool = all.filter((q) => {",
        "    const [min, max] = BAND_FOR_TIER[q.tier];",
        "    return pct >= min && pct < max;",
        "  });",
        "  if (pool.length === 0) return null;",
        "  let hash = 0;",
        "  for (let i = 0; i < seed.length; i++) {",
        "    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;",
        "  }",
        "  return pool[hash % pool.length];",
        "}",
        "",
    ]

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text("\n".join(lines), encoding="utf-8")
    print(f"Wrote {len(courses)} courses x 15 quotes = {len(courses) * 15} entries to {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
