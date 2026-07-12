import os
import sys

# Add backend root to path to resolve imports correctly
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

print("=== KSP Phase 7 Agentic RAG Verification Suite ===")

# ── 1. RAG Query Analysis test ────────────────────────
chat_payload = {
    "message": "Compare Bengaluru Urban and Hubballi-Dharwad districts risk level."
}
response = client.post("/api/ai/chat", json=chat_payload)
print(f"[PASS] AI Agent chat route status code: {response.status_code}")
if response.status_code != 200:
    print(f"FAIL: RAG Chat failed! Response: {response.text}")
    sys.exit(1)

result = response.json()
print("\n=== AI AGENT CONSOLE RESPONSE ===")
safe_response = result["response"].encode('ascii', errors='replace').decode('ascii')
print(safe_response)
print("==================================\n")

if not result["response"] or "agent_analysis" not in result["type"]:
    print("FAIL: AI Response type or text missing!")
    sys.exit(1)

# ── 2. Explainability structure check ─────────────────
explain = result.get("data", {}).get("explainability", {})
print("[PASS] Explainability block verified:")
print(f"   -> Confidence: {explain.get('confidenceRating')}")
print(f"   -> Sources Used: {', '.join(explain.get('evidenceUsed', []))}")
print(f"   -> Next Suggested Actions:")
for action in explain.get("suggestedNextActions", []):
    print(f"      * {action}")

if not explain.get("confidenceRating") or not explain.get("evidenceUsed"):
    print("FAIL: Explainability details incomplete!")
    sys.exit(1)

print("=== ALL AGENTIC RAG SYSTEM VALIDATION CHECKS PASSED SUCCESSFULLY ===")
sys.exit(0)
