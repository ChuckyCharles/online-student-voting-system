import sys
sys.path.append('.')
from app.database import SessionLocal
from app.models import Election, ElectionStatus
from datetime import datetime

db = SessionLocal()
try:
    election = db.query(Election).first()
    if election:
        print(f'Election ID: {election.id}')
        print(f'Title: {election.title}')
        print(f'Status: {election.status}')
        if election.status == ElectionStatus.PENDING or election.status == ElectionStatus.ENDED:
            election.status = ElectionStatus.ACTIVE
            election.start_time = datetime.now()
            db.commit()
            print('Election activated successfully!')
        else:
            print('Election is already active.')
    else:
        print('No election found.')
finally:
    db.close()