# Environment variables — where each value comes from

## Quick fill (4 secrets still needed)

| Variable | File | Supabase location |
|----------|------|-------------------|
| `REACT_APP_SUPABASE_ANON_KEY` | `frontend/.env` | Settings → **API Keys** → Publishable key |
| `DATABASE_URL` | `backend/.env` | Settings → **Database** → URI → Transaction pooler `:6543` |
| `SUPABASE_JWT_SECRET` | `backend/.env` | Settings → **JWT Keys** → JWT Secret |
| `SUPABASE_SERVICE_ROLE_KEY` | `backend/.env` | Settings → **API Keys** → Secret key |

Project URL is already set: `https://rtpooqxhhmmlmjlclifu.supabase.co`

---

## Local vs production

| Variable | Local | Production (EC2) |
|----------|-------|------------------|
| `REACT_APP_BACKEND_URL` | `http://localhost:8000` | `https://api.frontseatmedia.in` |
| `ENABLE_DEV_SESSION` | `true` | `false` |
| `CORS_ORIGINS` | `http://localhost:3000` | `https://frontseatmedia.in,https://www.frontseatmedia.in` |

Rebuild frontend after changing `REACT_APP_*` (`npm run build`).

Restart backend after changing `backend/.env`.
