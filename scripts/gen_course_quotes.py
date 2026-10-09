#!/usr/bin/env python3
"""Generates 50 course-specific grade quotes for every catalog course.

Reads the course names + categories from supabase/seed.sql and writes
src/lib/courseQuotes.ts. Each course gets exactly 50 quotes, split across
the four grade bands. Every quote names the course itself, and each is
built from an opener, an action, and a closer so no two in one course
share a sentence.

Deterministic: the same seed.sql always produces the same output file.
"""
import itertools
import json
import pathlib
import random
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent
SEED = ROOT / "supabase" / "seed.sql"
OUT = ROOT / "src" / "lib" / "courseQuotes.ts"

# (band name, quotes per course in this band). Total = 50.
BANDS = [
    ("excellent", 15),
    ("good", 15),
    ("needs_improvement", 12),
    ("at_risk", 8),
]

# What students in each subject actually get graded on.
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

# Each band is opener x action x closer. {course}, {item}, {skill} are filled per course.
PIECES = {
    "excellent": {
        "openers": [
            "You're performing at a high level in {course}.",
            "{course} is one of your strongest classes right now.",
            "This is strong work in {course}.",
            "Your {course} grade reflects real command of the material.",
            "You're clearly on top of {course} this quarter.",
            "{course} is in good shape right now.",
            "Few students hold a grade like this in {course}, and it shows.",
            "Your {course} work has been consistent, and the grade shows it.",
        ],
        "actions": [
            "Keep up the habits behind {item}.",
            "Use the margin to take on something harder in {item}.",
            "Don't let {item} slip just because the grade is safe.",
            "Consider going deeper on {item} instead of coasting.",
            "Helping a classmate with {item} would sharpen your own {skill}.",
            "Keep documenting what works for {item} so you can repeat it.",
            "Aim higher on {item} than what's asked of you.",
            "Use {item} as the place to practice {skill} under real pressure.",
        ],
    },
    "good": {
        "openers": [
            "You're in solid shape in {course}.",
            "This is a respectable grade in {course}, with room to tighten up.",
            "You're doing well in {course} overall.",
            "Your {course} grade is healthy, just short of your ceiling.",
            "{course} is comfortable right now.",
            "You're close to the next band in {course}.",
            "You're handling {course} capably.",
            "The {course} grade is solid, and one or two fixes would lift it.",
        ],
        "actions": [
            "A little more care on {item} would likely close the gap to the next band.",
            "Look back at recent {item} for a pattern in where points slip.",
            "Small, consistent gains on {item} are worth more right now than one big push.",
            "Read the feedback on recent {item} closely, not just the score.",
            "Budget a bit more time for {item}, the most common soft spot at this level.",
            "Fixing careless errors on {item} could be the whole difference.",
            "Ask your teacher exactly what would move your {item} up a band.",
            "Practice {skill} on {item} before the next big check.",
        ],
    },
    "needs_improvement": {
        "openers": [
            "{course} is slipping below where your effort should put it.",
            "There's a real gap to close in {course}.",
            "{course} needs more deliberate attention this quarter.",
            "Your {course} grade suggests some basics are shaky.",
            "This {course} grade is below where your ability should land it.",
            "{course} is one class where the current grade is costing you.",
            "Your {course} grade is in C territory, worth addressing before it slides.",
            "You're getting by in {course}, but not much more than that.",
        ],
        "actions": [
            "Rebuild a steady routine around {item}.",
            "Ask for feedback on {item} directly instead of guessing what went wrong.",
            "Focus on {skill}, which is usually the root cause at this level.",
            "Treat {item} as the priority in {course} this quarter.",
            "Go back over old {item} and sort out understanding from execution.",
            "Set a fixed weekly time for {item} instead of doing it whenever time is left over.",
            "Redo one past {item} on your own to find exactly where the points went.",
            "Make {item} the first thing you check each week, not the last.",
        ],
    },
    "at_risk": {
        "openers": [
            "{course} needs a real reset, starting now.",
            "This grade in {course} puts you at real risk for the semester.",
            "This is a serious gap in {course} that won't close on its own.",
            "Your {course} grade is at a point that needs intervention, not just more effort.",
            "Something in your {course} routine isn't working.",
            "This is the kind of {course} grade worth flagging to your teacher directly.",
            "{course} could cost you the semester if nothing changes.",
            "The {course} grade is well below the rest of your work and needs a plan.",
        ],
        "actions": [
            "Talk to your teacher this week about {item}.",
            "Get outside help focused on {item}.",
            "Break {item} into smaller pieces and finish them one at a time.",
            "Ask whether makeup or extra-credit {item} are available.",
            "Prioritize stabilizing {item} before anything else.",
            "Ask for a short meeting to map out exactly what's missing in {item}.",
            "Start with {item}, since it carries the most weight in {course}.",
            "Keep your other classes steady while you rebuild {item} in {course}.",
        ],
    },
}

CLOSERS = [
    "",
    " Small, steady effort is what protects this.",
    " Revisit this after your next few grades are in.",
    " Where this lands by the end of the quarter is still in your control.",
    " This is a snapshot, not a verdict.",
]


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
        pieces = PIECES[band]
        combos = list(itertools.product(pieces["openers"], pieces["actions"], CLOSERS))
        for opener, action, closer in rng.sample(combos, count):
            item = rng.choice(items)
            sentence = " ".join(
                part.format(course=course, item=item, skill=skill)
                for part in (opener, action)
            ) + closer
            out.append({"tier": band, "text": sentence})
    return out


def main():
    courses = parse_courses()
    total = sum(n for _, n in BANDS)
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
        assert len(quotes) == total, course
        assert len({q["text"] for q in quotes}) == total, f"repeat text in {course}"
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
    print(f"Wrote {len(courses)} courses x {total} quotes = {len(courses) * total} entries to {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
