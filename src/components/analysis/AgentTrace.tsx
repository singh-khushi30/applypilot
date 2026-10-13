"use client";

import type { Analysis } from "@/types/domain";
import { useState } from "react";

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
        <ol className="space-y-2 border-t border-border px-5 py-4">
          {trace.map((step, index) => (
            <li key={step.id} className="flex items-center gap-3 text-sm">
              <span className="text-xs text-muted-foreground">
                {String(index + 1).padStart(2, "0")}
              </span>
              {step.label}
            </li>
          ))}
        </ol>
      ) : null}
    </section>
  );
}
