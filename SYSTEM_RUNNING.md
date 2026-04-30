# Machakos University Student Leadership Elections 2026 - SYSTEM RUNNING

## ✅ System Status: FULLY OPERATIONAL

### Running Services

| Service | URL | Port | Status |
|---------|-----|------|--------|
| **Frontend** | http://localhost:5173 | 5173 | ✅ Running |
| **Backend API** | http://localhost:8000 | 8000 | ✅ Running |
| **Database** | SQLite (voting_system.db) | Local | ✅ Ready |

---

## 🚀 Quick Access

### Student Voter Access
**URL:** http://localhost:5173

### Admin Dashboard
**URL:** http://localhost:5173/admin
- **Email:** admin@machakosuni.ac.ke
- **Password:** admin123

### API Documentation
**URL:** http://localhost:8000/docs (Swagger UI)
**URL:** http://localhost:8000/redoc (ReDoc)

---

## 📊 Election Data Loaded

### Academic Structure
✅ **3 Schools Created:**
- School of Agriculture, Environment & Health Sciences
- School of Business
- School of Engineering & Technology

✅ **16 Departments Created:**
- Agricultural Studies, Environmental Studies, Natural Resources, Health Sciences
- Economics, Accounting/Banking/Finance, Business Administration, Hospitality & Tourism
- Computing & IT (CIT), Mechanical Engineering, Building & Civil Engineering, Electrical & Electronics

✅ **45 Courses Created**

### Election Positions & Candidates

✅ **9 University-Level Positions:**
- President (3 candidates)
- Deputy President (3 candidates)
- Secretary General (3 candidates)
- Treasurer (3 candidates)
- PWD Representative 1 (3 candidates)
- PWD Representative 2 (3 candidates)
- Sports & Entertainment (3 candidates)
- Academic Affairs Representative (3 candidates)
- Welfare Representative (3 candidates)

✅ **3 School Representative Positions:**
- School of Agriculture Rep (3 candidates)
- School of Business Rep (3 candidates)
- School of Engineering & Technology Rep (3 candidates)

✅ **45 Course Representative Positions:**
- One for each course with 2-3 candidates each

**Total Candidates Created: 150+**

---

## 🗳️ Election Timeline

| Event | Date & Time |
|-------|------------|
| **Election Status** | PENDING (Not yet started) |
| **Scheduled Start** | 2026-05-01 08:13 UTC |
| **Scheduled End** | 2026-05-08 08:13 UTC |
| **Duration** | 7 days |

---

## 👤 Admin User Credentials

```
Email: admin@machakosuni.ac.ke
Password: admin123
```

### Admin Functions Available:
- ✅ Start/Stop Elections
- ✅ Manage Positions & Candidates
- ✅ View Voting Statistics
- ✅ Manage Users & Departments
- ✅ Export Results
- ✅ View Audit Logs

---

## 🔧 Backend Architecture

### Technology Stack
- **Framework:** FastAPI (Python)
- **Database:** SQLite (voting_system.db)
- **ORM:** SQLAlchemy
- **Authentication:** JWT Tokens
- **Port:** 8000

### Key Endpoints
```
POST   /auth/register     - Student Registration
POST   /auth/login        - Student Login
GET    /elections          - List Elections
GET    /elections/{id}     - Election Details
GET    /elections/{id}/positions - Positions
POST   /vote              - Cast Vote
GET    /results           - View Results
```

### Admin Endpoints
```
POST   /admin/elections   - Create Election
PUT    /admin/elections/{id} - Update Election
POST   /admin/positions   - Create Positions
PUT    /admin/users       - Manage Users
```

---

## 🎨 Frontend Architecture

### Technology Stack
- **Framework:** React 18 with TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **API Client:** Axios
- **Port:** 5173

### Key Pages
- `/` - Home/Dashboard
- `/login` - Student Login
- `/register` - Student Registration
- `/vote` - Voting Page
- `/results` - Results Page
- `/admin` - Admin Dashboard
- `/admin/elections` - Manage Elections
- `/admin/candidates` - Manage Candidates
- `/admin/users` - Manage Users

---

## 📁 Database

**File Location:** `c:\Users\hp elitebook 840\Desktop\online-student-voting-system\backend\voting_system.db`

### Tables
- `schools` - University schools
- `departments` - Academic departments
- `courses` - Course offerings
- `users` - Student and admin accounts
- `elections` - Election records
- `positions` - Positions for each election
- `candidates` - Candidates running
- `voting_tokens` - Anonymous vote tracking
- `votes` - Anonymous vote records
- `audit_logs` - Admin action logs

---

## 🔐 Security Features

✅ **Anonymous Voting:** Votes are completely anonymous
✅ **One Vote Per Position:** Enforced via VotingToken uniqueness
✅ **JWT Authentication:** Secure token-based auth
✅ **Password Hashing:** Bcrypt hashing
✅ **Admin Audit Logs:** All admin actions logged
✅ **Role-Based Access:** Student vs Admin roles

---

## 📝 How to Use

### For Students (Voters)

1. **Access the Application**
   - Go to http://localhost:5173

2. **Register**
   - Click "Register"
   - Fill in details with student ID, email, password
   - Select school and course

3. **Login**
   - Use credentials from registration

4. **Vote**
   - Click "Vote"
   - Browse available positions
   - Select one candidate per position
   - Submit votes

5. **View Results**
   - Click "Results"
   - See real-time vote counts

### For Administrators

1. **Access Admin Dashboard**
   - Go to http://localhost:5173/admin
   - Login with admin credentials

2. **Start Election**
   - Click "Manage Elections"
   - Click "Start Election"
   - Election status changes to ACTIVE

3. **Monitor Voting**
   - View real-time statistics
   - See participation rates
   - Monitor voter turnout

4. **Manage Data**
   - Add/Edit candidates
   - Manage user access
   - Manage departments/courses

---

## 🚀 Starting/Stopping Services

### Start Backend
```powershell
cd backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Start Frontend
```powershell
cd frontend
npm run dev
```

### Stop Services
- **Backend:** Press Ctrl+C in backend terminal
- **Frontend:** Press Ctrl+C in frontend terminal
- **Both:** Use terminal kill commands

---

## 🐛 Troubleshooting

### Backend Won't Start
- Check if port 8000 is available
- Verify Python dependencies: `pip install -r requirements.txt`
- Check database connection in `.env`

### Frontend Won't Start
- Check if port 5173 is available
- Run `npm install` to install dependencies
- Check Node.js version (v16+)

### Database Issues
- Database file: `backend/voting_system.db`
- To reset: Delete the file and run setup again
- Run setup: `python backend/setup_machakos_election.py`

### Can't Connect Backend & Frontend
- Ensure both services are running
- Check firewall settings
- Verify ports are correct (8000 and 5173)

---

## 📋 Candidate List by Position

### University Level (9 positions × 3 candidates = 27 candidates)

**President:**
- Brian Mwangi
- Kevin Otieno
- Collins Mutiso

**Deputy President:**
- Peter Ochieng
- Samuel Njoroge
- David Mutua

**Secretary General:**
- Faith Wanjiku
- Esther Nyambura
- Irene Achieng

**Treasurer:**
- Dennis Kiptoo
- Kelvin Kariuki
- Boniface Mutua

**PWD Representative 1:**
- Mercy Achieng
- Lucy Wambui
- Ann Wanjiru

**PWD Representative 2:**
- Samuel Kiplangat
- Peter Kariuki
- Brian Otieno

**Sports & Entertainment:**
- Collins Mutiso
- Victor Kiptoo
- Kevin Mutua

**Academic Affairs Rep:**
- Esther Nyambura
- Faith Chebet
- Brian Mwangi

**Welfare Rep:**
- Peter Ochieng
- Mercy Wanjiru
- David Mwangi

---

## 💾 Data Persistence

- **Election data** is stored in SQLite database
- **Session data** persists in browser localStorage
- **API responses** are cached appropriately
- **Audit logs** record all admin actions

---

## 📞 Next Steps

1. **Test the System:**
   - Register as a student
   - Cast test votes
   - View results

2. **Configure Election:**
   - Login as admin
   - Start the election
   - Monitor voting process

3. **Generate Reports:**
   - Use admin dashboard to export results
   - View detailed statistics

---

## ✨ System Configuration Summary

| Component | Configuration |
|-----------|---------------|
| Database Engine | SQLite (Local) |
| API Host | 0.0.0.0 |
| API Port | 8000 |
| Frontend Port | 5173 |
| Authentication | JWT |
| Password Hashing | Bcrypt |
| Vote Anonymity | Enforced |

---

**Machakos University Student Leadership Elections 2026 - READY TO VOTE! 🗳️**
