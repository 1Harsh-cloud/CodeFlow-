"""Quick script to verify ANTHROPIC_API_KEY works."""
from dotenv import load_dotenv
import os

load_dotenv()
key = os.getenv("ANTHROPIC_API_KEY")

if not key:
    print("[FAIL] ANTHROPIC_API_KEY not found in .env")
    exit(1)

if not key.strip():
    print("[FAIL] ANTHROPIC_API_KEY is empty")
    exit(1)

print("Key found, testing API call...")

try:
    from anthropic import Anthropic
    client = Anthropic(api_key=key)
    response = client.messages.create(
        model="claude-3-haiku-20240307",
        max_tokens=50,
        messages=[{"role": "user", "content": "Say API key works and nothing else."}],
    )
    reply = response.content[0].text
    print("[OK] API key works!")
    print("Response:", reply)
except Exception as e:
    print("[FAIL] API call failed:", e)
    exit(1)
