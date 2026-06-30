# Google OAuth + Supabase Auth — detailed setup

This walks through **every click** for Google login on Frontseat Seeding.

---

## How the redirects work (read this first)

There are **two different redirect URLs**. People mix them up — that’s the #1 cause of login failures.

| Where | URL | Who uses it |
|-------|-----|-------------|
| **Google Cloud Console** | `https://YOUR-REF.supabase.co/auth/v1/callback` | Google → sends user **to Supabase** after sign-in |
| **Supabase dashboard** | `https://frontseatmedia.in/auth/callback` | Supabase → sends user **back to your app** after sign-in |
| **Supabase dashboard** (dev) | `http://localhost:3000/auth/callback` | Same, for local testing |

Flow:

```
Your app (frontseatmedia.in/login)
  → user picks Google
  → Supabase (YOUR-REF.supabase.co)
  → Google sign-in
  → back to Supabase (/auth/v1/callback)   ← Google Cloud redirect
  → back to your app (/auth/callback)      ← Supabase redirect URL
  → your API creates session + role
```

---

## Part 1 — Find your Supabase project reference

1. Open [supabase.com/dashboard](https://supabase.com/dashboard)
2. Open your project
3. **Project Settings** (gear icon, bottom of left sidebar) → **General**
4. Find **Reference ID** — a short random string, e.g. `abcdefghijklmnop`

Your Supabase URLs:

- Project URL: `https://abcdefghijklmnop.supabase.co`
- **Google redirect URI (copy exactly):**  
  `https://abcdefghijklmnop.supabase.co/auth/v1/callback`

Keep this tab open.

---

## Part 2 — Google Cloud Console

### 2.1 Create or pick a Google Cloud project

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Top bar → project dropdown → **New Project**
3. Name: e.g. `Frontseat Seeding` → **Create**
4. Wait ~30 seconds → select that project in the top bar

You can reuse an existing OWLED Media Google Cloud project if you already have one.

### 2.2 Configure OAuth consent screen

Google requires this **before** you can create OAuth credentials.

1. Left menu → **APIs & Services** → **OAuth consent screen**
2. **User Type:**
   - **Internal** — only if you have **Google Workspace** for `@owledmedia.com` and the project is under that org. Best for restricting to your company.
   - **External** — anyone with a Google account can see the consent screen, but **your app** still blocks non-`@owledmedia.com` emails on the backend. Use this if you don’t have Workspace or Internal isn’t available.
3. Click **Create** (External) or select Internal
4. **App information:**
   - App name: `Frontseat Seeding`
   - User support email: your email
   - Developer contact: your email
5. **Scopes** → **Save and Continue** (default `email`, `profile`, `openid` is enough — Supabase adds what it needs)
6. **Test users** (External only, while app is in “Testing”):
   - Add emails that will test login, e.g. `jaskaran.sethi@owledmedia.com`
   - While in Testing mode, **only listed test users** can sign in
7. **Summary** → **Back to Dashboard**

**Publishing (External):** For production, go to OAuth consent screen → **Publish app**. Until then, only test users work.

### 2.3 Create OAuth client ID

1. **APIs & Services** → **Credentials**
2. **+ Create Credentials** → **OAuth client ID**
3. Application type: **Web application**
4. Name: `Frontseat Seeding - Supabase`

5. **Authorized JavaScript origins** (optional but recommended):

   ```
   https://frontseatmedia.in
   https://www.frontseatmedia.in
   http://localhost:3000
   ```

   Add each with **+ Add URI**.  
   Do **not** put the Supabase callback here — that goes in redirect URIs.

6. **Authorized redirect URIs** — **this is critical:**

   Click **+ Add URI** and paste **exactly** (use YOUR reference ID):

   ```
   https://YOUR-REF.supabase.co/auth/v1/callback
   ```

   Example:

   ```
   https://abcdefghijklmnop.supabase.co/auth/v1/callback
   ```

   Rules:
   - Must be `https`
   - Must end with `/auth/v1/callback`
   - No trailing slash after `callback`
   - Must match your Supabase project ref exactly

7. Click **Create**

8. A popup shows **Client ID** and **Client secret** — copy both somewhere safe.  
   You can always find them again under **Credentials** → click the client name.

---

## Part 3 — Supabase dashboard

### 3.1 Enable Google provider

1. Supabase dashboard → your project
2. Left sidebar → **Authentication**
3. **Sign In / Providers** (or **Providers** tab)
4. Find **Google** → expand or click
5. Toggle **Enable Sign in with Google** → ON
6. Paste:
   - **Client ID** — from Google Cloud (ends in `.apps.googleusercontent.com`)
   - **Client Secret** — from Google Cloud
7. **Save**

Optional: Some Supabase versions show **Skip nonce check** — leave OFF unless Supabase docs tell you otherwise.

### 3.2 Site URL

1. Still under **Authentication** → **URL Configuration**
2. **Site URL** — set to your production app:

   ```
   https://frontseatmedia.in
   ```

   For local-only testing temporarily, you can use `http://localhost:3000`, but switch to production URL before go-live.

### 3.3 Redirect URLs (your app callbacks)

Same page — **Redirect URLs** (allow list):

Click **Add URL** for each:

```
http://localhost:3000/auth/callback
https://frontseatmedia.in/auth/callback
https://www.frontseatmedia.in/auth/callback
```

These must match what your React app uses. The code uses:

```javascript
redirectTo: window.location.origin + "/auth/callback"
```

So on production that becomes `https://frontseatmedia.in/auth/callback`.

**Save** the URL configuration.

---

## Part 4 — Frontend environment variables

On your PC, in `frontend/.env`:

```env
REACT_APP_SUPABASE_URL=https://YOUR-REF.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
REACT_APP_BACKEND_URL=http://localhost:8000
```

Get **anon key** from Supabase → **Project Settings** → **API** → `anon` `public`.

Restart the dev server after changing `.env`:

```bash
npm start
```

---

## Part 5 — Backend environment variable

In `backend/.env`:

```env
SUPABASE_URL=https://YOUR-REF.supabase.co
SUPABASE_JWT_SECRET=your-jwt-secret-from-supabase-api-settings
```

**JWT Secret** is on **Project Settings → API** → **JWT Settings** → JWT Secret (click reveal).

The backend uses this to verify the token Supabase gives the frontend after Google login.

---

## Part 6 — Test login locally

1. Start backend: `uvicorn server:app --reload --port 8000`
2. Start frontend: `npm start`
3. Open `http://localhost:3000/login`
4. Click **Continue with Google**
5. Expected path:
   - Redirect to Google
   - Sign in with `@owledmedia.com` account
   - Redirect back to `http://localhost:3000/auth/callback`
   - Brief “Signing you in…” then dashboard or **Pending approval**

---

## Common errors and fixes

### `redirect_uri_mismatch` (Google error page)

Google’s redirect URI doesn’t match.

- Fix in **Google Cloud → Credentials → your OAuth client**
- Redirect URI must be exactly:  
  `https://YOUR-REF.supabase.co/auth/v1/callback`
- Not your frontseatmedia.in URL — that goes in Supabase, not Google

### `Invalid redirect URL` (Supabase)

Your app callback isn’t in Supabase allow list.

- Add `http://localhost:3000/auth/callback` (dev) or production URL in **Authentication → URL Configuration → Redirect URLs**

### `Access blocked: app has not completed Google verification`

External app still in **Testing** and your email isn’t a test user.

- Add your email under **OAuth consent screen → Test users**, or **Publish app**

### Login works but API returns 401 / “Invalid access token”

- `SUPABASE_JWT_SECRET` missing or wrong in backend `.env`
- Restart backend after changing `.env`

### Login works but “Only @owledmedia.com emails are allowed”

- Working as designed — sign in with a company Google account
- Or change `ALLOWED_EMAIL_DOMAIN` in backend `.env` (not recommended for production)

### Google shows account picker but wrong domain accounts appear

The login button sends `hd: owledmedia.com` as a hint — Google may still show other accounts. Backend enforces the domain.

---

## Checklist before production

- [ ] Google redirect URI = `https://YOUR-REF.supabase.co/auth/v1/callback`
- [ ] Supabase Google provider enabled with Client ID + Secret
- [ ] Supabase Site URL = `https://frontseatmedia.in`
- [ ] Supabase Redirect URLs include `https://frontseatmedia.in/auth/callback`
- [ ] Frontend built with `REACT_APP_SUPABASE_URL` and `REACT_APP_SUPABASE_ANON_KEY`
- [ ] Backend has `SUPABASE_JWT_SECRET`
- [ ] Google OAuth app published (External) or all users added as test users (Testing)

---

## Quick reference

| Setting | Value |
|---------|--------|
| Google → Redirect URI | `https://YOUR-REF.supabase.co/auth/v1/callback` |
| Supabase → Site URL | `https://frontseatmedia.in` |
| Supabase → Redirect URLs | `https://frontseatmedia.in/auth/callback`, `http://localhost:3000/auth/callback` |
| Frontend env | `REACT_APP_SUPABASE_URL`, `REACT_APP_SUPABASE_ANON_KEY` |
| Backend env | `SUPABASE_JWT_SECRET`, `SUPABASE_URL` |
