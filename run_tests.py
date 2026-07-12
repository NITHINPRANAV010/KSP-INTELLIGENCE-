import os
import sys

# Append backend to sys path
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), "backend"))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def run_suite():
    print("=============================================================")
    print("   KSP AI COMMAND CENTER - PRODUCTION VERIFICATION HARNESS   ")
    print("=============================================================")

    # 1. Health Probe
    res = client.get("/health")
    assert res.status_code == 200, "Health probe failed"
    print(f"[PASS] Health Check Endpoint: {res.json()}")

    # 2. Readiness Probe
    res = client.get("/ready")
    assert res.status_code == 200, "Readiness probe failed"
    print(f"[PASS] Readiness Check Endpoint: {res.json()}")

    # 3. Auth Check
    login_payload = {"username": "sgupta_ksp", "password": "ksp_admin_pass"}
    res = client.post("/api/login", json=login_payload)
    assert res.status_code == 200, f"Login failed: {res.text}"
    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print(f"[PASS] Authentication Check: JWT generated successfully")

    # 4. User Role Permissions Check
    res = client.get("/api/me", headers=headers)
    assert res.status_code == 200, "Fetch current user failed"
    user_data = res.json()
    assert user_data["role"] == "Super Administrator", "Role mapping incorrect"
    print(f"[PASS] RBAC Check: Authorized {user_data['name']} (Role: {user_data['role']})")

    # 5. Core Data Registry Counts
    res = client.get("/api/dashboard/overview", headers=headers)
    assert res.status_code == 200, "Fetch dashboard stats failed"
    stats = res.json()
    assert stats["total_crimes"] >= 10250, "Incident seeding size incorrect"
    print(f"[PASS] DB Integrity Check: Seeded size is {stats['total_crimes']} incidents")

    # 6. AI Mathematical Forecasting Check
    predict_payload = {"district": "Bengaluru Urban", "crime_type": "Theft", "horizon": "week"}
    res = client.post("/api/ai/predict", json=predict_payload, headers=headers)
    assert res.status_code == 200, "Prediction route failed"
    pred = res.json()
    assert "predicted_count" in pred, "Prediction output key missing"
    print(f"[PASS] AI Prediction Model: Horizon predicted count is {pred['predicted_count']} cases")

    # 7. Agentic RAG Semantic Retrieval Check
    chat_payload = {"message": "Compare Bengaluru Urban and Hubballi-Dharwad districts"}
    res = client.post("/api/ai/chat", json=chat_payload, headers=headers)
    assert res.status_code == 200, "AI Chat routing failed"
    chat_out = res.json()
    assert chat_out["type"] == "agent_analysis", "Response type should be agent_analysis"
    explain = chat_out.get("data", {}).get("explainability", {})
    assert explain.get("confidenceRating") is not None, "Explainability block missing confidence"
    print(f"[PASS] Agentic RAG Check: Cosine match similarity score is {explain['confidenceRating']}")

    print("\n=============================================================")
    print("   ALL INTEGRATION, AUTH, DB & AI MODEL TESTS COMPLETED SUCCESS  ")
    print("=============================================================")
    return True

if __name__ == "__main__":
    try:
        run_suite()
        sys.exit(0)
    except AssertionError as e:
        print(f"\n[FAIL] VERIFICATION ASSERTION ERROR: {e}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"\n[CRITICAL] TESTING FAILURE: {e}", file=sys.stderr)
        sys.exit(1)
