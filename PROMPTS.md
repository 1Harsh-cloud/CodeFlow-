# CodeFlow – Frontend & Backend Prompts

Use these prompts when working on CodeFlow or when giving context to an AI assistant.

---

## Frontend Prompt

```
CodeFlow Frontend is a React 18 + Vite + TailwindCSS application for code explanation, generation, and execution.

**Project Structure:**
- frontend/src/App.jsx – Main app, tab state, API handlers (handleExplain, handleGenerate, handlePlay, handleExecute, etc.)
- frontend/src/main.jsx – Entry point
- frontend/src/index.css – Global styles, .line-by-line-scroll
- frontend/src/components/ – All UI components

**Tabs (TabNav.jsx):**
- Explain Code | Generate Code | Play | Codebase Map

**Components:**
- ExplainPanel – Upload area, "Explain Code in Editor" button, Line-by-line explanation (scrollable cards), CodeEditor, Input, Output, Run Code
- GeneratePanel – "What do you want to build?" textarea, language selector (Python/JS/Java/C/C++/HTML/CSS), Quick Start Examples (BST, BS, DFS, MS), CodeEditor, Input, Output
- PlayPanel – Game description input, Run Game button; uses GameOutputPanel for HTML5 game iframe
- MapPanel – Codebase map (GitHub URL or zip), CodeFlowGraph visualization
- CodeEditor – Monaco Editor wrapper, value/onChange, language, height props
- ExecutionPanel – Output + stdin display (used in Play tab)

**State (App.jsx):** activeTab, code, setCode, lineByLine, output, stdin, gameHtml, isLoading, error, generateLanguage

**API Base:** import.meta.env.VITE_API_URL || '' (empty = same origin; Vite proxy forwards /api to backend:5000)

**API Endpoints Called:**
- POST /api/explain – JSON {code} or FormData {file} → {code, lineByLine}
- POST /api/generate – JSON {prompt, language} → {code}
- POST /api/play – JSON {prompt} → {code}
- POST /api/execute – JSON {code, language?, stdin?} → {output} or {error}
- POST /api/codebase-map – JSON {githubUrl} or {files} or FormData zip

**Error Handling:** parseApiError() maps "Unexpected token... not valid JSON" to "Backend not running. Start it: cd backend && python app.py"

**Styling:**
- Dark theme: zinc/indigo palette (bg-zinc-900, border-zinc-700, text-zinc-400)
- Tailwind throughout; rounded-2xl cards, shadow-xl
- Custom scrollbar in index.css: .line-by-line-scroll

**Explain Tab – Line-by-line Box:**
- Container: min-h-[279px] max-h-[511px], flex-1, overflow-hidden
- Scroll area: line-by-line-scroll, overflow-y-auto, flex-1 min-h-0
- Each card: rounded-lg bg-zinc-800, L# indigo-400, code white, explanation below

**Generate Tab – Quick Start:** EXAMPLES in GeneratePanel; BST has pre-written code (code prop), others use prompt only.

**Vite Config:** Proxy /api → http://localhost:5000; port 5173.
```

---

## Backend Prompt

```
CodeFlow Backend is a Flask API (Python) for code explanation, generation, execution, and codebase mapping.

**Endpoints:**
- POST /api/explain – Explain code (file upload or JSON {code}). Uses Claude for line-by-line; fallback heuristics.
- POST /api/generate – Generate code from {prompt, language} via Claude.
- POST /api/execute – Run code (Python default) with optional stdin.
- POST /api/play – Generate playable HTML game from {prompt}.
- POST /api/generate-game – Alias / lower-level game gen.
- POST /api/improve-prompt – Improve user prompt for games.
- POST /api/codebase-map – Build codebase map (GitHub URL, files JSON, or zip upload).
- GET /api/github/auth-url – OAuth URL for GitHub.
- GET /api/github/callback – OAuth callback.
- GET /api/github/repos – List repos (requires token).
- GET /api/health – Health check.

**Env:**
- ANTHROPIC_API_KEY – Claude for explain/generate
- GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET – GitHub OAuth

**Explain:**
- Accepts multipart (file) or JSON (code).
- Returns {code, lineByLine: [{line, code, explanation}]}.
- Claude: claude-sonnet-4-6 or claude-3-5-sonnet/haiku.
- Fallback: heuristic rules (def, if, for, while, print, return, assignment, etc.).

**Execute:**
- Uses subprocess, tempfile; sandboxed Python execution.
- Returns {output} or {error}.

**CORS:** localhost:5173–5176, 127.0.0.1.
```

---

## Quick Reference

| Tab     | Frontend Component | Main API Endpoint   |
|---------|-------------------|---------------------|
| Explain | ExplainPanel      | POST /api/explain   |
| Generate| GeneratePanel     | POST /api/generate  |
| Play    | PlayPanel         | POST /api/play      |
| Map     | MapPanel          | POST /api/codebase-map |
