# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project Overview

**BudgetBrawl** is a hackathon webapp that turns Google Calendar events into spending predictions and social betting challenges.

**Key differentiator**: Snowflake is used as both the database AND the AI layer (Cortex LLM) — not just storage.

**Product flow**: Log in with Google → answer 3 spending habit questions → sync next 7 days of calendar → Snowflake Cortex predicts spending per event → challenge a friend to a $5 virtual bet on whether you'll stay under budget.

---

## Tech Stack

- **Backend**: FastAPI + Snowflake (snowflake-connector-python) + Google OAuth + PyJWT + APScheduler
- **Frontend**: React 18 + Vite + React Router v6 (plain TypeScript, no framework)
- **AI**: Snowflake Cortex `COMPLETE('mistral-large', ...)` for spending predictions
- **Auth**: Google OAuth only — no email/password

---

## Project Status

**Implementation complete (first pass).** All modules have been created. The app is not yet running/tested — Snowflake credentials and Google OAuth credentials still need to be configured.

---

## Directory Structure

```
BudgetBrawl/
├── CLAUDE.md
├── .gitignore
├── .env.example               # copy to backend/.env and fill in values
├── snowflake_setup.sql        # run as ACCOUNTADMIN before first start
├── backend/
│   ├── main.py                # FastAPI entrypoint, mounts all routers, lifespan
│   ├── config.py              # Pydantic BaseSettings from .env
│   ├── database.py            # Snowflake thread-local connection + run_query helper
│   ├── scheduler.py           # APScheduler auto-forfeit job (every 15 min)
│   ├── requirements.txt
│   ├── auth/
│   │   ├── router.py          # GET /auth/google, /auth/callback, /auth/me
│   │   ├── google_client.py   # google-auth-oauthlib OAuth2 flow
│   │   └── jwt_utils.py       # PyJWT sign/verify, get_current_user dependency
│   ├── users/
│   │   ├── router.py          # GET /users/search?email=
│   │   └── service.py         # upsert_user (MERGE), find_by_email
│   ├── onboarding/
│   │   ├── router.py          # POST /onboarding/quiz
│   │   ├── models.py
│   │   └── service.py
│   ├── friends/
│   │   ├── router.py          # /friends/request, /{id}/accept, /decline, /, /pending
│   │   ├── models.py
│   │   └── service.py
│   ├── calendar/
│   │   ├── router.py          # POST /calendar/sync, GET /calendar/events
│   │   ├── google_calendar.py # Google Calendar API using stored refresh token
│   │   └── service.py
│   ├── predictions/
│   │   ├── router.py          # GET /predictions/, POST /predictions/generate, GET /{id}
│   │   ├── cortex.py          # Snowflake COMPLETE() wrapper + prompt templates
│   │   └── service.py
│   ├── challenges/
│   │   ├── router.py          # POST/, GET/, /{id}/accept, /decline, /report
│   │   ├── models.py
│   │   └── service.py         # state machine + wallet transaction logic
│   └── wallet/
│       ├── router.py          # GET /wallet/balance, /wallet/transactions
│       └── service.py         # record_transaction helper (used inside transactions)
│
│   ── app/                    # OLD SQLite/SQLAlchemy implementation — superseded, safe to delete
│
└── frontend/
    ├── index.html
    ├── vite.config.ts
    ├── package.json           # React 18 + Vite + react-router-dom + axios
    ├── tsconfig.json
    └── src/
        ├── main.tsx           # Vite entrypoint
        ├── App.tsx            # BrowserRouter + Nav + ProtectedRoute + all Routes
        ├── api/               # axios client + per-domain API functions
        │   ├── client.ts      # axios instance, reads token from localStorage
        │   ├── auth.ts
        │   ├── onboarding.ts
        │   ├── friends.ts
        │   ├── calendar.ts
        │   ├── predictions.ts
        │   ├── challenges.ts
        │   └── wallet.ts
        ├── contexts/
        │   ├── AuthContext.tsx # user, token, login(), logout(), refreshUser()
        │   └── WalletContext.tsx
        └── pages/
            ├── LoginPage.tsx         # Google Sign-In button → /auth/google
            ├── AuthCallbackPage.tsx  # reads ?token= from redirect, calls login()
            ├── OnboardingPage.tsx    # 3-step wizard, only shown once
            ├── DashboardPage.tsx     # sync calendar + generate predictions
            ├── FriendsPage.tsx
            ├── ChallengesListPage.tsx
            ├── ChallengePage.tsx     # detail + report spend form
            └── WalletPage.tsx
```

---

## Snowflake Schema (7 tables)

`users`, `quiz_answers`, `friends`, `calendar_events`, `spending_predictions`, `challenges`, `challenge_outcomes`, `wallet_transactions`

See `snowflake_setup.sql` for full DDL.

**Important**: Snowflake returns column names in UPPERCASE. Always access dict keys uppercase, e.g. `row["USER_ID"]`, `row["WALLET_BALANCE"]`.

---

## Challenge State Machine

```
pending_friend → (friend accepts) → active
               → (friend declines) → declined [stake released to initiator]

active → (scheduler: event.end_time passed) → pending_report
         [report_deadline = event.end_time + 48h]

pending_report → (initiator reports actual spend) → resolved [winner gets $10]
               → (scheduler: report_deadline passed) → auto_forfeited [friend wins $10]
```

---

## Environment Variables

Copy `.env.example` → `backend/.env` and fill in all values.

Key variables:
- `SECRET_KEY` — random 32-byte hex
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — from Google Cloud Console
- `GOOGLE_REDIRECT_URI` — must match what's registered: `http://localhost:8000/auth/callback`
- `SNOWFLAKE_ACCOUNT` — format: `<org>-<account>`
- `ENCRYPTION_KEY` — Fernet key for encrypting Google refresh tokens at rest
- `VITE_API_BASE_URL` — for frontend `.env`, defaults to `http://localhost:8000`

Generate `ENCRYPTION_KEY`:
```bash
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

---

## Before First Run

1. Run `snowflake_setup.sql` in Snowflake as ACCOUNTADMIN
2. Grant Cortex: `GRANT DATABASE ROLE SNOWFLAKE.CORTEX_USER TO ROLE BUDGETBRAWL_ROLE;`
3. Use `us-west-2` or `us-east-1` region (Cortex availability)
4. Add `http://localhost:8000/auth/callback` as an authorized redirect URI in Google Cloud Console
5. Copy `.env.example` → `backend/.env`, fill in all values

---

## Dev Startup

```bash
# Backend
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# Frontend
cd frontend
npm install
npm run dev    # http://localhost:5173
```

---

## Known TODOs / Not Yet Done

- `backend/app/` (old SQLite implementation) can be deleted once verified
- No frontend `.env` file created — create `frontend/.env` with `VITE_API_BASE_URL=http://localhost:8000`
- No error boundary / loading states on frontend (basic implementation)
- Challenge creation UI: currently linked from Dashboard but no dedicated "New Challenge" form page yet (`/challenges/new` route is linked but page not created)
