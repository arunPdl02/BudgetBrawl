"""FastAPI entrypoint — mounts all routers, starts scheduler via lifespan."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from auth.router import router as auth_router
from gcalendar.router import router as calendar_router
from challenges.router import router as challenges_router
from config import settings
from friends.router import router as friends_router
from onboarding.router import router as onboarding_router
from predictions.router import router as predictions_router
from scheduler import create_scheduler
from users.router import router as users_router
from wallet.router import router as wallet_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    scheduler = create_scheduler()
    scheduler.start()
    yield
    scheduler.shutdown(wait=False)


app = FastAPI(
    title="BudgetBrawl API",
    description="Spending prediction and social betting powered by Snowflake Cortex",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(users_router)
app.include_router(onboarding_router)
app.include_router(friends_router)
app.include_router(calendar_router)
app.include_router(predictions_router)
app.include_router(challenges_router)
app.include_router(wallet_router)


@app.get("/health")
def health():
    return {"status": "ok"}
