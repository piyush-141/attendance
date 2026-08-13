# AttendIQ — QR-Based Classroom Attendance System

A full-stack web app for secure, QR-based classroom attendance. Teachers display a rotating QR code; students scan and self-register. Anti-fraud via device fingerprinting, one-time tokens, and HttpOnly cookies.

## Quick Start

### 1. Set up the Database

You need a PostgreSQL database. Options:
- **Local**: `createdb attendance`
- **Cloud**: [Neon](https://neon.tech) (free tier, generous limits)

### 2. Configure Backend

```bash
cd backend
cp .env.example .env
```

Edit `.env` and set your `DATABASE_URL`:
```
DATABASE_URL="postgresql://user:password@host:5432/attendance?schema=public"
```

### 3. Run Migrations & Seed

```bash
cd backend
npx prisma db push       # Create tables
npm run seed             # Seed demo data
```

Seed creates:
- **Teacher**: `teacher@demo.com` / `password123`
- 3 subjects (DW, CN, DBMS) × 2 class groups (CSE-A, CSE-B) × 30 students each

### 4. Start the Backend

```bash
cd backend
npm run dev
```
> Runs on http://localhost:4000

### 5. Start the Frontend

```bash
cd frontend
npm run dev
```
> Runs on http://localhost:5173

### 6. Test the Flow

1. Open http://localhost:5173 → login as `teacher@demo.com`
2. Select a subject → expand → click **Start** next to a class
3. The QR code appears. On your phone (same Wi-Fi), open http://`<your-local-ip>`:5173/scan/`<token>`
4. Enter roll number + name → submit
5. Watch it appear live on the teacher dashboard

---

## Project Structure

```
attendance/
├── backend/
│   ├── prisma/schema.prisma     # Data model (7 entities)
│   └── src/
│       ├── index.ts             # Express + Socket.IO entry
│       ├── socket.ts            # Socket.IO singleton
│       ├── middleware/auth.ts   # JWT middleware
│       ├── lib/
│       │   ├── prisma.ts        # DB client
│       │   └── qr.ts            # In-memory QR rotation engine
│       ├── routes/
│       │   ├── auth.ts          # Login / logout / me
│       │   ├── subjects.ts      # Teacher's subjects
│       │   ├── classes.ts       # Class groups + roster
│       │   ├── sessions.ts      # Start / end / QR poll / records
│       │   ├── scan.ts          # QR validation → challenge token
│       │   └── attendance.ts    # 6-step submission validation
│       └── seed.ts
└── frontend/
    └── src/
        ├── api/client.ts        # Axios + credentials
        ├── hooks/useSocket.ts   # Socket.IO hook
        └── pages/
            ├── Login.tsx
            ├── Dashboard.tsx
            ├── SessionView.tsx  # Live QR + attendance list
            ├── StudentScan.tsx  # Student self-submission
            └── RecordsView.tsx  # Past session records
```

## Security Model

| Layer | Defeats |
|---|---|
| Rotating QR (9s) | Forwarding a screenshot/link |
| One-time challenge token (20s) | Replay attacks |
| Device fingerprint (DB unique constraint) | One phone → multiple students |
| HttpOnly `scan_session` cookie | URL copy-paste to a different browser |
| 6-step server validation | All of the above, enforced server-side |

## API Reference

**Teacher (JWT cookie required)**
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/subjects`
- `GET /api/subjects/:id/classes`
- `GET /api/classes/:id/records`
- `GET /api/classes/:id/roster`
- `POST /api/sessions/start`
- `GET /api/sessions/:id/qr`
- `POST /api/sessions/:id/end`
- `GET /api/sessions/records/:sessionId`

**Student (public)**
- `GET /api/scan/:qrToken`
- `POST /api/attendance/submit`

**Socket.IO**
- Room: `session:{sessionId}`
- Events: `attendance:new`, `session:ended`
