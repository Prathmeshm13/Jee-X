# Jee Edge — Codebase Guide

Quick-reference for getting oriented in this repo. For deep detail, follow the links out to
`docs/database-schema.md` and `arch/README.md` — this file is the map, not the territory.

Jee Edge is a JEE (Main/Advanced) prep platform: students log in, take free diagnostic tests,
subject-wise practice tests and full mocks, and get scored/analyzed. Backend is FastAPI + MySQL,
frontend is React (Vite), auth is Auth0.

## Repo layout

```
backend/        FastAPI app (Python)
frontend/       React app (Vite)
generated/      JSON question banks + the scripts that generate them
scripts/        PYQ scraping/generation tooling (generate_pyqs.py)
docs/           database-schema.md — the full schema reference, source of truth for the data model
arch/           Mermaid/SVG/PNG diagrams generated from docs/database-schema.md
```

## Backend — `backend/app/`

FastAPI app, MySQL (Aiven, via `pymysql` — **no SQLite fallback**, see `database.py`), Auth0 for
auth. Entry point is `main.py`.

```
main.py          App factory: CORS, router registration, Base.metadata.create_all, /health
database.py      Engine/session setup; requires DATABASE_URL to start with mysql+pymysql://
auth.py          verify_token: validates Auth0 RS256 JWTs against the tenant's JWKS
deps.py          get_current_db_user: JWT payload -> app's own `users` row (404 if not onboarded)
schemas.py       All Pydantic request/response models (onboarding, tests, subject tests)
utils.py         class_level_to_years: converts "11"/"12"/"dropper" <-> (class_12_year, target_year)
importer.py      Loads generated/questions/**/*.json into the DB (upsert by ref, content-hash versioning)
models/          SQLAlchemy models, split by domain (see below)
routers/         API route handlers, one file per "service" (see below)
scripts/import_questions.py   CLI entry point that calls importer.py
```

### Models (`backend/app/models/`)

Split by domain, all sharing `app.database.Base`; every class is re-exported from
`models/__init__.py` so call sites just do `from app import models` / `models.User`. Domains
mirror `docs/database-schema.md` sections 4–10:

| File | Tables |
|---|---|
| `identity.py` | `User`, `StudentProfile`, `GuardianConsent` |
| `content.py` | `Subject`, `Chapter`, `Subtopic`, `Passage`, `Question`, `QuestionOption`, `QuestionSubtopic`, `Asset` |
| `tests.py` | `Test`, `TestQuestion`, `TestAttempt`, `QuestionResponse`, `ResponseOption` |
| `learning.py` | `StudentSubtopicStats`, `StudentChapterCoverage` |
| `ratings.py` | `StudentRating`, `StudentSubjectRating`, `QuestionRating`, `RatingEvent` (Glicko-2) |
| `publishing.py` | `Leaderboard`, `LeaderboardEntry`, `ShareCard` |
| `admin.py` | `ImportRun`, `QuestionRevision`, `QuestionReview`, `QuestionReport`, `RegradeRun`, `IntegrityFlag`, `AuditLog` |

The full schema (columns, keys, rules, lifecycles) is documented in
**[`docs/database-schema.md`](docs/database-schema.md)** — read it before touching models.
**Note:** its header currently says "Status: design... only `users` and `test_attempts` exist" —
that's stale; the full schema above is already implemented. Treat the doc as the column-level
reference, not as a statement of what's built.

Of the app/admin/public split the architecture doc describes, only the student-facing `/api/*`
surface is implemented today — no `/admin/*` routes and no background jobs (stats/ratings/ranks
are updated inline in the grading endpoint, not by separate jobs) yet. `backend/app/services/`
exists but is currently empty.

### Routers (`backend/app/routers/`) — each is one numbered "service"

| Router | Prefix | What it does |
|---|---|---|
| `users.py` | `/api` | `/me`, `/username-check/{u}`, `/onboarding`, `/profile` (PATCH) |
| `subjects.py` | `/api/subjects` | Service 1: public catalog — list subjects / chapters with published-question counts |
| `subject_tests.py` | `/api/subject-tests` | Service 2: build a subject/chapter test — samples published questions, creates `Test`/`TestQuestion`/`TestAttempt` rows, returns the paper (no answers) |
| `subject_test_attempts.py` | `/api/subject-tests` | Service 3: grade a submitted attempt — the only code that decides correctness; writes `QuestionResponse`/`ResponseOption`, updates `StudentSubtopicStats` inline |
| `test_attempts.py` | `/api/test-attempts` | Legacy **client-scored** flows (`FreeTest.jsx`, `Analysis.jsx`): the frontend grades itself and just POSTs a summary; lazily creates one canonical `free_diagnostic`/`full_mock` `Test` row shared by everyone |

Auth pattern: student routes depend on `get_current_db_user` (from `deps.py`), which requires a
valid Auth0 bearer token *and* a completed onboarding row — otherwise 404 (frontend treats that as
"go to /onboarding").

### Question data pipeline

`generated/questions/{physics,chemistry,mathematics}/<chapter-slug>.json` (plus a
`questions-2022-2023/` snapshot and per-file `.cache/` sidecars) are produced by
`scripts/generate_pyqs.py` and loaded into the DB by `backend/app/importer.py` (invoked via
`backend/scripts/import_questions.py`). Import upserts by question `ref`, hashing content to decide
whether a new `QuestionRevision` is needed — see `docs/database-schema.md` §13/§15 for the exact
file → table mapping and versioning rules.

## Frontend — `frontend/src/`

React 18 + Vite + `react-router-dom`. Auth0 via `@auth0/auth0-react`. Math rendering via KaTeX,
charts via `recharts`, icons via `lucide-react`.

```
main.jsx          Root: BrowserRouter + Auth0Provider (handles login redirect -> returnTo)
App.jsx            All routes, every page lazy-loaded behind <Suspense>
lib/api.js          request() fetch wrapper + `api` object (legacy /api/me, onboarding, test-attempts)
lib/subjectTests.js  catalogService / subjectTestBuilderService / subjectTestGraderService — thin
                     wrappers over /api/subjects and /api/subject-tests (the newer 3-service flow)
lib/pendingFreeTest.js  Holds a free-test result in progress across the login redirect
components/          AppHeader, Sidebar, Brand (incl. Loader), Palette, MathText, ProtectedRoute
crackjee/            screens.jsx (832 lines) + ui.js — a separate self-contained UI module
data/freeTestQuestions.js   Static question set for the unauthenticated free test
pages/
  Landing.jsx / Home.jsx     Public marketing/landing
  FreeTest.jsx (253)         Unauthenticated diagnostic test, client-graded
  Onboarding.jsx (153)       Collects name/username/dob/class_level -> POST /api/onboarding
  Dashboard.jsx (125)        Past attempts, subject breakdown
  SubjectTest.jsx (291)      Chapter/subject practice test flow (the 3-service pipeline)
  MockTest.jsx / Analysis.jsx / Buddy.jsx / Profile.jsx
```

Routing: `/` and `/free-test` are public; everything else (`/test`, `/analysis`, `/buddy`,
`/onboarding`, `/dashboard`, `/profile`, `/subject-test`) is wrapped in `<ProtectedRoute>`, which
redirects to Auth0 login and bounces back via `returnTo` if not authenticated.

Two parallel API patterns exist in the frontend — don't assume they're interchangeable:
- **Legacy client-scored** (`lib/api.js`): frontend grades itself, POSTs a finished summary to
  `/api/test-attempts`. Used by `FreeTest.jsx`/legacy mock flow.
- **Server-scored 3-service flow** (`lib/subjectTests.js`): frontend only fetches the catalog and
  the question paper; the backend grades submissions and returns solutions. Used by
  `SubjectTest.jsx`.

## Auth flow (Auth0)

1. Frontend (`main.jsx`) wraps the app in `Auth0Provider`; `ProtectedRoute` triggers
   `loginWithRedirect` for unauthenticated visits to protected routes.
2. Backend (`auth.py`) verifies the RS256 JWT against the tenant's JWKS (cached via `lru_cache`),
   checking audience + issuer. `deps.py` then maps the verified `sub` claim to a local `users` row.
3. A verified Auth0 identity with no local `users` row is a "not onboarded yet" user — most
   student endpoints 404 until `/api/onboarding` is called (see `Onboarding.jsx`).

Env vars: `AUTH0_DOMAIN`, `AUTH0_AUDIENCE` (backend); `VITE_AUTH0_DOMAIN`, `VITE_AUTH0_CLIENT_ID`,
`VITE_AUTH0_AUDIENCE` (frontend) — see the `.env.example` files in each app.

## Running locally

```bash
# backend (needs a MySQL DATABASE_URL in backend/.env — see backend/.env.example)
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload

# frontend
cd frontend
npm install
npm run dev
```

`backend/app/main.py` calls `Base.metadata.create_all(bind=engine)` on startup — no migration
framework (e.g. Alembic) yet, so schema changes require care against the live Aiven MySQL instance.

## Where to look next

- **Data model / business rules**: [`docs/database-schema.md`](docs/database-schema.md) — the
  canonical reference (32 tables, lifecycles, enforced rules, import mapping).
- **Diagrams**: [`arch/README.md`](arch/README.md) — system architecture, ER diagrams per domain,
  two sequence diagrams (ranked mock attempt; question file → regrade).
- **UI notes**: `UI-REDESIGN.md` at repo root.
