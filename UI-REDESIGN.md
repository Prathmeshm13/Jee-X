# Jee Edge UI redesign — charcoal / burnt orange

This update is based on the supplied `Jee-X-feature-version-1` archive. It has not been pushed to GitHub: the connected account returned 404 for `itsamit729-ui/Jee-X`.

## What changed

- Rebuilt landing page with white and charcoal surfaces, burnt-orange actions, plain sans-serif typography, compact test-format rows and a dark subject directory. Removed green, italic display type, paper effects, decorative flourishes and slogan-heavy copy. Correct-answer states use blue.
- Interactive practice question, FAQs and direct free-test entry are retained.
- Cohesive dashboard, navigation, forms, charts and test surfaces. All dashboard values continue to come from the existing API.
- Free-test introduction with clear instructions, visible progress and keyboard focus on each new question.
- Mobile navigation with all destinations visible. The full mock's question palette can be expanded when needed; subject tabs fit on phones.
- Subject selections from the landing page carry through login. Protected routes preserve the intended destination.
- Failed dashboard loads show a retry action. Pending free-test results are removed only after successful submission.
- Route-level lazy loading keeps charts and mathematical rendering off the initial landing-page path.

The backend, database schema, question banks and existing grading contracts are unchanged.

## Run

From `frontend`, run `npm ci`, configure `.env` from `.env.example` with your existing Auth0 and API settings, and run `npm run dev`. Run `npm run build` for production. The existing backend setup remains in the project README.

## Validation (rerun after palette and layout revision)

- Production Vite build passed.
- Browser checks passed at 1440px desktop, 768px tablet and 375px mobile for the public landing page.
- Verified mobile menu, FAQ expansion, interactive landing question and complete ten-question free-test flow, including the pending-result save.
- Verified dashboard charts, empty/error states and retention of a pending result after a failed POST using a temporary local test harness with simulated authentication/API responses.
- Verified subject preselection, desktop/mobile mock rendering and the mobile palette toggle.
- No uncaught browser errors in the checked flows.
- Screenshots in `docs/ui` document the checked screens. Dashboard screenshots use sample QA data, not a real student's results.
- Live Auth0 login, redirects against the deployed Auth0 tenant, real API/database writes and deployment were not verified. No production secrets were supplied. The local QA harness is excluded from this deliverable.

## Changed source files

`frontend/index.html`, `frontend/src/App.jsx`, `frontend/src/main.jsx`, `frontend/src/index.css`, `frontend/src/refinement.css`, `frontend/src/components/Brand.jsx`, `frontend/src/components/AppHeader.jsx`, `frontend/src/components/ProtectedRoute.jsx`, `frontend/src/crackjee/ui.js`, `frontend/src/crackjee/screens.jsx`, `frontend/src/pages/Home.jsx`, `frontend/src/pages/Dashboard.jsx`, `frontend/src/pages/FreeTest.jsx`, `frontend/src/pages/SubjectTest.jsx`.
