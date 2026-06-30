# Frontseat Seeding

Internal dashboard for brand brief inflow, admin approval, fulfillment, and revenue tracking.

**Production:** [frontseatmedia.in](https://frontseatmedia.in)  
**Stack:** React · FastAPI · **Supabase Auth** + Postgres + Storage · EC2 (or AWS App Runner)

## Deploy

| Step | Guide |
|------|--------|
| Full plan + Supabase Auth | [deploy/DEPLOY.md](deploy/DEPLOY.md) |
| EC2 (recommended, no AWS CLI) | [deploy/EC2.md](deploy/EC2.md) |

## Quick local dev

```bash
cd backend && cp .env.example .env && pip install -r requirements.txt
uvicorn server:app --reload --port 8000

cd frontend && cp .env.example .env && npm install --legacy-peer-deps && npm start
```

Login uses **Supabase Google OAuth** → app session with roles in Postgres.
