"""
Exercises the /analytics/admin/users/exists endpoint in isolation.

The real server.py needs Mongo, Cloudinary and a dozen other services to
import, so this lifts the handler's exact source out of the patched file and
runs it against a fake users collection. If the body changes, this test reads
the change.
"""
import ast, io, os, re, sys, hmac
from typing import Optional
from fastapi import FastAPI, APIRouter, HTTPException, Header
from fastapi.testclient import TestClient

SRC = io.open("server.py", encoding="utf-8").read()
tree = ast.parse(SRC)
node = next((n for n in tree.body
             if isinstance(n, ast.AsyncFunctionDef) and n.name == "user_exists_endpoint"), None)
assert node, "endpoint not found in server.py"
# get_source_segment starts at `def`, dropping the decorator that registers
# the route — take it from the first decorator line instead.
lines = SRC.splitlines(keepends=True)
start = min([d.lineno for d in node.decorator_list] + [node.lineno]) - 1
handler_src = "".join(lines[start:node.end_lineno])
print(f"lifted handler: {len(handler_src.splitlines())} lines\n")

USERS = [{"email": "Wes@OfficialMoodApp.com"}, {"email": "member@example.com"}]

class FakeUsers:
    async def find_one(self, query, projection=None):
        rx = query["email"]["$regex"]
        flags = re.I if "i" in query["email"].get("$options", "") else 0
        return next(({"_id": "x"} for u in USERS if re.match(rx, u["email"], flags)), None)

class FakeDB: users = FakeUsers()

api_router = APIRouter()
ns = {"api_router": api_router, "Optional": Optional, "Header": Header,
      "HTTPException": HTTPException, "os": os, "re": re, "hmac": hmac, "db": FakeDB()}
exec(handler_src, ns)

app = FastAPI(); app.include_router(api_router, prefix="/api")
client = TestClient(app, raise_server_exceptions=False)
URL = "/api/analytics/admin/users/exists"

passed = failed = 0
def check(name, cond, extra=""):
    global passed, failed
    if cond: passed += 1; print(f"  ok    {name}")
    else: failed += 1; print(f"  FAIL  {name}  {extra}")

print("--- token not configured on the app ---")
os.environ.pop("BOOKING_SERVICE_TOKEN", None)
r = client.get(URL, params={"q": "member@example.com"}, headers={"X-Service-Token": ""})
check("503, not a silent allow", r.status_code == 503, r.text)
r = client.get(URL, params={"q": "member@example.com"}, headers={"X-Service-Token": "anything"})
check("empty secret authenticates nobody", r.status_code == 503, r.text)

print("\n--- configured ---")
os.environ["BOOKING_SERVICE_TOKEN"] = "s3cr3t-token-value"
r = client.get(URL, params={"q": "member@example.com"})
check("no header -> 401", r.status_code == 401, r.text)
r = client.get(URL, params={"q": "member@example.com"}, headers={"X-Service-Token": "wrong"})
check("wrong token -> 401", r.status_code == 401, r.text)
r = client.get(URL, params={"q": "s3cr3t-token-valu"}, headers={"X-Service-Token": "s3cr3t-token-valu"})
check("prefix of the token is rejected", r.status_code == 401, r.text)

H = {"X-Service-Token": "s3cr3t-token-value"}
r = client.get(URL, params={"q": "member@example.com"}, headers=H)
check("known user -> total 1", r.status_code == 200 and r.json() == {"total": 1}, r.text)
r = client.get(URL, params={"q": "WES@officialmoodapp.COM"}, headers=H)
check("case-insensitive match", r.status_code == 200 and r.json() == {"total": 1}, r.text)
r = client.get(URL, params={"q": "  member@example.com  "}, headers=H)
check("whitespace tolerated", r.json() == {"total": 1}, r.text)
r = client.get(URL, params={"q": "stranger@example.com"}, headers=H)
check("unknown user -> total 0", r.json() == {"total": 0}, r.text)

print("\n--- it must not leak anything ---")
r = client.get(URL, params={"q": "member@example.com"}, headers=H)
check("response is only a count", set(r.json().keys()) == {"total"}, r.json())
r = client.get(URL, params={"q": "member@example.co"}, headers=H)
check("prefix of an email does not match", r.json() == {"total": 0}, r.text)
r = client.get(URL, params={"q": ".*@example.com"}, headers=H)
check("regex injection is escaped", r.json() == {"total": 0}, r.text)
r = client.get(URL, params={"q": "member"}, headers=H)
check("non-email rejected", r.status_code == 400, r.text)
r = client.get(URL, params={"q": ""}, headers=H)
check("empty rejected", r.status_code == 400, r.text)
r = client.get(URL, headers=H)
check("missing q -> 422", r.status_code == 422, r.text)

print("\n" + "=" * 48)
print(f"  {passed} passed, {failed} failed")
print("=" * 48)
sys.exit(1 if failed else 0)
