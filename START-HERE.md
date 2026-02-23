# CodeFlow – How to Start

## Quick start (2 steps)

### 1. Start the backend
Double-click **`start-backend.bat`** in this folder.
Or: Right-click `backend` folder → Open in Integrated Terminal → run `python app.py`

Wait until you see: `Running on http://127.0.0.1:5000`

### 2. Start the frontend
**Option A:** Right-click `frontend` folder → **Open in Integrated Terminal** → run:
```
npm run dev
```
**Option B:** In terminal (from Hackathon folder), run:
```
cd frontend
npm run dev
```
**Option C:** Double-click **`frontend\run.ps1`** (PowerShell)
**Option D:** Double-click **`start-frontend.bat`**

### 3. Open the app
Go to **http://localhost:5173** in your browser (NOT 5000 – that's the API)

---

## If using terminal instead

**Terminal 1 – Backend:**
```bash
cd backend
pip install -r requirements.txt
python app.py
```

**Terminal 2 – Frontend:**
```bash
cd frontend
npm install
npm run dev
```

---

## Backend needs ANTHROPIC_API_KEY (optional for Explain/Generate)

Add to `backend/.env`:
```
ANTHROPIC_API_KEY=your_key_here
```

Without it, Explain uses basic heuristics; Generate will show an error.
