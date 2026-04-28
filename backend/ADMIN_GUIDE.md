# Admin Guide: Fresh Election Setup

## Database Status
✅ Database has been reset and cleaned
✅ Academic structure preserved (6 schools, 6 departments, 4 courses, 5 users)
✅ Fresh election created with all positions and sample candidates

## Election Details
- **Election ID**: `acuej65wcu5kzk5p260lu6xm`
- **Title**: Student Council Election 2026
- **Status**: PENDING (not yet active)
- **Total Positions**: 24
  - University: 8
  - School: 6
  - Department: 6
  - Class: 4
- **Total Candidates**: 24 (1 per position by default)

## Next Steps for Admin

### 1. Access Admin Panel
Open: http://localhost:5173/admin
Login with: admin@university.edu / Admin@123

### 2. Review Positions
Navigate to Positions section to see all 24 positions across all levels.
You can:
- View position details
- Edit position name/level if needed
- Delete unwanted positions

### 3. Manage Candidates
Navigate to Candidates section to see all 24 sample candidates.
You can:
- **Edit existing candidates**: Update name, description, image URL
- **Add new candidates**: Click "Add Candidate" and select position
- **Delete candidates**: Remove unwanted candidates
- Upload candidate images via URL (optional)

### 4. Activate Election
When you're satisfied with positions and candidates:
```http
PATCH /admin/elections/acuej65wcu5kzk5p260lu6xm/status
Content-Type: application/json
Authorization: Bearer <your_token>

{"status": "ACTIVE"}
```
Or use the admin dashboard to change status to ACTIVE.

Once ACTIVE, students can start voting.

### 5. After Election Ends
Change status to ENDED when voting period is over:
```http
PATCH /admin/elections/acuej65wcu5kzk5p260lu6xm/status
{"status": "ENDED"}
```

## API Endpoints Reference

### Admin Auth
- `POST /auth/login` - Get admin token
- Body: `{"email":"admin@university.edu","password":"Admin@123"}`

### Elections
- `GET /admin/elections` - List all elections
- `POST /admin/elections` - Create election
- `PATCH /admin/elections/{id}/status` - Update status (PENDING/ACTIVE/ENDED)
- `DELETE /admin/elections/{id}` - Delete election

### Positions
- `GET /admin/positions` - List all positions
- `POST /admin/positions` - Create position
- `DELETE /admin/positions/{id}` - Delete position

### Candidates
- `GET /admin/candidates` - List all candidates
- `POST /admin/candidates` - Create candidate
- `PATCH /admin/candidates/{id}` - Update candidate
- `DELETE /admin/candidates/{id}` - Delete candidate

## Useful Commands

### Reset database (delete all election data)
```bash
cd backend
venv\Scripts\python.exe reset_db.py
```

### Create fresh election (automated)
```bash
cd backend
venv\Scripts\python.exe create_fresh_election.py
```

### Show current state
```bash
cd backend
venv\Scripts\python.exe show_election.py
```

## Notes
- Academic structure (schools, departments, courses) is preserved across resets
- Admin user is always available: admin@university.edu / Admin@123
- Database uses PostgreSQL with cascading deletes
- Votes are anonymous (not linked to user records)
