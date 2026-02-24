# Deploy CodeFlow to Railway (Frontend + Backend)

Complete guide to deploy CodeFlow on Railway so users can connect GitHub, use AI, create games, and more.

---

## What You'll Get

- **Backend URL**: `https://codeflow-backend-production-xxxx.up.railway.app`
- **Frontend URL**: `https://codeflow-frontend-production-xxxx.up.railway.app`
- Everything works: GitHub connect, Generate, Explain, Play, Codebase Map

---

## Before You Start

Make sure you have:
- [ ] CodeFlow repo on GitHub (you already have this ✓)
- [ ] Anthropic API key (from [console.anthropic.com](https://console.anthropic.com))
- [ ] GitHub OAuth App (from [github.com/settings/developers](https://github.com/settings/developers)) – for "Connect GitHub"

---

## Step 1: Create Railway Account & Project

1. Go to **[railway.app](https://railway.app)**
2. Click **Login** → **Login with GitHub**
3. Authorize Railway to access your GitHub
4. Click **New Project**
5. Select **Deploy from GitHub repo**
6. Choose **1Harsh-cloud/CodeFlow-** (or your repo name)
7. Click **Deploy Now** – Railway will add a first service (we'll configure it next)

---

## Step 2: Configure the Backend Service

Railway created a service from your repo. We need to point it to the **backend** folder.

1. Click on the service (the card that appeared)
2. Go to **Settings** (or the ⚙️ icon)
3. Find **Root Directory**:
   - Click **Edit** or **Override**
   - Set to: `backend`
   - Save

4. Find **Build Command** (or **Custom Build**):
   - Set to: `pip install -r requirements.txt`
   - (Railway may auto-detect this for Python)

5. Find **Start Command** (or **Custom Start**):
   - Set to: `gunicorn app:app --bind 0.0.0.0:$PORT --timeout 120`
   - Railway provides `$PORT` – your app must use it

6. Go to **Variables** (or **Environment**) and add:

   | Variable | Value |
   |----------|-------|
   | `ANTHROPIC_API_KEY` | `sk-ant-api03-...` (your key) |
   | `GITHUB_CLIENT_ID` | From your GitHub OAuth app |
   | `GITHUB_CLIENT_SECRET` | From your GitHub OAuth app |
   | `FRONTEND_URL` | Leave empty for now – we'll add after frontend deploys |
   | `CORS_ORIGINS` | Leave empty for now – we'll add after frontend deploys |

7. **Generate a public URL**:
   - Go to **Settings** → **Networking** → **Public Networking**
   - Click **Generate Domain** or **Add Domain**
   - Copy the URL (e.g. `https://codeflow-backend-production-1234.up.railway.app`)
   - **Save this** – you need it for the frontend

8. **GitHub OAuth Callback**: In [GitHub Developer Settings](https://github.com/settings/developers) → your OAuth app:
   - Add **Authorization callback URL**: `https://YOUR-BACKEND-URL/api/github/callback`
   - Example: `https://codeflow-backend-production-1234.up.railway.app/api/github/callback`

9. Click **Redeploy** if the service was already deployed (Settings changes may require a redeploy)

---

## Step 3: Add the Frontend Service

1. Back in your Railway **Project** (not inside the backend service)
2. Click **+ New** (or **Add Service**)
3. Select **GitHub Repo**
4. Choose the **same repo**: CodeFlow-
5. **Before deploying**, go to **Settings**:

6. **Root Directory**: Set to `frontend` (REQUIRED - build fails with ENOENT package.json if not set!)

7. **Build Command**: `npm install && npm run build`
   - (Railway may auto-detect for Vite)

8. **Start Command** (for static sites on Railway):
   - Option A: `npx serve -s dist` (if Railway doesn't auto-serve static)
   - Option B: Railway may auto-detect and serve `dist/` – check after first deploy

9. **Variables** – **Important**: Add before first deploy:
   - `VITE_API_URL` = `https://YOUR-BACKEND-URL` (no trailing slash)
   - Example: `VITE_API_URL` = `https://codeflow-backend-production-1234.up.railway.app`

10. **Generate a public URL**:
    - Settings → Networking → Generate Domain
    - Copy the frontend URL (e.g. `https://codeflow-frontend-production-5678.up.railway.app`)

11. Deploy – Railway will build and deploy automatically

---

## Step 4: Connect Backend and Frontend

1. Copy your **Frontend URL** (from Step 3)
2. Go to **Backend service** → **Variables**
3. Add or update:
   - `FRONTEND_URL` = `https://your-frontend-url.up.railway.app`
   - `CORS_ORIGINS` = `https://your-frontend-url.up.railway.app`
4. **Redeploy** the backend (Variables → Redeploy or use the Redeploy button)

---

## Step 5: Verify GitHub OAuth (If Using Connect GitHub)

In [GitHub Developer Settings](https://github.com/settings/developers) → your OAuth App:

- **Homepage URL**: Your frontend URL
- **Authorization callback URL**: `https://YOUR-BACKEND-URL/api/github/callback`

---

## Quick Checklist

| Step | What |
|------|------|
| 1 | Railway project + Backend service, Root = `backend` |
| 2 | Backend: `gunicorn app:app --bind 0.0.0.0:$PORT --timeout 120` |
| 3 | Backend env vars: ANTHROPIC_API_KEY, GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET |
| 4 | Backend public URL generated |
| 5 | GitHub OAuth callback = `https://backend-url/api/github/callback` |
| 6 | Frontend service, Root = `frontend` |
| 7 | Frontend env: `VITE_API_URL` = backend URL |
| 8 | Frontend public URL generated |
| 9 | Backend: FRONTEND_URL + CORS_ORIGINS = frontend URL, redeploy |

---

## Test Your Deployment

1. Open your **Frontend URL** in a browser
2. **Generate Code** tab → Enter "binary search" → Generate → should return code
3. **Codebase Map** tab → Connect GitHub → Authorize → Should see your repos
4. **Play** tab → Pick a game idea → Generate Code → Run Game

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| "Backend not reachable" | Check `VITE_API_URL` in frontend, no trailing slash |
| CORS errors | Add frontend URL to `CORS_ORIGINS` in backend, redeploy |
| GitHub connect fails | Add `https://backend-url/api/github/callback` to GitHub OAuth app |
| Build fails | Check Root Directory is `backend` or `frontend` correctly |
| Blank page | Frontend build may have failed – check Railway build logs |

---

## Railway UI Overview (Where to Find Things)

- **Project** = container for your services
- **Service** = one deployment (backend or frontend)
- **Settings** = Root Directory, Build/Start commands
- **Variables** = Environment variables
- **Deployments** = Build history and logs
- **Networking** = Generate public URL

---

Good luck with the hackathon.
