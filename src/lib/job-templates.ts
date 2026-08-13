/**
 * HIREMIND AI — Custom Job Templates
 *
 * Quick-pick job description templates shown on the home view. Each template
 * ships with a realistic 300-500 word job description so users can pre-fill
 * the target role fields with one click and immediately run an analysis.
 *
 * Categories drive the icon-chip color of each picker card:
 *   Engineering → accent-blue
 *   Data        → warning
 *   Design      → chart-3
 *   Product     → success
 *   DevOps      → chart-5
 */

export type JobTemplateCategory =
  | "Engineering"
  | "Data"
  | "Design"
  | "Product"
  | "DevOps";

export interface JobTemplate {
  id: string;
  title: string;
  category: JobTemplateCategory;
  /** Lucide icon name (as a string) — resolved by the picker via ICON_MAP. */
  icon: string;
  /** One-line summary shown on the picker card. */
  summary: string;
  /** Pre-fills the "Target role" title input. */
  jobTitle: string;
  /** Pre-fills the "Job description" textarea. 300-500 words. */
  jobDescription: string;
  /** Human-readable hint, e.g. "~2 min to review". */
  estimatedTime: string;
}

export const JOB_TEMPLATES: JobTemplate[] = [
  // 1 --------------------------------------------------------------------------
  {
    id: "ai-ml-engineer",
    title: "AI/ML Software Engineer",
    category: "Engineering",
    icon: "BrainCircuit",
    summary:
      "Design, train and serve production ML systems for millions of users.",
    jobTitle: "AI/ML Software Engineer",
    estimatedTime: "~2 min to review",
    jobDescription: `AI/ML Software Engineer — Applied ML Platform team

We are a Series-C product company building an applied ML platform that powers search ranking, recommendations, and content understanding for over 12 million monthly active users. The ML Platform team owns the training, serving, and observability stack that every data scientist relies on to ship models to production.

What you'll do
- Design and implement scalable ML training and serving systems that handle millions of predictions per day with strict latency budgets.
- Build robust data pipelines, feature stores, and offline evaluation harnesses that let teams move from notebook to production safely.
- Deploy models behind low-latency, high-throughput APIs with canary rollouts, shadow traffic, and automatic rollback.
- Partner with platform and infrastructure teams on system architecture, capacity planning, and cost optimization for GPU/CPU fleets.
- Own model monitoring, drift detection, and on-call reliability for critical production models.
- Mentor engineers on ML engineering best practices and raise the bar for reproducibility and operational excellence.

What we're looking for
- Strong Python expertise with at least 3 years of production ML experience using PyTorch or TensorFlow.
- Deep understanding of system design and scalability patterns for high-traffic, latency-sensitive services.
- Experience designing REST and gRPC APIs and operating microservices in a cloud environment.
- Hands-on experience with Docker, Kubernetes, and at least one major cloud (AWS, GCP, or Azure).
- Solid SQL and data modeling skills; familiarity with columnar warehouses (BigQuery, Snowflake, Redshift).
- Strong communication skills and a track record of cross-functional collaboration with product, data, and infra teams.
- Comfortable with CI/CD for ML — model registries, experiment tracking (MLflow / Weights & Biases), and reproducible builds.
- Bachelor's degree in Computer Science, Engineering, or equivalent practical experience.

Nice to have
- Experience with Kubernetes operators and distributed training (Ray, Horovod, or torchrun).
- Familiarity with caching, load balancing, and fault-tolerance patterns for inference workloads.
- MLOps experience including drift detection, A/B testing, and shadow deployments.
- Background in NLP, deep learning, or recommender systems.`,
  },

  // 2 --------------------------------------------------------------------------
  {
    id: "senior-fullstack-engineer",
    title: "Senior Full-Stack Engineer",
    category: "Engineering",
    icon: "Layers",
    summary:
      "Own features end-to-end across React frontends and Node/Python backends.",
    jobTitle: "Senior Full-Stack Engineer",
    estimatedTime: "~2 min to review",
    jobDescription: `Senior Full-Stack Engineer — Growth & Billing pod

We are a profitable B2B SaaS company serving 8,000+ customers across 40 countries. The Growth & Billing pod owns the subscriber lifecycle: signup, plan selection, usage-based billing, dunning, and retention. You will ship features that directly move revenue and shape how customers experience our product.

What you'll do
- Architect and ship end-to-end features spanning a React/TypeScript frontend and a Node.js (or Python) backend.
- Design resilient APIs and event-driven workflows that integrate with billing providers (Stripe, Lemon Squeezy) and CRM tools.
- Own feature quality from spec to production: design review, automated tests, observability dashboards, and progressive rollouts.
- Drive technical decisions on state management, caching, and data modeling for high-read customer-facing surfaces.
- Collaborate with product, design, and revenue operations to translate ambiguous business problems into clean technical solutions.
- Mentor mid-level engineers through code review, pairing, and design docs.

What we're looking for
- 5+ years of full-stack engineering experience with at least one modern JavaScript framework (React, Next.js, or Vue).
- Production experience with TypeScript and a backend language (Node.js, Python, or Go).
- Strong understanding of relational databases (PostgreSQL preferred) and schema design.
- Experience designing and operating REST or GraphQL APIs with thoughtful versioning and error semantics.
- Familiarity with cloud platforms (AWS, GCP, or Azure) and infrastructure-as-code (Terraform or Pulumi).
- Comfortable with CI/CD pipelines, feature flags, and progressive delivery.
- Excellent communication skills and the ability to lead ambiguous projects end-to-end.
- Experience with billing, payments, or fintech domain is a strong plus.

Nice to have
- Experience with usage-based metering and event-sourced billing systems.
- Familiarity with Stripe Billing, Stripe Tax, or comparable subscription platforms.
- Prior exposure to A/B testing, growth experimentation, or CRO tooling.
- Open-source contributions or technical writing on full-stack topics.`,
  },

  // 3 --------------------------------------------------------------------------
  {
    id: "backend-engineer",
    title: "Backend Engineer",
    category: "Engineering",
    icon: "Server",
    summary:
      "Build high-throughput APIs and core services that power the product.",
    jobTitle: "Backend Engineer",
    estimatedTime: "~2 min to review",
    jobDescription: `Backend Engineer — Core Services team

We are a rapidly scaling marketplace handling millions of transactions per week. The Core Services team owns the APIs, identity, payments, and notification services that every product surface depends on. Reliability, correctness, and clean abstractions are what we optimize for.

What you'll do
- Design, build, and operate distributed backend services that serve high-throughput, low-latency traffic.
- Own API contracts end-to-end: schema design, versioning, backwards compatibility, and developer documentation.
- Implement robust data models on PostgreSQL with thoughtful indexing, migrations, and partitioning for scale.
- Build idempotent, retry-safe workflows for payments, notifications, and third-party integrations.
- Instrument services with structured logging, metrics, and tracing; participate in on-call rotation.
- Drive incident response and postmortems that produce durable fixes, not just patches.

What we're looking for
- 4+ years of backend engineering experience with Python, Go, or Node.js in production.
- Strong grasp of relational database design, query optimization, and transactional integrity on PostgreSQL.
- Experience designing RESTful and gRPC APIs with thoughtful error handling and observability.
- Hands-on experience with message brokers (Kafka, RabbitMQ, or SQS) and event-driven architectures.
- Solid understanding of caching (Redis), queueing, and backpressure patterns.
- Familiarity with Docker, Kubernetes, and at least one major cloud platform.
- Strong testing discipline: unit, integration, and contract testing.
- Excellent communication and a collaborative, low-ego approach to code review.

Nice to have
- Experience with payment systems (Stripe, Adyen) and PCI-aware design.
- Familiarity with service mesh tooling and distributed tracing (OpenTelemetry).
- Background in fintech, marketplaces, or other high-stakes transactional systems.
- Contributions to internal platform libraries or shared service templates.`,
  },

  // 4 --------------------------------------------------------------------------
  {
    id: "devops-platform-engineer",
    title: "DevOps / Platform Engineer",
    category: "DevOps",
    icon: "GitBranch",
    summary:
      "Own the internal developer platform, CI/CD, and cloud reliability.",
    jobTitle: "DevOps / Platform Engineer",
    estimatedTime: "~2 min to review",
    jobDescription: `DevOps / Platform Engineer — Infrastructure team

We are a Series-B company building developer tooling used by 30,000 engineers worldwide. Our internal platform team owns the CI/CD, observability, and cloud infrastructure that lets product engineers ship safely dozens of times per day. You will design the abstractions that make every team faster.

What you'll do
- Build and operate a self-service internal developer platform on Kubernetes with golden-path templates.
- Own CI/CD pipelines (GitHub Actions, Argo CD) used by 40+ engineering teams.
- Design infrastructure-as-code modules (Terraform) for repeatable, secure, multi-environment deployments.
- Implement observability standards: metrics, logs, and traces using OpenTelemetry, Prometheus, and Grafana.
- Drive reliability programs — SLOs, error budgets, capacity planning, and chaos exercises.
- Partner with security on posture management, secret rotation, and least-privilege access control.

What we're looking for
- 4+ years of experience in DevOps, SRE, or platform engineering roles.
- Deep Kubernetes experience — Helm, operators, autoscaling, networking, and policy.
- Production experience with at least one major cloud (AWS, GCP, or Azure) and Terraform.
- Strong scripting skills in Bash, Python, or Go.
- Experience operating CI/CD at scale (GitHub Actions, GitLab CI, Jenkins, or Buildkite).
- Solid understanding of observability stacks (Prometheus, Grafana, Loki, Tempo, or Datadog).
- Familiarity with security best practices: SBOMs, image scanning, OIDC, and zero-trust networking.
- Excellent written communication and a service-oriented mindset toward internal customers.

Nice to have
- Experience with service mesh (Istio, Linkerd) and progressive delivery (Argo Rollouts, Flagger).
- Familiarity with FinOps and cost optimization on cloud infrastructure.
- Contributions to CNCF projects or open-source DevOps tooling.
- Background in multi-region, active-active deployments.`,
  },

  // 5 --------------------------------------------------------------------------
  {
    id: "data-engineer",
    title: "Data Engineer",
    category: "Data",
    icon: "Database",
    summary:
      "Build the data lakehouse, ingestion pipelines, and analytics warehouse.",
    jobTitle: "Data Engineer",
    estimatedTime: "~2 min to review",
    jobDescription: `Data Engineer — Analytics Platform team

We are a health-tech company generating billions of events per month across patient journeys, billing, and clinical operations. The Analytics Platform team owns the lakehouse, ingestion pipelines, and warehouse that power every dashboard, ML model, and compliance report the company relies on.

What you'll do
- Design and operate batch and streaming ingestion pipelines using Airflow, dbt, and Kafka.
- Build and maintain the analytics warehouse (Snowflake or BigQuery) — modeling, partitioning, and cost optimization.
- Implement data contracts, schema registries, and lineage tracking across hundreds of datasets.
- Partner with analytics and ML teams to deliver trusted, well-documented datasets.
- Drive data quality programs — freshness checks, anomaly detection, and incident response for broken pipelines.
- Own platform reliability: observability, alerting, and on-call rotation for critical data flows.

What we're looking for
- 4+ years of data engineering experience building production data platforms.
- Strong SQL skills and experience with dbt for transformation layer ownership.
- Production experience with at least one cloud warehouse (Snowflake, BigQuery, or Redshift).
- Hands-on experience with orchestration tools (Airflow, Dagster, or Prefect).
- Familiarity with streaming systems (Kafka, Kinesis, or Pub/Sub) and stream processing (Flink, Spark Structured Streaming).
- Programming proficiency in Python; familiarity with Scala or Java is a plus.
- Solid understanding of data modeling — Kimball, Data Vault, or event-sourced models.
- Excellent communication and a service mindset toward downstream data consumers.

Nice to have
- Experience with lakehouse architectures (Iceberg, Delta Lake, or Hudi).
- Familiarity with data catalogs and lineage tools (Amundsen, DataHub, or OpenMetadata).
- Background in HIPAA, SOC 2, or other regulated data environments.
- Contributions to open-source data tooling.`,
  },

  // 6 --------------------------------------------------------------------------
  {
    id: "product-manager",
    title: "Product Manager",
    category: "Product",
    icon: "Compass",
    summary:
      "Set strategy, own the roadmap, and ship outcomes customers love.",
    jobTitle: "Product Manager",
    estimatedTime: "~2 min to review",
    jobDescription: `Product Manager — Engagement pod

We are a consumer fintech app with 6 million monthly active users. The Engagement pod owns the daily-use surface: home feed, notifications, and habit-forming loops that help customers reach their financial goals. You will be the connective tissue between user research, design, and engineering.

What you'll do
- Own the strategy, roadmap, and outcomes for the Engagement pod in close partnership with engineering and design.
- Translate user research, support signals, and analytics into crisp problem statements and prioritized bets.
- Write clear product specs with measurable success criteria and ship features against them.
- Run experiments (A/B tests) end-to-end — hypothesis, design, rollout, analysis, and decision.
- Align stakeholders across growth, marketing, legal, and executive leadership on trade-offs and sequencing.
- Foster a strong discovery cadence — interviews, prototype testing, and competitive analysis.

What we're looking for
- 4+ years of product management experience on consumer or high-growth B2C products.
- Demonstrated ownership of roadmap decisions that moved core engagement or retention metrics.
- Strong analytical skills — comfortable writing SQL queries and reading experiment results.
- Experience running A/B tests and making decisions under uncertainty with incomplete data.
- Excellent written and verbal communication; able to influence without authority.
- Track record of shipping features end-to-end with cross-functional engineering and design teams.
- Customer obsession — frequent, direct contact with users is a must.
- Bachelor's degree or equivalent practical experience.

Nice to have
- Experience in fintech, health, or other regulated consumer verticals.
- Familiarity with behavioral economics and habit-forming product patterns.
- Background in growth, lifecycle marketing, or push/notification platforms.
- Prior experience as an engineer, designer, or analyst.`,
  },

  // 7 --------------------------------------------------------------------------
  {
    id: "frontend-engineer",
    title: "Frontend Engineer",
    category: "Engineering",
    icon: "Layout",
    summary:
      "Craft accessible, performant React interfaces with great UX.",
    jobTitle: "Frontend Engineer",
    estimatedTime: "~2 min to review",
    jobDescription: `Frontend Engineer — Design Systems team

We are a design-led productivity tool used by 200,000+ knowledge workers. The Design Systems team owns the component library, accessibility standards, and performance budget that every product engineer builds on. You will shape the foundation that ships polished experiences across web and desktop.

What you'll do
- Build and maintain a React/TypeScript component library consumed by 15+ product teams.
- Drive accessibility (WCAG 2.2 AA) across components — keyboard navigation, screen readers, focus management.
- Own frontend performance budgets — bundle size, runtime, and Core Web Vitals — and instrument them end-to-end.
- Partner with designers on tokens, theming, and dark mode parity; ship design updates safely.
- Build developer-facing tooling: Storybook, visual regression, and migration codemods.
- Mentor product engineers on frontend best practices through pairing, docs, and code review.

What we're looking for
- 3+ years of frontend engineering experience with React and TypeScript in production.
- Deep understanding of modern CSS, accessibility, and responsive design.
- Experience building and maintaining a design system or shared component library.
- Familiarity with build tooling (Vite, esbuild, or webpack) and frontend performance optimization.
- Solid testing discipline — unit (Vitest/Jest), component (Testing Library), and visual regression.
- Experience with Storybook and component documentation.
- Strong communication skills and a collaborative approach to API design.
- Care about details — micro-interactions, motion, and the polish that distinguishes great products.

Nice to have
- Familiarity with Framer Motion, GSAP, or other animation libraries.
- Experience with codemods (jscodeshift) and large-scale refactor automation.
- Contributions to open-source design systems or frontend libraries.
- Background in design or prior experience as a designer.`,
  },

  // 8 --------------------------------------------------------------------------
  {
    id: "mobile-engineer",
    title: "Mobile Engineer (iOS/Android)",
    category: "Engineering",
    icon: "Smartphone",
    summary:
      "Ship native-quality iOS and Android experiences with React Native.",
    jobTitle: "Mobile Engineer (iOS/Android)",
    estimatedTime: "~2 min to review",
    jobDescription: `Mobile Engineer (iOS/Android) — Mobile Experience team

We are a health and fitness app with 4 million active mobile users across 30 countries. The Mobile Experience team owns the React Native app and the native bridges that connect it to platform health APIs, push notifications, and offline-first data sync. You will ship features that millions of people open every morning.

What you'll do
- Build and ship new mobile features in React Native (TypeScript) for iOS and Android.
- Own native modules and bridges in Swift (iOS) and Kotlin (Android) when JavaScript can't reach.
- Implement offline-first sync, background tasks, and push notification journeys that work reliably across devices.
- Optimize app performance — startup time, list scrolling, memory footprint, and crash rate.
- Partner with design on motion, haptics, and platform-specific UX that feels native on each OS.
- Drive release engineering — TestFlight, Play Internal Testing, phased rollouts, and crash monitoring.

What we're looking for
- 3+ years of mobile engineering experience shipping production iOS or Android apps.
- Strong React Native and TypeScript skills with at least one shipped consumer app.
- Familiarity with native iOS (Swift, UIKit/SwiftUI) and Android (Kotlin, Jetpack Compose) development.
- Experience with offline-first architecture, local databases (SQLite, WatermelonDB, or Realm), and background sync.
- Solid understanding of mobile performance profiling — Instruments, Xcode Organizer, Android Studio Profiler.
- Hands-on experience with CI/CD for mobile (Fastlane, Bitrise, or GitHub Actions).
- Strong testing discipline — unit, integration, and end-to-end on mobile.
- Excellent communication and collaboration with cross-functional product teams.

Nice to have
- Experience with HealthKit, Google Fit, or other platform health APIs.
- Familiarity with push notifications, deep linking, and in-app messaging platforms.
- Background in AR, camera, or real-time video features.
- Contributions to React Native open-source community or libraries.`,
  },
];
