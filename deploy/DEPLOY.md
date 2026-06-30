# Deploy plan — Frontseat Seeding

**Domain:** [frontseatmedia.in](https://frontseatmedia.in) (GoDaddy)  
**Stack:** Supabase (Postgres + **Auth** + Storage) · EC2 (recommended) or App Runner + S3

---

## Progress checklist

### Phase 1 — Supabase
- [x] Create Supabase project
- [x] Run `supabase/migrations/001_initial_schema.sql` (database tables)
- [x] Storage bucket `uploads` created (private)
- [ ] **Google OAuth** — [GOOGLE-AUTH.md](./GOOGLE-AUTH.md) (step-by-step)
- [ ] Copy API keys + `DATABASE_URL` into server `.env`

### Phase 2 — Server (pick one)
- [ ] **EC2** (recommended for GoDaddy) → [EC2.md](./EC2.md)
- [ ] **OR** App Runner + S3/CloudFront → sections 4–5 below

### Phase 3 — GoDaddy DNS
- [ ] Point domain to server (A records for EC2, or CNAME for CloudFront/App Runner)

### Phase 4 — Go live
- [ ] Build frontend with Supabase + API env vars
- [ ] Deploy backend + frontend
- [ ] Test Google login on `https://frontseatmedia.in`

---

## Architecture

```
User → frontseatmedia.in (EC2 nginx or CloudFront)
         ↓ Google login
       Supabase Auth (OAuth)
         ↓ access_token
       FastAPI POST /api/auth/session
         ↓ app session + role (admin/bd/pending)
       Supabase Postgres + Storage
```

| Component | Service |
|-----------|---------|
| Login (Google) | **Supabase Auth** |
| Roles & permissions | **Your FastAPI app** (`users` table) |
| Database | **Supabase Postgres** |
| File uploads | **Supabase Storage** (`uploads` bucket) |
| Website + API host | **EC2** (or App Runner + S3) |

---

## Authentication (Supabase Auth)

We use **Supabase Auth for Google sign-in only**. After login, the app issues its own session token so roles (admin, BD, fulfillment, pending) stay in your database.

### Login flow

1. User clicks **Continue with Google** → `supabase.auth.signInWithOAuth({ provider: 'google' })`
2. Supabase handles Google OAuth → redirects to `/auth/callback`
3. Frontend reads Supabase session → sends `access_token` to `POST /api/auth/session`
4. Backend verifies JWT with `SUPABASE_JWT_SECRET`, checks `@owledmedia.com`, upserts `users` row, returns `session_token`
5. All API calls use `Authorization: Bearer <session_token>`

### Phase 1.4 — Google OAuth setup

**Full click-by-click guide:** [GOOGLE-AUTH.md](./GOOGLE-AUTH.md)

Summary — two different redirect URLs (do not swap them):

| Configure in | Redirect URL |
|--------------|--------------|
| **Google Cloud Console** | `https://YOUR-REF.supabase.co/auth/v1/callback` |
| **Supabase → URL Configuration** | `https://frontseatmedia.in/auth/callback` |

#### A) Google Cloud Console

1. [console.cloud.google.com](https://console.cloud.google.com) → create/select project
2. **APIs & Services → OAuth consent screen** → configure (External is fine)
3. **Credentials → Create credentials → OAuth client ID → Web application**
4. **Authorized redirect URI** (replace `[project-ref]` with your Supabase project ref):

   ```
   https://[project-ref].supabase.co/auth/v1/callback
   ```

5. Copy **Client ID** and **Client Secret**

#### B) Supabase dashboard

1. **Authentication → Providers → Google** → Enable → paste Client ID + Secret → Save
2. **Authentication → URL Configuration → Redirect URLs** → add:

   ```
   http://localhost:3000/auth/callback
   https://frontseatmedia.in/auth/callback
   https://www.frontseatmedia.in/auth/callback
   ```

3. Optional: under Google provider, restrict to your workspace if Supabase exposes hosted-domain settings

#### C) Keys for `.env` files

From **Project Settings → API**:

| Key | Used in |
|-----|---------|
| Project URL | `SUPABASE_URL`, `REACT_APP_SUPABASE_URL` |
| anon public | `REACT_APP_SUPABASE_ANON_KEY` (frontend only) |
| service_role | `SUPABASE_SERVICE_ROLE_KEY` (backend only — never expose) |
| JWT Secret | `SUPABASE_JWT_SECRET` (backend verifies login tokens) |

From **Project Settings → Database → Connection string** (URI, **Transaction pooler**, port **6543**):

| Key | Used in |
|-----|---------|
| Postgres URI | `DATABASE_URL` (backend) |

---

## Phase 1 — Supabase (reference)

Already done if you checked the boxes above.

1. **SQL** — full file: `supabase/migrations/001_initial_schema.sql`
2. **Storage** — bucket `uploads`, private, 0 policies is OK (backend uses service role)
3. **Auth** — complete Google OAuth section above

First backend startup auto-seeds teams, pages, demo users, and sample deals if DB is empty.

---

## Phase 2 — EC2 (recommended)

No AWS CLI required. Full guide: **[EC2.md](./EC2.md)**

Summary:

| Host | Points to |
|------|-----------|
| `frontseatmedia.in` | EC2 Elastic IP (A record in GoDaddy) |
| `www.frontseatmedia.in` | Same IP or CNAME to `@` |
| `api.frontseatmedia.in` | Same EC2 (nginx routes to uvicorn) |

---

## Phase 2 alt — App Runner + S3 (optional)

Use this only if you prefer managed hosting over EC2.

### DNS (GoDaddy)

| Record | Type | Target |
|--------|------|--------|
| `www` | CNAME | CloudFront distribution |
| `api` | CNAME | App Runner custom domain |
| `@` | Forward | `https://www.frontseatmedia.in` (GoDaddy forwarding) |

### Backend (App Runner)

1. ECR repository → build & push Docker image (`aws/deploy-backend.sh` or Docker + Console)
2. App Runner service, port **8000**, env vars from `backend/.env.example`
3. Custom domain: `api.frontseatmedia.in`

### Frontend (S3 + CloudFront)

1. ACM cert in **us-east-1** for `frontseatmedia.in` + `www`
2. S3 bucket + CloudFront + SPA error rules (403/404 → `index.html`)
3. Build & upload — see `aws/deploy-frontend.sh` or S3 Console upload

---

## Environment variables

### Backend (`backend/.env`)

```env
DATABASE_URL=postgresql://postgres.[ref]:[password]@...pooler.supabase.com:6543/postgres
SUPABASE_URL=https://[project-ref].supabase.co
SUPABASE_JWT_SECRET=...
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_STORAGE_BUCKET=uploads

APP_NAME=frontseat-seeding
SEED_ADMIN_EMAIL=jaskaran.sethi@owledmedia.com
ALLOWED_EMAIL_DOMAIN=owledmedia.com
ENABLE_DEV_SESSION=false
CORS_ORIGINS=https://frontseatmedia.in,https://www.frontseatmedia.in
```

### Frontend (`frontend/.env`)

```env
REACT_APP_BACKEND_URL=https://api.frontseatmedia.in
REACT_APP_SUPABASE_URL=https://[project-ref].supabase.co
REACT_APP_SUPABASE_ANON_KEY=...
```

For EC2 with single server, you can use `REACT_APP_BACKEND_URL=https://api.frontseatmedia.in` or same-origin `/api` if nginx proxies.

---

## Post-deploy checklist

- [ ] Google OAuth redirect URI in Google Cloud includes `https://[ref].supabase.co/auth/v1/callback`
- [ ] Supabase redirect URLs include `https://frontseatmedia.in/auth/callback`
- [ ] `SUPABASE_JWT_SECRET` set on backend (login will fail without it)
- [ ] `ENABLE_DEV_SESSION=false` in production
- [ ] `service_role` key never in frontend or git
- [ ] Login works with `@owledmedia.com` Google account
- [ ] New users land on **Pending approval** until admin assigns role

---

## Local dev (quick test)

```bash
# Backend
cd backend && cp .env.example .env   # fill Supabase values
pip install -r requirements.txt
uvicorn server:app --reload --port 8000

# Frontend
cd frontend && cp .env.example .env
npm install --legacy-peer-deps && npm start
```

Open `http://localhost:3000` → Google login → should hit Supabase → callback → dashboard or pending screen.
