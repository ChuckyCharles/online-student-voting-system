from app.database import engine
from sqlalchemy import text

with engine.connect() as conn:
    # Check existing schools
    result = conn.execute(text('SELECT id, name FROM schools'))
    schools = list(result.fetchall())
    print("Existing schools:", schools)
    
    if schools:
        print("Schools exist, clearing data...")
        conn.execute(text("DELETE FROM candidates"))
        conn.execute(text("DELETE FROM positions"))
        conn.execute(text("DELETE FROM elections"))
        conn.execute(text("DELETE FROM courses"))
        conn.execute(text("DELETE FROM departments"))
        conn.execute(text("DELETE FROM schools"))
        conn.execute(text("DELETE FROM users"))
        conn.commit()
        print("Data cleared.")
    else:
        print("No schools exist, ready to seed.")