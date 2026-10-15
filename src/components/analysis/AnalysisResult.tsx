"use client";

import { AnalysisView } from "@/components/analysis/AnalysisView";
import { PrimaryLink } from "@/components/landing/links";
import { Skeleton } from "@/components/ui/skeleton";
import { parseSessionAnalysis, readAnalysisSnapshot } from "@/lib/analysis/session";
import { useSyncExternalStore } from "react";

const PENDING = "\0pending";

function subscribe(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  return () => window.removeEventListener("storage", onStoreChange);
}

function AnalysisPending() {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <Skeleton className="h-4 w-28 motion-reduce:animate-none" />
      <Skeleton className="h-12 w-72 motion-reduce:animate-none" />
      <Skeleton className="h-40 w-full rounded-3xl motion-reduce:animate-none" />
    </div>
  );
}

function AnalysisMissing() {
  return (
    <div className="max-w-xl">
      <h1 className="font-heading text-4xl tracking-tight sm:text-5xl">No analysis found.</h1>
      <p className="mt-4 text-base leading-7 text-muted-foreground">
        Start a new analysis with a job description and your resume.
      </p>
      <div className="mt-8">
        <PrimaryLink href="/app/new">Analyze a job</PrimaryLink>
      </div>
    </div>
  );
}

export function AnalysisResult() {
  const raw = useSyncExternalStore(subscribe, readAnalysisSnapshot, () => PENDING);

  if (raw === PENDING) return <AnalysisPending />;

  const record = parseSessionAnalysis(raw);
  if (!record) return <AnalysisMissing />;
  return (
    <div className="space-y-6">
      {record.unsaved ? (
        <p className="rounded-2xl border border-border bg-blush/70 px-4 py-3 text-sm leading-6">
          This analysis is only in this browser session. It was not saved.
        </p>
      ) : null}
      <AnalysisView analysis={record.analysis} />
    </div>
  );
}
