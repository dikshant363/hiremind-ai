"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  BrainCircuit,
  Layers,
  Server,
  GitBranch,
  Database,
  Compass,
  Layout,
  Smartphone,
  Wand2,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import {
  JOB_TEMPLATES,
  type JobTemplate,
  type JobTemplateCategory,
} from "@/lib/job-templates";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Icon map — resolves the string icon name on a JobTemplate to a Lucide
// component. Defined as a stable module-level constant so we never create
// components during render (which would break hooks / re-mount on each render).
// ---------------------------------------------------------------------------

const ICON_MAP: Record<string, LucideIcon> = {
  BrainCircuit,
  Layers,
  Server,
  GitBranch,
  Database,
  Compass,
  Layout,
  Smartphone,
};

// ---------------------------------------------------------------------------
// Category → color mapping.
//   Engineering → accent-blue
//   Data        → warning
//   Design      → chart-3
//   Product     → success
//   DevOps      → chart-5
//
// Each category has two pairs:
//   - chipCls: the icon chip background + text color (slightly stronger tint)
//   - badgeCls: the tiny category pill (subtler tint + matching ring)
// ---------------------------------------------------------------------------

interface CategoryStyle {
  chipCls: string;
  badgeCls: string;
  glowCls: string;
}

const CATEGORY_STYLES: Record<JobTemplateCategory, CategoryStyle> = {
  Engineering: {
    chipCls: "bg-accent-blue/12 text-accent-blue",
    badgeCls: "bg-accent-blue/10 text-accent-blue ring-1 ring-inset ring-accent-blue/20",
    glowCls: "hover:border-accent-blue/50 hover:shadow-[0_0_0_1px_rgba(var(--accent-blue-rgb,99,102,241),0.15),0_8px_24px_-12px_rgba(var(--accent-blue-rgb,99,102,241),0.35)]",
  },
  Data: {
    chipCls: "bg-warning/12 text-warning",
    badgeCls: "bg-warning/10 text-warning ring-1 ring-inset ring-warning/20",
    glowCls: "hover:border-warning/50 hover:shadow-[0_8px_24px_-12px_rgba(234,179,8,0.35)]",
  },
  Design: {
    chipCls: "bg-chart-3/15 text-chart-3",
    badgeCls: "bg-chart-3/10 text-chart-3 ring-1 ring-inset ring-chart-3/25",
    glowCls: "hover:border-chart-3/50 hover:shadow-[0_8px_24px_-12px_rgba(249,115,22,0.35)]",
  },
  Product: {
    chipCls: "bg-success/12 text-success",
    badgeCls: "bg-success/10 text-success ring-1 ring-inset ring-success/20",
    glowCls: "hover:border-success/50 hover:shadow-[0_8px_24px_-12px_rgba(34,197,94,0.35)]",
  },
  DevOps: {
    chipCls: "bg-chart-5/15 text-chart-5",
    badgeCls: "bg-chart-5/10 text-chart-5 ring-1 ring-inset ring-chart-5/25",
    glowCls: "hover:border-chart-5/50 hover:shadow-[0_8px_24px_-12px_rgba(168,85,247,0.35)]",
  },
};

// ---------------------------------------------------------------------------
// JobTemplateCard — a single template card.
// Pure presentational component, no external state. Width is fully controlled
// by `className` so the same card works inside both the mobile horizontal
// scroll row and the desktop grid.
// ---------------------------------------------------------------------------

interface JobTemplateCardProps {
  template: JobTemplate;
  index: number;
  onSelect: (template: JobTemplate) => void;
  className?: string;
}

const JobTemplateCard = React.memo(function JobTemplateCard({
  template,
  index,
  onSelect,
  className,
}: JobTemplateCardProps) {
  const Icon = ICON_MAP[template.icon] ?? BrainCircuit;
  const style = CATEGORY_STYLES[template.category];

  return (
    <motion.button
      type="button"
      onClick={() => onSelect(template)}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: 0.04 * index,
        ease: [0.22, 1, 0.36, 1],
      }}
      whileHover={{ y: -3, transition: { type: "spring", stiffness: 400, damping: 25 } }}
      whileTap={{ scale: 0.98 }}
      aria-label={`Use ${template.title} template`}
      title={`${template.title} — click to pre-fill`}
      className={cn(
        "group hm-template-card hm-card-lift relative flex flex-col text-left",
        "p-3 rounded-xl",
        "bg-card border border-border/60",
        "transition-[transform,border-color,box-shadow] duration-200 ease-out",
        style.glowCls,
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/40 focus-visible:ring-offset-1 focus-visible:ring-offset-background",
        className,
      )}
    >
      {/* Icon chip */}
      <div className="flex items-center justify-between">
        <span
          className={cn(
            "inline-flex h-8 w-8 items-center justify-center rounded-lg",
            style.chipCls,
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
        {/* Category pill */}
        <span
          className={cn(
            "inline-flex items-center rounded-full px-1.5 py-0.5",
            "text-[9.5px] font-medium uppercase tracking-wide",
            "leading-none",
            style.badgeCls,
          )}
        >
          {template.category}
        </span>
      </div>

      {/* Title */}
      <h4 className="mt-2.5 text-[13px] font-semibold leading-snug line-clamp-2 text-foreground">
        {template.title}
      </h4>

      {/* Summary */}
      <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
        {template.summary}
      </p>

      {/* "Use template →" hint — revealed on hover */}
      <div className="mt-2.5 flex items-center gap-1 text-[10.5px] font-medium text-accent-blue/80 opacity-0 -translate-y-0.5 transition-all duration-200 group-hover:opacity-100 group-hover:translate-y-0">
        <span>Use template</span>
        <ArrowRight className="h-3 w-3 transition-transform duration-200 group-hover:translate-x-0.5" />
      </div>
    </motion.button>
  );
});

// ---------------------------------------------------------------------------
// JobTemplatePicker — the public component used on the home view.
//
// Renders a header row ("Quick start templates" + subtitle) plus two layouts
// for the card row:
//   - mobile:  horizontal scroll (`overflow-x-auto no-scrollbar`)
//   - desktop: responsive grid (`sm:grid sm:grid-cols-4 lg:grid-cols-8`)
//
// On the smallest screens, cards are fixed at w-[180px] so the row scrolls
// horizontally. On sm+ the grid owns the layout, so cards stretch to fill
// their cell (w-full) — this keeps `lg:grid-cols-8` cells from overflowing
// at narrow widths.
// ---------------------------------------------------------------------------

interface JobTemplatePickerProps {
  onSelect: (template: JobTemplate) => void;
}

export function JobTemplatePicker({ onSelect }: JobTemplatePickerProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
      className="mt-6 sm:mt-8"
      aria-label="Quick start templates"
    >
      {/* Header */}
      <div className="flex items-start sm:items-center gap-2.5 mb-3">
        <span
          aria-hidden
          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent-blue/10 text-accent-blue"
        >
          <Wand2 className="h-3.5 w-3.5" />
        </span>
        <div className="min-w-0">
          <h3 className="text-[13px] font-semibold leading-tight">
            Quick start templates
          </h3>
          <p className="mt-0.5 text-[11px] text-muted-foreground leading-tight">
            Pick a role to pre-fill the job description
          </p>
        </div>
      </div>

      {/* Mobile — horizontal scroll */}
      <div
        className="flex gap-2 overflow-x-auto no-scrollbar pb-2 -mx-1 px-1 sm:hidden"
        role="list"
      >
        {JOB_TEMPLATES.map((tpl, i) => (
          <JobTemplateCard
            key={tpl.id}
            template={tpl}
            index={i}
            onSelect={onSelect}
            className="w-[180px] shrink-0"
          />
        ))}
      </div>

      {/* Desktop — responsive grid */}
      <div
        className="hidden sm:grid sm:grid-cols-4 lg:grid-cols-8 gap-2"
        role="list"
      >
        {JOB_TEMPLATES.map((tpl, i) => (
          <JobTemplateCard
            key={tpl.id}
            template={tpl}
            index={i}
            onSelect={onSelect}
            className="w-full"
          />
        ))}
      </div>
    </motion.section>
  );
}
