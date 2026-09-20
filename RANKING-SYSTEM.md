# JeeX rating system

Implemented in this release: a 1–5000 rating, ten badge tiers, three placement contests, a cohort leaderboard, permanent earned badges, rating history, profile/dashboard summaries, and server-graded timed contests. Open **Rankings** in the app navigation (`/ranking`).

## Run the release

1. Keep your existing backend `.env` (MySQL and Auth0) and frontend `.env` configuration.
2. Install backend requirements and restart the API as usual. The existing `Base.metadata.create_all` startup creates three **new** tables: `jeex_ratings`, `rated_contests`, and `contest_entries`. No existing rating, practice, or rewards records are overwritten. The database account needs CREATE TABLE permission for this first startup.
3. Run `npm ci` and `npm run build` from `frontend`, and deploy the frontend build using your existing hosting setup.
4. Publish a common contest using reviewed, published questions. An empty contest arena is intentional until you schedule one. No demo students or fictional ratings are inserted.

## Publish the first contest

Use an existing administrator account (`users.role = admin`). There is no public role-assignment endpoint. Its Auth0 access token must target the same API audience as the frontend. The publishing script uses `JEEX_ADMIN_TOKEN` and `JEEX_API_URL` from the environment; do not commit tokens.

Create a local `contest.json` with real question IDs from your database:

```json
{
  "title": "JeeX Weekly Challenge 01",
  "exam": "jee_main",
  "target_year": 2027,
  "opens_at": "2026-10-04T10:00:00+05:30",
  "closes_at": "2026-10-04T11:00:00+05:30",
  "duration_sec": 1800,
  "question_ids": [101, 102, 103]
}
```

Choose future dates when you run this; the numbers above are examples, not seeded questions. From `backend`, run:

```bash
python scripts/publish_rated_contest.py contest.json
```

The API rejects non-admin users, duplicate or unpublished question IDs, invalid answer keys, an incompatible exam, overlapping contests for the same exam/year, past opening times, and a window shorter than the test duration. Questions and answer keys are snapshotted at publication. Source edits afterward do not change that contest. Supply a balanced Physics/Chemistry/Mathematics set; the API does not decide educational coverage for you.

Schedule a new reviewed set each week. This release intentionally does not automatically recycle questions. All questions use +4 for an exact correct answer, −1 for a wrong answer, and 0 for a skipped answer. Multiple-correct questions require the entire correct set, without partial credit; this is the contest marking policy, not a reproduction of every official JEE Advanced marking scheme.

## Result publication

Results remain hidden until the contest closes. Opening the ranking page calls `POST /api/ranking/settle`, which finalizes closed contests in chronological order. For prompt publication even when no student opens the page, configure your existing scheduler to run this every minute from the backend directory, with the same database environment:

```bash
python scripts/finalize_rated_contests.py
```

Finalization uses database row locks and one transaction for results and ratings. Retrying finalization does not double-count ratings. No scheduler is installed or deployed by this archive.

## Rating rules (version 1)

| Rating | Title |
|---|---|
| 1–499 | Aspirant |
| 500–999 | Explorer |
| 1000–1499 | Challenger |
| 1500–1999 | Achiever |
| 2000–2499 | Scholar |
| 2500–2999 | Strategist |
| 3000–3499 | Ace |
| 3500–3999 | Topper |
| 4000–4499 | Ranker |
| 4500–5000 | Legend |

- Each exam/target-year cohort has a separate rating. The cohort comes from the existing student profile.
- Students start internally at 1500, displayed as **Unrated** until three eligible contests finish. These are the placement contests; they use the same common test as other entrants.
- Each entrant is compared with every other entrant using the final server-graded score. Wins count 1, ties 0.5, losses 0. Expected result is `1 / (1 + 10 ** ((opponent_rating - rating) / 800))`.
- Adjustment is `round(old_rating + K * mean(actual - expected))`, clamped to 1–5000. K is 400 during the first three contests, then 160. All calculations use the pre-contest ratings, so processing order cannot affect results. This is JeeX's initial Elo policy, not a claim to reproduce LeetCode's private formula.
- Starting a test enrolls the student. Saved answers count even if they abandon it; unanswered questions score zero. This prevents discarding a weak result by not pressing Submit.
- A contest with fewer than two entrants is scored but does not change rating or placement count.
- The peak and badge collection begin when placement completes. Current title can fall; badges earned at previous peaks stay. There is no inactivity penalty.
- Equal ratings share the same competition rank (1, 1, 3). Equal contest scores also share a rank; finishing faster does not break ties.
- The leaderboard includes active student accounts with three completed rated contests, username visibility enabled, and a rated contest in the last 30 days. Inactive and hidden students keep their rating. Only usernames appear publicly, not names, emails or dates of birth.
- Existing personalized practice, daily questions, legacy browser-scored mocks, rewards and streaks are unchanged. They cannot award rating points. No separate new XP economy was added.

## Attempt behavior

There is one entry per user per contest. Reopening resumes that entry with its original server deadline. The deadline is the earlier of start + duration or contest close. Answers save as the student works, and the frontend serializes saves to prevent an older response from overwriting a newer one. Invalid question/option IDs and mismatched answer types are rejected. No answer key or solutions are returned during an attempt. Late writes and writes after submission are rejected; already saved answers remain.

A network outage cannot preserve answers that never reached the server: the page displays save failures with a retry action. Keep the browser open and check the save status. This is a basic online contest flow, not a proctored exam; it cannot prevent external assistance or sharing questions.

## Code map

- `backend/app/models/ranking.py`: additive tables, separate from unused legacy Glicko-shaped tables.
- `backend/app/services/ranking.py`: tiers, score calculation, rating updates, finalization and summary.
- `backend/app/routers/ranking.py`: authenticated student endpoints and admin publishing endpoint.
- `frontend/src/pages/Ranking.jsx`: rating, milestones, leaderboard, contests, history and visibility control.
- `frontend/src/pages/RankedTest.jsx`: timed test, answer autosave, resume and submission.
- `frontend/src/components/RatingSummary.jsx`: dashboard and profile links with current progress.
- `backend/tests/test_ranking.py`: rating and API regression tests.

## Verification

From `backend`, install `pytest` and `httpx` alongside requirements and run `python -m pytest tests -q`. Tests use an isolated in-memory SQLite database and dependency-overridden authentication; production database configuration remains MySQL-only. They cover rating boundaries, ties, upsets, placements, permanent badges, answer grading, secrecy, ownership, validation, deadlines, repeated finalization, privacy, inactivity, cohort isolation and single-entry contests.

The frontend production build passed. Eleven backend tests passed. Desktop and mobile browser checks passed for the ranking page, all ten badges, visibility controls, autosave/submission, empty states and horizontal overflow. Browser checks used mock authentication/API responses; real Auth0 login, production MySQL row-lock concurrency, and deployment still need your configured environment. Ratings are not a predicted JEE percentile or AIR. Before tuning the algorithm, collect contest participation and rating-distribution data; avoid changing the formula silently mid-season.
