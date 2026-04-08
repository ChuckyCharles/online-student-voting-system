from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.routers import auth, elections, vote, results, admin

@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        Base.metadata.create_all(bind=engine)
    except Exception:
        pass  # DB not available yet — skip table creation
    yield

app = FastAPI(title="Student Voting API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    # Dev wiring: allow requests from any local origin.
    # The frontend uses `Authorization: Bearer ...` (no cookies), so credentials aren't required.
    allow_origin_regex=r"^https?://.*$",
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(elections.router)
app.include_router(vote.router)
app.include_router(results.router)
app.include_router(admin.router)


@app.get("/health")
def health():
    return {"status": "ok"}
