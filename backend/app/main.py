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
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
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
