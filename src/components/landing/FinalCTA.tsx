import { PrimaryLink } from "@/components/landing/links";
import { Reveal } from "@/components/landing/Reveal";
import { Squiggle } from "@/components/landing/Squiggle";
import { AccentCanvas } from "@/components/three/AccentCanvas";

export function FinalCTA() {
  return (
    <section className="px-5 pb-8 lg:px-8 lg:pb-12">
      <Reveal>
        <div className="mx-auto flex w-full max-w-7xl flex-col items-start justify-between gap-8 rounded-[2rem] border border-border bg-cream px-6 py-10 sm:px-10 sm:py-12 lg:flex-row lg:items-center lg:px-14">
          <div className="max-w-xl">
            <Squiggle className="mb-4 h-3 w-28" />
            <h2 className="font-heading text-[2rem] leading-[1.12] tracking-[-0.03em] text-balance text-foreground sm:text-4xl lg:text-5xl">
              Your next application should be intentional.
            </h2>
            <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
              Give ApplyPilot a role and let the agent build the strategy.
            </p>
            <div className="mt-7">
              <PrimaryLink href="#agent">Analyze your first job</PrimaryLink>
            </div>
          </div>
          <AccentCanvas />
        </div>
      </Reveal>
    </section>
  );
}
