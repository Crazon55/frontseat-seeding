# Showcase deploy (Render + MongoDB Atlas)

~15 minutes. One URL serves the React app and API (`/api/*`).

## 1. MongoDB Atlas

1. [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) → free M0 cluster.
2. **Database Access** → user + password.
3. **Network Access** → Allow access from anywhere (`0.0.0.0/0`) for the demo.
4. **Connect** → Drivers → copy connection string. Replace `<password>` and set `DB_NAME=frontseat_seeding`.

## 2. GitHub

Repo: `https://github.com/Crazon55/frontseat-seeding` (branch `main`).

## 3. Render

1. [render.com](https://render.com) → **New +** → **Web Service** → connect repo.
2. **Runtime:** Docker (uses root `Dockerfile`).
3. **Environment variables:**

   | Key | Value |
   |-----|--------|
   | `MONGO_URL` | Atlas connection string |
   | `DB_NAME` | `frontseat_seeding` |
   | `ENABLE_DEV_SESSION` | `true` |
   | `SINGLE_ORIGIN` | `true` |
   | `CORS_ORIGINS` | `https://YOUR-SERVICE.onrender.com` |

4. Deploy. First boot seeds demo teams/users (may take 1–2 min on free tier).

## 4. Demo login

On the login page use **Admin**, **BD**, or **Fulfillment** (no Google needed). Google OAuth may not work on Render unless Emergent redirect URLs are updated.

## 5. Custom domain (optional)

Render → **Settings → Custom Domains** → add `seeding.owledmedia.com` → CNAME to Render hostname. Update `CORS_ORIGINS` to match.

## Health check

`GET /health` → `{"ok": true}`
