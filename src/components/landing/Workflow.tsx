"use client";

import { workflowSteps } from "@/components/landing/demo-data";
import { cn } from "@/lib/utils";
import { motion, useReducedMotion } from "motion/react";
import { BadgeCheck } from "lucide-react";

export function Workflow() {
  const reduce = useReducedMotion() === true;

  return (
    <section id="workflow" className="scroll-mt-24 bg-secondary/70 py-20 lg:py-28">
      <div className="mx-auto w-full max-w-7xl px-5 lg:px-8">
        <h2 className="max-w-3xl font-heading text-[2rem] leading-[1.15] tracking-[-0.03em] text-balance text-foreground sm:text-4xl lg:text-5xl">
          From job post to outreach — one agentic workflow.
        </h2>
        <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">
          Seven steps. You stay in charge of the last one.
        </p>

        <div className="relative mt-12">
          <div
            aria-hidden="true"
            className="absolute top-7 bottom-7 left-[1.35rem] w-px bg-lavender md:hidden"
          />
          <div
            aria-hidden="true"
            className="absolute top-7 right-8 left-8 hidden h-px bg-lavender xl:block"
          />
          <motion.ol
            className="relative grid gap-3 md:grid-cols-2 xl:grid-cols-7"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "0px 0px -10% 0px" }}
            variants={{
              hidden: {},
              show: {
                transition: { staggerChildren: reduce ? 0 : 0.06 },
              },
            }}
          >
            {workflowSteps.map((step) => (
              <motion.li
                key={step.number}
                variants={{
                  hidden: reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 },
                  show: {
                    opacity: 1,
                    y: 0,
                    transition: { duration: reduce ? 0 : 0.45, ease: [0.22, 1, 0.36, 1] },
                  },
                }}
                className={cn(
                  "relative z-10 rounded-2xl border p-4 shadow-[0_16px_40px_-32px_rgba(74,61,100,0.45)] xl:min-h-44",
                  step.approval
                    ? "border-violet/25 bg-blush"
                    : "border-border bg-card",
                )}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "inline-flex size-8 items-center justify-center rounded-full text-xs font-medium",
                      step.approval
                        ? "bg-violet text-primary-foreground"
                        : "bg-lavender text-violet",
                    )}
                  >
                    {step.number}
                  </span>
                  {step.approval ? (
                    <BadgeCheck className="size-4 text-violet" aria-hidden="true" />
                  ) : null}
                </div>
                {step.approval ? (
                  <p className="mt-3 text-[11px] font-medium tracking-[0.14em] text-violet uppercase">
                    Human in the loop
                  </p>
                ) : null}
                <h3 className="mt-3 font-heading text-lg leading-snug text-foreground">
                  {step.title}
                </h3>
                <p className="mt-1.5 text-sm leading-5 text-muted-foreground">
                  {step.detail}
                </p>
              </motion.li>
            ))}
          </motion.ol>
        </div>
      </div>
    </section>
  );
}
