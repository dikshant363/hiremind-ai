/**
 * HIREMIND AI — Dynamic System Configuration & Live Customization
 *
 * Real runtime configuration persisted in PostgreSQL via Prisma.
 * Modifies brand name, styling accent colors, scoring formulas, interview defaults,
 * skill taxonomy, custom job templates, and feature flags without rebuilding.
 */

import { db } from "@/lib/db";
import type { AuthUser } from "@/lib/auth";

export interface ScoringWeights {
  requiredSkillAlignment: number; // default 0.40
  evidenceStrength: number;       // default 0.30
  semanticRelevance: number;      // default 0.20
  coverageBreadth: number;        // default 0.10
}

export interface ReadinessWeights {
  jobAlignment: number;           // default 0.30
  requiredCoverage: number;       // default 0.25
  interviewEvidence: number;      // default 0.20
  technicalReadiness: number;     // default 0.15
  communication: number;          // default 0.10
}

export interface FeatureFlags {
  enableVoiceInput: boolean;
  enablePresentationMode: boolean;
  enableCompareView: boolean;
  enableAchievements: boolean;
  enableDemoMode: boolean;
  enableAIPolish: boolean;
}

export interface CustomTaxonomyItem {
  skill: string;
  competency: string;
  category: string;
  aliases: string[];
}

export interface CustomRoleTemplate {
  id: string;
  title: string;
  category: string;
  summary: string;
  description: string;
}

export interface AppSystemConfig {
  brandName: string;
  brandTagline: string;
  accentColor: "blue" | "indigo" | "violet" | "emerald" | "amber" | "rose";
  defaultDifficulty: "auto" | "easy" | "medium" | "hard";
  scoringWeights: ScoringWeights;
  readinessWeights: ReadinessWeights;
  featureFlags: FeatureFlags;
  customTaxonomy: CustomTaxonomyItem[];
  customRoles: CustomRoleTemplate[];
  updatedAt: string;
}

export const DEFAULT_SCORING_WEIGHTS: ScoringWeights = {
  requiredSkillAlignment: 0.4,
  evidenceStrength: 0.3,
  semanticRelevance: 0.2,
  coverageBreadth: 0.1,
};

export const DEFAULT_READINESS_WEIGHTS: ReadinessWeights = {
  jobAlignment: 0.3,
  requiredCoverage: 0.25,
  interviewEvidence: 0.2,
  technicalReadiness: 0.15,
  communication: 0.1,
};

export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  enableVoiceInput: true,
  enablePresentationMode: true,
  enableCompareView: true,
  enableAchievements: true,
  enableDemoMode: true,
  enableAIPolish: true,
};

export const DEFAULT_CONFIG: AppSystemConfig = {
  brandName: "HireMind AI",
  brandTagline: "Evidence-based job readiness · AI-assisted assessment",
  accentColor: "blue",
  defaultDifficulty: "auto",
  scoringWeights: DEFAULT_SCORING_WEIGHTS,
  readinessWeights: DEFAULT_READINESS_WEIGHTS,
  featureFlags: DEFAULT_FEATURE_FLAGS,
  customTaxonomy: [],
  customRoles: [],
  updatedAt: new Date().toISOString(),
};

let cachedConfig: AppSystemConfig | null = null;
let lastCacheFetch = 0;
const CACHE_TTL_MS = 15_000; // 15 seconds

/**
 * Loads the active system configuration from database with local memory caching.
 */
export async function getSystemConfig(): Promise<AppSystemConfig> {
  const now = Date.now();
  if (cachedConfig && now - lastCacheFetch < CACHE_TTL_MS) {
    return cachedConfig;
  }

  try {
    let row = await db.systemConfig.findUnique({ where: { id: "singleton" } });
    if (!row) {
      row = await db.systemConfig.create({
        data: {
          id: "singleton",
          brandName: DEFAULT_CONFIG.brandName,
          brandTagline: DEFAULT_CONFIG.brandTagline,
          accentColor: DEFAULT_CONFIG.accentColor,
          defaultDifficulty: DEFAULT_CONFIG.defaultDifficulty,
          scoringWeightsJson: JSON.stringify(DEFAULT_SCORING_WEIGHTS),
          readinessWeightsJson: JSON.stringify(DEFAULT_READINESS_WEIGHTS),
          featureFlagsJson: JSON.stringify(DEFAULT_FEATURE_FLAGS),
          customTaxonomyJson: JSON.stringify([]),
          customRolesJson: JSON.stringify([]),
        },
      });
    }

    let scoringWeights = DEFAULT_SCORING_WEIGHTS;
    try {
      if (row.scoringWeightsJson) scoringWeights = JSON.parse(row.scoringWeightsJson);
    } catch { /* ignore */ }

    let readinessWeights = DEFAULT_READINESS_WEIGHTS;
    try {
      if (row.readinessWeightsJson) readinessWeights = JSON.parse(row.readinessWeightsJson);
    } catch { /* ignore */ }

    let featureFlags = DEFAULT_FEATURE_FLAGS;
    try {
      if (row.featureFlagsJson) featureFlags = JSON.parse(row.featureFlagsJson);
    } catch { /* ignore */ }

    let customTaxonomy: CustomTaxonomyItem[] = [];
    try {
      if (row.customTaxonomyJson) customTaxonomy = JSON.parse(row.customTaxonomyJson);
    } catch { /* ignore */ }

    let customRoles: CustomRoleTemplate[] = [];
    try {
      if (row.customRolesJson) customRoles = JSON.parse(row.customRolesJson);
    } catch { /* ignore */ }

    cachedConfig = {
      brandName: row.brandName,
      brandTagline: row.brandTagline,
      accentColor: (["blue", "indigo", "violet", "emerald", "amber", "rose"].includes(row.accentColor)
        ? row.accentColor
        : "blue") as AppSystemConfig["accentColor"],
      defaultDifficulty: (["auto", "easy", "medium", "hard"].includes(row.defaultDifficulty)
        ? row.defaultDifficulty
        : "auto") as AppSystemConfig["defaultDifficulty"],
      scoringWeights,
      readinessWeights,
      featureFlags,
      customTaxonomy,
      customRoles,
      updatedAt: row.updatedAt.toISOString(),
    };
    lastCacheFetch = now;
    return cachedConfig;
  } catch (err) {
    console.warn("[HIREMIND] getSystemConfig fallback to default:", err);
    return DEFAULT_CONFIG;
  }
}

/**
 * Updates system configuration in SQLite and records an audit log.
 */
export async function updateSystemConfig(
  patch: Partial<AppSystemConfig>,
  user?: AuthUser | null
): Promise<AppSystemConfig> {
  const current = await getSystemConfig();

  // Validate and clamp weights if provided
  let newScoringWeights = current.scoringWeights;
  if (patch.scoringWeights) {
    const s = patch.scoringWeights;
    const sum = (s.requiredSkillAlignment || 0) + (s.evidenceStrength || 0) + (s.semanticRelevance || 0) + (s.coverageBreadth || 0);
    if (Math.abs(sum - 1.0) > 0.05) {
      throw new Error("Scoring weights must sum to 1.0 (100%).");
    }
    newScoringWeights = {
      requiredSkillAlignment: Number(s.requiredSkillAlignment) || 0.4,
      evidenceStrength: Number(s.evidenceStrength) || 0.3,
      semanticRelevance: Number(s.semanticRelevance) || 0.2,
      coverageBreadth: Number(s.coverageBreadth) || 0.1,
    };
  }

  let newReadinessWeights = current.readinessWeights;
  if (patch.readinessWeights) {
    const r = patch.readinessWeights;
    const sum = (r.jobAlignment || 0) + (r.requiredCoverage || 0) + (r.interviewEvidence || 0) + (r.technicalReadiness || 0) + (r.communication || 0);
    if (Math.abs(sum - 1.0) > 0.05) {
      throw new Error("Readiness weights must sum to 1.0 (100%).");
    }
    newReadinessWeights = {
      jobAlignment: Number(r.jobAlignment) || 0.3,
      requiredCoverage: Number(r.requiredCoverage) || 0.25,
      interviewEvidence: Number(r.interviewEvidence) || 0.2,
      technicalReadiness: Number(r.technicalReadiness) || 0.15,
      communication: Number(r.communication) || 0.1,
    };
  }

  const brandName = patch.brandName?.trim() || current.brandName;
  const brandTagline = patch.brandTagline?.trim() || current.brandTagline;
  const accentColor = patch.accentColor || current.accentColor;
  const defaultDifficulty = patch.defaultDifficulty || current.defaultDifficulty;
  const featureFlags = { ...current.featureFlags, ...(patch.featureFlags || {}) };
  const customTaxonomy = patch.customTaxonomy || current.customTaxonomy;
  const customRoles = patch.customRoles || current.customRoles;

  await db.systemConfig.upsert({
    where: { id: "singleton" },
    update: {
      brandName,
      brandTagline,
      accentColor,
      defaultDifficulty,
      scoringWeightsJson: JSON.stringify(newScoringWeights),
      readinessWeightsJson: JSON.stringify(newReadinessWeights),
      featureFlagsJson: JSON.stringify(featureFlags),
      customTaxonomyJson: JSON.stringify(customTaxonomy),
      customRolesJson: JSON.stringify(customRoles),
    },
    create: {
      id: "singleton",
      brandName,
      brandTagline,
      accentColor,
      defaultDifficulty,
      scoringWeightsJson: JSON.stringify(newScoringWeights),
      readinessWeightsJson: JSON.stringify(newReadinessWeights),
      featureFlagsJson: JSON.stringify(featureFlags),
      customTaxonomyJson: JSON.stringify(customTaxonomy),
      customRolesJson: JSON.stringify(customRoles),
    },
  });

  // Record audit log
  await db.auditEvent.create({
    data: {
      userId: user?.id ?? null,
      category: "config",
      action: "update_config",
      level: "info",
      message: `System configuration updated by ${user?.email ?? "system"}`,
      metaJson: JSON.stringify({ brandName, accentColor, defaultDifficulty }),
    },
  }).catch(() => {});

  // Invalidate cache
  cachedConfig = null;
  lastCacheFetch = 0;
  return getSystemConfig();
}

/**
 * Resets system configuration to defaults.
 */
export async function resetSystemConfig(user?: AuthUser | null): Promise<AppSystemConfig> {
  return updateSystemConfig(DEFAULT_CONFIG, user);
}
