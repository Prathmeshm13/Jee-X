"""Generate JEE Main 2022 questions with Gemini and dump them as JeeX question files.

Output follows docs/database-schema.md section 15: one file per chapter at
<out>/<subject>/<chapter-slug>.json. Files already there are merged into, never replaced.

Gemini answers from its own training data only. No tools are passed, so there is no
Google Search grounding and no search cost.

Each question gets a difficulty from 1 (very easy) to 10 (very hard), and an `image` when the
original has a figure. The model can only offer an image URL it remembers, and such URLs are
often made up, so each one is fetched and kept only if it really serves an image. Otherwise
`image.url` is null and `image.alt` describes the figure so it can be sourced or redrawn.

Token saving:
  - a short system prompt; the output shape is enforced by a JSON response schema
    instead of sending the 900-line schema doc with every request
  - compact response keys (options as 4 plain strings, one answer key), expanded to
    the full file format locally
  - one small request per shift / subject / section, cached on disk, so re-runs and
    retries never pay for the same section twice
  - thinking is set to the lowest the model allows (minimal on Gemini 3+ Flash, off on
    2.5 Flash); the schema asks for the solution before the answer key, so the model
    still works the answer out

Setup:
  pip install google-genai
  put your key in scripts/.env as GEMINI_API_KEY=... (or set it in the environment).
  Several keys may be comma-separated; they are rotated when one hits a rate limit.

Usage:
  python scripts/generate_pyqs.py
  python scripts/generate_pyqs.py --shift "26 Jun 2022, Shift 1" --shift "28 Jul 2022, Shift 2"
  python scripts/generate_pyqs.py --subjects PHY --dry-run
  python scripts/generate_pyqs.py --out backend/data/questions
"""

import argparse
import http.client
import json
import os
import re
import sys
import time
import urllib.request
from functools import lru_cache
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ENV_FILE = Path(__file__).resolve().parent / ".env"

DEFAULT_MODEL = "gemini-3.5-flash"
DEFAULT_FALLBACK_MODEL = "gemini-2.5-flash"  # used when the main model stays overloaded
DEFAULT_SHIFTS = ["24 Jun 2022, Shift 1", "25 Jul 2022, Shift 1"]
MAX_OUTPUT_TOKENS = 16384
RETRIES = 5
RETRYABLE = (429, 500, 502, 503, 504)
THINKING_LEVELS = ("minimal", "low", "medium", "high")
CACHE_VERSION = 2  # bump when the compact response format changes, so old cached responses aren't reused
IMAGE_CHECK_TIMEOUT = 10

EXAM, YEAR = "jee_main", 2022

# code -> (folder, display name, first question number in the paper)
SUBJECTS = {
    "PHY": ("physics", "Physics", 1),
    "CHEM": ("chemistry", "Chemistry", 31),
    "MATH": ("mathematics", "Mathematics", 61),
}

# JEE Main 2022 paper: per subject, Section A = 20 single-correct MCQs,
# Section B = 10 numerical questions (integer answers, attempt any 5).
SECTIONS = {
    "A": (20, "single-correct MCQs", False),
    "B": (10, "numerical-answer questions with integer answers", True),
}

# JEE Main 2022 syllabus. slug | ref code | name | class_level | in_advanced
SYLLABUS = {
    "PHY": """
units-dimensions|UND|Units, Dimensions and Errors|11|1
kinematics|KIN|Kinematics|11|1
laws-of-motion|LOM|Laws of Motion|11|1
work-energy-power|WEP|Work, Energy and Power|11|1
rotational-motion|ROT|Rotational Motion|11|1
gravitation|GRV|Gravitation|11|1
mechanical-properties-solids|MPS|Mechanical Properties of Solids|11|1
fluid-mechanics|FLU|Mechanical Properties of Fluids|11|1
thermal-properties|THP|Thermal Properties of Matter|11|1
thermodynamics|THD|Thermodynamics|11|1
kinetic-theory|KTG|Kinetic Theory of Gases|11|1
oscillations|OSC|Oscillations|11|1
waves|WAV|Waves|11|1
electrostatics|ELS|Electric Charges, Fields and Potential|12|1
capacitance|CAP|Capacitance|12|1
current-electricity|CUR|Current Electricity|12|1
moving-charges-magnetism|MAG|Moving Charges and Magnetism|12|1
magnetism-matter|MGM|Magnetism and Matter|12|1
electromagnetic-induction|EMI|Electromagnetic Induction|12|1
alternating-current|ACC|Alternating Current|12|1
electromagnetic-waves|EMW|Electromagnetic Waves|12|1
ray-optics|RAY|Ray Optics|12|1
wave-optics|WVO|Wave Optics|12|1
dual-nature|DUN|Dual Nature of Radiation and Matter|12|1
atoms|ATM|Atoms|12|1
nuclei|NUC|Nuclei|12|1
semiconductors|SEM|Semiconductor Electronics|12|0
communication-systems|COM|Communication Systems|12|0
experimental-skills|EXP|Experimental Skills|12|0
""",
    "CHEM": """
basic-concepts|MOL|Some Basic Concepts of Chemistry|11|1
atomic-structure|ATS|Atomic Structure|11|1
periodic-classification|PER|Classification of Elements and Periodicity|11|1
chemical-bonding|BND|Chemical Bonding and Molecular Structure|11|1
states-of-matter|STM|States of Matter: Gases and Liquids|11|1
chemical-thermodynamics|CTD|Chemical Thermodynamics|11|1
chemical-equilibrium|CEQ|Chemical Equilibrium|11|1
ionic-equilibrium|IEQ|Ionic Equilibrium|11|1
redox-reactions|RDX|Redox Reactions|11|1
hydrogen|HYD|Hydrogen|11|1
s-block|SBL|s-Block Elements|11|1
p-block-13-14|PB1|p-Block Elements (Groups 13-14)|11|1
goc|GOC|Some Basic Principles of Organic Chemistry|11|1
purification-characterisation|POC|Purification and Characterisation of Organic Compounds|11|1
hydrocarbons|HYC|Hydrocarbons|11|1
environmental-chemistry|ENV|Environmental Chemistry|11|0
solid-state|SST|Solid State|12|1
solutions|SOL|Solutions|12|1
electrochemistry|ELC|Electrochemistry|12|1
chemical-kinetics|CKN|Chemical Kinetics|12|1
surface-chemistry|SUR|Surface Chemistry|12|1
metallurgy|MET|General Principles and Processes of Isolation of Metals|12|1
p-block-15-18|PB2|p-Block Elements (Groups 15-18)|12|1
d-f-block|DFB|d- and f-Block Elements|12|1
coordination-compounds|COR|Coordination Compounds|12|1
haloalkanes-haloarenes|HAL|Haloalkanes and Haloarenes|12|1
alcohols-phenols-ethers|APE|Alcohols, Phenols and Ethers|12|1
aldehydes-ketones-acids|ALD|Aldehydes, Ketones and Carboxylic Acids|12|1
amines|AMN|Organic Compounds Containing Nitrogen|12|1
polymers|POL|Polymers|12|1
biomolecules|BIO|Biomolecules|12|1
chemistry-everyday-life|CEL|Chemistry in Everyday Life|12|0
practical-chemistry|PRC|Principles Related to Practical Chemistry|12|0
""",
    "MATH": """
sets-relations-functions|SRF|Sets, Relations and Functions|11|1
trigonometry|TRG|Trigonometric Functions and Equations|11|1
complex-numbers|CPX|Complex Numbers|11|1
quadratic-equations|QEQ|Quadratic Equations|11|1
mathematical-induction|MIN|Mathematical Induction|11|1
permutations-combinations|PNC|Permutations and Combinations|11|1
binomial-theorem|BIN|Binomial Theorem|11|1
sequences-series|SEQ|Sequences and Series|11|1
straight-lines|STL|Straight Lines|11|1
circles|CIR|Circles|11|1
conic-sections|CON|Conic Sections|11|1
limits|LIM|Limits|11|1
statistics|STA|Statistics|11|0
mathematical-reasoning|MRE|Mathematical Reasoning|11|0
matrices-determinants|MAT|Matrices and Determinants|12|1
inverse-trigonometry|ITF|Inverse Trigonometric Functions|12|1
continuity-differentiability|CND|Continuity and Differentiability|12|1
application-of-derivatives|AOD|Applications of Derivatives|12|1
indefinite-integrals|IND|Indefinite Integrals|12|1
definite-integrals|DEF|Definite Integrals|12|1
area-under-curves|AUC|Area Under Curves|12|1
differential-equations|DEQ|Differential Equations|12|1
vectors|VEC|Vector Algebra|12|1
three-d-geometry|TDG|Three Dimensional Geometry|12|1
probability|PRB|Probability|12|1
""",
}


def parse_syllabus():
    chapters = {}
    for subj, table in SYLLABUS.items():
        chapters[subj] = {}
        for pos, line in enumerate(table.strip().splitlines(), start=1):
            slug, code, name, class_level, adv = line.split("|")
            chapters[subj][slug] = {
                "code": code, "name": name, "class_level": class_level,
                "in_advanced": adv == "1", "position": pos,
            }
    return chapters


CHAPTERS = parse_syllabus()

SYSTEM = """You reproduce past JEE Main papers from memory for a question bank. Recall the actual questions of the requested shift, in paper order.
- conf: "exact" if you recall the real question; otherwise "approx" with the closest faithful reconstruction (same concept and style).
- Markdown text. Every mathematical expression in LaTeX inside $...$; units like $5\\ \\mathrm{m/s}$.
- opts: the four option texts in order A-D, without "(A)" labels.
- sol: brief worked solution, at most 6 short lines, reaching the answer.
- key: the correct option letter, or the numerical answer.
- ch: chapter slug. sub: kebab-case subtopic slug within that chapter, reusing a listed one when it fits; sub_name: its title.
- img: true only if the original question shows a figure, graph or circuit needed to solve it. img_desc: if img, describe the figure fully enough to redraw it (shapes, labels, values); else "". img_url: a direct URL to that figure's image file only if you actually know one; else "". Never invent a URL.
- diff: integer 1-10 for a JEE Main aspirant: 1 = direct recall of a formula or fact, 5 = typical JEE Main question, 10 = among the hardest in the paper. secs: realistic solving time in seconds."""

DIFFICULTY_MIN, DIFFICULTY_MAX = 1, 10
OPTION_LABEL = re.compile(r"^\s*(?:\([A-D]\)\s*|[A-D][.)]\s+)")


def default_secs(difficulty):
    """60 s at difficulty 1 up to 180 s at 10 (the old easy and hard defaults)."""
    return round(60 + (difficulty - DIFFICULTY_MIN) * 120 / (DIFFICULTY_MAX - DIFFICULTY_MIN))


def slugify(text):
    return re.sub(r"[^a-z0-9]+", "-", str(text).lower()).strip("-")


def stem_key(shift, stem):
    return shift, re.sub(r"\W+", "", stem.lower())


def response_schema(subj, numerical):
    props = {
        "ch": {"type": "STRING", "enum": list(CHAPTERS[subj])},
        "sub": {"type": "STRING"},
        "sub_name": {"type": "STRING"},
        "conf": {"type": "STRING", "enum": ["exact", "approx"]},
        "stem": {"type": "STRING"},
        "img": {"type": "BOOLEAN"},
        "img_desc": {"type": "STRING"},
        "img_url": {"type": "STRING"},
    }
    if not numerical:
        props["opts"] = {"type": "ARRAY", "items": {"type": "STRING"}, "min_items": 4, "max_items": 4}
    # Solution before key: the answer is derived rather than guessed, without paying for thinking.
    props["sol"] = {"type": "STRING"}
    props["key"] = {"type": "NUMBER"} if numerical else {"type": "STRING", "enum": list("ABCD")}
    # Rated after the solution, so difficulty and time reflect the worked answer.
    props["diff"] = {"type": "INTEGER", "minimum": DIFFICULTY_MIN, "maximum": DIFFICULTY_MAX}
    props["secs"] = {"type": "INTEGER"}
    return {
        "type": "ARRAY",
        "items": {"type": "OBJECT", "properties": props,
                  "required": list(props), "property_ordering": list(props)},
    }


def build_prompt(shift, subj, section, known_subtopics):
    count, kind, _ = SECTIONS[section]
    _, name, first = SUBJECTS[subj]
    start = first + (0 if section == "A" else SECTIONS["A"][0])
    prompt = f"JEE Main {YEAR}, {shift}, {name}, Section {section}: {count} {kind} (Q{start}-{start + count - 1})."
    if known_subtopics:
        lines = "\n".join(f"{ch}: {', '.join(subs)}" for ch, subs in known_subtopics.items())
        prompt += f"\nExisting subtopics:\n{lines}"
    return prompt


@lru_cache(maxsize=None)
def verified_image_url(url):
    """Returns url if it actually serves an image, else None. Model-recalled URLs are often made up."""
    if not url:
        return None
    if not re.match(r"https?://", url, re.I):
        print(f"    dropped image URL {url!r}: not http(s)")
        return None
    request = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (JeeX question generator)"})
    try:
        with urllib.request.urlopen(request, timeout=IMAGE_CHECK_TIMEOUT) as response:
            content_type = response.headers.get_content_type()
    except (OSError, ValueError, http.client.HTTPException) as e:
        print(f"    dropped image URL {url}: {e}")
        return None
    if not content_type.startswith("image/"):
        print(f"    dropped image URL {url}: serves {content_type}, not an image")
        return None
    return url


def build_image(item):
    """The question's `image` entry, or None when the original has no figure."""
    if not item.get("img"):
        return None
    alt = str(item.get("img_desc") or "").strip() or "Figure referred to in the question; not described."
    return {"url": verified_image_url(str(item.get("img_url") or "").strip()), "alt": alt}


def build_question(item, numerical, shift):
    """Expand one compact model item into a question-file entry (schema section 15). Raises ValueError."""
    stem = str(item.get("stem") or "").strip()
    solution = str(item.get("sol") or "").strip()
    if not stem or not solution:
        raise ValueError("empty stem or solution")
    try:
        difficulty = min(max(round(float(item.get("diff"))), DIFFICULTY_MIN), DIFFICULTY_MAX)
    except (TypeError, ValueError):
        difficulty = 5
    try:
        secs = int(item.get("secs") or 0)
    except (TypeError, ValueError):
        secs = 0
    secs = min(max(secs, 30), 600) if secs else default_secs(difficulty)

    question = {
        "ref": None,
        "subtopic": slugify(item.get("sub")) or "general",
        "type": "numerical" if numerical else "single_correct",
        "difficulty": difficulty,
        "expected_time_sec": secs,
        # 'adapted' marks questions the model could only reconstruct, not recall.
        "source_type": "pyq" if item.get("conf") == "exact" else "adapted",
        "exam": EXAM,
        "year": YEAR,
        "shift": shift,
        "status": "draft",
        "stem": stem,
        "image": build_image(item),
    }
    if numerical:
        try:
            value = float(item.get("key"))
        except (TypeError, ValueError):
            raise ValueError(f"non-numeric answer {item.get('key')!r}")
        question["answer"] = {"min": value, "max": value}
    else:
        opts = item.get("opts") or []
        key = str(item.get("key") or "").strip().upper()
        if len(opts) != 4:
            raise ValueError(f"{len(opts)} options instead of 4")
        if key not in ("A", "B", "C", "D"):
            raise ValueError(f"bad answer key {key!r}")
        question["options"] = [
            {"label": label, "content": OPTION_LABEL.sub("", str(text), count=1).strip(), "is_correct": label == key}
            for label, text in zip("ABCD", opts)
        ]
        if not all(o["content"] for o in question["options"]):
            raise ValueError("empty option")
    question["solution"] = solution
    return question


class ChapterFiles:
    """Chapter files under <out>, loaded if present and merged into."""

    def __init__(self, out):
        self.out = out
        self.files = {}  # (subject, chapter slug) -> [path, data]
        self.dirty = set()
        self.seen = set()  # (shift, normalised stem) of every question already stored
        self.figures = {"total": 0, "with_url": 0}  # among questions added this run
        for subj, (folder, _, _) in SUBJECTS.items():
            for path in sorted((out / folder).glob("*.json")):
                data = json.loads(path.read_text(encoding="utf-8"))
                self.files[(data["subject"], data["chapter"]["slug"])] = [path, data]
                for q in data["questions"]:
                    self.seen.add(stem_key(q.get("shift"), q["stem"]))

    def known_subtopics(self, subj):
        return {slug: [s["slug"] for s in data["subtopics"]]
                for (s, slug), (_, data) in self.files.items() if s == subj and data["subtopics"]}

    def chapter(self, subj, slug):
        if (subj, slug) not in self.files:
            ch = CHAPTERS[subj][slug]
            data = {
                "subject": subj,
                "chapter": {"name": ch["name"], "slug": slug, "class_level": ch["class_level"],
                            "in_main": True, "in_advanced": ch["in_advanced"], "position": ch["position"]},
                "subtopics": [],
                "passages": [],
                "questions": [],
            }
            self.files[(subj, slug)] = [self.out / SUBJECTS[subj][0] / f"{slug}.json", data]
        return self.files[(subj, slug)][1]

    def add(self, subj, item, numerical, shift):
        """Returns 'added' or 'duplicate'; raises ValueError for an invalid item."""
        slug = item.get("ch")
        if slug not in CHAPTERS[subj]:
            raise ValueError(f"unknown chapter {slug!r}")
        question = build_question(item, numerical, shift)
        key = stem_key(shift, question["stem"])
        if key in self.seen:
            return "duplicate"

        data = self.chapter(subj, slug)
        subtopics = data["subtopics"]
        if question["subtopic"] not in {s["slug"] for s in subtopics}:
            name = str(item.get("sub_name") or "").strip() or question["subtopic"].replace("-", " ").title()
            position = max((s.get("position", 0) for s in subtopics), default=0) + 1
            subtopics.append({"slug": question["subtopic"], "name": name, "position": position})

        prefix = f"{subj}-{CHAPTERS[subj][slug]['code']}-"
        numbers = [int(m.group(1)) for q in data["questions"]
                   if (m := re.fullmatch(re.escape(prefix) + r"(\d+)", q["ref"]))]
        question["ref"] = f"{prefix}{max(numbers, default=0) + 1:03d}"

        data["questions"].append(question)
        self.seen.add(key)
        self.dirty.add((subj, slug))
        if question["image"]:
            self.figures["total"] += 1
            self.figures["with_url"] += question["image"]["url"] is not None
        return "added"

    def save(self):
        for key in sorted(self.dirty):
            path, data = self.files[key]
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
            print(f"  wrote {path} ({len(data['questions'])} questions)")


def thinking_config(types, model, setting):
    """setting: a level name, a token budget, or None for the cheapest the model allows."""
    if setting is None:
        if model.startswith("gemini-2.5"):
            setting = "0" if "flash" in model else "128"
        else:
            setting = "minimal" if "flash" in model else "low"
    if setting.isdigit():
        return types.ThinkingConfig(thinking_budget=int(setting))
    return types.ThinkingConfig(thinking_level=setting.upper())


class Gemini:
    def __init__(self, model, keys, thinking, fallback):
        from google import genai
        from google.genai import errors, types

        self.genai, self.errors, self.types = genai, errors, types
        self.model, self.keys, self.thinking, self.fallback = model, keys, thinking, fallback
        self.key_index = 0
        self.client = genai.Client(api_key=keys[0])
        self.usage = {"input": 0, "output": 0, "thinking": 0}

    def rotate_key(self):
        if len(self.keys) > 1:
            self.key_index = (self.key_index + 1) % len(self.keys)
            self.client = self.genai.Client(api_key=self.keys[self.key_index])

    def generate(self, prompt, schema):
        while True:
            try:
                return self._generate(prompt, schema)
            except self.errors.APIError as e:
                if e.code not in RETRYABLE or not self.fallback or self.fallback == self.model:
                    raise
                print(f"    {self.model} still unavailable; switching to {self.fallback} for the rest of the run")
                # A thinking level set for the main model may not apply to the fallback.
                self.model, self.fallback, self.thinking = self.fallback, None, None

    def _generate(self, prompt, schema):
        config = self.types.GenerateContentConfig(
            system_instruction=SYSTEM,
            response_mime_type="application/json",
            response_schema=schema,
            # Gemini 3+ is tuned for its default temperature; lower values can make it loop.
            temperature=0.2 if self.model.startswith("gemini-2") else None,
            max_output_tokens=MAX_OUTPUT_TOKENS,
            thinking_config=thinking_config(self.types, self.model, self.thinking),
            # No tools and AFC off: the model answers from its own knowledge, never Google Search.
            automatic_function_calling=self.types.AutomaticFunctionCallingConfig(disable=True),
        )
        for attempt in range(1, RETRIES + 1):
            try:
                response = self.client.models.generate_content(model=self.model, contents=prompt, config=config)
                usage = response.usage_metadata
                if usage:
                    self.usage["input"] += usage.prompt_token_count or 0
                    self.usage["output"] += usage.candidates_token_count or 0
                    self.usage["thinking"] += usage.thoughts_token_count or 0
                try:
                    items = json.loads(response.text or "")
                except ValueError:
                    finish = response.candidates[0].finish_reason if response.candidates else None
                    raise ValueError(f"unparseable output, finish reason {finish}")
                if not isinstance(items, list):
                    raise ValueError("response is not a JSON array")
                return items
            except self.errors.APIError as e:
                if e.code not in RETRYABLE or attempt == RETRIES:
                    raise
                if e.code == 429:
                    self.rotate_key()
                reason = f"{e.code} {e.status}: {e.message}"
            except ValueError as e:
                if attempt >= 2:  # a second bad answer rarely turns into a good one; stop paying
                    raise
                reason = str(e)
            wait = 5 * 2 ** (attempt - 1)
            print(f"    {reason}; retrying in {wait}s")
            time.sleep(wait)


def load_env():
    """Read KEY=VALUE lines from scripts/.env; real environment variables win."""
    if not ENV_FILE.exists():
        return
    for line in ENV_FILE.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            key, value = line.split("=", 1)
            value = value.strip().strip("'\"")
            if value:
                os.environ.setdefault(key.strip(), value)


def api_keys():
    raw = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY") or ""
    return [k.strip() for k in raw.split(",") if k.strip()]


def main():
    load_env()  # before argparse, so GEMINI_MODEL from .env is the --model default
    parser = argparse.ArgumentParser(description="Generate JEE Main 2022 questions with Gemini (no web search).")
    parser.add_argument("--shift", action="append", dest="shifts",
                        help=f"shift label, repeatable (default: {' and '.join(DEFAULT_SHIFTS)})")
    parser.add_argument("--subjects", nargs="+", choices=list(SUBJECTS), default=list(SUBJECTS))
    parser.add_argument("--out", type=Path, default=ROOT / "generated" / "questions")
    parser.add_argument("--model", default=os.environ.get("GEMINI_MODEL", DEFAULT_MODEL))
    parser.add_argument("--fallback-model", default=os.environ.get("GEMINI_FALLBACK_MODEL", DEFAULT_FALLBACK_MODEL),
                        help='model to switch to if the main one stays unavailable; "none" to disable')
    parser.add_argument("--thinking", default=os.environ.get("GEMINI_THINKING"),
                        help=f"thinking level ({'/'.join(THINKING_LEVELS)}) or token budget "
                             "(default: the cheapest the model allows)")
    parser.add_argument("--refresh", action="store_true", help="ignore cached responses and call Gemini again")
    parser.add_argument("--dry-run", action="store_true", help="print the prompts that would be sent, call nothing")
    args = parser.parse_args()
    if args.thinking is not None:
        args.thinking = args.thinking.strip().lower()
        if not (args.thinking.isdigit() or args.thinking in THINKING_LEVELS):
            parser.error(f"--thinking must be a number or one of {', '.join(THINKING_LEVELS)}")
    fallback = None if args.fallback_model.strip().lower() in ("", "none") else args.fallback_model.strip()

    shifts = args.shifts or DEFAULT_SHIFTS
    cache_dir = args.out / ".cache"
    files = ChapterFiles(args.out)
    gemini = None
    failed = []
    totals = {"added": 0, "duplicate": 0, "invalid": 0}

    for shift in shifts:
        for subj in args.subjects:
            for section, (_, _, numerical) in SECTIONS.items():
                label = f"{shift} | {subj} | Section {section}"
                cache = cache_dir / f"{slugify(shift)}_{subj}_{section}_v{CACHE_VERSION}.json"
                prompt = build_prompt(shift, subj, section, files.known_subtopics(subj))

                if cache.exists() and not args.refresh:
                    items = json.loads(cache.read_text(encoding="utf-8"))
                    print(f"{label}: {len(items)} items (cached)")
                elif args.dry_run:
                    print(f"--- {label}\n{prompt}\n")
                    continue
                else:
                    if gemini is None:
                        keys = api_keys()
                        if not keys:
                            sys.exit(f"Set GEMINI_API_KEY in {ENV_FILE} (or the environment).")
                        gemini = Gemini(args.model, keys, args.thinking, fallback)
                    print(f"{label}: calling {gemini.model} ...")
                    try:
                        items = gemini.generate(prompt, response_schema(subj, numerical))
                    except Exception as e:
                        print(f"    failed: {e}")
                        failed.append(label)
                        continue
                    cache.parent.mkdir(parents=True, exist_ok=True)
                    cache.write_text(json.dumps(items, indent=1, ensure_ascii=False), encoding="utf-8")
                    print(f"    {len(items)} items")

                for n, item in enumerate(items, start=1):
                    try:
                        totals[files.add(subj, item, numerical, shift)] += 1
                    except (ValueError, AttributeError) as e:
                        totals["invalid"] += 1
                        print(f"    skipped item {n}: {e}")

    if args.dry_run:
        return
    files.save()
    print(f"\nAdded {totals['added']}, already present {totals['duplicate']}, invalid {totals['invalid']}.")
    figures = files.figures
    if figures["total"]:
        print(f"Figures: {figures['total']} added questions have one, {figures['with_url']} with a verified URL; "
              "the rest have image.url null and need an image sourced.")
    if gemini:
        u = gemini.usage
        print(f"Tokens: {u['input']} input, {u['output']} output, {u['thinking']} thinking.")
    if failed:
        print("Failed (re-run to retry just these):\n  " + "\n  ".join(failed))
        sys.exit(1)


if __name__ == "__main__":
    main()
