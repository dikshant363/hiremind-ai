"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Sliders,
  Sparkles,
  Palette,
  Calculator,
  Activity,
  Layers,
  FileCode,
  ToggleLeft,
  ShieldAlert,
  RotateCcw,
  Check,
  RefreshCw,
  Server,
  Database,
  Cpu,
  AlertTriangle,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useHireMind } from "@/lib/store";
import type { AppSystemConfig, ScoringWeights, ReadinessWeights, FeatureFlags } from "@/lib/config";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ControlCenterProps {
  open: boolean;
  onClose: () => void;
}

type TabType =
  | "brand"
  | "scoring"
  | "interview"
  | "taxonomy"
  | "roles"
  | "features"
  | "health"
  | "audit";

const TABS: { id: TabType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "brand", label: "Brand & Style", icon: Palette },
  { id: "scoring", label: "Scoring Weights", icon: Calculator },
  { id: "interview", label: "Interview & AI", icon: Sparkles },
  { id: "taxonomy", label: "Skills Taxonomy", icon: Layers },
  { id: "roles", label: "Job Templates", icon: FileCode },
  { id: "features", label: "Feature Flags", icon: ToggleLeft },
  { id: "health", label: "System Health", icon: Activity },
  { id: "audit", label: "Audit Trail", icon: Server },
];

const ACCENT_COLORS: { id: AppSystemConfig["accentColor"]; label: string; bg: string }[] = [
  { id: "blue", label: "Blue", bg: "bg-blue-500" },
  { id: "indigo", label: "Indigo", bg: "bg-indigo-500" },
  { id: "violet", label: "Violet", bg: "bg-purple-500" },
  { id: "emerald", label: "Emerald", bg: "bg-emerald-500" },
  { id: "amber", label: "Amber", bg: "bg-amber-500" },
  { id: "rose", label: "Rose", bg: "bg-rose-500" },
];

export function ControlCenter({ open, onClose }: ControlCenterProps) {
  const { systemConfig, fetchSystemConfig, currentUser } = useHireMind();
  const [tab, setTab] = React.useState<TabType>("brand");
  const [saving, setSaving] = React.useState(false);
  const [auditEvents, setAuditEvents] = React.useState<any[]>([]);
  const [healthData, setHealthData] = React.useState<any>(null);
  const [healthLoading, setHealthLoading] = React.useState(false);

  // Form states initialized from systemConfig
  const [brandName, setBrandName] = React.useState(systemConfig?.brandName || "HireMind AI");
  const [brandTagline, setBrandTagline] = React.useState(systemConfig?.brandTagline || "");
  const [accentColor, setAccentColor] = React.useState<AppSystemConfig["accentColor"]>(systemConfig?.accentColor || "blue");
  const [defaultDifficulty, setDefaultDifficulty] = React.useState<AppSystemConfig["defaultDifficulty"]>(systemConfig?.defaultDifficulty || "auto");

  const [scoringWeights, setScoringWeights] = React.useState<ScoringWeights>(
    systemConfig?.scoringWeights || {
      requiredSkillAlignment: 0.4,
      evidenceStrength: 0.3,
      semanticRelevance: 0.2,
      coverageBreadth: 0.1,
    }
  );

  const [readinessWeights, setReadinessWeights] = React.useState<ReadinessWeights>(
    systemConfig?.readinessWeights || {
      jobAlignment: 0.3,
      requiredCoverage: 0.25,
      interviewEvidence: 0.2,
      technicalReadiness: 0.15,
      communication: 0.1,
    }
  );

  const [featureFlags, setFeatureFlags] = React.useState<FeatureFlags>(
    systemConfig?.featureFlags || {
      enableVoiceInput: true,
      enablePresentationMode: true,
      enableCompareView: true,
      enableAchievements: true,
      enableDemoMode: true,
      enableAIPolish: true,
    }
  );

  const isAdmin = currentUser?.role === "admin";

  const loadHealth = React.useCallback(async () => {
    setHealthLoading(true);
    try {
      const res = await fetch("/api/health");
      const data = await res.json();
      setHealthData(data);
    } catch {
      setHealthData({ status: "unhealthy", message: "Failed to connect to health endpoint" });
    } finally {
      setHealthLoading(false);
    }
  }, []);

  const loadConfigWithAudit = React.useCallback(async () => {
    try {
      const res = await fetch("/api/config");
      const data = await res.json();
      if (data.auditEvents) setAuditEvents(data.auditEvents);
    } catch { /* ignore */ }
  }, []);

  // Sync state on modal open
  React.useEffect(() => {
    if (open) {
      fetchSystemConfig();
      loadHealth();
      loadConfigWithAudit();
    }
  }, [open, fetchSystemConfig, loadHealth, loadConfigWithAudit]);

  React.useEffect(() => {
    if (systemConfig) {
      setBrandName(systemConfig.brandName);
      setBrandTagline(systemConfig.brandTagline);
      setAccentColor(systemConfig.accentColor);
      setDefaultDifficulty(systemConfig.defaultDifficulty);
      setScoringWeights(systemConfig.scoringWeights);
      setReadinessWeights(systemConfig.readinessWeights);
      setFeatureFlags(systemConfig.featureFlags);
    }
  }, [systemConfig]);

  const handleSave = async () => {
    if (!isAdmin) {
      toast.error("Admin privileges required to save changes.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandName,
          brandTagline,
          accentColor,
          defaultDifficulty,
          scoringWeights,
          readinessWeights,
          featureFlags,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update configuration.");

      toast.success("System configuration saved successfully!");
      fetchSystemConfig();
      loadConfigWithAudit();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!isAdmin) {
      toast.error("Admin privileges required to reset.");
      return;
    }

    if (!confirm("Are you sure you want to reset system configuration to factory defaults?")) return;

    setSaving(true);
    try {
      const res = await fetch("/api/config", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reset config.");

      toast.success("Configuration reset to defaults.");
      fetchSystemConfig();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  const scoringSum =
    (scoringWeights.requiredSkillAlignment || 0) +
    (scoringWeights.evidenceStrength || 0) +
    (scoringWeights.semanticRelevance || 0) +
    (scoringWeights.coverageBreadth || 0);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-background/80 backdrop-blur-md"
        />

        {/* Modal Panel */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 12 }}
          transition={{ duration: 0.2 }}
          className="hm-card hm-glass-panel relative w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl border border-border/80 rounded-2xl z-10 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border/60">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-accent-blue/15 text-accent-blue">
                <Sliders className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-base sm:text-lg font-semibold tracking-tight">Control Center</h2>
                <p className="text-xs text-muted-foreground">
                  Real-time system configuration, scoring formulas, and health monitoring
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {!isAdmin && (
                <span className="flex items-center gap-1 text-[11px] font-medium text-warning bg-warning/15 px-2.5 py-1 rounded-full">
                  <Lock className="h-3 w-3" /> Read-Only Mode (Sign in as Admin to edit)
                </span>
              )}
              <button
                onClick={onClose}
                className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Body with Sidebar & Content */}
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* Sidebar Navigation */}
            <div className="w-full md:w-56 p-3 border-b md:border-b-0 md:border-r border-border/60 bg-secondary/20 flex md:flex-col gap-1 overflow-x-auto">
              {TABS.map((t) => {
                const Icon = t.icon;
                const active = tab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all text-left whitespace-nowrap",
                      active
                        ? "bg-accent-blue text-white shadow-xs"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Content Area */}
            <div className="flex-1 p-5 sm:p-6 overflow-y-auto space-y-6">
              {/* TAB 1: Brand & Style */}
              {tab === "brand" && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold mb-1">Brand Identity & Accent Styling</h3>
                    <p className="text-xs text-muted-foreground mb-4">
                      Changes dynamically update the application header, branding labels, and accent highlights.
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground block mb-1">Brand Name</label>
                      <Input
                        disabled={!isAdmin}
                        value={brandName}
                        onChange={(e) => setBrandName(e.target.value)}
                        placeholder="HireMind AI"
                        className="text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground block mb-1">Brand Tagline</label>
                      <Input
                        disabled={!isAdmin}
                        value={brandTagline}
                        onChange={(e) => setBrandTagline(e.target.value)}
                        placeholder="Evidence-based job readiness"
                        className="text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-2">Accent Color Theme</label>
                    <div className="flex flex-wrap gap-2.5">
                      {ACCENT_COLORS.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          disabled={!isAdmin}
                          onClick={() => setAccentColor(c.id)}
                          className={cn(
                            "flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all",
                            accentColor === c.id
                              ? "border-accent-blue bg-accent-blue/10 text-foreground ring-1 ring-accent-blue"
                              : "border-border/60 hover:bg-secondary/40 text-muted-foreground"
                          )}
                        >
                          <span className={cn("h-3 w-3 rounded-full", c.bg)} />
                          <span>{c.label}</span>
                          {accentColor === c.id && <Check className="h-3.5 w-3.5 ml-1 text-accent-blue" />}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: Scoring Weights */}
              {tab === "scoring" && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-sm font-semibold mb-1">Match Index Scoring Weights</h3>
                    <p className="text-xs text-muted-foreground mb-3">
                      Adjust the 4 deterministic weights for the Prototype Job Match Index. Must sum to 1.0 (100%).
                    </p>
                    <div className={cn("text-xs font-medium inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md", Math.abs(scoringSum - 1.0) < 0.01 ? "bg-success/15 text-success-foreground" : "bg-destructive/15 text-destructive")}>
                      <span>Total Sum: {Math.round(scoringSum * 100)}%</span>
                      {Math.abs(scoringSum - 1.0) >= 0.01 && <span>(Weights must equal 100%)</span>}
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground block mb-1">
                        Required-Skill Alignment ({Math.round(scoringWeights.requiredSkillAlignment * 100)}%)
                      </label>
                      <Input
                        type="number"
                        step="0.05"
                        min="0"
                        max="1"
                        disabled={!isAdmin}
                        value={scoringWeights.requiredSkillAlignment}
                        onChange={(e) => setScoringWeights({ ...scoringWeights, requiredSkillAlignment: parseFloat(e.target.value) || 0 })}
                        className="text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground block mb-1">
                        Evidence Strength ({Math.round(scoringWeights.evidenceStrength * 100)}%)
                      </label>
                      <Input
                        type="number"
                        step="0.05"
                        min="0"
                        max="1"
                        disabled={!isAdmin}
                        value={scoringWeights.evidenceStrength}
                        onChange={(e) => setScoringWeights({ ...scoringWeights, evidenceStrength: parseFloat(e.target.value) || 0 })}
                        className="text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground block mb-1">
                        Semantic Relevance ({Math.round(scoringWeights.semanticRelevance * 100)}%)
                      </label>
                      <Input
                        type="number"
                        step="0.05"
                        min="0"
                        max="1"
                        disabled={!isAdmin}
                        value={scoringWeights.semanticRelevance}
                        onChange={(e) => setScoringWeights({ ...scoringWeights, semanticRelevance: parseFloat(e.target.value) || 0 })}
                        className="text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground block mb-1">
                        Coverage Breadth ({Math.round(scoringWeights.coverageBreadth * 100)}%)
                      </label>
                      <Input
                        type="number"
                        step="0.05"
                        min="0"
                        max="1"
                        disabled={!isAdmin}
                        value={scoringWeights.coverageBreadth}
                        onChange={(e) => setScoringWeights({ ...scoringWeights, coverageBreadth: parseFloat(e.target.value) || 0 })}
                        className="text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: Interview & AI */}
              {tab === "interview" && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold mb-1">Interview & AI Engine Defaults</h3>
                    <p className="text-xs text-muted-foreground mb-4">
                      Configure default interview difficulty and AI provider parameters.
                    </p>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-2">Default Interview Difficulty</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {(["auto", "easy", "medium", "hard"] as const).map((diff) => (
                        <button
                          key={diff}
                          type="button"
                          disabled={!isAdmin}
                          onClick={() => setDefaultDifficulty(diff)}
                          className={cn(
                            "py-2 px-3 rounded-lg border text-xs font-medium capitalize text-center transition-all",
                            defaultDifficulty === diff
                              ? "border-accent-blue bg-accent-blue/10 text-foreground ring-1 ring-accent-blue"
                              : "border-border/60 text-muted-foreground hover:bg-secondary/40"
                          )}
                        >
                          {diff === "auto" ? "Adaptive (Auto)" : diff}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: Skills Taxonomy */}
              {tab === "taxonomy" && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold mb-1">Canonical Skill Taxonomy</h3>
                    <p className="text-xs text-muted-foreground mb-4">
                      Core competencies and alias normalization mappings loaded from the active database.
                    </p>
                  </div>
                  <div className="bg-secondary/30 p-4 rounded-xl border border-border/40 text-xs space-y-2 max-h-60 overflow-y-auto">
                    <div className="flex justify-between font-semibold border-b border-border/40 pb-1.5 text-foreground">
                      <span>Canonical Competency</span>
                      <span>Category</span>
                    </div>
                    {[
                      { comp: "System Design", cat: "system_design" },
                      { comp: "Scalability", cat: "system_design" },
                      { comp: "Microservices", cat: "backend" },
                      { comp: "REST APIs", cat: "backend" },
                      { comp: "Docker", cat: "devops" },
                      { comp: "Kubernetes", cat: "devops" },
                      { comp: "Machine Learning", cat: "ml" },
                      { comp: "Deep Learning", cat: "ml" },
                      { comp: "Python", cat: "languages" },
                      { comp: "TypeScript", cat: "frontend" },
                    ].map((item) => (
                      <div key={item.comp} className="flex justify-between text-muted-foreground py-1">
                        <span className="font-medium text-foreground">{item.comp}</span>
                        <span className="bg-secondary px-2 py-0.5 rounded text-[10px]">{item.cat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 5: Job Templates */}
              {tab === "roles" && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold mb-1">Standard Job Templates</h3>
                    <p className="text-xs text-muted-foreground mb-4">
                      Pre-configured industry job templates available for instant matching on the home screen.
                    </p>
                  </div>
                  <div className="grid gap-2.5 sm:grid-cols-2">
                    {[
                      { title: "AI/ML Software Engineer", cat: "Engineering" },
                      { title: "Backend Systems Architect", cat: "Engineering" },
                      { title: "Staff Frontend Engineer", cat: "Frontend" },
                      { title: "Cloud Platform & SRE", cat: "DevOps" },
                    ].map((r) => (
                      <div key={r.title} className="p-3 rounded-lg bg-secondary/30 border border-border/40 text-xs">
                        <div className="font-semibold text-foreground">{r.title}</div>
                        <div className="text-muted-foreground text-[10px] mt-0.5">{r.cat}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 6: Feature Flags */}
              {tab === "features" && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold mb-1">System Feature Flags</h3>
                    <p className="text-xs text-muted-foreground mb-4">
                      Enable or disable features across the application at runtime.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {[
                      { key: "enableVoiceInput", label: "Voice Input Dictation", desc: "Allows speech-to-text input during mock interviews." },
                      { key: "enablePresentationMode", label: "Presentation Mode", desc: "Full-width distraction-free viewing hotkey." },
                      { key: "enableCompareView", label: "Session Comparison", desc: "Side-by-side session delta comparator." },
                      { key: "enableAchievements", label: "Achievement Milestones", desc: "Progress badges and motivation toasts." },
                      { key: "enableDemoMode", label: "Demo Candidate Quickstart", desc: "One-click benchmark candidate loader." },
                    ].map((f) => (
                      <div key={f.key} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/40">
                        <div>
                          <div className="text-xs font-medium text-foreground">{f.label}</div>
                          <div className="text-[11px] text-muted-foreground">{f.desc}</div>
                        </div>
                        <input
                          type="checkbox"
                          disabled={!isAdmin}
                          checked={(featureFlags as any)[f.key] ?? true}
                          onChange={(e) => setFeatureFlags({ ...featureFlags, [f.key]: e.target.checked })}
                          className="h-4 w-4 rounded border-border/80 text-accent-blue focus:ring-accent-blue"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 7: System Health */}
              {tab === "health" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold mb-1">Live Diagnostics & Dependency Health</h3>
                      <p className="text-xs text-muted-foreground">
                        Real live-tested status of database, AI abstraction, and text extractors.
                      </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={loadHealth} disabled={healthLoading} className="gap-1.5 h-8 text-xs">
                      <RefreshCw className={cn("h-3.5 w-3.5", healthLoading && "animate-spin")} />
                      <span>Ping Health</span>
                    </Button>
                  </div>

                  {healthData ? (
                    <div className="space-y-3">
                      <div className={cn("p-4 rounded-xl border flex items-center justify-between", healthData.status === "healthy" ? "bg-success/10 border-success/30 text-success-foreground" : "bg-warning/10 border-warning/30 text-warning-foreground")}>
                        <div className="flex items-center gap-2.5">
                          <Activity className="h-5 w-5" />
                          <div>
                            <div className="font-semibold text-xs capitalize">System Status: {healthData.status}</div>
                            <div className="text-[11px] opacity-80">Total diagnostic ping latency: {healthData.latencyMs}ms</div>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono opacity-80">{new Date(healthData.timestamp).toLocaleTimeString()}</span>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-3">
                        <div className="p-3.5 rounded-xl bg-secondary/40 border border-border/50 text-xs">
                          <div className="flex items-center gap-2 text-foreground font-semibold mb-1">
                            <Database className="h-4 w-4 text-accent-blue" />
                            <span>Database</span>
                          </div>
                          <p className="text-muted-foreground text-[11px]">{healthData.checks?.database?.message}</p>
                          <div className="mt-2 text-[10px] font-mono text-accent-blue">Latency: {healthData.checks?.database?.latencyMs}ms</div>
                        </div>

                        <div className="p-3.5 rounded-xl bg-secondary/40 border border-border/50 text-xs">
                          <div className="flex items-center gap-2 text-foreground font-semibold mb-1">
                            <Sparkles className="h-4 w-4 text-warning" />
                            <span>AI Engine</span>
                          </div>
                          <p className="text-muted-foreground text-[11px]">{healthData.checks?.aiProvider?.message}</p>
                          <div className="mt-2 text-[10px] font-mono text-success">Status: Online</div>
                        </div>

                        <div className="p-3.5 rounded-xl bg-secondary/40 border border-border/50 text-xs">
                          <div className="flex items-center gap-2 text-foreground font-semibold mb-1">
                            <FileCode className="h-4 w-4 text-purple-400" />
                            <span>Document Engine</span>
                          </div>
                          <p className="text-muted-foreground text-[11px]">{healthData.checks?.textExtractor?.message}</p>
                          <div className="mt-2 text-[10px] font-mono text-success">PDF & DOCX Ready</div>
                        </div>
                      </div>

                      {healthData.runtime && (
                        <div className="p-3.5 rounded-xl bg-secondary/30 text-xs space-y-1 text-muted-foreground">
                          <div className="font-semibold text-foreground text-[11px] mb-1">Process Metrics</div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px]">
                            <div>Platform: {healthData.runtime.platform}</div>
                            <div>Node: {healthData.runtime.nodeVersion}</div>
                            <div>Uptime: {healthData.runtime.uptimeSeconds}s</div>
                            <div>Heap: {healthData.runtime.memory?.heapUsed} MB</div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-xs text-muted-foreground">Loading diagnostics…</div>
                  )}
                </div>
              )}

              {/* TAB 8: Audit Trail */}
              {tab === "audit" && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold mb-1">System & Security Audit Trail</h3>
                    <p className="text-xs text-muted-foreground mb-4">
                      Real-time operational events recorded across authentication, AI processing, and database transactions.
                    </p>
                  </div>

                  <div className="space-y-2 max-h-72 overflow-y-auto">
                    {auditEvents.length > 0 ? (
                      auditEvents.map((evt) => (
                        <div key={evt.id} className="p-2.5 rounded-lg bg-secondary/30 border border-border/40 text-xs flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="font-semibold text-foreground text-[11px] capitalize">{evt.category} · {evt.action}</span>
                              <span className={cn("text-[9px] px-1.5 py-0.5 rounded font-mono uppercase", evt.level === "error" ? "bg-destructive/20 text-destructive" : evt.level === "warn" ? "bg-warning/20 text-warning" : "bg-secondary text-muted-foreground")}>
                                {evt.level}
                              </span>
                            </div>
                            <p className="text-muted-foreground text-[11px]">{evt.message}</p>
                          </div>
                          <span className="text-[10px] text-muted-foreground whitespace-nowrap font-mono">
                            {new Date(evt.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-muted-foreground italic text-center py-6">
                        No audit events recorded yet or sign in as Admin to inspect.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer Controls */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-border/60 bg-secondary/20">
            <Button
              variant="ghost"
              size="sm"
              disabled={!isAdmin || saving}
              onClick={handleReset}
              className="text-xs text-muted-foreground hover:text-destructive gap-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset Defaults</span>
            </Button>

            <div className="flex items-center gap-2.5">
              <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
                Close
              </Button>
              {isAdmin && (
                <Button size="sm" onClick={handleSave} disabled={saving} className="text-xs gap-1.5">
                  <Check className="h-3.5 w-3.5" />
                  <span>{saving ? "Saving…" : "Save Configuration"}</span>
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
