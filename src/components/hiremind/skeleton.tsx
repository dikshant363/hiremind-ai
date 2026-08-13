"use client";

import * as React from "react";

/** Skeleton line — animated shimmer placeholder */
function SkeletonLine({ className = "" }: { className?: string }) {
  return <div className={`hm-skeleton ${className}`} />;
}

/** Skeleton for Candidate Intelligence view */
export function CandidateSkeleton() {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-8 py-8 sm:py-14">
      <div className="space-y-3 mb-6">
        <SkeletonLine className="w-36 h-3" />
        <SkeletonLine className="w-64 h-7" />
        <SkeletonLine className="w-96 h-4" />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Profile skeleton */}
        <div className="hm-card p-4 sm:p-6 space-y-4">
          <div className="flex items-center gap-3">
            <SkeletonLine className="w-10 h-10 !rounded-full" />
            <div className="space-y-2 flex-1">
              <SkeletonLine className="w-28 h-4" />
              <SkeletonLine className="w-36 h-3" />
            </div>
          </div>
          <SkeletonLine className="w-full h-12" />
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex justify-between">
                <SkeletonLine className="w-24 h-3" />
                <SkeletonLine className="w-8 h-3" />
              </div>
            ))}
          </div>
        </div>
        {/* Skills skeleton */}
        <div className="hm-card p-4 sm:p-6 lg:col-span-2 space-y-4">
          <SkeletonLine className="w-32 h-4" />
          {[...Array(6)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-between">
                <SkeletonLine className="w-40 h-4" />
                <SkeletonLine className="w-16 h-3" />
              </div>
              <SkeletonLine className="w-full h-1.5 !rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Skeleton for Match view */
export function MatchSkeleton() {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-8 py-8 sm:py-14">
      <div className="space-y-3 mb-6">
        <SkeletonLine className="w-24 h-3" />
        <SkeletonLine className="w-56 h-7" />
        <SkeletonLine className="w-80 h-4" />
      </div>
      <div className="grid gap-4 lg:grid-cols-5">
        <div className="hm-card p-4 sm:p-6 lg:col-span-2 flex items-center justify-center">
          <SkeletonLine className="w-32 h-32 !rounded-full" />
        </div>
        <div className="hm-card p-4 sm:p-6 lg:col-span-3 space-y-4">
          <SkeletonLine className="w-28 h-4" />
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-between">
                <SkeletonLine className="w-32 h-4" />
                <SkeletonLine className="w-10 h-4" />
              </div>
              <SkeletonLine className="w-full h-1.5 !rounded-full" />
              <SkeletonLine className="w-3/4 h-3" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Skeleton for Gaps view */
export function GapsSkeleton() {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-8 py-8 sm:py-14">
      <div className="space-y-3 mb-6">
        <SkeletonLine className="w-20 h-3" />
        <SkeletonLine className="w-48 h-7" />
        <SkeletonLine className="w-72 h-4" />
      </div>
      <div className="hm-card p-6 sm:p-10 space-y-4">
        <SkeletonLine className="w-36 h-5" />
        <SkeletonLine className="w-56 h-8" />
        <SkeletonLine className="w-full h-4" />
        <div className="grid sm:grid-cols-3 gap-4 mt-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-lg bg-secondary/40 p-3 space-y-2">
              <SkeletonLine className="w-20 h-3" />
              <SkeletonLine className="w-28 h-4" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Empty state for when there is no data yet */
export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-8 py-14 text-center">
      <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-muted-foreground mb-5">
        {icon}
      </div>
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
