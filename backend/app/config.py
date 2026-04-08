from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str = "dev-secret"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480
    ALGORITHM: str = "HS256"
    # Dev-only: allow admin-protected endpoints even when the user isn't ADMIN.
    # This is useful while wiring up frontend/backend communication.
    DEV_RELAX_ADMIN: bool = True

    class Config:
        env_file = ".env"
        # Ignore unrelated env vars (e.g. NextAuth variables) so the backend
        # can boot even if the `.env` file is shared with the frontend.
        extra = "ignore"

settings = Settings()
