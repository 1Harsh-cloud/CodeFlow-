# Deploy CodeFlow to Vercel

## Overview

CodeFlow has two parts:
1. **Frontend** (React + Vite) → deploy to **Vercel**
2. **Backend** (Flask API) → deploy to **Railway** or **Render** (Vercel can't run long-lived Flask servers)

---

## Step 1: Deploy the Backend First

### Option A: Railway (recommended, free tier)

1. Go to [railway.app](https://railway.app) and sign in with GitHub
2. Click **New Project** → **Deploy from GitHub repo** → select your Hackathon repo
3. Railway may auto-detect. If not:
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app --bind 0.0.0.0:$PORT`
4. Add **Environment Variables** in Railway dashboard:
   ```
   ANTHROPIC_API_KEY=sk-ant-...
   GITHUB_CLIENT_ID=...
   GITHUB_CLIENT_SECRET=...
   FRONTEND_URL=https://your-vercel-url.vercel.app
   CORS_ORIGINS=https://your-vercel-url.vercel.app
   ```
5. Deploy and copy your backend URL (e.g. `https://codeflow-backend.up.railway.app`)
6. **GitHub OAuth**: In [GitHub Developer Settings](https://github.com/settings/developers), add callback URL:  
   `https://your-backend-url/api/github/callback`

### Option B: Render

1. Go to [render.com](https://render.com) → **New** → **Web Service**
2. Connect repo, set **Root Directory** to `backend`
3. **Build**: `pip install -r requirements.txt`
4. **Start**: `gunicorn app:app`
5. Add env vars (same as above)
6. Copy your backend URL

> **Note**: Add `gunicorn` to `backend/requirements.txt` if not already there.

---

## Step 2: Deploy the Frontend to Vercel

### Via Vercel Dashboard

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **Add New** → **Project**
3. Import your Hackathon repository
4. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend` ← important
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `dist` (default)
5. **Environment Variables** – add:
   ```
   VITE_API_URL = https://your-backend-url.railway.app
   ```
   (Use your actual Railway/Render backend URL, no trailing slash)
6. Click **Deploy**

### Via Vercel CLI

```bash
cd frontend
npm i -g vercel
vercel
# Follow prompts, set Root Directory to frontend when asked
# Add VITE_API_URL when prompted for env vars
```

---

## Step 3: Update Backend CORS

After your Vercel deployment, you'll get a URL like `https://codeflow-xxx.vercel.app`.

Update your backend env vars:
- `FRONTEND_URL`: `https://codeflow-xxx.vercel.app`
- `CORS_ORIGINS`: `https://codeflow-xxx.vercel.app`

Redeploy the backend so CORS allows your frontend.

---

## Checklist

| Item | Where |
|------|-------|
| Backend deployed (Railway/Render) | Copy URL |
| `VITE_API_URL` set in Vercel | Frontend build env |
| `ANTHROPIC_API_KEY` in backend | Railway/Render env |
| `GITHUB_CLIENT_ID` + `GITHUB_CLIENT_SECRET` | Backend env |
| `FRONTEND_URL` + `CORS_ORIGINS` in backend | Backend env |
| GitHub OAuth callback URL | GitHub Developer Settings |

---

## Quick Test

1. Open your Vercel URL
2. Try **Generate Code** → Enter a prompt → Generate
3. If you see "Backend not reachable", check `VITE_API_URL` and backend is running

---

## Troubleshooting

- **API calls fail**: Verify `VITE_API_URL` has no trailing slash and matches backend URL exactly
- **CORS errors**: Add your Vercel URL to `CORS_ORIGINS` in backend
- **GitHub connect fails**: Add `https://your-backend-url/api/github/callback` to GitHub OAuth settings
