import { featureCards } from "@/components/landing/demo-data";
import { Reveal } from "@/components/landing/Reveal";
import { cn } from "@/lib/utils";
import { BadgeCheck, CircleDashed, ScanSearch, Users } from "lucide-react";

const icons = [ScanSearch, CircleDashed, Users, BadgeCheck] as const;

const tones = {
  lavender: "bg-lavender/70",
  powder: "bg-powder/80",
  cream: "bg-cream",
  blush: "bg-blush/80",
} as const;

export function Features() {
  return (
    <section id="features" className="scroll-mt-24 py-16 lg:py-24">
      <div className="mx-auto w-full max-w-7xl px-5 lg:px-8">
        <Reveal>
          <h2 className="max-w-2xl font-heading text-[2rem] leading-[1.15] tracking-[-0.03em] text-balance text-foreground sm:text-4xl lg:text-5xl">
            Everything between the posting and the send.
          </h2>
        </Reveal>
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {featureCards.map((feature, index) => {
            const Icon = icons[index];
            return (
              <Reveal key={feature.title} delay={index * 0.05}>
                <article
                  className={cn(
                    "h-full rounded-3xl border border-border/80 p-6 transition duration-200 motion-safe:hover:-translate-y-1 sm:p-7",
                    tones[feature.tone],
                  )}
                >
                  <span className="inline-flex size-10 items-center justify-center rounded-2xl bg-card text-violet shadow-sm">
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <h3 className="mt-5 font-heading text-2xl tracking-tight text-foreground">
                    {feature.title}
                  </h3>
                  <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground sm:text-base">
                    {feature.body}
                  </p>
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
