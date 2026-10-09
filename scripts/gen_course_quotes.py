#!/usr/bin/env python3
"""Generates 100 course-specific grade quotes for every catalog course.

Reads course names + categories from supabase/seed.sql and writes
src/lib/courseQuotes.ts. Each course gets:

  * 50 "band" quotes: broad feedback for the four grade bands
    (excellent / good / needs improvement / at risk).
  * 50 "interval" quotes: feedback written for each 3-point score interval,
    from below 60% up to 99-100%, with 3-4 quotes per interval.

Every quote names the course. The app shows the narrowest interval quote
that matches a student's score, falling back to band quotes if needed.

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

# ---------------------------------------------------------------------------
# Subject vocabulary
# ---------------------------------------------------------------------------

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

CLOSERS = [
    "",
    " Small, steady effort is what protects this.",
    " Revisit this after your next few grades are in.",
    " Where this lands by the end of the quarter is still in your control.",
    " This is a snapshot, not a verdict.",
]

# ---------------------------------------------------------------------------
# Band quotes (50 per course): four broad bands.
# ---------------------------------------------------------------------------

BAND_BANDS = [
    # (tier, quotes per course, min, max, label)
    ("excellent", 15, 90, 100.01, "Excellent"),
    ("good", 15, 80, 90, "Good"),
    ("needs_improvement", 12, 70, 80, "Needs improvement"),
    ("at_risk", 8, 0, 70, "At risk"),
]

BAND_PIECES = {
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

# ---------------------------------------------------------------------------
# Interval quotes (50 per course): one feedback set per 3-point score interval.
# Each entry: (min, max, label, count, openers, actions). Ranges are [min, max).
# Openers and actions are written for that exact interval, so feedback at
# 91% reads differently from feedback at 88%.
# ---------------------------------------------------------------------------

INTERVALS = [
    (0, 60, "Below 60%", 4,
     [
         "{course} is below 60% right now, so it needs an urgent plan rather than small tweaks.",
         "At under 60% in {course}, the first job is stopping the slide before chasing a better grade.",
         "A {course} grade under 60% is a signal to meet your teacher, not to wait it out.",
         "{course} sitting under 60% means missing work matters more than any single score.",
     ],
     [
         "Make a list of every missing or failed {item} and ask which can still be turned in.",
         "Ask your teacher what the fastest route back to passing in {course} looks like.",
         "Rebuild {item} first, since it likely carries real weight in this grade.",
         "Set up a standing weekly check-in on {item} for the rest of the quarter.",
     ]),
    (60, 63, "60–62%", 3,
     [
         "{course} at 60–62% is technically passing, but there is almost no margin left.",
         "You're sitting on the bottom edge of passing in {course}, around 60–62%.",
         "At 60–62% in {course}, one bad {item} could drop you into failing territory.",
     ],
     [
         "Your next {item} is the highest-leverage thing you can do this week.",
         "Ask whether any {item} can be redone or corrected for partial credit.",
         "Aim for a clear jump, not a narrow escape, by putting extra time into {item}.",
     ]),
    (63, 66, "63–65%", 3,
     [
         "{course} at 63–65% is a D-range grade, and it is still well within reach.",
         "At 63–65% in {course}, you're just above the failing line with real room to climb.",
         "Your {course} grade of 63–65% says the fundamentals need work before anything advanced.",
     ],
     [
         "Fix the basics on {item} before moving on to anything more advanced.",
         "Go to office hours with specific questions about your most recent {item}.",
         "Find the one category in {course} dragging this number down and attack it first.",
     ]),
    (66, 69, "66–68%", 3,
     [
         "{course} at 66–68% has a clear path up, and it runs through {item}.",
         "Sitting at 66–68% in {course}, you're close enough to C-range that a few fixes can show quickly.",
         "A 66–68% in {course} is a grade that moves with focused effort over just a few weeks.",
     ],
     [
         "Redo any {item} where you lost points on a concept rather than a careless slip.",
         "Set a target of two strong {item} in a row before you call this fixed.",
         "Use your teacher's comments on {item} as a checklist for the next one.",
     ]),
    (69, 72, "69–71%", 4,
     [
         "{course} at 69–71% sits right at the C-minus line, so every point is contested.",
         "A 69–71% in {course} is fragile: the next check could push it either way.",
         "You're hovering just above the C-minus cutoff in {course}, at 69–71%.",
         "At 69–71%, {course} is one of the grades most sensitive to a single good week.",
     ],
     [
         "Put your strongest effort into {item}, since small gains there move the grade fastest.",
         "Be deliberate about {skill} this week instead of just doing more of the same.",
         "Keep a running tally of {item} scores so you can see whether you're climbing or slipping.",
         "Ask one specific question per week about {item} so you stop repeating the same mistake.",
     ]),
    (72, 75, "72–74%", 3,
     [
         "{course} at 72–74% is a solid C, with real room to climb back into B territory.",
         "You're in the mid-C range in {course}, around 72–74%, which means the next band is close.",
         "At 72–74%, {course} is stable, and a few clean results would change the picture.",
     ],
     [
         "Focus on consistency in {item}; a few clean results in a row would change the picture.",
         "Look at which {item} cost you the most points and check whether the pattern repeats.",
         "Plan one focused session on {item} before each assessment in {course}.",
     ]),
    (75, 78, "75–77%", 3,
     [
         "{course} at 75–77% is a steady C-plus, and you're closer to B-minus than it may feel.",
         "At 75–77% in {course}, the grade is stable but hasn't yet earned its ceiling.",
         "Your {course} grade of 75–77% is on the cusp of B-minus territory.",
     ],
     [
         "Recheck your {item} against the rubric before turning it in.",
         "A modest increase on {item} would move this into the next band.",
         "Talk with your teacher about one concrete change that would lift {item} by a full band.",
     ]),
    (78, 81, "78–80%", 4,
     [
         "{course} at 78–80% is a respectable B-minus with clear room to improve.",
         "You're near the bottom of the B-minus range in {course}, at 78–80%.",
         "A 78–80% in {course} shows you know the material, but the grade undersells you a little.",
         "At 78–80%, {course} is one or two solid assessments from the next band.",
     ],
     [
         "Tighten up {item} so a single mistake doesn't cost you a full band.",
         "Find where your points are going on {item} and fix the most common error first.",
         "Keep the habits that got you here and add one deliberate practice of {skill}.",
         "Ask for a second look at your last {item} to see whether the grade undersells your understanding.",
     ]),
    (81, 84, "81–83%", 3,
     [
         "{course} at 81–83% is a solid B-range grade, and you're close to the next step up.",
         "A grade between 81 and 83 in {course} means you're handling the material well.",
         "At 81–83%, your {course} work is reliable, with a few spots holding it back.",
     ],
     [
         "Push {item} from good to great by checking your work before you submit.",
         "Use feedback from recent {item} to remove the one habit costing you the most points.",
         "Spend a little extra time on {item} the night before, not the week before.",
     ]),
    (84, 87, "84–86%", 3,
     [
         "{course} at 84–86% is a strong B, with a real chance to move into A territory.",
         "You're comfortably in the B range in {course}, at 84–86%.",
         "At 84–86%, {course} is a grade that rewards steady, deliberate work.",
     ],
     [
         "Target {item} as the place to earn the last few points of the next band.",
         "Ask a classmate who scored higher on {item} how they approached the work.",
         "Keep the routine steady and tighten the one category where you lost the most points.",
     ]),
    (87, 90, "87–89%", 4,
     [
         "{course} at 87–89% is a high B-plus, and one or two clean results could reach A-minus.",
         "Sitting at 87–89% in {course} means the upper B band is yours to claim.",
         "At 87–89%, {course} is close enough to A-minus that precision now matters more than effort.",
         "Your {course} grade of 87–89% reflects strong, consistent understanding.",
     ],
     [
         "Focus on the details of {item}; at this level, precision matters more than effort.",
         "Review your last three {item} for small errors that add up over time.",
         "Use {skill} as your goal for the next assessment to see the grade actually move.",
         "Raise your bar on {item} from done to polished.",
     ]),
    (90, 93, "90–92%", 3,
     [
         "{course} at 90–92% is an A-minus, and it's clear you have the material down.",
         "You're on the edge of A-minus in {course} at 90–92%, a strong result.",
         "At 90–92%, your {course} work is clearly at the top of the B-plus-to-A range.",
     ],
     [
         "Protect this grade by staying consistent on {item} through the end of the quarter.",
         "Consider taking on a harder version of {item} to push past the A-minus line.",
         "Help a classmate on {item}; explaining it will firm up your {skill}.",
     ]),
    (93, 96, "93–95%", 3,
     [
         "{course} at 93–95% is a solid A, and it reflects real command of the material.",
         "A 93–95% in {course} puts you firmly in the A band.",
         "At 93–95%, {course} is one of your strongest results this quarter.",
     ],
     [
         "Keep doing what works on {item}, and write down the routine so you can repeat it.",
         "Look for stretch opportunities in {item} that go beyond the assignment.",
         "Use this grade as a baseline and aim to keep {item} at this level.",
     ]),
    (96, 99, "96–98%", 3,
     [
         "{course} at 96–98% is near the top of the scale, and it shows in your work.",
         "Your {course} grade of 96–98% is exceptional, and the margin for error is tiny.",
         "At 96–98%, {course} is a result most students never reach.",
     ],
     [
         "Protect this by keeping {item} clean; one careless slip is what stands between you and the top.",
         "Share what works on {item} with peers; teaching it cements the {skill} you've built.",
         "Look for a way to show {skill} beyond what the rubric asks for in {item}.",
     ]),
    (99, 100.01, "99–100%", 4,
     [
         "{course} at 99–100% is essentially perfect, and it reflects exceptional work.",
         "A 99–100% in {course} is a rare result. You've mastered the material.",
         "At 99–100%, {course} is as close to flawless as grades get.",
         "Your {course} grade of 99–100% says the work has been near-perfect all quarter.",
     ],
     [
         "Keep the same discipline on {item} that got you here, even when the grade feels settled.",
         "Consider mentoring others on {item}; you have the expertise to help them.",
         "Take the extra challenge in {item} that the class doesn't require.",
         "Use this strength in {skill} to pursue work well beyond the course.",
     ]),
]


def parse_courses():
    text = SEED.read_text(encoding="utf-8")
    rows = re.findall(r"^  \('((?:[^']|'')+)', '(?:H|AP|APE)', [\d.]+, '(\w+)'\)", text, re.M)
    if not rows:
        raise SystemExit("No courses found in supabase/seed.sql — check the file format.")
    return [(name.replace("''", "'"), category) for name, category in rows]


def fill(template, course, item, skill):
    return template.format(course=course, item=item, skill=skill)


def band_quotes(course, category, rng):
    items = ITEMS[category]
    skill = SKILL[category]
    out = []
    for tier, count, lo, hi, label in BAND_BANDS:
        pieces = BAND_PIECES[tier]
        combos = list(itertools.product(pieces["openers"], pieces["actions"], CLOSERS))
        for opener, action, closer in rng.sample(combos, count):
            item = rng.choice(items)
            text = " ".join(fill(p, course, item, skill) for p in (opener, action)) + closer
            out.append({"label": label, "min": lo, "max": hi, "text": text})
    return out


def interval_quotes(course, category, rng):
    items = ITEMS[category]
    skill = SKILL[category]
    out = []
    for lo, hi, label, count, openers, actions in INTERVALS:
        combos = list(itertools.product(openers, actions, CLOSERS))
        if len(combos) < count:
            raise SystemExit(f"Not enough combinations for {label}")
        for opener, action, closer in rng.sample(combos, count):
            item = rng.choice(items)
            text = " ".join(fill(p, course, item, skill) for p in (opener, action)) + closer
            out.append({"label": label, "min": lo, "max": hi, "text": text})
    return out


def main():
    courses = parse_courses()
    lines = [
        "// AUTO-GENERATED by scripts/gen_course_quotes.py — do not hand-edit.",
        "// Regenerate with: python3 scripts/gen_course_quotes.py",
        "",
        "export interface CourseQuote {",
        "  label: string;",
        "  min: number;",
        "  max: number;",
        "  text: string;",
        "}",
        "",
        "export const COURSE_QUOTES: Record<string, CourseQuote[]> = {",
    ]

    seen_names = set()
    per_course = sum(c for _, c, *_ in BAND_BANDS) + sum(i[3] for i in INTERVALS)
    for course, category in courses:
        if course in seen_names:
            raise SystemExit(f"Duplicate course name in seed: {course}")
        seen_names.add(course)
        rng = random.Random(course)
        quotes = band_quotes(course, category, rng) + interval_quotes(course, category, rng)
        assert len(quotes) == per_course == 100, course
        assert len({q["text"] for q in quotes}) == per_course, f"repeat text in {course}"
        lines.append(f"  {json.dumps(course)}: [")
        for q in quotes:
            lines.append(
                "    { label: %s, min: %s, max: %s, text: %s },"
                % (json.dumps(q["label"], ensure_ascii=False), q["min"], q["max"], json.dumps(q["text"], ensure_ascii=False))
            )
        lines.append("  ],")

    lines += [
        "};",
        "",
        "/**",
        " * Pick the narrowest-range quote that covers the student's score, so a",
        " * 91% gets the 90-92% feedback rather than broad A-range advice. Same",
        " * course + same seed always returns the same quote.",
        " */",
        "export function pickCourseQuote(",
        "  courseName: string,",
        "  pct: number,",
        "  seed: string",
        "): CourseQuote | null {",
        "  const all = COURSE_QUOTES[courseName];",
        "  if (!all) return null;",
        "  const pool = all.filter((q) => pct >= q.min && pct < q.max);",
        "  if (pool.length === 0) return null;",
        "  const narrowest = Math.min(...pool.map((q) => q.max - q.min));",
        "  const best = pool.filter((q) => q.max - q.min === narrowest);",
        "  let hash = 0;",
        "  for (let i = 0; i < seed.length; i++) {",
        "    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;",
        "  }",
        "  return best[hash % best.length];",
        "}",
        "",
    ]

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text("\n".join(lines), encoding="utf-8")
    print(f"Wrote {len(courses)} courses x {per_course} quotes = {len(courses) * per_course} entries to {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
