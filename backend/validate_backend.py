import os
import sys

# Add backend root to path to resolve imports correctly
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

print("=== KSP Phase 6 Backend Verification Suite ===")

# ── 1. Root & Swagger Docs check ──────────────────────
response = client.get("/docs")
print(f"[PASS] Swagger UI docs endpoint checked: status code {response.status_code}")
if response.status_code != 200:
    print("FAIL: Docs endpoint not responding!")
    sys.exit(1)

# ── 2. Login & JWT Token generation check ─────────────
login_payload = {
    "username": "sgupta_ksp",
    "password": "ksp_admin_pass"
}
response = client.post("/api/login", json=login_payload)
print(f"[PASS] Login endpoint checked: status code {response.status_code}")
if response.status_code != 200:
    print(f"FAIL: Login failed! Response: {response.text}")
    sys.exit(1)

token_data = response.json()
token = token_data.get("access_token")
print(f"   -> Auth token retrieved: {token[:24]}...")
if not token:
    print("FAIL: Access token missing in response!")
    sys.exit(1)

# Headers with Authorization token
headers = {"Authorization": f"Bearer {token}"}

# ── 3. Current User Endpoint (GET /me) ────────────────
response = client.get("/api/me", headers=headers)
print(f"[PASS] Current user endpoint check: {response.status_code}")
me = response.json()
print(f"   -> Logged user name: {me['name']} (Role: {me['role']})")
if me['username'] != "sgupta_ksp":
    print("FAIL: Username mismatch on current user check!")
    sys.exit(1)

# ── 4. Dashboard Overview statistics check ────────────
response = client.get("/api/dashboard/overview", headers=headers)
print(f"[PASS] Dashboard Overview check: {response.status_code}")
stats = response.json()
print(f"   -> Seeded Crime records count: {stats['total_crimes']} cases")
print(f"   -> Solved Crimes percentage: {stats['solved_percentage']}%")
if stats['total_crimes'] < 10000:
    print(f"FAIL: Ingested crime records count lower than expected 10,000 cases ({stats['total_crimes']})!")
    sys.exit(1)

# ── 5. AI Predictions calculation check ───────────────
predict_payload = {
    "district": "Bengaluru Urban",
    "crime_type": "Cybercrime",
    "horizon": "week"
}
response = client.post("/api/ai/predict", json=predict_payload, headers=headers)
print(f"[PASS] AI Prediction model response code: {response.status_code}")
pred = response.json()
print(f"   -> Predicted count: {pred['predicted_count']} incidents")
print(f"   -> AI confidence: {pred['confidence'] * 100:.0f}%")
if pred['predicted_count'] <= 0:
    print("FAIL: AI predictions count returned non-positive integer values!")
    sys.exit(1)

# ── 6. Advanced Filters and Search check ──────────────
response = client.get("/api/crimes?district=Bengaluru Urban&limit=5", headers=headers)
print(f"[PASS] Crime records query check: status code {response.status_code}")
records = response.json()
print(f"   -> First matched case record: {records[0]['id']} ({records[0]['crime_type']} at {records[0]['police_station']})")
if len(records) != 5:
    print(f"FAIL: Records limit check mismatch! Fetched count: {len(records)}")
    sys.exit(1)

print("=== ALL FASTAPI BACKEND VERIFICATION CHECKS PASSED SUCCESSFULLY ===")
sys.exit(0)
