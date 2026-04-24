from app.database import engine
from sqlalchemy import text

with engine.connect() as conn:
    # Check existing schools
    result = conn.execute(text('SELECT id, name FROM schools'))
    schools = list(result.fetchall())
    print("Existing schools:", schools)
    
    result = conn.execute(text('SELECT id, name FROM departments'))
    depts = list(result.fetchall())
    print("Existing departments:", depts[:10], "..." if len(depts) > 10 else "")
    
    result = conn.execute(text('SELECT id, name FROM courses'))
    courses = list(result.fetchall())
    print("Existing courses:", courses[:10], "..." if len(courses) > 10 else "")