# Jee Edge

A mock-test platform for JEE aspirants: competitive mocks, topic-by-topic analysis,
and personalised retests, built on a 5,000-question classified starter pack.

This first slice ships:
- A landing page (React)
- Auth0-backed signup/login
- An onboarding form that collects name, a unique username, date of birth, and class
- A basic dashboard shell

## Structure

```
jee-edge/
├── frontend/   React + Vite app (landing page, auth, onboarding, dashboard)
└── backend/    FastAPI app (Auth0 token verification, user profile storage)
```

## 1. Set up Auth0 (one-time)

1. Create a free account at https://auth0.com and a new tenant.
2. Applications → Create Application → "Single Page Application" → name it `Jee Edge Web`.
   - Under Settings, set:
     - Allowed Callback URLs: `http://localhost:5173`
     - Allowed Logout URLs: `http://localhost:5173`
     - Allowed Web Origins: `http://localhost:5173`
   - Copy the **Domain** and **Client ID** — you'll need them below.
3. Applications → APIs → Create API.
   - Name: `Jee Edge API`, Identifier (audience): `https://jee-edge-api` (any URL-shaped string works, it doesn't have to resolve).
4. Optional: Authentication → Database → your default connection → Applications tab → make sure `Jee Edge Web` is enabled, and turn on "Sign Ups" if you want self-serve signup.

## 2. Run the backend

```bash
cd backend
python -m venv venv && source venv/bin/activate   # or your preferred env tool
pip install -r requirements.txt
cp .env.example .env
```

Edit `.env`:
```
AUTH0_DOMAIN=your-tenant.us.auth0.com
AUTH0_AUDIENCE=https://jee-edge-api
CORS_ORIGINS=http://localhost:5173
DATABASE_URL=sqlite:///./jee-edge.db
```

```bash
uvicorn app.main:app --reload --port 8000
```

The API is now at `http://localhost:8000`. SQLite (`jee-edge.db`) is created automatically
on first run — swap `DATABASE_URL` for Postgres later without touching any other code.

## 3. Run the frontend

```bash
cd frontend
npm install
cp .env.example .env
```

Edit `.env`:
```
VITE_AUTH0_DOMAIN=your-tenant.us.auth0.com
VITE_AUTH0_CLIENT_ID=your-client-id-from-step-1
VITE_AUTH0_AUDIENCE=https://jee-edge-api
VITE_API_URL=http://localhost:8000
```

```bash
npm run dev
```

Visit `http://localhost:5173`. "Start free" / "Log in" open Auth0's hosted login page.
After first login, new users are routed to `/onboarding` to set their name, username,
date of birth, and class; returning users go straight to `/dashboard`.

## How auth actually works here

- The frontend never touches passwords — Auth0's hosted page handles login/signup entirely.
- On success, Auth0 hands the frontend an access token (JWT).
- Every backend call sends that token as `Authorization: Bearer <token>`.
- The backend verifies the token's signature against Auth0's public keys before trusting
  the request (`app/auth.py`), and reads the user's stable `sub` claim as their identity —
  it never has to store or see a password.

## What's deliberately not built yet

- The full mock-test engine for logged-in users (timing, scoring, leaderboards at scale)
- The 5,000-question bank and its chapter/difficulty classification
- The analysis/leaderboard views (the dashboard cards are placeholders at 0)

The auth + profile layer here is built so the mock-test engine can plug straight into
`models.User` and the same `verify_token` dependency once you're ready for it.

## The "Take a Free Test" flow

`/free-test` (public, no login required) is a single continuous experience:
a short Sundar Pichai story → 10 timed questions → results → a prompt to create
an account. No intermediate screens, matching the "minimum friction" brief.

- Question data lives in `frontend/src/data/freeTestQuestions.js`, in a reusable
  shape (`id, subject, topic, difficulty, question, options, correctAnswer, explanation`)
  so it can later be swapped for personalised, generated questions per student without
  touching `FreeTest.jsx`.
- **On the photo**: the story uses a line-art monogram instead of an actual photo of
  Sundar Pichai. A real person's photo used this way in a live product reads as an
  implied endorsement he hasn't given, on top of the underlying copyright question of
  who owns the image. Swap in a properly licensed photo later if you secure the rights.

### How the result actually gets saved

A student can finish the free test before they have an account, so the result has to
survive the Auth0 signup redirect:

1. On the results screen, if the student is already logged in, the attempt is POSTed
   to `/api/test-attempts` immediately (`FreeTest.jsx`).
2. If not, it's stashed in `localStorage` (`frontend/src/lib/pendingFreeTest.js`,
   30-minute expiry) and the student is sent through Auth0 signup.
3. Once they finish onboarding (`Onboarding.jsx`) — or if they land straight on
   `Dashboard.jsx` because they already had an account — the pending result is read
   back out of `localStorage`, POSTed, and cleared.
4. The Dashboard's stats (tests taken, best accuracy, questions attempted) and the
   "Recent attempts" list are computed from real data via `GET /api/test-attempts`,
   not placeholders.

Backend-side this lives in `models.TestAttempt` (a `user_id`-scoped table) and
`routers/test_attempts.py`, both gated by the same `verify_token` → `get_current_db_user`
dependency chain (`app/deps.py`) as the rest of the authenticated API.

