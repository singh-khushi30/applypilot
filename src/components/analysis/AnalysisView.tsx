import { AgentTrace } from "@/components/analysis/AgentTrace";
import { MatchScore } from "@/components/analysis/MatchScore";
import { Button, buttonVariants } from "@/components/ui/button";
import type { Analysis, GapImportance } from "@/types/domain";
import { cn } from "@/lib/utils";
import Link from "next/link";

const importanceCopy: Record<GapImportance, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

const importanceTone: Record<GapImportance, string> = {
  high: "bg-blush text-foreground",
  medium: "bg-lavender text-violet",
  low: "bg-powder text-foreground",
};

export function AnalysisView({ analysis }: { analysis: Analysis }) {
  return (
    <div className="space-y-10">
      {analysis.demo ? (
        <p className="inline-flex rounded-full bg-secondary px-3 py-1 text-xs font-medium tracking-[0.14em] text-violet uppercase">
          Demo analysis · sample candidate
        </p>
      ) : null}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div>
          <p className="text-sm text-muted-foreground">{analysis.job.company}</p>
          <h1 className="mt-1 font-heading text-4xl tracking-tight sm:text-5xl">
            {analysis.job.title}
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            {analysis.job.location}
            <span className="px-2" aria-hidden="true">
              ·
            </span>
            {analysis.job.employmentType}
          </p>
          {analysis.summary ? (
            <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
              {analysis.summary}
            </p>
          ) : null}
        </div>
        <MatchScore match={analysis.match} />
      </div>

      <section>
        <h2 className="font-heading text-3xl tracking-tight">Why you match</h2>
        <p className="mt-2 text-sm text-muted-foreground">Strong alignment</p>
        {analysis.alignments.length === 0 ? (
          <p className="mt-5 text-sm text-muted-foreground">
            No resume evidence was strong enough to list as a match.
          </p>
        ) : (
        <ul className="mt-5 grid gap-3 sm:grid-cols-2">
          {analysis.alignments.map((item) => (
            <li
              key={item.skill}
              className="rounded-2xl border border-border bg-card px-4 py-4"
            >
              <p className="font-medium">{item.skill}</p>
              <p className="mt-1 text-sm text-muted-foreground">{item.evidence}</p>
            </li>
          ))}
        </ul>
        )}
      </section>

      <section>
        <h2 className="font-heading text-3xl tracking-tight">Match breakdown</h2>
        <ul className="mt-5 space-y-4">
          {analysis.match.dimensions.map((dimension) => (
            <li key={dimension.id}>
              <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
                <span>{dimension.label}</span>
                <span className="font-medium text-violet">
                  {dimension.omitted ? "Not listed" : `${dimension.score}%`}
                </span>
              </div>
              {dimension.omitted ? null : (
              <div
                className="h-1.5 overflow-hidden rounded-full bg-muted"
                role="meter"
                aria-valuenow={dimension.score}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={dimension.label}
              >
                <div
                  className="h-full rounded-full bg-violet"
                  style={{ width: `${dimension.score}%` }}
                />
              </div>
              )}
            </li>
          ))}
        </ul>
        <div className="mt-6 max-w-2xl">
          <h3 className="text-sm font-medium">How this score works</h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {analysis.match.explanation}
          </p>
        </div>
      </section>

      <section>
        <h2 className="font-heading text-3xl tracking-tight">Potential gaps</h2>
        {analysis.gaps.length === 0 ? (
          <p className="mt-5 text-sm text-muted-foreground">
            No major gaps stood out in this comparison.
          </p>
        ) : (
        <ul className="mt-5 grid gap-3 lg:grid-cols-3">
          {analysis.gaps.map((gap) => (
            <li
              key={gap.skill}
              className="rounded-[1.5rem] border border-border bg-card p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-heading text-2xl tracking-tight">{gap.skill}</h3>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[11px] font-medium tracking-wide uppercase",
                    importanceTone[gap.importance],
                  )}
                >
                  {importanceCopy[gap.importance]}
                </span>
              </div>
              <p className="mt-3 text-sm">{gap.requirement}</p>
              <p className="mt-1 text-sm text-muted-foreground">{gap.finding}</p>
            </li>
          ))}
        </ul>
        )}
      </section>

      <section className="rounded-[1.75rem] border border-violet/15 bg-blush/70 p-6 sm:p-8">
        <h2 className="font-heading text-3xl tracking-tight sm:text-4xl">
          ApplyPilot’s take
        </h2>
        <p className="mt-4 max-w-3xl text-base leading-7">{analysis.recommendation}</p>
        <h3 className="mt-8 text-sm font-medium">Recommended next steps</h3>
        <ol className="mt-3 space-y-2">
          {analysis.nextSteps.map((step, index) => (
            <li key={step} className="flex gap-3 text-sm">
              <span className="text-violet">{index + 1}.</span>
              {step}
            </li>
          ))}
        </ol>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button type="button" className="h-11 rounded-full px-5">
            Tailor my resume
          </Button>
          {analysis.demo ? (
            <Button
              type="button"
              variant="outline"
              className="h-11 rounded-full bg-cream px-5"
              disabled
            >
              Find relevant people
            </Button>
          ) : (
            <Link
              href="/app/contacts"
              className={buttonVariants({
                variant: "outline",
                className: "h-11 rounded-full bg-cream px-5",
              })}
            >
              Find relevant people
            </Link>
          )}
        </div>
      </section>

      <AgentTrace trace={analysis.trace} />
    </div>
  );
}
