# ARCH.md — QR-Based Classroom Attendance System

## 1. Overview

A web application that lets a teacher start an attendance session for a class, display a QR code, and let students self-register their attendance by scanning it and entering their roll number and name.

The architecture is optimized for **reliability at small scale**, not for high traffic. It runs on a single backend, a single database, and no distributed infrastructure. The one place the design is *not* minimal is the QR/session security model — that complexity is intentional, because it's the direct fix for the two problems that started this project:

1. A scanned link can be forwarded to students who aren't in the room.
2. One phone can register attendance for more than one student.

Everything else in the stack stays as simple as possible.

---

## 2. Design Priorities

- Reliable for a fixed, small user base (a handful of teachers, a few classes each) — not built to scale horizontally.
- One backend service, one Postgres database. No queues, no microservices, no Redis/cache layer.
- Students never need an account. Only teachers authenticate.
- Anti-fraud logic lives entirely in the backend; the frontend is a thin client.
- Buildable and maintainable by a single developer.

---

## 3. System Components

```
                Teacher Dashboard
              (React + TS, in browser)
                        │
                REST  +  Socket.IO
                        │
                        ▼
              Node.js + Express Server
                        │
     ┌──────────────────┼───────────────────┐
     │                  │                   │
     ▼                  ▼                   ▼
PostgreSQL        Session / QR         Device Fingerprint
(Prisma ORM)      Token Engine         + Duplicate Check
                        │
                        ▼
              Student Attendance Page
              (opens after QR scan, no login)
```

---

## 4. Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | React + Vite + TypeScript | Fast dev loop, type safety, simple deploys |
| Styling | Tailwind CSS | No custom CSS files to maintain |
| Backend | Node.js + Express | Simple REST server, huge ecosystem |
| Database | PostgreSQL + Prisma ORM | Relational data (teachers/classes/records), type-safe migrations |
| Teacher Auth | JWT + HttpOnly secure cookies | Stateless, standard, no session store needed |
| Real-time | Socket.IO | Live attendance list on the dashboard |
| QR Generation | `qrcode` npm package | Generates QR image server-side, no external service |
| Device ID | FingerprintJS (open source) | Browser fingerprint, no biometric data |
| Frontend hosting | Vercel | Zero-config React deploys |
| Backend hosting | Railway | Simple Node deploys, always-on process |
| Database hosting | Neon PostgreSQL | Managed Postgres, generous free tier |

No Redis, no message broker, no separate cache layer — QR/session state lives in the single Node process and Postgres, which is enough at this scale (see §7).

---

## 5. Data Model

| Entity | Key Fields | Purpose |
|---|---|---|
| `Teacher` | id, name, email, password_hash | Login, owns subjects |
| `Subject` | id, code, name, teacher_id | e.g. DW, CN, DBMS |
| `ClassGroup` | id, subject_id, name | e.g. CSE-A, CSE-B, IT-A |
| `StudentRoster` | id, class_id, roll_no, name | Pre-loaded class list, used to compute absentees |
| `AttendanceSession` | id, class_id, teacher_id, status, started_at, ended_at, expires_at | One session per "Start Attendance" click |
| `AttendanceToken` | id, session_id, token, device_fingerprint, cookie_id, issued_at, expires_at, used_at | One-time, per-scan challenge token |
| `AttendanceRecord` | id, session_id, roll_no, name, device_fingerprint, ip, user_agent, submitted_at | Final saved attendance entry |

`AttendanceSession.status`: `active → ended` (or `expired` if the timer runs out before the teacher ends it manually).

---

## 6. Core Security Model

This is the part that directly answers "how do we stop link sharing and multi-student devices." It's four layers, each defeating a specific attack — none of them alone is sufficient.

| Layer | Defeats | Mechanism |
|---|---|---|
| Rotating QR | Forwarding a screenshot/link after the fact | QR image regenerates every 8–10s; old QR token stops being accepted |
| One-time challenge token | Reloading/resubmitting the same scan | Minted on scan, single use, expires in ~15–20s |
| Device fingerprint binding | One phone marking multiple roll numbers | One `(session_id, device_fingerprint)` pair = one attendance record, enforced by a DB unique constraint |
| HttpOnly session cookie | Copy-pasting the raw URL into another browser | Challenge token is only valid from the browser that received the cookie |

**QR rotation** is kept in-memory in the Node process (current token + issue time per active session) — no external cache needed, since a session only exists for a few minutes and only one backend instance is running. Rotation can be disabled per session for a simpler, static-QR mode if a teacher prefers it, at the cost of weaker anti-sharing protection.

### Attendance validation sequence

Every submission is checked, in order, before anything is written to the database:

1. Session exists and is `active`.
2. Challenge token exists, belongs to this session, and is unexpired.
3. Challenge token has not already been used.
4. Cookie on the request matches the cookie the token was issued to.
5. No existing `AttendanceRecord` for this `(session_id, device_fingerprint)`.
6. Roll number exists in the class roster and hasn't already been marked present.

Only if all six pass: the record is stored, the token is marked used, and a Socket.IO event fires to the teacher dashboard.

---

## 7. Teacher Workflow

```
Login (JWT)
   → Dashboard: assigned subjects (DW, CN, DBMS…)
   → Select subject → select class (CSE-A, CSE-B…)
   → View past Attendance Records, or "Start Attendance"
   → Backend creates session, begins QR rotation
   → QR displayed to class, live attendance list fills in
   → Teacher clicks "End Attendance"
   → QR deactivated, session closed, sheet saved to Records
```

## 8. Student Workflow

```
Scan current QR
   → Backend validates session + issues one-time challenge token + sets cookie
   → Minimal page: enter roll number + name
   → Submit
   → Backend runs the 6-step validation above
   → Record saved, token burned, page confirms success
```

Students never create an account or log in.

---

## 9. Real-Time Updates

- On session start, the teacher's browser joins a Socket.IO room keyed by `session_id`.
- On every successful `AttendanceRecord` insert, the backend emits `attendance:new` (roll, name, time) to that room.
- On `End Attendance`, the backend emits `session:ended` and the room is closed.
- No polling; no manual refresh needed on the dashboard.

---

## 10. API Reference

**Teacher (JWT-protected)**
- `POST /api/auth/login`
- `GET /api/subjects`
- `GET /api/subjects/:id/classes`
- `GET /api/classes/:id/records`
- `GET /api/records/:sessionId`
- `POST /api/sessions/start` `{ subjectId, classId }`
- `POST /api/sessions/:id/end`

**Student (public, session-scoped)**
- `GET /api/scan/:qrToken` → validates session, sets cookie, returns challenge token
- `POST /api/attendance/submit` `{ challengeToken, rollNo, name, deviceFingerprint }`

**Realtime**
- Socket.IO room: `session:{sessionId}`
- Events: `attendance:new`, `session:ended`

---

## 11. Deployment

| Component | Platform |
|---|---|
| Frontend | Vercel |
| Backend | Railway (single always-on Node process) |
| Database | Neon PostgreSQL |

No containers, no orchestration, no CDN configuration beyond what Vercel does by default.

---

## 12. Known Limitations

This model makes casual fraud (forwarding a link, one phone marking several students) genuinely difficult, but it cannot stop **intentional in-person collusion** — e.g., a present student physically handing their unlocked phone to a friend to scan before putting it away. Closing that gap needs stronger identity verification: authenticated student accounts tied to registered devices, biometrics, or a supervised/native-app flow with device attestation. That's a deliberate scope boundary, not an oversight.

## 13. Future Enhancements

- Student login with college credentials, bound to a registered device
- Campus Wi-Fi or Bluetooth-beacon presence check
- Native Android/iOS app with device attestation (Play Integrity / App Attest)
- CSV/Excel export and emailed reports
- Audit log for flagged/suspicious submissions
- Timetable-driven automatic session scheduling
