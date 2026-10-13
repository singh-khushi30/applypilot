"use client";

import { cn } from "@/lib/utils";
import type { Analysis, TraceEvent } from "@/types/domain";
import { useState } from "react";

function formatDuration(ms: number) {
  return ms < 1000 ? `${ms} ms` : `${(ms / 1000).toFixed(1)} s`;
}

function meta(step: TraceEvent) {
  const parts: string[] = [];
  if (step.attempt > 1) parts.push(`Attempt ${step.attempt}`);
  if (step.durationMs !== null) parts.push(formatDuration(step.durationMs));
  return parts.join(" · ");
}

export function AgentTrace({ trace }: { trace: Analysis["trace"] }) {
  const [open, setOpen] = useState(false);

  return (
    <section className="rounded-[1.5rem] border border-border bg-card">
      <button
        type="button"
        className="flex w-full items-center justify-between px-5 py-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-inset"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="text-sm font-medium">Agent run</span>
        <span className="text-xs text-muted-foreground">{open ? "Hide" : "Show"}</span>
      </button>
      {open ? (
        <ol className="space-y-3 border-t border-border px-5 py-4">
          {trace.map((step, index) => (
            <li key={step.id} className="flex items-start gap-3 text-sm">
              <span className="pt-0.5 text-xs text-muted-foreground">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0 flex-1">
                <p className={cn(step.status === "failed" && "text-destructive")}>
                  {step.label}
                  {step.status === "failed" ? (
                    <span className="sr-only"> (did not pass)</span>
                  ) : null}
                </p>
                {step.detail ? (
                  <p className="text-xs text-muted-foreground">{step.detail}</p>
                ) : null}
              </div>
              {meta(step) ? (
                <span className="shrink-0 pt-0.5 text-xs text-muted-foreground">{meta(step)}</span>
              ) : null}
            </li>
          ))}
        </ol>
      ) : null}
    </section>
  );
}
