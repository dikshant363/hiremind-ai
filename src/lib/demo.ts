/**
 * HIREMIND AI — Deterministic Demo Data
 *
 * The demo must be reproducible. This candidate + job are designed so that:
 *   - The candidate has strong ML + backend evidence
 *   - But limited System Design depth (specifically Scalability)
 *   - Which becomes the highest-impact gap
 *   - Which drives the first adaptive question (System Design)
 *   - The demo answer shows limited Scalability depth
 *   - Which makes the NEXT question target Scalability (the WOW moment)
 */

export const DEMO_RESUME = `Aarav Sharma
AI/ML Software Engineer

SUMMARY
Machine learning engineer with 4 years of experience building production ML pipelines and backend services. Strong in Python, PyTorch and deploying models with FastAPI. Comfortable with data engineering and model monitoring.

EXPERIENCE
ML Engineer — Brightwave Labs (2022 - Present)
- Built recommendation models in Python using PyTorch and scikit-learn, deployed via FastAPI.
- Trained and evaluated deep learning models for text classification; improved F1 by 14%.
- Owned end-to-end ML pipelines: data ingestion with Pandas, feature engineering, training, and serving.
- Set up CI/CD pipelines to package models with Docker and deploy to AWS.

Software Engineer — Nimbus Tech (2020 - 2022)
- Developed REST APIs in Python using FastAPI for internal analytics services.
- Wrote SQL queries against PostgreSQL for reporting; built basic dashboards.
- Containerized services with Docker and ran them on AWS EC2.

SKILLS
Python, PyTorch, TensorFlow, scikit-learn, Pandas, NumPy, FastAPI, REST APIs, SQL, PostgreSQL,
Docker, AWS, Machine Learning, Deep Learning, NLP, Feature Engineering, Git, CI/CD

PROJECTS
Resume Tagger — fine-tuned transformer for tagging resumes; deployed with FastAPI.
Pitch Classifier — CNN audio classifier trained on spectrograms; achieved 91% accuracy.

EDUCATION
B.Tech in Computer Science — IIIT Hyderabad

CERTIFICATIONS
AWS Certified Developer Associate`;

export const DEMO_JOB_TITLE = "AI/ML Software Engineer";

export const DEMO_JOB = `AI/ML Software Engineer

About the role:
We are looking for an AI/ML Software Engineer to design, build and scale production ML systems that serve millions of users. You will work across the full ML lifecycle and partner with platform teams on system design and scalability.

Responsibilities:
- Design and implement scalable ML training and serving systems.
- Build robust data pipelines and feature stores.
- Deploy models behind low-latency, high-throughput APIs.
- Collaborate on system architecture and capacity planning.
- Own model monitoring, observability and reliability.

Required qualifications:
- Strong Python expertise with production ML experience (PyTorch or TensorFlow).
- Deep understanding of system design and scalability for high-traffic services.
- Experience designing REST APIs and microservices.
- Strong SQL and database design skills.
- Hands-on Docker and AWS experience.
- Excellent communication and cross-functional collaboration.

Preferred qualifications:
- Experience with Kubernetes.
- Familiarity with caching, load balancing and fault tolerance patterns.
- MLOps experience including model monitoring and CI/CD for ML.
- Background in NLP or deep learning.`;

/**
 * A scripted demo answer that intentionally shows LIMITED scalability depth,
 * so the evaluator detects "Scalability" as a deeper gap, triggering the
 * adaptive next question on Scalability — the WOW moment.
 */
export const DEMO_ANSWERS = {
  // Q1 (System Design): "How would you design a scalable REST API for 100k concurrent users?"
  systemDesignLimited: `I'd build a FastAPI service running in Docker containers on AWS EC2, with a PostgreSQL database. I'd add an API gateway in front, use async handlers to handle concurrent requests, and put the model inference in a separate worker. For deployment I'd use CI/CD to push new images. I'd also add logging and basic monitoring with CloudWatch.`,

  // A stronger System Design answer (for comparison / alternate demo path)
  systemDesignStrong: `I'd start by estimating load: 100k concurrent users at maybe 1k RPS each is 100M RPS — unrealistic; assume 100k total users with ~10 RPS peak = 1M RPS. I'd horizontally scale stateless API containers behind a load balancer, shard the PostgreSQL read replicas, introduce Redis caching for hot keys, put a CDN in front of static assets, and use a message queue (Kafka) for async model inference. I'd add circuit breakers, rate limiting, and graceful degradation. Capacity planning would target ~70% CPU headroom with autoscaling.`,

  // Q2 (Scalability): "How would you introduce caching and load balancing?"
  scalabilityStrong: `I'd add a Redis cache-aside layer for hot read paths with a TTL plus explicit invalidation on writes. For load balancing I'd use a layer-7 LB with least-connections routing, configure health checks, and use consistent hashing for session affinity if needed. I'd also add a CDN for static assets and edge caching for read-mostly API responses. Backpressure would be enforced via token buckets at the gateway.`,
};
