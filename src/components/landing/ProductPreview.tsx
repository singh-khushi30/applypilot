import { previewDemo, previewNav } from "@/components/landing/demo-data";
import { Reveal } from "@/components/landing/Reveal";
import { cn } from "@/lib/utils";

const activityMark = {
  done: "✓",
  active: "●",
  pending: "○",
} as const;

export function ProductPreview() {
  return (
    <section id="agent" className="scroll-mt-24 py-20 lg:py-28">
      <div className="mx-auto w-full max-w-7xl px-5 lg:px-8">
        <Reveal>
          <h2 className="max-w-2xl font-heading text-[2rem] leading-[1.15] tracking-[-0.03em] text-balance text-foreground sm:text-4xl lg:text-5xl">
            The agent workspace
          </h2>
          <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">
            A static preview of the analysis, using sample data.
          </p>
        </Reveal>

        <Reveal delay={0.08} className="relative mt-12 mb-4 md:mb-16">
          <div className="overflow-hidden rounded-[1.75rem] border border-border bg-card shadow-[0_40px_80px_-48px_rgba(74,61,100,0.55)]">
            <div className="flex items-center gap-3 border-b border-border px-4 py-3">
              <span className="flex gap-1.5" aria-hidden="true">
                <span className="size-2.5 rounded-full bg-blush" />
                <span className="size-2.5 rounded-full bg-lavender" />
                <span className="size-2.5 rounded-full bg-powder" />
              </span>
              <p className="text-sm text-muted-foreground">ApplyPilot</p>
              <p className="ml-auto rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium tracking-wide text-violet uppercase">
                Sample
              </p>
            </div>

            <div className="grid md:grid-cols-[11.5rem_minmax(0,1fr)]">
              <div className="flex gap-2 overflow-x-auto border-b border-border bg-secondary/50 p-3 md:flex-col md:overflow-visible md:border-r md:border-b-0">
                {previewNav.map((item) => (
                  <span
                    key={item.label}
                    className={cn(
                      "shrink-0 rounded-xl px-3 py-2 text-sm whitespace-nowrap",
                      item.active
                        ? "bg-card font-medium text-violet shadow-sm"
                        : "text-muted-foreground",
                    )}
                  >
                    {item.label}
                  </span>
                ))}
              </div>

              <div className="min-w-0 p-5 sm:p-7">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{previewDemo.company}</p>
                    <h3 className="font-heading text-3xl tracking-tight text-foreground sm:text-4xl">
                      {previewDemo.role}
                    </h3>
                  </div>
                  <p className="font-heading text-5xl tracking-tight text-violet">
                    {previewDemo.match}%
                    <span className="ml-2 font-sans text-sm font-medium tracking-normal text-muted-foreground">
                      Match
                    </span>
                  </p>
                </div>

                <div
                  className="mt-4 h-1.5 overflow-hidden rounded-full bg-muted"
                  role="progressbar"
                  aria-valuenow={previewDemo.match}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="Sample match"
                >
                  <div
                    className="h-full rounded-full bg-violet"
                    style={{ width: `${previewDemo.match}%` }}
                  />
                </div>

                <div className="mt-8 grid gap-6 sm:grid-cols-2">
                  <div>
                    <h4 className="text-sm font-medium text-foreground">Strong matches</h4>
                    <ul className="mt-3 flex flex-wrap gap-2">
                      {previewDemo.matches.map((skill) => (
                        <li
                          key={skill}
                          className="rounded-full bg-lavender px-3 py-1 text-sm text-violet"
                        >
                          {skill}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-foreground">Potential gaps</h4>
                    <ul className="mt-3 flex flex-wrap gap-2">
                      {previewDemo.gaps.map((skill) => (
                        <li
                          key={skill}
                          className="rounded-full bg-blush px-3 py-1 text-sm text-foreground"
                        >
                          {skill}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-8">
                  <h4 className="text-sm font-medium text-foreground">Agent activity</h4>
                  <ul className="mt-3 space-y-2">
                    {previewDemo.activity.map((item) => (
                      <li key={item.label} className="flex items-center gap-3 text-sm">
                        <span
                          aria-hidden="true"
                          className={cn(
                            "inline-flex w-4 justify-center text-violet",
                            item.state === "active" && "motion-safe:animate-pulse",
                            item.state === "pending" && "text-muted-foreground",
                          )}
                        >
                          {activityMark[item.state]}
                        </span>
                        <span
                          className={
                            item.state === "pending"
                              ? "text-muted-foreground"
                              : "text-foreground"
                          }
                        >
                          {item.label}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <aside className="mt-4 rounded-2xl border border-violet/20 bg-blush p-4 shadow-[0_18px_40px_-30px_rgba(74,61,100,0.6)] md:absolute md:-right-2 md:-bottom-8 md:mt-0 md:w-64">
            <p className="text-sm font-medium text-foreground">Human approval required</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Outreach waits here until you review it.
            </p>
            <span className="mt-3 inline-flex h-8 items-center rounded-full bg-primary px-3 text-xs font-medium text-primary-foreground">
              Review draft
            </span>
          </aside>
          <p className="sr-only">
            Illustrative preview with sample data. The review control is not interactive.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
