from app.database import engine
from sqlalchemy import text

with engine.connect() as conn:
    # Drop all tables and recreate
    conn.execute(text("DROP TABLE IF EXISTS audit_logs CASCADE"))
    conn.execute(text("DROP TABLE IF EXISTS votes CASCADE"))
    conn.execute(text("DROP TABLE IF EXISTS voting_tokens CASCADE"))
    conn.execute(text("DROP TABLE IF EXISTS candidates CASCADE"))
    conn.execute(text("DROP TABLE IF EXISTS positions CASCADE"))
    conn.execute(text("DROP TABLE IF EXISTS elections CASCADE"))
    conn.execute(text("DROP TABLE IF EXISTS courses CASCADE"))
    conn.execute(text("DROP TABLE IF EXISTS departments CASCADE"))
    conn.execute(text("DROP TABLE IF EXISTS schools CASCADE"))
    conn.execute(text("DROP TABLE IF EXISTS users CASCADE"))
    conn.commit()
    print("All tables dropped.")