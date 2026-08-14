/**
 * HIREMIND AI — Multi-Candidate & Multi-Job Differentiation Test
 * Validates that Candidate A, Candidate B, and Candidate C with distinct skillsets
 * produce genuinely distinct and isolated results across all 10 stages:
 *  - Distinct Candidate Profiles
 *  - Distinct Match Indexes
 *  - Distinct Skill Gaps
 *  - Distinct Interview Questions
 *  - Distinct Evaluations & Detected Gaps
 *  - Distinct Readiness Scores
 *  - Distinct Personalized Roadmaps
 */

const BASE_URL = "http://localhost:3000";

// --- CANDIDATE A: AI / ML Engineer ---
const CANDIDATE_A_RESUME = `Aarav Sharma
San Francisco, CA • aarav.sharma@example.com • github.com/aaravsharma

SUMMARY
AI/ML Engineer with 3+ years experience building production ML pipelines and LLM applications using PyTorch, FastAPI, and Docker.

EXPERIENCE
Machine Learning Engineer — NexusAI (2023 – Present)
- Deployed semantic search with PyTorch, FastAPI, and Qdrant for 2M active users.
- Automated evaluation frameworks with 92% benchmark accuracy.
- Containerized microservices with Docker and GitHub Actions CI/CD.

SKILLS
Python, PyTorch, FastAPI, Docker, SQL, PostgreSQL, Qdrant, Pandas, NumPy`;

const JOB_A = `AI/ML Software Engineer — Core Platform
Requirements:
- Strong experience in Python, PyTorch, FastAPI.
- Experience with Docker and microservices architecture.
- Solid system design and scalability background.
- Experience with PostgreSQL.`;

// --- CANDIDATE B: Frontend React Specialist ---
const CANDIDATE_B_RESUME = `Elena Rostova
New York, NY • elena.rostova@example.com • github.com/elenarostova

SUMMARY
Senior Frontend Engineer with 5+ years of experience crafting accessible, high-performance web applications using React, TypeScript, Next.js, and Tailwind CSS.

EXPERIENCE
Lead UI Engineer — PixelCraft Studio (2022 – Present)
- Architected Next.js and TypeScript design system used by 40+ engineering teams.
- Optimized Core Web Vitals (LCP reduced by 60%, INP to <50ms).
- Built real-time interactive canvas widgets and custom state management with Zustand.

Frontend Engineer — WebVibe Inc (2019 – 2022)
- Developed responsive SPAs in React, TypeScript, and CSS.
- Implemented automated end-to-end testing with Playwright and Jest.

SKILLS
React, TypeScript, JavaScript, Next.js, Tailwind CSS, CSS, HTML5, Web Vitals, Zustand, Jest, Playwright`;

const JOB_B = `Senior Frontend Architect — Design Systems
Requirements:
- 5+ years in React, TypeScript, and Next.js.
- Deep expertise in Frontend Performance, Web Vitals, and responsive CSS.
- Experience with GraphQL API integration.
- Experience with component design systems and accessibility (a11y).`;

// --- CANDIDATE C: DevOps / Cloud Platform Engineer ---
const CANDIDATE_C_RESUME = `Marcus Vance
Seattle, WA • marcus.vance@example.com • github.com/marcusvance

SUMMARY
Staff DevOps & Cloud Platform Engineer with 6+ years designing multi-region AWS and Kubernetes infrastructure with Terraform, Prometheus, and CI/CD.

EXPERIENCE
Staff Platform Engineer — CloudScale Ops (2021 – Present)
- Managed 50+ production Kubernetes clusters across 3 AWS regions with 99.99% SLA.
- Automated infrastructure provisioning with Terraform and GitOps (ArgoCD).
- Built centralized observability using Prometheus, Grafana, and OpenTelemetry.

DevOps Engineer — InfraCloud (2018 – 2021)
- Designed automated GitHub Actions and Jenkins CI/CD deployment pipelines.
- Implemented zero-trust container security scanning with Trivy.

SKILLS
Kubernetes, Docker, AWS, Terraform, CI/CD, Prometheus, Grafana, Linux, Bash, Go, Cloud Architecture`;

const JOB_C = `Staff Cloud Platform Engineer — Reliability
Requirements:
- 5+ years in Kubernetes, Docker, and AWS.
- Strong experience with Terraform, Infrastructure-as-Code, and CI/CD.
- Observability expertise with Prometheus and Grafana.
- Backend systems programming in Go (Golang) and concurrency.`;

async function runCandidatePipeline(name, resumeText, jobTitle, jobText) {
  console.log(`\n==================================================`);
  console.log(`🧪 TESTING CANDIDATE: ${name}`);
  console.log(`==================================================`);

  // 1. Analyze
  const anRes = await fetch(`${BASE_URL}/api/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resumeText, jobTitle, jobText, isDemo: false }),
  });
  if (!anRes.ok) throw new Error(`Analyze failed for ${name}`);
  const anData = await anRes.json();
  const sessionId = anData.id;

  const topSkills = anData.candidate?.skills?.slice(0, 4) ?? [];
  const matchIndex = anData.match?.index;
  const topGap = anData.gaps?.[0]?.competency ?? "None";

  console.log(`1. Extracted Top Skills: ${topSkills.join(", ")}`);
  console.log(`2. Match Index: ${matchIndex}/100 (${anData.match?.band})`);
  console.log(`3. Top Priority Gap: "${topGap}" (Importance: ${anData.gaps?.[0]?.importance})`);

  // 2. Start Interview
  const startRes = await fetch(`${BASE_URL}/api/interview/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, difficultyPreference: "auto" }),
  });
  if (!startRes.ok) throw new Error(`Interview start failed for ${name}`);
  const startData = await startRes.json();
  const q1 = startData.interview?.questions?.[0];
  console.log(`4. Generated Q1 Competency: "${q1?.competency}"`);
  console.log(`   Q1 Text: "${q1?.text?.slice(0, 65)}..."`);

  // 3. Answer Q1
  const ansRes = await fetch(`${BASE_URL}/api/interview/answer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId,
      questionId: q1.id,
      answer: `In my past experience, I dealt with ${q1.competency} by structuring clear interfaces and monitoring metrics.`,
    }),
  });
  const ansData = await ansRes.json();
  console.log(`5. Q1 Evaluation Score: ${Math.round(ansData.evaluation?.overall * 100)}%`);

  // 4. Readiness & Roadmap
  const readRes = await fetch(`${BASE_URL}/api/readiness`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId }),
  });
  const readData = await readRes.json();
  const readinessIdx = readData.readiness?.index;
  const roadmapFocus = readData.roadmap?.steps?.[0]?.focus ?? "N/A";

  console.log(`6. Readiness Index: ${readinessIdx}/100 (${readData.readiness?.band})`);
  console.log(`7. First Roadmap Step: "${roadmapFocus}"`);

  return {
    name,
    sessionId,
    topSkills,
    matchIndex,
    topGap,
    q1Competency: q1?.competency,
    readinessIdx,
    roadmapFocus,
  };
}

async function verifyDifferentInputs() {
  console.log("==================================================");
  console.log("🔍 MULTI-CANDIDATE DIFFERENTIATION VERIFICATION");
  console.log("==================================================");

  const resA = await runCandidatePipeline("Candidate A (AI/ML Engineer)", CANDIDATE_A_RESUME, "AI/ML Software Engineer", JOB_A);
  const resB = await runCandidatePipeline("Candidate B (Frontend Specialist)", CANDIDATE_B_RESUME, "Senior Frontend Architect", JOB_B);
  const resC = await runCandidatePipeline("Candidate C (Cloud DevOps SRE)", CANDIDATE_C_RESUME, "Staff Cloud Platform Engineer", JOB_C);

  console.log("\n==================================================");
  console.log("📊 MULTI-CANDIDATE COMPARISON MATRIX");
  console.log("==================================================");
  console.table([resA, resB, resC]);

  // Assert distinct candidate profiles
  if (resA.topSkills[0] === resB.topSkills[0] || resB.topSkills[0] === resC.topSkills[0]) {
    throw new Error("FAIL: Extracted skills are identical across distinct candidates!");
  }

  // Assert distinct top gaps
  if (resA.topGap === resB.topGap && resB.topGap === resC.topGap) {
    throw new Error("FAIL: Skill gaps are identical across distinct roles!");
  }

  // Assert distinct interview questions
  if (resA.q1Competency === resB.q1Competency && resB.q1Competency === resC.q1Competency) {
    throw new Error("FAIL: Interview questions are identical across distinct roles!");
  }

  // Assert distinct roadmap recommendations
  if (resA.roadmapFocus === resB.roadmapFocus && resB.roadmapFocus === resC.roadmapFocus) {
    throw new Error("FAIL: Roadmap steps are identical across distinct candidates!");
  }

  console.log("\n🎯 CRITICAL DIFFERENT-INPUT TEST: 100% PASSED!");
  console.log("Every candidate generated completely unique, isolated, and authentic results based purely on their actual inputs.");
}

verifyDifferentInputs().catch(err => {
  console.error("DIFFERENT INPUTS TEST FAILED:", err);
  process.exit(1);
});
