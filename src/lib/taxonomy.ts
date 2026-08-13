/**
 * HIREMIND AI — Skill Taxonomy
 *
 * Maintainable normalized competency model with aliases. Extensible by design.
 * This is intentionally NOT exhaustive — it covers the demo scenario
 * (AI/ML Software Engineer, System Design gap) and common adjacent skills.
 */

import type { CompetencyCategory } from "./types";

export interface TaxonomyNode {
  competency: string;
  category: CompetencyCategory;
  aliases: string[];
  children?: string[]; // sub-competencies (informational)
}

export const TAXONOMY: TaxonomyNode[] = [
  // --- System Design ---
  { competency: "System Design", category: "system_design", aliases: ["system design", "architecture", "scalable design", "high-level design", "hld", "system architecture"], children: ["Scalability", "Fault Tolerance", "Caching", "Load Balancing"] },
  { competency: "Scalability", category: "system_design", aliases: ["scalability", "scale", "horizontal scaling", "vertical scaling", "scaling systems"] },
  { competency: "Fault Tolerance", category: "system_design", aliases: ["fault tolerance", "resilience", "high availability", "ha", "redundancy", "graceful degradation"] },
  { competency: "Caching", category: "system_design", aliases: ["cache", "caching", "redis cache", "cdn caching", "in-memory cache"] },
  { competency: "Load Balancing", category: "system_design", aliases: ["load balancer", "load balancing", "reverse proxy", "traffic distribution"] },

  // --- Backend ---
  { competency: "REST APIs", category: "backend", aliases: ["rest api", "restful api", "rest services", "rest", "api design", "rest endpoints"] },
  { competency: "GraphQL", category: "backend", aliases: ["graphql", "gql"] },
  { competency: "Microservices", category: "backend", aliases: ["microservices", "microservice architecture", "service oriented architecture", "soa"] },
  { competency: "Databases", category: "backend", aliases: ["database", "databases", "rdbms", "relational database", "sql database"] },
  { competency: "SQL", category: "backend", aliases: ["sql", "structured query language", "queries", "joins"] },
  { competency: "NoSQL", category: "backend", aliases: ["nosql", "document database", "mongodb", "cassandra", "dynamodb"] },
  { competency: "Message Queues", category: "backend", aliases: ["message queue", "kafka", "rabbitmq", "event streaming", "pub sub", "pub/sub"] },
  { competency: "Concurrency", category: "backend", aliases: ["concurrency", "multithreading", "async", "asynchronous programming", "parallelism"] },

  // --- Frontend ---
  { competency: "React", category: "frontend", aliases: ["react", "reactjs", "react.js"] },
  { competency: "TypeScript", category: "frontend", aliases: ["typescript", "ts"] },
  { competency: "JavaScript", category: "frontend", aliases: ["javascript", "js", "ecmascript"] },
  { competency: "CSS", category: "frontend", aliases: ["css", "stylesheets", "styling", "tailwind", "scss"] },
  { competency: "Frontend Performance", category: "frontend", aliases: ["frontend performance", "web vitals", "lcp", "fcp", "rendering performance"] },

  // --- Data ---
  { competency: "Data Modeling", category: "data", aliases: ["data modeling", "data model", "schema design", "entity relationship"] },
  { competency: "ETL", category: "data", aliases: ["etl", "data pipeline", "data ingestion", "data engineering"] },
  { competency: "Data Analysis", category: "data", aliases: ["data analysis", "analytics", "exploratory analysis", "statistics"] },

  // --- ML ---
  { competency: "Machine Learning", category: "ml", aliases: ["machine learning", "ml", "ml models", "predictive modeling"] },
  { competency: "Deep Learning", category: "ml", aliases: ["deep learning", "neural networks", "cnn", "rnn", "transformers"] },
  { competency: "NLP", category: "ml", aliases: ["nlp", "natural language processing", "text processing", "language models"] },
  { competency: "MLOps", category: "ml", aliases: ["mlops", "ml deployment", "model deployment", "model monitoring"] },
  { competency: "Feature Engineering", category: "ml", aliases: ["feature engineering", "feature selection", "feature extraction"] },

  // --- Cloud ---
  { competency: "AWS", category: "cloud", aliases: ["aws", "amazon web services", "ec2", "s3", "lambda"] },
  { competency: "GCP", category: "cloud", aliases: ["gcp", "google cloud", "google cloud platform"] },
  { competency: "Azure", category: "cloud", aliases: ["azure", "microsoft azure"] },
  { competency: "Cloud Architecture", category: "cloud", aliases: ["cloud architecture", "cloud native", "cloud design"] },

  // --- DevOps ---
  { competency: "Docker", category: "devops", aliases: ["docker", "containers", "containerization"] },
  { competency: "Kubernetes", category: "devops", aliases: ["kubernetes", "k8s", "orchestration"] },
  { competency: "CI/CD", category: "devops", aliases: ["ci/cd", "cicd", "continuous integration", "continuous deployment", "github actions", "jenkins"] },
  { competency: "Monitoring", category: "devops", aliases: ["monitoring", "observability", "logging", "prometheus", "grafana"] },

  // --- Languages ---
  { competency: "Python", category: "languages", aliases: ["python", "py", "python3"] },
  { competency: "Go", category: "languages", aliases: ["go", "golang"] },
  { competency: "Java", category: "languages", aliases: ["java", "jvm"] },
  { competency: "C++", category: "languages", aliases: ["c++", "cpp", "c plus plus"] },

  // --- Communication / HR ---
  { competency: "Communication", category: "communication", aliases: ["communication", "presentation", "stakeholder communication"] },
  { competency: "Leadership", category: "communication", aliases: ["leadership", "mentorship", "team leadership"] },
  { competency: "Problem Solving", category: "communication", aliases: ["problem solving", "analytical thinking", "critical thinking"] },

  // --- Domain ---
  { competency: "Domain Knowledge", category: "domain", aliases: ["domain knowledge", "industry knowledge", "business domain"] },
];

// Build a quick alias->competency map (lowercased).
const ALIAS_MAP: Map<string, TaxonomyNode> = new Map();
for (const node of TAXONOMY) {
  ALIAS_MAP.set(node.competency.toLowerCase(), node);
  for (const alias of node.aliases) {
    ALIAS_MAP.set(alias.toLowerCase(), node);
  }
}

export function normalizeSkill(raw: string): { competency: string; category: CompetencyCategory } {
  const key = raw.toLowerCase().trim();
  const node = ALIAS_MAP.get(key);
  if (node) return { competency: node.competency, category: node.category };
  // Fuzzy: try includes match
  for (const [alias, n] of ALIAS_MAP.entries()) {
    if (key.includes(alias) || alias.includes(key)) {
      return { competency: n.competency, category: n.category };
    }
  }
  // Unknown — keep the raw name but bucket as "domain" by default
  return { competency: raw.trim(), category: "domain" };
}

export function getTaxonomyNode(competency: string): TaxonomyNode | undefined {
  return TAXONOMY.find((n) => n.competency.toLowerCase() === competency.toLowerCase());
}

export const ALL_COMPETENCIES = TAXONOMY.map((n) => n.competency);
