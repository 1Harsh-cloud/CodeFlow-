"""Test which Claude models your API key can use. Run: python test_models.py"""
from dotenv import load_dotenv
import os

load_dotenv()
key = os.getenv("ANTHROPIC_API_KEY")

if not key:
    print("[FAIL] ANTHROPIC_API_KEY not found in .env")
    exit(1)

print("Testing Claude models (best first)...\n")

MODELS = [
    "claude-sonnet-4-5-20250929",   # Sonnet 4.5 - best quality (like Claude.ai)
    "claude-3-5-sonnet-20241022",   # Claude 3.5 Sonnet
    "claude-3-haiku-20240307",      # Haiku - fastest, weakest
]

try:
    from anthropic import Anthropic
    client = Anthropic(api_key=key)

    for m in MODELS:
        try:
            r = client.messages.create(
                model=m,
                max_tokens=20,
                messages=[{"role": "user", "content": "Say OK"}],
            )
            print(f"[OK]  {m}")
        except Exception as e:
            err = str(e).lower()
            if "404" in err or "not_found" in err:
                print(f"[---] {m}  (not available on your plan)")
            else:
                print(f"[FAIL] {m}  {e}")

    print("\nDone. Use [OK] models for best game quality.")
except Exception as e:
    print("[FAIL] Error:", e)
    exit(1)
