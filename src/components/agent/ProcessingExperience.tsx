"use client";

import { AccentCanvas } from "@/components/three/AccentCanvas";

const steps = [
  "Reading your resume",
  "Structuring job requirements",
  "Comparing evidence",
  "Identifying gaps",
  "Calculating fit",
  "Checking analysis quality",
  "Preparing recommendation",
] as const;

export function ProcessingExperience() {
  return (
    <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_11rem]">
      <div>
        <p className="text-xs font-medium tracking-[0.16em] text-violet uppercase">
          Analysis
        </p>
        <h1 className="mt-3 max-w-xl font-heading text-4xl leading-[1.12] tracking-tight text-balance sm:text-5xl">
          ApplyPilot is building your strategy.
        </h1>
        <p className="mt-3 text-sm text-muted-foreground" aria-live="polite">
          Analysis in progress. These are the parts of this request, not a live step log.
        </p>
        <ul className="mt-8 space-y-3">
          {steps.map((step) => (
            <li key={step} className="flex items-center gap-3 text-sm text-foreground">
              <span aria-hidden="true" className="inline-flex w-4 justify-center text-violet">
                ○
              </span>
              {step}
            </li>
          ))}
        </ul>
      </div>
      <AccentCanvas />
    </div>
  );
}
