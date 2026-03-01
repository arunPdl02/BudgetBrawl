# BudgetBrawl

Gamify financial discipline through private competitive bets. Users connect their calendar, get spending predictions, and bet $5 with friends that they'll spend less than a threshold.

## Tech Stack

- **Backend**: Python, FastAPI, SQLAlchemy (SQLite), APScheduler
- **Frontend**: Next.js 16, TypeScript, TailwindCSS, shadcn/ui, NextAuth

## Quick Start

### Backend

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env   # edit SECRET_KEY for production
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

### Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local   # add AUTH_SECRET
npm run dev
```

Open http://localhost:3000

### Environment

**Backend (.env)**
- `DATABASE_URL` - Default: `sqlite+aiosqlite:///./budgetbrawl.db`
- `SECRET_KEY` - JWT signing secret
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` - For Google Calendar (optional)

**Frontend (.env.local)**
- `NEXT_PUBLIC_API_URL` - Default: `http://localhost:8000`
- `AUTH_SECRET` - NextAuth secret (run `openssl rand -base64 32`)

## Features

- **Auth**: Email/password via NextAuth + FastAPI JWT
- **Onboarding**: 3-question calibration (avg lunch, transport, eat-out frequency)
- **Friends**: Add by email, accept requests, head-to-head records
- **Calendar**: Add events (next 7 days), deterministic spending predictions
- **Challenges**: Bet $5 you'll spend less than threshold; submit actual spend within 24h; auto-resolve if no submission (opponent wins)

## MVP Checklist

1. Add friend
2. Accept friend
3. Connect calendar (add events)
4. Predict spending
5. Create bet
6. Accept bet
7. Submit spend
8. Auto-resolve
9. Update H2H
10. Reject illegal transitions
