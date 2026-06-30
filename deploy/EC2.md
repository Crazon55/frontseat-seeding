# EC2 deploy — no AWS CLI

Single Ubuntu server for **frontend + backend**. Works well with **GoDaddy** (A records to Elastic IP).

**Prerequisites:** Supabase Phase 1 complete (database, storage, Google Auth). See [DEPLOY.md](./DEPLOY.md).

---

## What runs where

| URL | On EC2 |
|-----|--------|
| `https://frontseatmedia.in` | nginx serves React `build/` |
| `https://www.frontseatmedia.in` | same |
| `https://api.frontseatmedia.in` | nginx → uvicorn :8000 |

Supabase stays hosted — EC2 only runs your app.

---

## Step 1 — Launch EC2

1. AWS Console → **EC2** → **Launch instance**
2. **Ubuntu 22.04 LTS**
3. Instance type: **t3.small** (enough for showcase)
4. Create/download **key pair** (`.pem`)
5. **Security group** — inbound rules:

   | Port | Source | Purpose |
   |------|--------|---------|
   | 22 | Your IP | SSH |
   | 80 | 0.0.0.0/0 | HTTP (certbot) |
   | 443 | 0.0.0.0/0 | HTTPS |

6. Launch → **Elastic IP** → Allocate → Associate with instance

Note the **Elastic IP** (e.g. `3.110.xxx.xxx`).

---

## Step 2 — GoDaddy DNS

**DNS → Manage DNS** for `frontseatmedia.in`:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| **A** | `@` | Your Elastic IP | 600 |
| **A** or **CNAME** | `www` | Elastic IP or `@` | 600 |
| **A** or **CNAME** | `api` | Same Elastic IP | 600 |

Remove old parking-page A records on `@`.

Wait 5–15 minutes for DNS to propagate.

---

## Step 3 — SSH into server

From PowerShell (path to your `.pem`):

```powershell
ssh -i C:\path\to\your-key.pem ubuntu@YOUR_ELASTIC_IP
```

---

## Step 4 — Install dependencies

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y nginx python3-pip python3-venv git certbot python3-certbot-nginx

curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

---

## Step 5 — Upload code

**Option A — Git (if repo is accessible):**

```bash
cd ~
git clone https://github.com/Crazon55/frontseat-seeding.git
cd frontseat-seeding
```

**Option B — WinSCP / FileZilla:**  
Upload the whole `FS-Seeding-main` folder to `~/frontseat-seeding` on the server.

---

## Step 6 — Backend

```bash
cd ~/frontseat-seeding/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

nano .env
```

Paste (fill in your Supabase values):

```env
DATABASE_URL=postgresql://postgres.[ref]:[password]@...pooler.supabase.com:6543/postgres
SUPABASE_URL=https://[project-ref].supabase.co
SUPABASE_JWT_SECRET=your-jwt-secret
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_STORAGE_BUCKET=uploads
APP_NAME=frontseat-seeding
SEED_ADMIN_EMAIL=jaskaran.sethi@owledmedia.com
ALLOWED_EMAIL_DOMAIN=owledmedia.com
ENABLE_DEV_SESSION=false
CORS_ORIGINS=https://frontseatmedia.in,https://www.frontseatmedia.in
```

Test:

```bash
source venv/bin/activate
uvicorn server:app --host 127.0.0.1 --port 8000
```

In another SSH session: `curl http://127.0.0.1:8000/api/` → should return `{"app":"Frontseat Seeding","ok":true}`

Ctrl+C to stop, then create systemd service:

```bash
sudo nano /etc/systemd/system/frontseat-api.service
```

```ini
[Unit]
Description=Frontseat Seeding API
After=network.target

[Service]
User=ubuntu
WorkingDirectory=/home/ubuntu/frontseat-seeding/backend
EnvironmentFile=/home/ubuntu/frontseat-seeding/backend/.env
ExecStart=/home/ubuntu/frontseat-seeding/backend/venv/bin/uvicorn server:app --host 127.0.0.1 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable frontseat-api
sudo systemctl start frontseat-api
sudo systemctl status frontseat-api
```

---

## Step 7 — Frontend

```bash
cd ~/frontseat-seeding/frontend
nano .env
```

```env
REACT_APP_BACKEND_URL=https://api.frontseatmedia.in
REACT_APP_SUPABASE_URL=https://[project-ref].supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
```

```bash
npm install --legacy-peer-deps
npm run build

sudo mkdir -p /var/www/frontseat
sudo cp -r build/* /var/www/frontseat/
sudo chown -R www-data:www-data /var/www/frontseat
```

---

## Step 8 — nginx

```bash
sudo nano /etc/nginx/sites-available/frontseat
```

```nginx
# React app
server {
    listen 80;
    server_name frontseatmedia.in www.frontseatmedia.in;

    root /var/www/frontseat;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}

# API
server {
    listen 80;
    server_name api.frontseatmedia.in;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
sudo ln -sf /etc/nginx/sites-available/frontseat /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

---

## Step 9 — HTTPS (Let's Encrypt)

```bash
sudo certbot --nginx -d frontseatmedia.in -d www.frontseatmedia.in -d api.frontseatmedia.in
```

Follow prompts. Certbot updates nginx for HTTPS automatically.

---

## Step 10 — Test

1. `https://api.frontseatmedia.in/api/` → JSON ok
2. `https://frontseatmedia.in` → login page
3. **Continue with Google** → Supabase Auth → back to app
4. Admin email → dashboard; new email → pending screen

---

## Updating later

**Frontend change:**

```bash
cd ~/frontseat-seeding/frontend
git pull   # or re-upload files
npm run build
sudo cp -r build/* /var/www/frontseat/
```

**Backend change:**

```bash
cd ~/frontseat-seeding/backend
git pull
source venv/bin/activate && pip install -r requirements.txt
sudo systemctl restart frontseat-api
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Login redirects then fails | Check Supabase redirect URLs + `SUPABASE_JWT_SECRET` on backend |
| CORS error | Add site URL to `CORS_ORIGINS` in backend `.env`, restart API |
| 502 on api subdomain | `sudo systemctl status frontseat-api` — is uvicorn running? |
| Google “redirect_uri_mismatch” | Google Cloud redirect must be `https://[ref].supabase.co/auth/v1/callback` |
