from app.database import engine
from sqlalchemy import text

with engine.connect() as conn:
    result = conn.execute(text('SELECT column_name FROM information_schema.columns WHERE table_name = \'positions\''))
    cols = [row[0] for row in result]
    print("Current columns:", cols)
    
    if 'level' not in cols:
        print("Adding level column...")
        conn.execute(text('ALTER TABLE positions ADD COLUMN level VARCHAR'))
    if 'school_id' not in cols:
        print("Adding school_id column...")
        conn.execute(text('ALTER TABLE positions ADD COLUMN school_id VARCHAR'))
    if 'department_id' not in cols:
        print("Adding department_id column...")
        conn.execute(text('ALTER TABLE positions ADD COLUMN department_id VARCHAR'))
    if 'course_id' not in cols:
        print("Adding course_id column...")
        conn.execute(text('ALTER TABLE positions ADD COLUMN course_id VARCHAR'))
    conn.commit()
    print("Done!")