# Handoff for Claude — Frontseat Seeding

**Read this first.** User is mid-deploy; finish secrets → local test → EC2 → GoDaddy.

---

## Copy-paste brief

```
Project: Frontseat Seeding (internal brand brief / fulfillment dashboard)
Path: C:\Users\skill\Desktop\FS-Seeding-main
GitHub: https://github.com/Crazon55/frontseat-seeding (private, main)
Domain: frontseatmedia.in (GoDaddy) — api.frontseatmedia.in for API
Deploy path: EC2 (single server + nginx) — NOT App Runner unless user changes mind

Supabase project: frontseat-seeding
Ref: rtpooqxhhmmlmjlclifu
URL: https://rtpooqxhhmmlmjlclifu.supabase.co
Google callback (Google Cloud redirect URI): https://rtpooqxhhmmlmjlclifu.supabase.co/auth/v1/callback
```

---

## Done ✅

### Infrastructure (Supabase dashboard)
- [x] Project created
- [x] SQL migration run — `supabase/migrations/001_initial_schema.sql`
- [x] Storage bucket `uploads` (private)
- [x] Google provider enabled (Client ID + Secret in Supabase)
- [x] **URL Configuration:**
  - Site URL: `https://frontseatmedia.in`
  - Redirect URLs: `http://localhost:3000/auth/callback`, `https://frontseatmedia.in/auth/callback`

### Code (repo)
- [x] Mongo/Emergent removed → Supabase Postgres + Auth + Storage
- [x] Auth: Google via Supabase → `POST /api/auth/session` → app roles in `users` table
- [x] `@owledmedia.com` only; admin seed: `jaskaran.sethi@owledmedia.com`
- [x] `.env` files exist with known values pre-filled — see `deploy/ENV.md`
- [x] Docs: `deploy/DEPLOY.md`, `deploy/EC2.md`, `deploy/GOOGLE-AUTH.md`, `deploy/ENV.md`

### Verify (user may have done — confirm if login fails)
- [ ] Google Cloud → **Clients** → redirect URI = `https://rtpooqxhhmmlmjlclifu.supabase.co/auth/v1/callback`

---

## Not done ❌ — your tasks

### 1. Fill 4 secrets in `.env` (BLOCKER)

Files: `frontend/.env`, `backend/.env` — values are **empty after `=`** on required lines.

See **`deploy/ENV.md`** for Supabase → variable mapping.

Ask user for secrets one at a time if needed. **Do not commit `.env`.**

### 2. Local smoke test

```powershell
cd C:\Users\skill\Desktop\FS-Seeding-main\backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
uvicorn server:app --reload --port 8000

cd C:\Users\skill\Desktop\FS-Seeding-main\frontend
npm install --legacy-peer-deps
npm start
```

→ `http://localhost:3000/login` → Google → dashboard or pending approval.

### 3. EC2 deploy

Follow **`deploy/EC2.md`**. Switch `.env` to production values (commented blocks in `backend/.env`).

### 4. GoDaddy DNS

A records: `@`, `www`, `api` → EC2 Elastic IP.

---

## Auth flow

```
Login.jsx (signInWithOAuth google)
  → Google
  → Supabase /auth/v1/callback          [Google Cloud redirect URI]
  → app /auth/callback                  [Supabase URL Configuration]
  → AuthCallback.jsx
  → POST /api/auth/session { access_token }
  → verify SUPABASE_JWT_SECRET → users table → session_token
```

---

## Key paths

| Path | Role |
|------|------|
| `backend/server.py` | API + auth + seed |
| `backend/postgres_db.py` | Postgres layer |
| `backend/storage.py` | Supabase Storage |
| `frontend/src/lib/supabase.js` | Supabase client |
| `frontend/src/components/AuthCallback.jsx` | OAuth return handler |
| `frontend/.env` | 1 secret needed: anon/publishable key |
| `backend/.env` | 3 secrets needed: DATABASE_URL, JWT_SECRET, SERVICE_ROLE |

---

## User rules

- Do not commit unless asked
- Do not put `service_role` or JWT secret in frontend
- Prefer EC2 over AWS CLI / App Runner
- Minimize scope — fix deploy blockers first

---

## Suggested order

1. Fill `.env` from `deploy/ENV.md`
2. Run local test, fix errors
3. EC2 + nginx + certbot per `deploy/EC2.md`
4. GoDaddy DNS
5. Production login test on `https://frontseatmedia.in`
