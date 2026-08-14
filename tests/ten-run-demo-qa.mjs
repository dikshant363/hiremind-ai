/**
 * HIREMIND AI — 10-Run Automated Demo Workflow Test Suite
 * Executes 10 complete end-to-end runs of the full intelligence loop:
 * LOAD DEMO -> ANALYZE -> MATCH -> GAPS -> INTERVIEW -> ADAPTIVE PIVOT -> READINESS -> ROADMAP -> DB PERSISTENCE
 */

const DEMO_JOB_TITLE = "AI/ML Software Engineer";

const DEMO_JOB = `AI/ML Software Engineer — Core Platform
Location: San Francisco, CA / Remote

About the Role:
We are looking for an AI/ML Software Engineer to join our Core Platform team. You will build and scale production ML inference pipelines, integrate Large Language Models into user-facing products, and design low-latency REST APIs.

Key Responsibilities:
- Design, deploy, and maintain production ML pipelines and LLM inference endpoints.
- Build robust, high-performance REST APIs using Python (FastAPI) and TypeScript.
- Architect scalable backend systems handling 100k+ concurrent requests.
- Optimize model inference latency using ONNX, TensorRT, or quantization.
- Implement CI/CD pipelines, automated testing, and Docker containerization.
- Collaborate with frontend engineers to deliver end-to-end features.

Required Qualifications:
- 3+ years experience with Python and ML frameworks (PyTorch or TensorFlow).
- Strong experience building REST APIs with FastAPI, Flask, or Django.
- Experience with Docker, containerization, and cloud deployment (AWS/GCP).
- Solid foundation in data structures, algorithms, and system design.
- Familiarity with SQL and database design (PostgreSQL).

Preferred Qualifications:
- Experience with LLM frameworks (LangChain, LlamaIndex, vLLM).
- Experience with vector databases (Pinecone, Qdrant, Chroma).
- Familiarity with TypeScript and modern frontend frameworks (Next.js/React).
- Contributions to open-source ML projects.`;

const DEMO_RESUME = `Aarav Sharma
San Francisco, CA • aarav.sharma@example.com • github.com/aaravsharma

SUMMARY
AI/ML Engineer with 3+ years of experience building production ML pipelines and LLM applications. Proficient in Python, PyTorch, FastAPI, and Docker with a track record of deploying models that serve millions of users.

EXPERIENCE

Machine Learning Engineer — NexusAI (2023 – Present)
- Designed and deployed an LLM-powered semantic search pipeline using PyTorch, FastAPI, and Qdrant, reducing search latency by 45% for 2M+ monthly active users.
- Built automated evaluation frameworks for model fine-tuning with 92% benchmark accuracy.
- Containerized 8 microservices with Docker and deployed via GitHub Actions CI/CD to AWS ECS.
- Collaborated with cross-functional teams to integrate generative AI features into core product.

Software Engineer — DataFlow Systems (2021 – 2023)
- Developed RESTful APIs in Python/FastAPI processing 50M+ daily events with 99.9% uptime.
- Optimized PostgreSQL database queries and connection pooling, cutting p95 latency by 30%.
- Implemented real-time data ingestion pipelines using Redis and Kafka.
- Mentored 3 junior engineers and established team coding standards and unit testing practices.

PROJECTS
- PromptForge: Open-source LLM prompt optimization toolkit with 1.2k GitHub stars (Python, PyTorch).
- FastEmbed: Lightweight text embedding microservice with ONNX runtime serving 500 req/sec.

EDUCATION
B.S. in Computer Science — University of California, Davis (2017 – 2021)

SKILLS
- Languages: Python, JavaScript, TypeScript, SQL
- Frameworks: PyTorch, FastAPI, Flask, React, Next.js, scikit-learn, Pandas, NumPy
- Tools & Cloud: Docker, Kubernetes, AWS, Git, CI/CD, Redis, PostgreSQL, Qdrant`;

const BASE_URL = "http://localhost:3000";

async function executeSingleRun(runNumber) {
  const tStart = performance.now();
  console.log(`\n==================================================`);
  console.log(`🚀 EXECUTION RUN #${runNumber} OF 10`);
  console.log(`==================================================`);

  // 1. Analyze
  const t0 = performance.now();
  const analyzeRes = await fetch(`${BASE_URL}/api/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      resumeText: DEMO_RESUME,
      jobTitle: DEMO_JOB_TITLE,
      jobText: DEMO_JOB,
      isDemo: true,
    }),
  });
  const analyzeLatency = Math.round(performance.now() - t0);
  if (analyzeRes.status !== 200) throw new Error(`Analyze failed with status ${analyzeRes.status}`);
  const analyzeData = await analyzeRes.json();
  const sessionId = analyzeData.id;
  console.log(`[Run ${runNumber}] 1. Analyze: 200 OK (${analyzeLatency}ms) — Session: ${sessionId}`);

  // 2. Start Interview
  const t1 = performance.now();
  const startRes = await fetch(`${BASE_URL}/api/interview/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, difficultyPreference: "auto" }),
  });
  const startLatency = Math.round(performance.now() - t1);
  if (startRes.status !== 200) throw new Error(`Interview start failed with status ${startRes.status}`);
  const startData = await startRes.json();
  const q1 = startData.interview?.questions?.[0];
  console.log(`[Run ${runNumber}] 2. Interview Start: 200 OK (${startLatency}ms) — Q1: "${q1.competency}"`);

  // 3. Submit Q1 with weak scalability answer -> Verify Adaptive Pivot
  const t2 = performance.now();
  const weakAnswer = "We will just build REST endpoints in FastAPI and wrap everything in Docker containers. That is all we need to get started.";
  const ans1Res = await fetch(`${BASE_URL}/api/interview/answer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId,
      questionId: q1.id,
      answer: weakAnswer,
      useDemoAnswer: false,
    }),
  });
  const ans1Latency = Math.round(performance.now() - t2);
  if (ans1Res.status !== 200) throw new Error(`Answer Q1 failed with status ${ans1Res.status}`);
  const ans1Data = await ans1Res.json();
  const q2 = ans1Data.interview?.questions?.[1];
  console.log(`[Run ${runNumber}] 3. Answer Q1 & Eval: 200 OK (${ans1Latency}ms) — Score: ${Math.round(ans1Data.evaluation?.overall * 100)}%`);

  // Verify Q2 is adaptive
  const isAdaptive = q2 && (
    q2.competency === "Scalability" ||
    q2.text?.toLowerCase().includes("scal") ||
    q2.text?.toLowerCase().includes("cach") ||
    ans1Data.evaluation?.nextFocus?.includes("Scalability")
  );
  if (!isAdaptive) throw new Error(`Run ${runNumber} did not trigger adaptive pivot to Scalability`);
  console.log(`[Run ${runNumber}] 4. Adaptive Pivot Confirmed: Q2 is "${q2.competency}" — "${q2.text.slice(0, 50)}..."`);

  // 4. Submit Q2 answer
  const t3 = performance.now();
  const strongAnswer = "We introduce an AWS ALB for load balancing, Redis cache-aside cluster for hot reads, and PostgreSQL read replicas with PgBouncer connection pooling.";
  const ans2Res = await fetch(`${BASE_URL}/api/interview/answer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId,
      questionId: q2.id,
      answer: strongAnswer,
      useDemoAnswer: false,
    }),
  });
  const ans2Latency = Math.round(performance.now() - t3);
  if (ans2Res.status !== 200) throw new Error(`Answer Q2 failed with status ${ans2Res.status}`);
  console.log(`[Run ${runNumber}] 5. Answer Q2 & Eval: 200 OK (${ans2Latency}ms)`);

  // 5. Readiness & Roadmap
  const t4 = performance.now();
  const readRes = await fetch(`${BASE_URL}/api/readiness`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId }),
  });
  const readLatency = Math.round(performance.now() - t4);
  if (readRes.status !== 200) throw new Error(`Readiness failed with status ${readRes.status}`);
  const readData = await readRes.json();
  console.log(`[Run ${runNumber}] 6. Readiness: 200 OK (${readLatency}ms) — Index: ${readData.readiness?.index}/100, Steps: ${readData.roadmap?.steps?.length}`);

  // 6. DB Persistence & Retrieval Verification
  const t5 = performance.now();
  const fetchRes = await fetch(`${BASE_URL}/api/session?id=${sessionId}`);
  const fetchLatency = Math.round(performance.now() - t5);
  if (fetchRes.status !== 200) throw new Error(`DB retrieval failed with status ${fetchRes.status}`);
  const fetchData = await fetchRes.json();
  if (fetchData.id !== sessionId || fetchData.readiness?.index === undefined) {
    throw new Error(`Data mismatch in DB for session ${sessionId}`);
  }
  console.log(`[Run ${runNumber}] 7. DB Persistence Verified (${fetchLatency}ms) — Candidate: ${fetchData.candidate?.name}, Readiness: ${fetchData.readiness?.index}`);

  const totalTime = Math.round(performance.now() - tStart);
  console.log(`✅ RUN #${runNumber} PASSED COMPLETELY in ${totalTime}ms`);
  return { runNumber, passed: true, totalTime };
}

async function runAll10() {
  console.log("==================================================");
  console.log("🔥 STARTING 10-RUN CONSECUTIVE DEMO WORKFLOW TEST");
  console.log("==================================================");

  const results = [];
  for (let i = 1; i <= 10; i++) {
    const res = await executeSingleRun(i);
    results.push(res);
  }

  console.log("\n==================================================");
  console.log("🏆 10-RUN DEMO TEST SUMMARY");
  console.log("==================================================");
  console.table(results);

  const allPassed = results.every(r => r.passed);
  console.log(`\nFinal Verdict: ${allPassed ? "10/10 SUCCESS (100% PASS RATE)" : "FAILURES DETECTED"}`);
  if (!allPassed) process.exit(1);
}

runAll10().catch(err => {
  console.error("FATAL RUN ERROR:", err);
  process.exit(1);
});
