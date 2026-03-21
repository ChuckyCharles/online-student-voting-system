# 🗳️ Online Student Voting System

A secure, production-ready online voting platform for student council elections built with Next.js 15, TypeScript, PostgreSQL, and Prisma.

## Features

- **Secure authentication** — email + password with bcrypt hashing, JWT sessions
- **Role-based access** — Student and Admin roles with middleware protection
- **Anonymous voting** — voter identity is separated from vote records via VotingToken pattern
- **One vote per position** — enforced at DB level with unique constraints + transactions
- **Admin dashboard** — manage elections, positions, candidates, and students
- **Audit logs** — all admin actions are logged
- **Rate limiting** — protects auth and voting endpoints
- **Input validation** — Zod schemas on all API routes

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend + Backend | Next.js 15 (App Router) |
| Language | TypeScript |
| Database | PostgreSQL 16 |
| ORM | Prisma 5 |
| Auth | NextAuth v4 (JWT) |
| Styling | Tailwind CSS 3 |
| Validation | Zod |
| Deployment | Docker + docker-compose |

---

## Quick Start (Local)

### Prerequisites
- Node.js 20+
- PostgreSQL 16 running locally (or use Docker)

### 1. Clone and install

```bash
git clone <repo-url>
cd online-student-voting-system
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env — set DATABASE_URL and NEXTAUTH_SECRET
```

Generate a secure secret:
```bash
openssl rand -base64 32
```

### 3. Set up the database

```bash
npx prisma migrate dev --name init
npm run db:seed
```

### 4. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Default credentials (from seed)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@university.edu | Admin@123 |
| Student | student1@university.edu | Student@123 |
| Student | student2@university.edu | Student@123 |

---

## Docker (Recommended)

```bash
# Copy and configure env
cp .env.example .env.production
# Edit .env.production with your secrets

# Build and start everything
docker-compose up --build
```

The app will be available at [http://localhost:3000](http://localhost:3000).

The container automatically runs migrations and seeds on startup.

---

## Project Structure

```
src/
├── app/
│   ├── (student)/          # Student-facing pages (layout-grouped)
│   │   ├── dashboard/      # Voting dashboard
│   │   ├── vote/[id]/      # Voting page per election
│   │   └── results/        # Results pages
│   ├── admin/              # Admin pages
│   │   ├── elections/      # Election management
│   │   ├── candidates/     # Candidate management
│   │   └── users/          # Student management
│   ├── api/
│   │   ├── auth/           # NextAuth + register
│   │   ├── vote/           # Vote submission
│   │   ├── elections/      # Election data
│   │   ├── results/        # Results (access-controlled)
│   │   └── admin/          # Admin-only APIs
│   ├── login/
│   └── register/
├── components/
│   └── Navbar.tsx
├── lib/
│   ├── auth.ts             # NextAuth config
│   ├── prisma.ts           # Prisma singleton
│   ├── validations.ts      # Zod schemas
│   ├── rate-limit.ts       # In-memory rate limiter
│   ├── audit.ts            # Audit logging
│   └── api.ts              # Response helpers
├── middleware.ts            # Route protection
└── __tests__/              # Unit tests
prisma/
├── schema.prisma
└── seed.ts
k8s/                        # Kubernetes manifests
```

---

## Anonymity Design

Votes are anonymous by design:

```
VotingToken (userId + positionId) → proves a user voted for a position
Vote (candidateId only)           → no userId, cannot be traced back
```

The `@@unique([userId, positionId])` constraint on `VotingToken` enforces one vote per position at the database level. Both records are created in a single transaction.

---

## Running Tests

```bash
npm test
```

---

## Kubernetes Deployment

```bash
# Create secrets first (edit k8s/secrets.yaml with real values)
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/postgres.yaml
kubectl apply -f k8s/deployment.yaml
```

---

## Security Notes

- All passwords hashed with bcrypt (cost factor 12)
- JWT sessions expire after 8 hours
- All API routes validate input with Zod
- Admin routes double-checked server-side (not just middleware)
- Rate limiting on auth and voting endpoints
- No raw vote data exposed — only aggregated counts
- Environment secrets never committed (`.env` in `.gitignore`)
