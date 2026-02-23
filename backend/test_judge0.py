"""Quick script to verify Judge0 CE is working (RapidAPI or ce.judge0.com)."""
import os
import sys

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

payload = {
    "source_code": "#include <stdio.h>\nint main(){printf(\"hi\");return 0;}",
    "language_id": 50,
    "stdin": "",
}

def test(url, headers, name):
    import requests
    r = requests.post(url, json=payload, headers=headers, timeout=30)
    if r.status_code in (200, 201):
        d = r.json()
        status_id = d.get("status", {}).get("id")
        stdout = d.get("stdout", "")
        if status_id in (3, 4):
            print(f"{name}: WORKING (output={repr(stdout)})")
            return True
    print(f"{name}: HTTP {r.status_code} - {r.text[:200]}")
    return False

print("Testing Judge0 CE...")
print()

# 1. Try RapidAPI if key exists
rapid_key = (os.getenv("RAPIDAPI_KEY") or "").strip()
if rapid_key:
    print("1. RapidAPI (judge0-ce.p.rapidapi.com)...")
    if test(
        "https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=false&wait=true",
        {"Content-Type": "application/json", "X-RapidAPI-Key": rapid_key, "x-rapidapi-host": "judge0-ce.p.rapidapi.com"},
        "   RapidAPI"
    ):
        print("\n>>> Judge0 is WORKING (via RapidAPI)! <<<")
        sys.exit(0)
else:
    print("1. RAPIDAPI_KEY not set, skipping RapidAPI")
print()

# 2. Fallback: free public ce.judge0.com
print("2. ce.judge0.com (free public instance)...")
if test(
    "https://ce.judge0.com/submissions?base64_encoded=false&wait=true",
    {"Content-Type": "application/json"},
    "   ce.judge0.com"
):
    print("\n>>> Judge0 is WORKING (via ce.judge0.com)! <<<")
    sys.exit(0)
else:
    print("\n>>> Both failed <<<")
    sys.exit(1)
