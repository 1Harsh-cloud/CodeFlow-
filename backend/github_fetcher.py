"""
Fetch public GitHub repo file tree and contents via GitHub API.
No auth required for public repos (rate limited).
"""
import re
import requests

GITHUB_API = "https://api.github.com"
MAX_FILE_SIZE = 500_000  # 500KB - skip larger files
CODE_EXTENSIONS = {".py", ".js", ".jsx", ".ts", ".tsx", ".css", ".scss", ".java", ".go", ".rb", ".rs", ".c", ".cpp", ".h"}


def parse_repo_url(url: str) -> tuple:
    """Extract owner/repo from URL. Returns (owner, repo) or None."""
    # https://github.com/owner/repo or github.com/owner/repo or owner/repo
    url = (url or "").strip()
    m = re.search(r"github\.com[/:]([\w\-\.]+)/([\w\-\.]+?)(?:/|\.git|$)", url, re.I)
    if m:
        return m.group(1), m.group(2)
    # Also accept plain owner/repo
    m = re.match(r"([\w\-\.]+)/([\w\-\.]+)\s*$", url)
    if m:
        return m.group(1), m.group(2)
    return None


def _auth_headers(token: str = None):
    """Headers for GitHub API (with optional auth for private repos)."""
    h = {"Accept": "application/vnd.github.v3+json"}
    if token:
        h["Authorization"] = f"token {token}"
    return h


def fetch_file_list(owner: str, repo: str, branch: str = None, token: str = None) -> list:
    """Get recursive file tree. Returns list of {path, sha, type}."""
    headers = _auth_headers(token)
    if not branch:
        r = requests.get(f"{GITHUB_API}/repos/{owner}/{repo}", headers=headers, timeout=10)
        if r.status_code != 200:
            raise RuntimeError(f"Repo not found: {owner}/{repo}")
        branch = r.json().get("default_branch", "main")

    r = requests.get(
        f"{GITHUB_API}/repos/{owner}/{repo}/git/trees/{branch}",
        params={"recursive": 1},
        headers=headers,
        timeout=15,
    )
    if r.status_code != 200:
        raise RuntimeError(f"Failed to fetch tree: {r.json().get('message', r.text)}")

    tree = r.json().get("tree", [])
    return [
        {"path": t["path"], "sha": t.get("sha"), "type": t.get("type", "blob")}
        for t in tree
        if t.get("type") == "blob"
    ]


def fetch_file_content(owner: str, repo: str, path: str, token: str = None) -> str:
    """Fetch raw file content."""
    headers = {"Accept": "application/vnd.github.raw+json"}
    if token:
        headers["Authorization"] = f"token {token}"
    r = requests.get(
        f"{GITHUB_API}/repos/{owner}/{repo}/contents/{path}",
        headers=headers,
        timeout=10,
    )
    if r.status_code != 200:
        raise RuntimeError(f"Failed to fetch {path}")
    return r.text


def fetch_repo_files(url: str, max_files: int = 80, token: str = None) -> list:
    """
    Fetch code files from a public GitHub repo.
    Returns list of {path, content}.
    Skips node_modules, __pycache__, .git, etc.
    """
    parsed = parse_repo_url(url)
    if not parsed:
        raise ValueError("Invalid GitHub URL. Use: https://github.com/owner/repo")

    owner, repo = parsed
    files = fetch_file_list(owner, repo, token=token)

    # Filter to code files only, skip common non-source dirs
    skip_dirs = {"node_modules", "__pycache__", ".git", "dist", "build", ".venv", "venv"}
    results = []
    for f in files:
        path = f["path"]
        parts = path.lower().split("/")
        if any(skip in parts for skip in skip_dirs):
            continue
        ext = "." + path.split(".")[-1].lower() if "." in path else ""
        if ext not in CODE_EXTENSIONS:
            continue
        if len(results) >= max_files:
            break
        try:
            content = fetch_file_content(owner, repo, path, token=token)
            if len(content) <= MAX_FILE_SIZE:
                results.append({"path": path, "content": content})
        except Exception:
            continue  # Skip files we can't fetch

    return results
