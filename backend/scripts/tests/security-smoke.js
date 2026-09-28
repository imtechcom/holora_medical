// Run only against a disposable local stack; creates a synthetic patient account.
const assert = require("node:assert/strict");
const crypto = require("node:crypto");

async function main() {
  const base = process.env.TEST_API_URL;
  assert(base, "Set TEST_API_URL to a disposable local backend");
  assert(["localhost", "127.0.0.1"].includes(new URL(base).hostname));
  const adminPaths = ["/users", "/roles", "/permissions", "/patients", "/api/recurring-appointments/1"];
  const paths = [...adminPaths, "/api/emr/1"];
  for (const path of paths) {
    const response = await fetch(`${base}${path}`);
    assert.equal(response.status, 401, `Anonymous access: ${path}`);
  }
  const suffix = crypto.randomBytes(6).toString("hex");
  const email = `security-${suffix}@example.test`;
  const password = crypto.randomBytes(24).toString("hex");
  const post = (path, body) => fetch(`${base}${path}`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const registration = await post("/auth/register", {
    full_name: "Synthetic Security Test", username: `test_${suffix}`,
    email, password, account_type: "patient",
  });
  assert.equal(registration.status, 201, await registration.text());
  const login = await post("/auth/login", { email, password });
  assert.equal(login.status, 200);
  const { token } = await login.json();
  const headers = { Authorization: `Bearer ${token}` };
  for (const path of adminPaths) {
    const response = await fetch(`${base}${path}`, { headers });
    assert.equal(response.status, 403, `Patient administrative access: ${path}`);
  }
  assert.equal((await fetch(`${base}/patients/me`, { headers })).status, 200);
  assert.equal((await post("/specialties", { name: "unauthorized" })).status, 401);
  const cors = await fetch(`${base}/api/emr/1`, {
    method: "OPTIONS", headers: {
      Origin: process.env.TEST_ORIGIN || "http://localhost:5173",
      "Access-Control-Request-Method": "POST",
    },
  });
  assert.equal(cors.status, 204);
  console.log("PASS: anonymous denial, patient denial, registration/login/profile, CORS");
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; });
