# Quick Start Guide - Machakos University Voting System

## 🚀 Quick Access Links

| Item | Link |
|------|------|
| **Application** | http://localhost:5173 |
| **Admin Dashboard** | http://localhost:5173/admin |
| **API Docs** | http://localhost:8000/docs |
| **API ReDoc** | http://localhost:8000/redoc |

---

## 🔐 Admin Login Credentials

```
Email: admin@machakosuni.ac.ke
Password: admin123
```

---

## ⚡ Quick Terminal Commands

### Start the Entire System

#### Terminal 1 - Backend
```powershell
cd "c:\Users\hp elitebook 840\Desktop\online-student-voting-system\backend"
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

#### Terminal 2 - Frontend
```powershell
cd "c:\Users\hp elitebook 840\Desktop\online-student-voting-system\frontend"
npm run dev
```

### Reset Database
```powershell
cd "c:\Users\hp elitebook 840\Desktop\online-student-voting-system\backend"
# Delete the database file
rm voting_system.db

# Recreate and populate
python setup_machakos_election.py
```

### Check if Ports are Available
```powershell
# Check port 8000 (Backend)
netstat -ano | findstr :8000

# Check port 5173 (Frontend)
netstat -ano | findstr :5173
```

### Kill Process on Port
```powershell
# For port 8000
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# For port 5173
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

---

## 📱 User Journey

### Student Workflow

1. **Visit Application**
   ```
   Go to: http://localhost:5173
   Redirected to: http://localhost:5173/login
   ```

2. **Register Account**
   - Click "Register"
   - Fill in:
     - Name
     - Student ID (e.g., "STU001")
     - Email (e.g., "student@machakosuni.ac.ke")
     - Password
     - School (Dropdown)
     - Course (Dropdown)
   - Submit

3. **Login**
   - Enter registered email
   - Enter password
   - Click "Login"

4. **Vote**
   - Click "Vote" from dashboard
   - See available positions
   - For each position: Select one candidate
   - Click "Submit Vote"
   - See confirmation

5. **View Results**
   - Click "Results"
   - See real-time vote counts
   - View candidate rankings

### Admin Workflow

1. **Access Admin Dashboard**
   ```
   Go to: http://localhost:5173/admin
   ```

2. **Login**
   - Email: admin@machakosuni.ac.ke
   - Password: admin123

3. **Start Election**
   - Click "Manage Elections"
   - Find the election
   - Click "Start"
   - Status changes to ACTIVE

4. **Monitor Voting**
   - View real-time statistics
   - See voter participation
   - Track vote counts

5. **Manage System**
   - Add/Edit candidates
   - Manage users
   - View audit logs
   - Export results

---

## 🎯 System Capabilities

### Available at Launch

| Feature | Status |
|---------|--------|
| Student Registration | ✅ Active |
| Student Login | ✅ Active |
| Voting System | ✅ Active |
| Results Viewing | ✅ Active |
| Admin Dashboard | ✅ Active |
| Election Management | ✅ Active |
| Audit Logging | ✅ Active |
| Anonymous Voting | ✅ Active |
| Vote Validation | ✅ Active |

---

## 📊 Election Statistics

### Quick Numbers
- **Total Candidates:** 150+
- **Total Positions:** 57
- **University Positions:** 9
- **School Positions:** 3
- **Course Positions:** 45
- **Schools:** 3
- **Departments:** 16
- **Courses:** 45

### Admin Credentials
- **Email:** admin@machakosuni.ac.ke
- **Password:** admin123
- **Role:** ADMIN

---

## 🔍 API Quick Test

### Test Backend Health
```powershell
# Check if backend is running
Invoke-WebRequest -Uri http://localhost:8000/docs -UseBasicParsing | Select-Object -ExpandProperty StatusCode
# Should return: 200
```

### Login API Call (PowerShell)
```powershell
$loginData = @{
    email = "admin@machakosuni.ac.ke"
    password = "admin123"
} | ConvertTo-Json

Invoke-WebRequest -Uri http://localhost:8000/auth/login `
    -Method POST `
    -Headers @{"Content-Type"="application/json"} `
    -Body $loginData `
    -UseBasicParsing
```

---

## 🗂️ Important Files

| File | Location | Purpose |
|------|----------|---------|
| Database | `backend/voting_system.db` | SQLite database |
| Setup Script | `backend/setup_machakos_election.py` | Initialize database |
| Backend Config | `backend/app/config.py` | Backend settings |
| Frontend Config | `frontend/vite.config.ts` | Build configuration |
| Models | `backend/app/models.py` | Database models |
| Main Backend | `backend/app/main.py` | FastAPI app |

---

## ⚙️ Configuration

### Backend (.env)
```
DATABASE_URL="sqlite:///./voting_system.db"
SECRET_KEY="change-this-in-production"
ACCESS_TOKEN_EXPIRE_MINUTES=480
```

### Frontend (vite.config.ts)
```typescript
VITE_API_URL=http://localhost:8000
```

---

## 🔐 Security Notes

1. **Admin Credentials**
   - Keep credentials secure
   - Change password after first use in production
   - Use strong passwords

2. **Database**
   - SQLite file is stored locally
   - Regular backups recommended
   - Don't share database file

3. **API Tokens**
   - JWT tokens expire after configured time (480 minutes)
   - Tokens stored in browser localStorage
   - Clear browser data to logout all sessions

---

## 📝 Voting Process

1. Student logs in
2. System verifies student identity
3. Student navigates to voting page
4. System displays available positions
5. Student selects one candidate per position
6. Student submits vote
7. System creates VotingToken (links user to position)
8. System creates anonymous Vote (links candidate to vote)
9. Vote is recorded (anonymous, no user link)
10. Student sees confirmation
11. Student can view real-time results

---

## 🎯 Admin Functions

### Election Management
- ✅ Create elections
- ✅ Start/Stop elections
- ✅ View election details
- ✅ Edit election info

### Candidate Management
- ✅ Add candidates
- ✅ Edit candidate info
- ✅ Delete candidates
- ✅ Assign to positions

### User Management
- ✅ View users
- ✅ Create users
- ✅ Edit user info
- ✅ Reset user passwords
- ✅ View user activity

### Results
- ✅ View real-time results
- ✅ See vote counts
- ✅ View rankings
- ✅ Export results
- ✅ Generate reports

### System
- ✅ View audit logs
- ✅ See admin actions
- ✅ Track system activity
- ✅ Monitor performance

---

## 🚨 Troubleshooting Checklist

### Backend Won't Start
- [ ] Port 8000 available?
- [ ] Python installed? (`python --version`)
- [ ] Dependencies installed? (`pip install -r requirements.txt`)
- [ ] Database file exists or can be created?

### Frontend Won't Start
- [ ] Port 5173 available?
- [ ] Node.js installed? (`node --version`)
- [ ] Dependencies installed? (`npm install`)
- [ ] npm start works? (`npm run dev`)

### Can't Login
- [ ] Backend running?
- [ ] Check email and password
- [ ] Browser cache cleared?
- [ ] Check browser console for errors

### No Results Showing
- [ ] Election started?
- [ ] Votes submitted?
- [ ] Backend connected?
- [ ] Check database for votes

---

## 💡 Tips

### For Smooth Operation
1. Keep both terminals (backend + frontend) open
2. Check logs for errors
3. Use browser DevTools (F12) for debugging
4. Clear browser cache if issues occur
5. Restart services if unresponsive

### Performance Optimization
1. Database is local (fast access)
2. No external API calls needed
3. Caching enabled on frontend
4. Optimized database queries
5. Lazy loading on components

---

## 📞 Emergency Commands

### Restart Everything
```powershell
# Kill all related processes
taskkill /F /IM python.exe
taskkill /F /IM node.exe

# Wait 5 seconds
Start-Sleep -Seconds 5

# Restart backend
cd backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000

# In new terminal - Restart frontend
cd frontend
npm run dev
```

### Full System Reset
```powershell
# Stop backend (Ctrl+C)
# Stop frontend (Ctrl+C)

# Delete database
cd backend
rm voting_system.db

# Recreate database
python setup_machakos_election.py

# Restart both services
```

---

## ✨ Features Summary

### For Students
- ✅ Self-registration
- ✅ Secure authentication
- ✅ Simple voting interface
- ✅ Real-time results
- ✅ Vote submission confirmation
- ✅ Anonymous voting guarantee

### For Administrators
- ✅ User management
- ✅ Election control
- ✅ Candidate management
- ✅ Real-time statistics
- ✅ Results export
- ✅ Audit trail
- ✅ System monitoring

### System Features
- ✅ Responsive design
- ✅ Fast performance
- ✅ Secure data handling
- ✅ Error handling
- ✅ Data validation
- ✅ Transaction support
- ✅ Audit logging

---

## 🎓 What's Available

### 150+ Candidates Running for 57 Positions

**University Level:**
- 9 positions (President, VP, Secretary, Treasurer, etc.)
- 27 candidates total

**School Level:**
- 3 school representative positions
- 9 candidates total

**Course Level:**
- 45 course representative positions
- 115+ candidates total

---

## 🎯 Election Details

**Machakos University Student Leadership Elections 2026**

| Detail | Value |
|--------|-------|
| Status | PENDING (Ready to Start) |
| Start | 2026-05-01 08:13 UTC |
| End | 2026-05-08 08:13 UTC |
| Duration | 7 Days |
| Candidates | 150+ |
| Positions | 57 |
| Admin Email | admin@machakosuni.ac.ke |
| Admin Password | admin123 |

---

## ✅ System Ready!

All components operational:
- ✅ Database: Running
- ✅ Backend API: Running on port 8000
- ✅ Frontend: Running on port 5173
- ✅ Authentication: Working
- ✅ Voting System: Ready
- ✅ Results: Live
- ✅ Admin Dashboard: Accessible

**🗳️ Ready for Election! 🗳️**

---

**For detailed setup information, see:** `SETUP_COMPLETE.md`
**For system status, see:** `SYSTEM_RUNNING.md`
