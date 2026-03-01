"""FastAPI application entry point for BudgetBrawl."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import init_db
from app.routers import auth, users, friends, events, challenges
from app.scheduler import start_scheduler


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifespan - startup and shutdown."""
    await init_db()
    scheduler = start_scheduler()
    yield
    scheduler.shutdown(wait=False)


app = FastAPI(
    title="BudgetBrawl API",
    description="Backend API for BudgetBrawl - budget challenges between friends",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(users.router, prefix="/users", tags=["users"])
app.include_router(friends.router, prefix="/friends", tags=["friends"])
app.include_router(events.router, prefix="/events", tags=["events"])
app.include_router(challenges.router, prefix="/challenges", tags=["challenges"])


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok"}
