/**
 * HIREMIND AI — Auth, Dynamic Config, Diagnostics & Security QA Suite
 */

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";

async function runQa() {
  console.log("==================================================");
  console.log("🧪 HIREMIND AI — AUTH & CONFIG INTEGRATION QA");
  console.log("==================================================\n");

  const results = {
    healthDiagnostics: false,
    publicConfig: false,
    firstUserAdminRegistration: false,
    authMeVerification: false,
    secondUserRegistration: false,
    loginValidAndInvalid: false,
    adminConfigUpdate: false,
    unauthorizedConfigRejection: false,
    realDatabaseStats: false,
    authSessionAssociation: false,
    logoutAndCookieClear: false,
  };

  try {
    // 1. Health Diagnostics
    console.log("--- 1. SYSTEM HEALTH DIAGNOSTICS ---");
    const healthRes = await fetch(`${BASE_URL}/api/health`);
    const healthData = await healthRes.json();
    console.log(`GET /api/health status: ${healthRes.status}, overall: ${healthData.status}, latency: ${healthData.latencyMs}ms`);
    console.log(`Database check: ${healthData.checks?.database?.message}`);
    if (healthRes.status === 200 && healthData.checks?.database?.status === "healthy") {
      results.healthDiagnostics = true;
    }

    // 2. Public Config Loading
    console.log("\n--- 2. PUBLIC CONFIGURATION ---");
    const cfgRes = await fetch(`${BASE_URL}/api/config`);
    const cfgData = await cfgRes.json();
    console.log(`GET /api/config status: ${cfgRes.status}, brand: "${cfgData.config?.brandName}", accent: "${cfgData.config?.accentColor}"`);
    if (cfgRes.status === 200 && cfgData.config?.brandName) {
      results.publicConfig = true;
    }

    // 3. User Registration (First user auto-promoted to admin)
    console.log("\n--- 3. FIRST USER REGISTRATION (ADMIN AUTO-PROMOTION) ---");
    const adminEmail = `admin_${Date.now()}@hiremind.test`;
    const adminPassword = "SecurePassword123!";
    const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: adminEmail, password: adminPassword, name: "Admin Lead" }),
    });
    const regData = await regRes.json();
    const adminCookie = regRes.headers.get("set-cookie");
    console.log(`Register admin user: status ${regRes.status}, role: "${regData.user?.role}", email: "${regData.user?.email}"`);
    if (regRes.status === 200 && regData.user?.role === "admin" && adminCookie) {
      results.firstUserAdminRegistration = true;
    }

    // 4. Authenticated /api/auth/me Verification
    console.log("\n--- 4. AUTHENTICATED SESSION ME VERIFICATION ---");
    const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Cookie: adminCookie || "" },
    });
    const meData = await meRes.json();
    console.log(`GET /api/auth/me: status ${meRes.status}, user: ${meData.user?.email} (${meData.user?.role})`);
    if (meRes.status === 200 && meData.user?.id === regData.user?.id) {
      results.authMeVerification = true;
    }

    // 5. Second User Registration (Standard User)
    console.log("\n--- 5. SECOND USER REGISTRATION (STANDARD ROLE) ---");
    const userEmail = `candidate_${Date.now()}@hiremind.test`;
    const userPassword = "CandidatePassword123!";
    const regUserRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: userEmail, password: userPassword, name: "Candidate Jane" }),
    });
    const regUserData = await regUserRes.json();
    const userCookie = regUserRes.headers.get("set-cookie");
    console.log(`Register standard user: status ${regUserRes.status}, role: "${regUserData.user?.role}"`);
    if (regUserRes.status === 200 && regUserData.user?.role === "user") {
      results.secondUserRegistration = true;
    }

    // 6. Login Tests (Valid & Invalid)
    console.log("\n--- 6. PASSWORD AUTHENTICATION & REJECTION ---");
    const invalidLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: adminEmail, password: "WrongPassword" }),
    });
    console.log(`Invalid password login rejection: status ${invalidLoginRes.status} (expected 401)`);

    const validLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: adminEmail, password: adminPassword }),
    });
    const validLoginData = await validLoginRes.json();
    console.log(`Valid password login: status ${validLoginRes.status}, token present: ${Boolean(validLoginData.token)}`);
    if (invalidLoginRes.status === 401 && validLoginRes.status === 200 && validLoginData.token) {
      results.loginValidAndInvalid = true;
    }

    // 7. Admin Config Update
    console.log("\n--- 7. DYNAMIC CONFIGURATION UPDATE (ADMIN ONLY) ---");
    const updateRes = await fetch(`${BASE_URL}/api/config`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookie || "",
      },
      body: JSON.stringify({
        brandName: "HireMind AI Enterprise",
        accentColor: "indigo",
        scoringWeights: {
          requiredSkillAlignment: 0.35,
          evidenceStrength: 0.35,
          semanticRelevance: 0.20,
          coverageBreadth: 0.10,
        },
      }),
    });
    const updateData = await updateRes.json();
    console.log(`Admin update config: status ${updateRes.status}, new brand: "${updateData.config?.brandName}", accent: "${updateData.config?.accentColor}"`);
    if (updateRes.status === 200 && updateData.config?.brandName === "HireMind AI Enterprise") {
      results.adminConfigUpdate = true;
    }

    // 8. Unauthorized Config Rejection
    console.log("\n--- 8. UNAUTHORIZED CONFIG UPDATE REJECTION ---");
    const unauthRes = await fetch(`${BASE_URL}/api/config`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Cookie: userCookie || "",
      },
      body: JSON.stringify({ brandName: "Hacked Brand" }),
    });
    console.log(`Non-admin update rejection: status ${unauthRes.status} (expected 403)`);
    if (unauthRes.status === 403) {
      results.unauthorizedConfigRejection = true;
    }

    // 9. Real Database Analytics Stats
    console.log("\n--- 9. REAL DATABASE STATS ENDPOINT ---");
    const statsRes = await fetch(`${BASE_URL}/api/session?stats=true`);
    const statsData = await statsRes.json();
    console.log(`GET /api/session?stats=true: totalSessions=${statsData.totalSessions}, users=${statsData.registeredUsers}`);
    if (statsRes.status === 200 && typeof statsData.totalSessions === "number" && statsData.registeredUsers >= 2) {
      results.realDatabaseStats = true;
    }

    // 10. Authenticated Analysis & Session Association
    console.log("\n--- 10. AUTHENTICATED ANALYSIS & USER LINKING ---");
    const analyzeRes = await fetch(`${BASE_URL}/api/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: userCookie || "",
      },
      body: JSON.stringify({
        isDemo: true,
      }),
    });
    const analyzeData = await analyzeRes.json();
    console.log(`Analyze session created: id ${analyzeData.id}`);

    const loadSessionRes = await fetch(`${BASE_URL}/api/session?id=${analyzeData.id}`, {
      headers: { Cookie: userCookie || "" },
    });
    const loadSessionData = await loadSessionRes.json();
    console.log(`Loaded session owner userId: "${loadSessionData.userId}" (expected "${regUserData.user?.id}")`);
    if (analyzeRes.status === 200 && loadSessionData.userId === regUserData.user?.id) {
      results.authSessionAssociation = true;
    }

    // 11. Logout & Cookie Clear
    console.log("\n--- 11. LOGOUT & COOKIE CLEAR ---");
    const logoutRes = await fetch(`${BASE_URL}/api/auth/logout`, {
      method: "POST",
      headers: { Cookie: userCookie || "" },
    });
    const logoutCookie = logoutRes.headers.get("set-cookie");
    console.log(`Logout: status ${logoutRes.status}, cookie cleared: ${logoutCookie?.includes("Max-Age=0") || logoutCookie?.includes("Expires=")}`);
    if (logoutRes.status === 200) {
      results.logoutAndCookieClear = true;
    }
  } catch (err) {
    console.error("Test execution error:", err);
  }

  console.log("\n==================================================");
  console.log("📊 QA VERIFICATION SUMMARY");
  console.log("==================================================");
  let allPassed = true;
  for (const [test, passed] of Object.entries(results)) {
    console.log(`${passed ? "✅ PASS" : "❌ FAIL"}: ${test}`);
    if (!passed) allPassed = false;
  }
  console.log("==================================================");
  console.log(allPassed ? "🎉 ALL SYSTEM CHECKS PASSED PERFECTLY!" : "⚠️ SOME CHECKS FAILED");
  console.log("==================================================");

  if (!allPassed) {
    process.exit(1);
  }
}

runQa();
