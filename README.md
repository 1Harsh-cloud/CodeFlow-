# CodeFlow

A full-stack code explanation and playground app that lets you understand, generate, and execute code.

## Features

- **Codebase Map** - Visualize repo structure (folders, files, functions) from GitHub or zip
- **Project Report** - AI-generated summary of your codebase
- **Flashcards** - AI learning cards with 3D carousel and study modes
- **AI Chat** - Ask questions about your codebase and get answers
- **File Upload** - Upload code files for AI-powered explanation
- **Text Input** - Describe what you want and generate code
- **Code Editor** - Monaco Editor for syntax-highlighted code display and editing
- **Live Execution** - Run code in a sandboxed environment and see results
- **Play from Text** - Flamingo-style: describe a game and play! (Number Guess, Rock Paper Scissors, Text Adventure, Code Quiz, Trivia)

## Project Structure

```
Hackathon/
├── frontend/          # React + Vite + TailwindCSS
├── backend/           # Python Flask API
├── README.md
└── requirements.txt   # Backend dependencies (also in backend/)
```

## Tech Stack

- **Frontend**: React 18, Vite, TailwindCSS, Monaco Editor
- **Backend**: Python Flask
- **API**: REST endpoints for code explanation, generation, and execution

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.9+

### Backend Setup

```bash
cd backend
pip install -r requirements.txt
python app.py
```

The API runs at `http://localhost:5000`

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The app runs at `http://localhost:5173`

### C, C++, Java Execution

Python and JavaScript run locally. For **C, C++, and Java**, use one of these options:

1. **Cloud (recommended)** – Add to `backend/.env`:
   - **Get free API key:**
     1. Go to https://rapidapi.com/judge0-official/api/judge0-ce
     2. Sign up (free)
     3. Subscribe to the free Basic plan
     4. Copy your API key from the dashboard
   - Add to `backend/.env`: `RAPIDAPI_KEY=your_api_key_here`
   - Or use JDoodle: `JDOODLE_CLIENT_ID` + `JDOODLE_CLIENT_SECRET` from [jdoodle.com](https://www.jdoodle.com/subscribe-api)

2. **Local compilers** – Install gcc (e.g. [winlibs.com](https://winlibs.com)) for C/C++, or Java JDK

### Run Both

1. Start the backend first: `cd backend && python app.py`
2. Start the frontend in another terminal: `cd frontend && npm run dev`
3. Open http://localhost:5173 in your browser

## Ship It (Production Deployment)

### Pre-flight checklist

| Item | Needed for |
|------|------------|
| `ANTHROPIC_API_KEY` | Report, Flashcards, AI Chat |
| `GITHUB_CLIENT_ID` + `GITHUB_CLIENT_SECRET` | Connect GitHub, repo picker |
| `RAPIDAPI_KEY` or JDoodle | C/C++/Java execution (optional) |

### Build & run in production

**1. Backend** (e.g. Railway, Render, Fly.io, or any Python host)

```bash
cd backend
pip install -r requirements.txt
# Set env vars (see below), then:
# gunicorn app:app --bind 0.0.0.0:5000
```

**2. Frontend** (e.g. Vercel, Netlify, Cloudflare Pages)

```bash
cd frontend
npm install
VITE_API_URL=https://api.yourdomain.com npm run build
```

Deploy the `frontend/dist` folder. Set `VITE_API_URL` in your build env so the frontend knows your API base URL.

**3. Backend `.env` (production)**

```env
ANTHROPIC_API_KEY=sk-ant-...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
FRONTEND_URL=https://yourdomain.com
CORS_ORIGINS=https://yourdomain.com
```

**4. GitHub OAuth** – In [GitHub Developer Settings](https://github.com/settings/developers), add your production callback URL:  
`https://api.yourdomain.com/api/github/callback`

### Quick deploys

- **Vercel** – Connect frontend repo, set `VITE_API_URL`, build command `npm run build`, output `dist`
- **Railway / Render** – Connect backend, add env vars, start command `gunicorn app:app`
- Never commit `.env` or API keys

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/codebase-map` | Build codebase map from GitHub URL or zip |
| POST | `/api/codebase-report` | AI-generated project report |
| POST | `/api/codebase-flashcards` | AI-generated learning flashcards |
| POST | `/api/codebase-chat` | Chat with AI about the codebase |
| POST | `/api/explain` | Explain uploaded code |
| POST | `/api/generate` | Generate code from text description |
| POST | `/api/play` | Get playable text game from description |
| POST | `/api/execute` | Execute code (optional `stdin` for games) |

---

Built for Hackathon 2025
