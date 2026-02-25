"""
CodeFlow Backend - Flask API
Provides endpoints for code explanation, generation, and execution.
"""

import json
from flask import Flask, request, jsonify, redirect
from flask_cors import CORS
from dotenv import load_dotenv
import subprocess
import tempfile
import os
import re
import zipfile
from io import BytesIO

load_dotenv()

GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID")
GITHUB_CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET")
GITHUB_CALLBACK_PATH = "/api/github/callback"

app = Flask(__name__)
_cors_origins = ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:5176", "http://127.0.0.1:5173", "http://127.0.0.1:5175", "http://127.0.0.1:5176"]
_extra_origins = (os.getenv("CORS_ORIGINS") or "").strip().split(",")
_cors_origins.extend(x.strip() for x in _extra_origins if x.strip())
CORS(app, origins=_cors_origins)


# --- Codebase Map (visualize flow) ---
try:
    from codebase_parser import build_codebase_map
    from github_fetcher import fetch_repo_files
except ImportError:
    build_codebase_map = None
    fetch_repo_files = None

CODE_EXTENSIONS = {".py", ".js", ".jsx", ".ts", ".tsx", ".java", ".go", ".rb", ".rs", ".c", ".cpp", ".h"}


def _is_anthropic_credit_error(err):
    """Check if exception is due to low Anthropic API credits."""
    s = str(err).lower()
    return any(x in s for x in ["credit", "balance", "billing", "upgrade", "purchase credits"])


def _raise_if_credit_error(err):
    """Raise user-friendly error if this is a credit/billing issue."""
    if _is_anthropic_credit_error(err):
        raise RuntimeError(
            "Your Anthropic API credit balance is too low. "
            "Add credits at https://console.anthropic.com (Plans & Billing)."
        ) from err


@app.route("/api/codebase-map", methods=["POST"])
def codebase_map():
    """
    Build codebase map for visualization.
    Accepts:
    - JSON: { "githubUrl": "https://github.com/owner/repo" }
    - JSON: { "files": [{ "path": "x/y.py", "content": "..." }] }
    - multipart: file (zip of project)
    """
    if not build_codebase_map:
        return jsonify({"error": "codebase_parser not available"}), 500

    files = []

    # 1. GitHub URL (optional githubToken for private repos)
    if request.is_json:
        data = request.get_json() or {}
        url = (data.get("githubUrl") or "").strip()
        token = (data.get("githubToken") or "").strip() or None
        if url and fetch_repo_files:
            try:
                files = fetch_repo_files(url, token=token)
            except ValueError as e:
                return jsonify({"error": str(e)}), 400
            except RuntimeError as e:
                return jsonify({"error": str(e)}), 400
        elif data.get("files"):
            files = data["files"]

    # 2. Zip upload
    if not files and "file" in request.files:
        f = request.files["file"]
        if f.filename and f.filename.lower().endswith(".zip"):
            try:
                data = f.read()
                with zipfile.ZipFile(BytesIO(data), "r") as z:
                    for name in z.namelist():
                        if name.endswith("/"):
                            continue
                        ext = "." + name.split(".")[-1].lower() if "." in name else ""
                        if ext in CODE_EXTENSIONS:
                            try:
                                content = z.read(name).decode("utf-8", errors="replace")
                                files.append({"path": name, "content": content})
                            except Exception:
                                pass
            except zipfile.BadZipFile:
                return jsonify({"error": "Invalid zip file"}), 400
        else:
            return jsonify({"error": "Upload a .zip file of your project"}), 400

    if not files:
        return jsonify({
            "error": "Provide githubUrl (JSON), files (JSON), or upload a .zip file"
        }), 400

    try:
        result = build_codebase_map(files)
        inc = False
        if request.is_json:
            inc = (request.get_json() or {}).get("includeContent", False)
        inc = inc or request.form.get("includeContent", "").lower() in ("1", "true", "yes")
        inc = inc or request.args.get("includeContent", "").lower() in ("1", "true", "yes")
        include_content = bool(inc)
        if include_content:
            result["filesWithContent"] = [{"path": f["path"], "content": f.get("content", "")} for f in files]
        return jsonify({"success": True, **result})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


def _load_codebase_files():
    """Load codebase files from request (GitHub URL, JSON files, or zip). Same logic as codebase_map."""
    files = []
    if request.is_json:
        data = request.get_json() or {}
        url = (data.get("githubUrl") or "").strip()
        token = (data.get("githubToken") or "").strip() or None
        if url and fetch_repo_files:
            try:
                files = fetch_repo_files(url, token=token)
            except (ValueError, RuntimeError):
                raise
        elif data.get("files"):
            files = data["files"]
    if not files and "file" in request.files:
        f = request.files["file"]
        if f.filename and f.filename.lower().endswith(".zip"):
            try:
                raw = f.read()
                with zipfile.ZipFile(BytesIO(raw), "r") as z:
                    for name in z.namelist():
                        if name.endswith("/"):
                            continue
                        ext = "." + name.split(".")[-1].lower() if "." in name else ""
                        if ext in CODE_EXTENSIONS:
                            try:
                                content = z.read(name).decode("utf-8", errors="replace")
                                files.append({"path": name, "content": content})
                            except Exception:
                                pass
            except zipfile.BadZipFile:
                raise ValueError("Invalid zip file")
        else:
            raise ValueError("Upload a .zip file of your project")
    return files


def _get_report_system_prompt(length_pages: int) -> str:
    length_guide = (
        "Keep the report to about 1 page (300-500 words). Be very concise." if length_pages <= 1
        else f"Be thorough and detailed. Report can span up to {length_pages} pages for better quality."
    )
    return f"""You are a technical analyst. Generate a PROJECT REPORT from the provided codebase.

LENGTH: {length_guide}

STYLE RULES (CRITICAL):
- Write in clear, flowing prose. Use paragraphs, not bullet lists. Read like a human technical document.
- Do NOT use asterisks for bold (**text**). Do not use ** anywhere.
- Do NOT use dash bullets (- item). Instead write sentences: "The stack includes Python, Keras, and OpenCV."
- Do NOT use em dashes (— or –). Use commas or rephrase.
- Use simple section headers like "Overview" and "Tech Stack" on their own line, no markdown symbols.
- Keep formatting minimal. No bullet points, no bold markers. Natural paragraphs only.

COVER these topics in order:
1. Overview: What the project does, in 2-4 sentences.
2. Tech Stack: List technologies as a prose sentence (e.g., "The project uses Python, TensorFlow, OpenCV, and librosa for audio processing.").
3. Architecture: Describe folder structure and how parts connect, in paragraphs.
4. Key Components: Explain important files and functions in flowing text.
5. Data Flow: How data moves through the system, in prose.
6. Recommendations: Entry points, setup steps, tips for newcomers, as short paragraphs.

Use actual file paths and names from the codebase. Output ONLY the report text, no preamble."""


def _get_flashcards_system_prompt(count: int, mode: str) -> str:
    mode_guides = {
        "easy": "EASY mode: Simple questions for beginners. Focus on basic concepts, file names, obvious functions. Short answers (1 sentence). Examples: 'What file contains the main route?', 'Which library is used for X?'",
        "medium": "MEDIUM mode: Balanced mix. Include concepts, function purposes, file roles, and some architecture. Answers 1–2 sentences. Mix straightforward and slightly deeper questions.",
        "hard": "HARD mode: Challenging questions. Deep architecture, design decisions, data flow, edge cases, 'why' and 'how' questions. Answers 2–3 sentences with more detail.",
        "exam": "EXAM mode: Exam-style questions. Focus on understanding, troubleshooting, 'What would happen if...?', 'Explain the flow of...', 'Why does X call Y?'. Concise but precise answers. Simulate technical interview or code review style.",
    }
    mode_guide = mode_guides.get(mode.lower(), mode_guides["medium"])
    return f"""You are a coding educator. Generate LEARNING FLASHCARDS from the codebase.

MODE: {mode_guide}

Create exactly {count} flashcards. Questions must be specific to THIS codebase.

Output ONLY a JSON array. No other text. Format:
[
  {{"question": "What does function X do?", "answer": "It handles..."}},
  {{"question": "What is the entry point of this app?", "answer": "..."}}
]

Do not use asterisks or em dashes. Output valid JSON only."""


@app.route("/api/codebase-report", methods=["POST"])
def codebase_report():
    """Generate project report from codebase. Same input as /api/codebase-map."""
    if not build_codebase_map:
        return jsonify({"error": "codebase_parser not available"}), 500
    try:
        files = _load_codebase_files()
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except (ValueError, RuntimeError) as e:
        return jsonify({"error": str(e)}), 400
    if not files:
        return jsonify({"error": "Provide githubUrl, files, or zip"}), 400

    data = request.get_json() or {}
    length_pages = int(data.get("reportLength", data.get("report_length", 1)))
    length_pages = max(1, min(15, length_pages))

    api_key = (os.getenv("ANTHROPIC_API_KEY") or "").strip()
    if " " in api_key:
        api_key = api_key.split()[0]
    if not api_key:
        return jsonify({"error": "ANTHROPIC_API_KEY not set for AI report"}), 500

    # Build context: structure + key file snippets (truncate large files)
    try:
        result = build_codebase_map(files)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    nodes_summary = []
    for n in (result.get("nodes") or [])[:80]:
        nodes_summary.append(f"- {n.get('type', '?')}: {n.get('label', '?')} (id: {n.get('id', '')})")
    edges_summary = []
    for e in (result.get("edges") or [])[:50]:
        edges_summary.append(f"- {e.get('source', '')} → {e.get('target', '')}")

    file_previews = []
    for f in files[:30]:
        content = (f.get("content") or "")[:1200]
        file_previews.append(f"=== {f.get('path', '')} ===\n{content}\n")

    context = (
        "STRUCTURE (nodes):\n" + "\n".join(nodes_summary) + "\n\n"
        "EDGES (dependencies):\n" + "\n".join(edges_summary) + "\n\n"
        "FILE CONTENTS (previews):\n" + "\n".join(file_previews)
    )

    try:
        from anthropic import Anthropic
        client = Anthropic(api_key=api_key)
        mods = ["claude-sonnet-4-6", "claude-sonnet-4-5-20250929", "claude-haiku-4-5-20251001", "claude-sonnet-4-20250514", "claude-3-haiku-20240307"]
        response = None
        last_err = None
        for m in mods:
            try:
                response = client.messages.create(
                    model=m,
                    max_tokens=8192 if length_pages > 1 else 2048,
                    system=_get_report_system_prompt(length_pages),
                    messages=[{"role": "user", "content": f"Generate a project report from this codebase:\n\n{context}"}],
                )
                break
            except Exception as e:
                last_err = e
                _raise_if_credit_error(e)
                if any(x in str(e).lower() for x in ["404", "not_found", "invalid", "model"]):
                    continue
                raise
        if not response:
            if last_err:
                _raise_if_credit_error(last_err)
            err_msg = f"No compatible model. Last error: {last_err}" if last_err else "No compatible model"
            raise RuntimeError(err_msg)
        report = response.content[0].text.strip()
        # Post-process: remove AI-ish formatting users dislike
        report = report.replace("\u2014", ",").replace("\u2013", ",")  # em dashes
        report = re.sub(r"\*\*([^*]+)\*\*", r"\1", report)  # **bold** -> plain text
        report = re.sub(r"\*([^*]+)\*", r"\1", report)  # *italic* -> plain text
        report = re.sub(r"^- ", "  ", report, flags=re.MULTILINE)  # "- item" bullets -> indent
        return jsonify({"success": True, "report": report})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/codebase-flashcards", methods=["POST"])
def codebase_flashcards():
    """Generate learning flashcards from codebase. Same input as /api/codebase-map."""
    if not build_codebase_map:
        return jsonify({"error": "codebase_parser not available"}), 500
    try:
        files = _load_codebase_files()
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except (ValueError, RuntimeError) as e:
        return jsonify({"error": str(e)}), 400
    if not files:
        return jsonify({"error": "Provide githubUrl, files, or zip"}), 400

    data = request.get_json() or {}
    flashcard_count = int(data.get("flashcardCount", data.get("flashcard_count", 10)))
    flashcard_count = max(5, min(20, flashcard_count))
    flashcard_mode = str(data.get("flashcardMode", data.get("flashcard_mode", "medium"))).lower()
    if flashcard_mode not in ("easy", "medium", "hard", "exam"):
        flashcard_mode = "medium"

    api_key = (os.getenv("ANTHROPIC_API_KEY") or "").strip()
    if " " in api_key:
        api_key = api_key.split()[0]
    if not api_key:
        return jsonify({"error": "ANTHROPIC_API_KEY not set for AI flashcards"}), 500

    try:
        result = build_codebase_map(files)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    nodes_summary = []
    for n in (result.get("nodes") or [])[:80]:
        nodes_summary.append(f"- {n.get('type', '?')}: {n.get('label', '?')} (id: {n.get('id', '')})")
    file_previews = []
    for f in files[:25]:
        content = (f.get("content") or "")[:800]
        file_previews.append(f"=== {f.get('path', '')} ===\n{content}\n")

    context = (
        "STRUCTURE:\n" + "\n".join(nodes_summary) + "\n\n"
        "FILE CONTENTS:\n" + "\n".join(file_previews)
    )

    try:
        from anthropic import Anthropic
        client = Anthropic(api_key=api_key)
        mods = ["claude-sonnet-4-6", "claude-sonnet-4-5-20250929", "claude-haiku-4-5-20251001", "claude-sonnet-4-20250514", "claude-3-haiku-20240307"]
        response = None
        for m in mods:
            try:
                response = client.messages.create(
                    model=m,
                    max_tokens=2048,
                    system=_get_flashcards_system_prompt(flashcard_count, flashcard_mode),
                    messages=[{"role": "user", "content": f"Generate flashcards from this codebase:\n\n{context}"}],
                )
                break
            except Exception as e:
                _raise_if_credit_error(e)
                if any(x in str(e).lower() for x in ["404", "not_found", "invalid", "model"]):
                    continue
                raise
        if not response:
            raise RuntimeError("No compatible model")
        text = response.content[0].text.strip()
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0].strip()
        elif "```" in text:
            text = text.split("```")[1].split("```")[0].strip()
        flashcards = json.loads(text)
        if not isinstance(flashcards, list):
            flashcards = []
        # Normalize and clean AI-ish formatting
        def _clean(t):
            t = str(t).replace("\u2014", ",").replace("\u2013", ",")
            t = re.sub(r"\*\*([^*]+)\*\*", r"\1", t)
            return re.sub(r"\*([^*]+)\*", r"\1", t)

        out = []
        for c in flashcards:
            q = c.get("question") or c.get("front") or ""
            a = c.get("answer") or c.get("back") or ""
            if q and a:
                out.append({"question": _clean(q), "answer": _clean(a)})
        return jsonify({"success": True, "flashcards": out})
    except json.JSONDecodeError as e:
        return jsonify({"error": f"Invalid flashcards JSON: {e}"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500


def _clean_ai_reply(text):
    """Strip AI-ish formatting: code fences, asterisks, em dashes, decorative headers, etc."""
    if not text:
        return text
    # Em dashes and en dashes → hyphen or comma
    text = text.replace("\u2014", ",").replace("\u2013", "-")
    # Remove **bold** and *italic*
    text = re.sub(r"\*\*([^*]+)\*\*", r"\1", text)
    text = re.sub(r"\*([^*]+)\*", r"\1", text)
    # Remove ``` code block fences (keep content inside)
    text = re.sub(r"```[\w]*\n?", "", text)
    text = re.sub(r"\n?```", "", text)
    # Remove `inline code` backticks (keep text)
    text = re.sub(r"`([^`]+)`", r"\1", text)
    # Remove ## headers (strip leading #)
    text = re.sub(r"^#+\s*", "", text, flags=re.MULTILINE)
    # Remove --- and ___ horizontal rules
    text = re.sub(r"^[-_]{3,}\s*$", "", text, flags=re.MULTILINE)
    # Convert "----- SECTION NAME -----" style headers to plain "SECTION NAME"
    text = re.sub(r"^[-=\s]{3,}\s*(.+?)\s*[-=\s]{3,}\s*$", r"\1", text, flags=re.MULTILINE)
    # Remove lines that are only dashes/equals (decorative)
    text = re.sub(r"^[-=]{2,}\s*$", "", text, flags=re.MULTILINE)
    # Collapse triple+ newlines to double
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


CODEBASE_CHAT_SYSTEM = """You are a helpful, conversational coding assistant that answers questions about a codebase.
You have access to the project structure and file contents. Answer concisely and accurately.
Reference specific files, functions, or paths when relevant. If you cannot find something, say so.
Write in plain prose. Do not use: em dashes, markdown code fences (```), backticks, asterisks for bold/italic, horizontal rules, or decorative dashed headers like "----- SECTION NAME -----". Use hyphens only within words. For section headers, use plain text like "VIDEO STREAM" not "----- VIDEO STREAM -----". No dashes, equals signs, or icons as decoration.

Be conversational: after each answer, end with a brief, natural follow-up question to keep the dialogue going. For example: "Would you like me to explain how X works in more detail?" or "Should I walk through the Y module next?" or "Do you want to know about error handling in this function?" Keep follow-ups relevant to the topic and codebase. Keep them short (one sentence)."""


@app.route("/api/codebase-chat", methods=["POST"])
def codebase_chat():
    """Chat with AI about the codebase. Same input as codebase-map, plus 'message' and optional 'history'."""
    if not build_codebase_map:
        return jsonify({"error": "codebase_parser not available"}), 500
    try:
        files = _load_codebase_files()
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except (ValueError, RuntimeError) as e:
        return jsonify({"error": str(e)}), 400
    if not files:
        return jsonify({"error": "Provide githubUrl, files, or zip"}), 400

    data = request.get_json() or {}
    message = (data.get("message") or "").strip()
    if not message:
        return jsonify({"error": "Provide a message (your question about the codebase)"}), 400

    history = data.get("history") or []

    api_key = (os.getenv("ANTHROPIC_API_KEY") or "").strip()
    if " " in api_key:
        api_key = api_key.split()[0]
    if not api_key:
        return jsonify({"error": "ANTHROPIC_API_KEY not set for AI chat"}), 500

    try:
        result = build_codebase_map(files)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    nodes_summary = []
    for n in (result.get("nodes") or [])[:100]:
        nodes_summary.append(f"- {n.get('type', '?')}: {n.get('label', '?')} (id: {n.get('id', '')})")
    file_previews = []
    for f in files[:40]:
        content = (f.get("content") or "")[:1500]
        file_previews.append(f"=== {f.get('path', '')} ===\n{content}\n")

    context = (
        "CODEBASE STRUCTURE:\n" + "\n".join(nodes_summary) + "\n\n"
        "FILE CONTENTS:\n" + "\n".join(file_previews)
    )

    try:
        from anthropic import Anthropic
        client = Anthropic(api_key=api_key)
        mods = ["claude-sonnet-4-6", "claude-sonnet-4-5-20250929", "claude-haiku-4-5-20251001", "claude-sonnet-4-20250514", "claude-3-haiku-20240307"]
        system_content = CODEBASE_CHAT_SYSTEM + "\n\nUse this codebase context:\n" + context
        messages = []
        for h in history[-10:]:
            role = "user" if h.get("role") == "user" else "assistant"
            messages.append({"role": role, "content": str(h.get("content", ""))[:4000]})
        messages.append({"role": "user", "content": message})

        response = None
        for m in mods:
            try:
                response = client.messages.create(
                    model=m,
                    max_tokens=2048,
                    system=system_content,
                    messages=messages,
                )
                break
            except Exception as e:
                _raise_if_credit_error(e)
                if any(x in str(e).lower() for x in ["404", "not_found", "invalid", "model"]):
                    continue
                raise
        if not response:
            raise RuntimeError("No compatible model")
        reply = response.content[0].text.strip()
        # Strip AI-ish formatting: em dashes, asterisks, code fences, etc.
        reply = _clean_ai_reply(reply)
        return jsonify({"success": True, "reply": reply})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# --- GitHub OAuth (Connect GitHub for repo picker) ---
def _backend_url():
    """Base URL for backend - required for correct redirect_uri behind proxies (Railway, etc)."""
    url = os.getenv("BACKEND_URL", "").strip()
    if url:
        return url.rstrip("/")
    return request.host_url.rstrip("/")


@app.route("/api/github/auth-url", methods=["GET"])
def github_auth_url():
    """Return GitHub OAuth URL for 'Connect GitHub' button."""
    if not GITHUB_CLIENT_ID:
        return jsonify({"error": "GitHub OAuth not configured. Add GITHUB_CLIENT_ID to .env"}), 500
    # Use explicit BACKEND_URL for redirect_uri (request.host_url can be wrong behind Railway proxy)
    base_url = _backend_url()
    redirect_uri = f"{base_url}{GITHUB_CALLBACK_PATH}"
    url = (
        f"https://github.com/login/oauth/authorize"
        f"?client_id={GITHUB_CLIENT_ID}"
        f"&redirect_uri={redirect_uri}"
        f"&scope=repo"
    )
    return jsonify({"authUrl": url})


@app.route("/api/github/callback", methods=["GET"])
def github_callback():
    """OAuth callback: exchange code for token, redirect to frontend with token."""
    code = request.args.get("code")
    if not code:
        return redirect(_frontend_url() + "?github_error=no_code")
    if not GITHUB_CLIENT_ID or not GITHUB_CLIENT_SECRET:
        return redirect(_frontend_url() + "?github_error=config")

    redirect_uri = f"{_backend_url()}{GITHUB_CALLBACK_PATH}"
    try:
        import requests
        r = requests.post(
            "https://github.com/login/oauth/access_token",
            headers={"Accept": "application/json"},
            data={
                "client_id": GITHUB_CLIENT_ID,
                "client_secret": GITHUB_CLIENT_SECRET,
                "code": code,
                "redirect_uri": redirect_uri,
            },
            timeout=10,
        )
        data = r.json()
        token = data.get("access_token")
        if not token:
            return redirect(_frontend_url() + "?github_error=auth")
        return redirect(_frontend_url() + f"?github_token={token}")
    except Exception:
        return redirect(_frontend_url() + "?github_error=exchange")


def _frontend_url():
    """Guess frontend URL from CORS origins or default."""
    # Use first CORS origin; fallback to 5173
    return os.getenv("FRONTEND_URL", "http://localhost:5173")


@app.route("/api/github/repos", methods=["GET"])
def github_repos():
    """List user's GitHub repos. Requires Authorization: Bearer <token>."""
    auth = request.headers.get("Authorization")
    if not auth or not auth.startswith("Bearer "):
        return jsonify({"error": "Missing or invalid Authorization header"}), 401
    token = auth.replace("Bearer ", "").strip()
    if not token:
        return jsonify({"error": "Missing token"}), 401

    try:
        import requests
        r = requests.get(
            "https://api.github.com/user/repos",
            headers={"Authorization": f"token {token}", "Accept": "application/vnd.github.v3+json"},
            params={"per_page": 100, "sort": "updated"},
            timeout=10,
        )
        if r.status_code != 200:
            return jsonify({"error": "Failed to fetch repos", "detail": r.text[:200]}), r.status_code
        repos = r.json()
        return jsonify({
            "repos": [
                {"full_name": r["full_name"], "html_url": r["html_url"], "name": r["name"]}
                for r in repos
            ]
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/health", methods=["GET"])
def health():
    """Health check endpoint."""
    return jsonify({"status": "ok", "message": "CodeFlow API is running"})


EXPLAIN_SYSTEM = """You explain code line by line in a learner-friendly way.
For each line of code, write a short, clear explanation (1-2 sentences).
Output a JSON array only, no other text. Format:
[{"line": 1, "code": "exact line from input", "explanation": "..."}, ...]
Preserve the exact "code" string for each line (including indentation).
Keep explanations concise but meaningful. Explain what the line does and why it matters."""


@app.route("/api/explain", methods=["POST"])
def explain_code():
    """
    Explain code from file upload or raw text using Claude.
    Accepts: multipart/form-data with 'file' or JSON with 'code' key.
    """
    code = None

    if "file" in request.files:
        file = request.files["file"]
        if file.filename:
            try:
                code = _extract_text_from_file(file, file.filename)
            except ValueError as e:
                return jsonify({"error": str(e)}), 400
    elif request.is_json and "code" in request.json:
        code = request.json["code"]

    if not code or not code.strip():
        return jsonify({"error": "No code provided"}), 400

    # Try Claude first for intelligent explanations
    api_key = (os.getenv("ANTHROPIC_API_KEY") or "").strip()
    if " " in api_key:
        api_key = api_key.split()[0]

    if api_key:
        try:
            from anthropic import Anthropic
            client = Anthropic(api_key=api_key)
            MODELS = ["claude-sonnet-4-6", "claude-sonnet-4-5-20250929", "claude-haiku-4-5-20251001", "claude-sonnet-4-20250514", "claude-3-haiku-20240307"]
            response = None
            for model in MODELS:
                try:
                    response = client.messages.create(
                        model=model,
                        max_tokens=4096,
                        system=EXPLAIN_SYSTEM,
                        messages=[{"role": "user", "content": f"Explain this code line by line:\n\n```\n{code}\n```"}],
                    )
                    break
                except Exception as e:
                    _raise_if_credit_error(e)
                    if any(x in str(e).lower() for x in ["404", "not_found", "invalid", "model"]):
                        continue
                    raise
            if not response:
                raise RuntimeError("No compatible model")
            text = response.content[0].text.strip()
            # Parse JSON (handle markdown fence)
            if "```json" in text:
                text = text.split("```json")[1].split("```")[0].strip()
            elif "```" in text:
                text = text.split("```")[1].split("```")[0].strip()
            line_by_line = json.loads(text)
            if isinstance(line_by_line, list) and len(line_by_line) > 0:
                # Normalize: ensure line, code, explanation
                code_lines = code.splitlines()
                for item in line_by_line:
                    ln = item.get("line", 0)
                    if "code" not in item and 1 <= ln <= len(code_lines):
                        item["code"] = code_lines[ln - 1]
                    if "explanation" not in item:
                        item["explanation"] = "See line above"
                return jsonify({
                    "success": True,
                    "code": code,
                    "lineByLine": line_by_line,
                    "explanation": None,
                })
        except Exception as e:
            print(f"[explain fallback] {e}")

    # Fallback: heuristic explanations
    lines = code.splitlines()
    line_by_line = []
    for i, line in enumerate(lines, 1):
        stripped = line.strip()
        if not stripped:
            exp = "Blank line (whitespace/indentation)"
        elif stripped.startswith("#"):
            exp = "Comment – ignored at runtime"
        elif "def " in stripped:
            exp = "Function definition – defines a reusable block of code"
        elif "if " in stripped and ":" in stripped:
            exp = "Conditional – runs block only if condition is true"
        elif "elif " in stripped:
            exp = "Else-if – alternative condition to check"
        elif stripped.startswith("else") and ":" in stripped:
            exp = "Else – runs when no previous condition matches"
        elif "for " in stripped and " in " in stripped:
            exp = "For loop – iterates over a sequence"
        elif "while " in stripped and ":" in stripped:
            exp = "While loop – repeats while condition is true"
        elif "print(" in stripped:
            exp = "Output – prints value to console"
        elif "return " in stripped:
            exp = "Return – sends a value back from function"
        elif "=" in stripped and "==" not in stripped and "!=" not in stripped:
            exp = "Assignment – stores a value in a variable"
        elif "import " in stripped:
            exp = "Import – brings in code from another module"
        else:
            exp = "Statement – executes an action or expression"
        line_by_line.append({"line": i, "code": line, "explanation": exp})

    return jsonify({
        "success": True,
        "code": code,
        "lineByLine": line_by_line,
        "explanation": None,
    })


CODE_GENERATION_SYSTEM = """You are a production-quality coding assistant. Generate correct, runnable, clean code.

RULES:
1. Output ONLY the code. No markdown fences, no explanations, no comments before/after.
2. Use the exact language requested (Python, JavaScript, Java, C, C++, HTML, CSS).
3. Code MUST run without errors.
4. If the user says "do NOT use input()" or "built-in demo", use hardcoded demo data only. No input().
5. CRITICAL - Print/output MUST be minimal (max ~3–5 lines). NEVER verbose. Applies to Python, JavaScript, Java, C, C++.
   - BAD: step-by-step prints, "merge_sort called on:", "Splitting...", "Merging...", "Comparing...", "Base case reached"
   - BAD: separators (====, ---, ***), multiple demos ("Additional Demo"), teaching-style output
   - Python: print(arr); print(merge_sort(arr)) — 2 lines. JavaScript: console.log(arr); console.log(mergeSort(arr)). Same principle.
   - Java: System.out.println for output. C/C++: printf or cout. Max 2–3 output statements total.
   - If you add any print/printf/System.out/console.log inside recursive/loop logic, you are wrong. Only output final input and final result.
6. For algorithms (any language): use demo data, 1–3 output statements total. Nothing else.
7. HTML/CSS: no verbose comments or debug elements.
8. Production-ready, no syntax errors."""


@app.route("/api/generate", methods=["POST"])
def generate_code():
    """
    Generate code from a text description using Claude.
    Expects JSON: { "prompt": "description", "language": "python"|"javascript"|"java"|"c"|"cpp"|"html"|"css" }
    """
    data = request.get_json() or {}
    prompt = data.get("prompt", "").strip()
    language = (data.get("language") or "python").lower()

    if not prompt:
        return jsonify({"error": "No prompt provided"}), 400

    lang_names = {"python": "Python", "javascript": "JavaScript", "java": "Java", "c": "C", "cpp": "C++", "html": "HTML", "css": "CSS"}
    lang_label = lang_names.get(language, "Python")

    api_key = (os.getenv("ANTHROPIC_API_KEY") or "").strip()
    if " " in api_key:
        api_key = api_key.split()[0]
    if not api_key:
        return jsonify({"error": "ANTHROPIC_API_KEY not set in .env"}), 500

    try:
        from anthropic import Anthropic
        client = Anthropic(api_key=api_key)
        CODE_MODELS = [
            ("claude-sonnet-4-6", 4096),
            ("claude-sonnet-4-5-20250929", 4096),
            ("claude-haiku-4-5-20251001", 2048),
            ("claude-sonnet-4-20250514", 4096),
            ("claude-3-haiku-20240307", 2048),
        ]
        response = None
        last_err = None
        for model, max_tokens in CODE_MODELS:
            try:
                response = client.messages.create(
                    model=model,
                    max_tokens=max_tokens,
                    system=CODE_GENERATION_SYSTEM,
                    messages=[{"role": "user", "content": f"Generate {lang_label} code for: {prompt}"}],
                )
                break
            except Exception as e:
                last_err = e
                _raise_if_credit_error(e)
                err_str = str(e).lower()
                if any(x in err_str for x in ["404", "not_found", "invalid", "model"]):
                    continue
                raise
        if response is None:
            raise RuntimeError(f"No compatible model available. Last error: {last_err}")
        generated_code = response.content[0].text.strip()
        # Strip markdown code fences if present
        if generated_code.startswith("```"):
            lines = generated_code.split("\n")
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines and lines[-1].strip() == "```":
                lines = lines[:-1]
            generated_code = "\n".join(lines)
        return jsonify({"success": True, "code": generated_code, "prompt": prompt, "language": language})
    except Exception as e:
        return jsonify({"error": str(e), "success": False}), 500


# Pre-built text games (Flamingo-style: play from text)
GAME_TEMPLATES = {
    "guess": '''# Number Guessing Game
import random
secret = random.randint(1, 20)
print("I'm thinking of a number 1-20. Guess it!")
for _ in range(5):
    try:
        guess = int(input("Your guess: "))
        if guess == secret:
            print("You got it! 🎉")
            break
        print("Too high!" if guess > secret else "Too low!")
    except ValueError:
        print("Enter a number!")
else:
    print(f"Out of guesses! The number was {secret}")
''',
    "rps": '''# Rock Paper Scissors
import random
choices = ["rock", "paper", "scissors"]
print("Rock, Paper, Scissors! Type your choice:")
player = input().strip().lower()
if player not in choices:
    print("Invalid! Use rock, paper, or scissors")
else:
    computer = random.choice(choices)
    print(f"Computer picked: {computer}")
    if player == computer:
        print("Tie!")
    elif (player == "rock" and computer == "scissors") or (player == "scissors" and computer == "paper") or (player == "paper" and computer == "rock"):
        print("You win! 🎉")
    else:
        print("You lose!")
''',
    "story": '''# Mini Text Adventure
print("You enter a dark forest. Path splits: left or right?")
choice = input("Choice: ").strip().lower()
if "left" in choice:
    print("You find a treasure chest! You win! 🏆")
elif "right" in choice:
    print("A friendly squirrel guides you home. Safe!")
else:
    print("You wander lost... but find berries. Not bad!")
''',
    "quiz": '''# Quick Code Quiz
score = 0
q1 = input("What does print() do? (a)delete (b)display (c)skip: ").strip().lower()
if q1 == "b": score += 1
q2 = input("Python uses __ for blocks: (a){} (b)[] (c)indent: ").strip().lower()
if q2 == "c": score += 1
print(f"Score: {score}/2 - {'Well done!' if score == 2 else 'Keep learning!'}")
''',
    "trivia": '''# Number Trivia
n = input("Pick a number 1-5: ")
nums = {"1": "One is the loneliest number!", "2": "Two's company!", "3": "Three's a crowd!", "4": "Four seasons!", "5": "High five!"}
print(nums.get(n.strip(), "Pick 1-5 next time!"))
''',
}


GAME_SYSTEM_PROMPT = """You are an expert HTML5 game developer. Generate PRODUCTION-QUALITY, COMPLETE game code.

CRITICAL - COMPLETENESS:
- Every function MUST be fully implemented—never cut off mid-function. Your entire response must be valid HTML that runs.
- If your code would exceed response limits, simplify (fewer enemies, fewer particle effects)—but NEVER return incomplete/broken code.

CRITICAL - Your output must be:
- FULLY WORKING from first run. No TODOs, no placeholders, no stubs.
- POLISHED: win screen with celebration (e.g. confetti), game over screen, score display, lives if needed.
- COMPLETE: all functions implemented. If you draw a character, implement its movement. If you show platforms, implement collision and jumping.
- SINGLE FILE: <!DOCTYPE html>, <html>, <head> with <style>, <body> with <canvas> and <script>. All inline.

OUTPUT FORMAT:
- Raw HTML only. Start with <!DOCTYPE html>. No markdown, no explanation.
- Rich games welcome: scrolling world, physics, animations, particle effects. Just ensure the code is complete.

QUALITY BAR (match Claude chat output):
- Platformers: gravity, jump, camera/scrolling, collectibles, enemies, proper collision.
- Animal games: Distinct character, environment, collect/avoid, score, win/lose screens.
- Visually appealing: gradients, clear shapes, readable UI. Show controls (e.g. "← → Move | Space Jump").
- Must run in browser as-is."""


IMPROVE_PROMPT_SYSTEM = """Rewrite the user's game idea as ONE very short, direct prompt (8–12 words max).
Format: "[thing] [genre], [action], [obstacle]" 
Examples: "Snake game, eat apples, avoid walls" | "Pong, two paddles, ball physics" | "Fox in forest, collect berries, avoid wolves"
Output ONLY the improved prompt. No quotes. No extra words."""


@app.route("/api/improve-prompt", methods=["POST"])
def improve_prompt():
    """
    Improve a short game description into a detailed prompt for better generation.
    Expects JSON: { "prompt": "e.g. Flamingo game" }
    """
    api_key = (os.getenv("ANTHROPIC_API_KEY") or "").strip()
    if " " in api_key:
        api_key = api_key.split()[0]  # In case key was pasted twice
    if not api_key:
        return jsonify({"error": "ANTHROPIC_API_KEY not set in .env"}), 500

    data = request.get_json() or {}
    prompt = (data.get("prompt") or "").strip()
    if not prompt:
        return jsonify({"error": "No prompt provided"}), 400

    try:
        from anthropic import Anthropic
        client = Anthropic(api_key=api_key)
        # Try Sonnet 4.6 first (best), then fallbacks
        MODELS = [
            "claude-sonnet-4-6",           # Claude Sonnet 4.6
            "claude-sonnet-4-5-20250929",  # Claude Sonnet 4.5
            "claude-haiku-4-5-20251001",   # Claude Haiku 4.5
            "claude-sonnet-4-20250514",    # Claude Sonnet 4
            "claude-3-haiku-20240307",     # Claude Haiku 3 (legacy)
        ]
        response = None
        last_err = None
        for m in MODELS:
            try:
                response = client.messages.create(
                    model=m,
                    max_tokens=80,
                    system=IMPROVE_PROMPT_SYSTEM,
                    messages=[{"role": "user", "content": f"Improve this game idea: {prompt}"}],
                )
                break
            except Exception as e:
                last_err = e
                _raise_if_credit_error(e)
                err_str = str(e).lower()
                if any(x in err_str for x in ["404", "not_found", "invalid", "model"]):
                    continue
                raise
        if response is None:
            raise RuntimeError(
                f"No compatible model available. Last error: {last_err}"
            )
        improved = response.content[0].text.strip()
        return jsonify({"success": True, "improvedPrompt": improved, "original": prompt})
    except Exception as e:
        return jsonify({"error": str(e), "success": False}), 500


@app.route("/api/generate-game", methods=["POST"])
def generate_game():
    """
    Generate a playable HTML5 game from description using Claude.
    Expects JSON: { "prompt": "e.g. Mario platformer, car racing" }
    """
    data = request.get_json() or {}
    prompt = (data.get("prompt") or "").strip().lower()
    if not prompt:
        return jsonify({"error": "No prompt provided"}), 400

    api_key = (os.getenv("ANTHROPIC_API_KEY") or "").strip()
    if " " in api_key:
        api_key = api_key.split()[0]
    if not api_key:
        return jsonify({"error": "ANTHROPIC_API_KEY not set in .env"}), 500

    try:
        from anthropic import Anthropic
        client = Anthropic(api_key=api_key)
        # Try Sonnet 4.6 first (best), then fallbacks
        GAME_MODELS = [
            ("claude-sonnet-4-6", 16000),
            ("claude-sonnet-4-5-20250929", 16000),
            ("claude-haiku-4-5-20251001", 8192),
            ("claude-sonnet-4-20250514", 16000),
            ("claude-3-haiku-20240307", 4096),
        ]
        response = None
        last_err = None
        for model, max_tokens in GAME_MODELS:
            try:
                response = client.messages.create(
                    model=model,
                    max_tokens=max_tokens,
                    system=GAME_SYSTEM_PROMPT,
                    messages=[{"role": "user", "content": f"Generate complete, production-quality HTML5 game code for: {prompt}\n\nOutput ONLY the raw HTML. No explanation. Must be fully playable, polished, and run correctly in a browser."}],
                )
                break
            except Exception as model_err:
                last_err = model_err
                _raise_if_credit_error(model_err)
                err_str = str(model_err).lower()
                if any(x in err_str for x in ["404", "not_found", "invalid", "model"]):
                    continue
                raise
        if response is None:
            raise RuntimeError(f"No compatible model available. Last error: {last_err}")

        # Check for truncation (incomplete output)
        if getattr(response, "stop_reason", None) == "max_tokens":
            return jsonify({
                "error": "Generated code was cut off (output too long). Try a simpler prompt, e.g. 'Snake game' or 'Pong game'.",
                "success": False
            }), 500

        html = response.content[0].text.strip()

        # Strip markdown code fences if present
        if "```html" in html:
            html = html.split("```html")[1].split("```")[0].strip()
        elif "```" in html:
            parts = html.split("```")
            if len(parts) >= 2:
                html = parts[1].strip()
                if parts[1].strip().lower().startswith("html"):
                    html = parts[1].strip()[4:].strip()  # remove "html" from first line

        # If model returned description instead of code, reject it
        if not html or ("<!DOCTYPE" not in html and "<html" not in html and "<!doctype" not in html.lower()):
            return jsonify({
                "error": "Model returned a description instead of HTML code. Try a shorter, clearer prompt like 'Flamingo game in a pond' or 'Snake game'.",
                "success": False
            }), 500

        return jsonify({"success": True, "html": html, "prompt": prompt})
    except Exception as e:
        err_msg = str(e) or "Unknown error"
        print(f"[generate-game ERROR] {err_msg}")  # Backend logs to terminal
        return jsonify({"error": err_msg, "success": False}), 500


@app.route("/api/play", methods=["POST"])
def play_game():
    """
    Get a playable text game from description.
    Expects JSON: { "prompt": "game description" } or { "game": "preset_key" }
    Presets: guess, rps, story, quiz, trivia
    """
    data = request.get_json() or {}
    prompt = (data.get("prompt") or data.get("game") or "").strip().lower()

    if not prompt:
        return jsonify({
            "success": True,
            "code": "# Describe a game to play!\\n# Try: number guessing, rock paper scissors, story, quiz, trivia",
            "games": list(GAME_TEMPLATES.keys()),
        })

    # Match preset by keyword
    keywords = {
        "guess": ["guess", "number", "guessing"],
        "rps": ["rps", "rock", "paper", "scissors"],
        "story": ["story", "adventure", "forest", "choose"],
        "quiz": ["quiz", "code question"],
        "trivia": ["trivia", "number 1-5"],
    }
    for key, words in keywords.items():
        if any(w in prompt for w in words):
            return jsonify({"success": True, "code": GAME_TEMPLATES[key], "game": key})

    # Custom: use generate-style for unknown games
    custom = f'''# Your game: {prompt[:60]}
# Integrate LLM to generate custom games from any description!
print("Game: {prompt[:40]}...")
print("Add an LLM to generate custom games from any description!")
'''
    return jsonify({"success": True, "code": custom, "game": "custom"})


def _extract_text_from_file(file, filename):
    """Extract text from uploaded file (PDF, DOCX, or plain text/code)."""
    raw = file.read()
    ext = (filename or "").lower().split(".")[-1] if "." in (filename or "") else ""
    try:
        if ext == "pdf":
            try:
                from pypdf import PdfReader
                reader = PdfReader(BytesIO(raw))
                text = "\n".join(page.extract_text() or "" for page in reader.pages)
                return text.strip() or "(No text extracted from PDF)"
            except ImportError:
                raise ValueError("PDF support requires: pip install pypdf")
        if ext == "docx":
            try:
                from docx import Document
                doc = Document(BytesIO(raw))
                return "\n".join(p.text for p in doc.paragraphs)
            except ImportError:
                raise ValueError("Word support requires: pip install python-docx")
            except Exception:
                try:
                    z = zipfile.ZipFile(BytesIO(raw), "r")
                    xml = z.read("word/document.xml")
                    text = re.sub(r"<[^>]+>", " ", xml.decode("utf-8", errors="replace"))
                    return " ".join(text.split())
                except Exception:
                    raise ValueError("Could not extract text from Word document")
        if ext in ("png", "jpg", "jpeg", "gif", "bmp", "webp"):
            raise ValueError("Image files are not supported yet. Try PDF, Word (.docx), or paste code in the editor.")
        # Plain text, code files, .txt, .md, etc.: decode as UTF-8
        return raw.decode("utf-8", errors="replace")
    except ValueError:
        raise
    except Exception as e:
        raise ValueError(f"Could not read file: {e}")


def _extract_java_class_name(code):
    """Extract public class name from Java code for filename."""
    m = re.search(r"public\s+class\s+(\w+)", code)
    return m.group(1) if m else "Main"


PISTON_URLS = [
    "https://emkc.org/api/v2/execute",
    "https://emkc.org/api/v2/piston/execute",
    "https://emkc.org/api/v2/piston/api/v2/execute",
]


JUDGE0_LANG_IDS = {"c": 50, "cpp": 54, "java": 91}  # Judge0 CE language IDs


def _parse_judge0_response(d):
    """Parse Judge0 API response into our format."""
    stdout = d.get("stdout") or ""
    stderr = d.get("stderr") or ""
    compile_out = d.get("compile_output") or ""
    status = d.get("status", {})
    status_id = status.get("id", 0)
    success = status_id in (3, 4)
    if status_id == 6:
        return {"success": False, "output": compile_out.strip() or "(compile error)", "error": compile_out}
    out = (stdout + stderr).strip() or "(no output)"
    return {"success": success, "output": out, "error": stderr if status_id not in (3, 4) else None}


def _run_via_judge0(language, code, stdin_text=""):
    """Run via Judge0 CE - RapidAPI or ce.judge0.com (free public instance)."""
    if language not in JUDGE0_LANG_IDS:
        return None
    lid = JUDGE0_LANG_IDS[language]
    rapid_key = (os.getenv("RAPIDAPI_KEY") or "").strip()
    auth_token = (os.getenv("JUDGE0_AUTH_TOKEN") or "").strip()
    payload = {"source_code": code, "language_id": lid, "stdin": stdin_text or ""}

    # Try RapidAPI first if key exists
    if rapid_key:
        url = "https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=false&wait=true"
        headers = {"Content-Type": "application/json", "X-RapidAPI-Key": rapid_key, "x-rapidapi-host": "judge0-ce.p.rapidapi.com"}
        try:
            import requests
            r = requests.post(url, json=payload, headers=headers, timeout=30)
            if r.status_code in (200, 201):
                return _parse_judge0_response(r.json())
            if r.status_code != 403:
                print(f"[judge0] RapidAPI HTTP {r.status_code}: {r.text[:300]}")
            # 403 = not subscribed; fall through to ce.judge0.com
        except Exception as e:
            print(f"[judge0] RapidAPI error: {e}")

    # Fallback: free public instance at ce.judge0.com (no subscription needed)
    url = "https://ce.judge0.com/submissions?base64_encoded=false&wait=true"
    headers = {"Content-Type": "application/json"}
    if auth_token:
        headers["X-Auth-Token"] = auth_token
    try:
        import requests
        r = requests.post(
            url,
            json=payload,
            headers=headers,
            timeout=30,
        )
        if r.status_code not in (200, 201):
            print(f"[judge0] ce.judge0.com HTTP {r.status_code}: {r.text[:500]}")
            return None
        return _parse_judge0_response(r.json())
    except Exception as e:
        print(f"[judge0] Error: {e}")
        return None


def _run_via_jdoodle(language, code, stdin_text=""):
    """Optional: run via JDoodle if JDOODLE_CLIENT_ID and JDOODLE_CLIENT_SECRET in .env."""
    cid = (os.getenv("JDOODLE_CLIENT_ID") or "").strip()
    sec = (os.getenv("JDOODLE_CLIENT_SECRET") or "").strip()
    if not cid or not sec:
        return None
    lang_map = {"c": ("c", "4"), "cpp": ("cpp17", "0"), "java": ("java", "4")}
    if language not in lang_map:
        return None
    jd_lang, ver = lang_map[language]
    try:
        import requests
        r = requests.post(
            "https://api.jdoodle.com/v1/execute",
            json={
                "clientId": cid,
                "clientSecret": sec,
                "script": code,
                "language": jd_lang,
                "versionIndex": ver,
                "stdin": stdin_text or "",
            },
            timeout=15,
        )
        if r.status_code != 200:
            return None
        d = r.json()
        out = d.get("output", "")
        err = d.get("error", "")
        success = d.get("statusCode", 200) == 200 and d.get("isExecutionSuccess", True)
        return {
            "success": success,
            "output": (out or err or "(no output)").strip(),
            "error": err.strip() if not success and err else None,
        }
    except Exception:
        return None


def _run_via_piston(language, code, stdin_text=""):
    """Fallback: run code via Piston API when local compiler is not available."""
    lang_map = {"c": ("c", "main.c"), "cpp": ("cpp", "main.cpp"), "java": ("java", "Main.java")}  # piston uses c, cpp, java
    if language not in lang_map:
        return None
    piston_lang, fname = lang_map[language]
    payload = {
        "language": piston_lang,
        "version": "*",
        "files": [{"name": fname, "content": code}],
        "stdin": stdin_text or "",
    }
    for url in PISTON_URLS:
        try:
            import requests
            r = requests.post(url, json=payload, timeout=30, headers={"User-Agent": "CodeFlow/1.0"})
            if r.status_code != 200:
                print(f"[piston] {url} -> {r.status_code}")
                continue
            data = r.json()
            run = data.get("run") or {}
            comp = data.get("compile") or {}
            stdout = run.get("stdout", "") or ""
            stderr = run.get("stderr", "") or ""
            comp_out = (comp.get("output") or comp.get("stderr") or "").strip()
            comp_code = comp.get("code")
            if comp_out and comp_code is not None and comp_code != 0:
                return {"success": False, "output": comp_out, "error": comp_out}
            out = stdout + stderr
            return {
                "success": run.get("code", 1) == 0,
                "output": out.strip() or "(no output)",
                "error": stderr.strip() if run.get("code", 0) != 0 else None,
            }
        except Exception as e:
            print(f"[piston] {url} failed: {e}")
            continue
    print("[piston] All URLs failed - C/C++/Java need gcc/g++/javac installed")
    return None


@app.route("/api/test-cloud", methods=["GET"])
def test_cloud():
    """Debug: test which cloud API works for C (Judge0, Piston, JDoodle)."""
    code = "#include <stdio.h>\nint main(){printf(\"hi\");return 0;}"
    j0 = _run_via_judge0("c", code, "")
    piston = _run_via_piston("c", code, "") if not j0 else None
    jd = _run_via_jdoodle("c", code, "") if not j0 and not piston else None
    return jsonify({
        "judge0": j0 is not None,
        "piston": piston is not None,
        "jdoodle": jd is not None,
        "result": j0 or piston or jd,
        "tip": "Add RAPIDAPI_KEY (Judge0 CE on RapidAPI) to .env" if not j0 else None,
    })


@app.route("/api/execute", methods=["POST"])
def execute_code():
    """
    Execute code in a sandboxed subprocess.
    Expects JSON: { "code": "...", "stdin": "optional", "language": "python"|"javascript"|"java" }
    """
    data = request.get_json() or {}
    code = data.get("code", "").strip()
    stdin_text = data.get("stdin", "")
    language = (data.get("language") or "python").lower()

    if not code:
        return jsonify({"error": "No code provided"}), 400

    if language not in ("python", "javascript", "java", "c", "cpp"):
        return jsonify({
            "success": False,
            "output": "",
            "error": f"Run not supported for: {language}.",
        }), 400

    # Security: Block dangerous operations
    blocked = ["os.system", "subprocess", "child_process", "__import__", "eval(", "exec("]
    if language == "java":
        blocked.extend(["Runtime.getRuntime()", "ProcessBuilder", "ProcessBuilder("])
    if language in ("c", "cpp"):
        blocked.extend(["system(", "popen(", "execve", "execv"])
    for b in blocked:
        if b in code:
            return jsonify({
                "success": False,
                "output": "",
                "error": f"Blocked operation for security: {b}",
            }), 400

    write_opts = {"mode": "w", "encoding": "utf-8"}
    cwd = tempfile.mkdtemp()
    path = None

    # For C, C++, Java: try cloud APIs (Judge0, Piston, JDoodle)
    if language in ("c", "cpp", "java"):
        for run_fn in (_run_via_judge0, _run_via_piston, _run_via_jdoodle):
            result = run_fn(language, code, stdin_text)
            if result:
                return jsonify(result)

    try:
        if language == "javascript":
            path = os.path.join(cwd, "script.js")
            with open(path, **write_opts) as f:
                f.write(code)
            result = subprocess.run(
                ["node", path],
                input=stdin_text if stdin_text else None,
                capture_output=True,
                text=True,
                timeout=15,
                cwd=cwd,
            )
        elif language == "c":
            path = os.path.join(cwd, "main.c")
            with open(path, **write_opts) as f:
                f.write(code)
            exe = os.path.join(cwd, "a.out" if os.name != "nt" else "a.exe")
            compile_result = subprocess.run(
                ["gcc", path, "-o", exe],
                capture_output=True,
                text=True,
                timeout=15,
                cwd=cwd,
            )
            if compile_result.returncode != 0:
                out = compile_result.stdout + compile_result.stderr
                return jsonify({"success": False, "output": out or "(compile failed)", "error": out.strip() or "gcc not found?"}), 400
            result = subprocess.run(
                [exe],
                input=stdin_text if stdin_text else None,
                capture_output=True,
                text=True,
                timeout=15,
                cwd=cwd,
            )
        elif language == "cpp":
            path = os.path.join(cwd, "main.cpp")
            with open(path, **write_opts) as f:
                f.write(code)
            exe = os.path.join(cwd, "a.out" if os.name != "nt" else "a.exe")
            compile_result = subprocess.run(
                ["g++", path, "-o", exe],
                capture_output=True,
                text=True,
                timeout=15,
                cwd=cwd,
            )
            if compile_result.returncode != 0:
                out = compile_result.stdout + compile_result.stderr
                return jsonify({"success": False, "output": out or "(compile failed)", "error": out.strip() or "g++ not found?"}), 400
            result = subprocess.run(
                [exe],
                input=stdin_text if stdin_text else None,
                capture_output=True,
                text=True,
                timeout=15,
                cwd=cwd,
            )
        elif language == "java":
            class_name = _extract_java_class_name(code)
            path = os.path.join(cwd, f"{class_name}.java")
            with open(path, **write_opts) as f:
                f.write(code)
            compile_result = subprocess.run(
                ["javac", path],
                capture_output=True,
                text=True,
                timeout=15,
                cwd=cwd,
            )
            if compile_result.returncode != 0:
                output = compile_result.stdout + compile_result.stderr
                return jsonify({
                    "success": False,
                    "output": output or "(compilation failed)",
                    "error": output.strip() or "Java compilation failed. Is javac installed?",
                }), 400
            result = subprocess.run(
                ["java", "-cp", cwd, class_name],
                input=stdin_text if stdin_text else None,
                capture_output=True,
                text=True,
                timeout=15,
                cwd=cwd,
            )
        else:
            path = os.path.join(cwd, "script.py")
            with open(path, **write_opts) as f:
                f.write(code)
            result = subprocess.run(
                ["python", path],
                input=stdin_text if stdin_text else None,
                capture_output=True,
                text=True,
                timeout=15,
                cwd=cwd,
            )

        output = result.stdout + result.stderr
        return jsonify({
            "success": result.returncode == 0,
            "output": output or "(no output)",
            "error": result.stderr if result.returncode != 0 else None,
        })
    except subprocess.TimeoutExpired:
        return jsonify({
            "success": False,
            "output": "",
            "error": "Execution timed out (max 15 seconds). Does your code use input()? Add values in the Input box above, one per line.",
        }), 400
    except FileNotFoundError:
        tip = ""
        if language in ("c", "cpp", "java"):
            tip = "\n\nCloud run: Add RAPIDAPI_KEY (Judge0 CE on RapidAPI) or JDOODLE keys to .env. Or install gcc/Java."
        return jsonify({
            "success": False,
            "output": "",
            "error": f"Compiler not found. Install gcc (C/C++) or Java, or add JDoodle API key to .env.{tip}",
        }), 400
    except Exception as e:
        return jsonify({
            "success": False,
            "output": "",
            "error": str(e),
        }), 500
    finally:
        if cwd and os.path.exists(cwd):
            try:
                for f in os.listdir(cwd):
                    os.unlink(os.path.join(cwd, f))
                os.rmdir(cwd)
            except Exception:
                pass


if __name__ == "__main__":
    app.run(debug=True, port=5000)
