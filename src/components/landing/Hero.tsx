import { PrimaryLink, SecondaryLink } from "@/components/landing/links";
import { Reveal } from "@/components/landing/Reveal";
import { Squiggle } from "@/components/landing/Squiggle";
import { trustPoints } from "@/components/landing/demo-data";
import { HeroCanvas } from "@/components/three/HeroCanvas";
import { BadgeCheck, FileText, Sparkles } from "lucide-react";

const trustIcons = [FileText, BadgeCheck, Sparkles] as const;

function Emphasis({ children }: { children: string }) {
  return (
    <em className="relative inline-block px-0.5 font-heading text-violet italic">
      {children}
      <span
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 -z-10 h-[0.42em] rounded-sm bg-lavender"
      />
    </em>
  );
}

export function Hero() {
  return (
    <section className="mx-auto grid w-full max-w-7xl items-center gap-10 px-5 pt-10 pb-16 sm:pt-14 lg:grid-cols-[minmax(0,45fr)_minmax(0,55fr)] lg:gap-8 lg:px-8 lg:pt-16 lg:pb-24">
      <Reveal>
        <div>
          <p className="flex items-center gap-3 text-[11px] font-medium tracking-[0.18em] text-violet uppercase sm:text-xs">
            Your AI job search copilot
            <Squiggle className="hidden h-3 w-24 sm:block" />
          </p>
          <h1 className="mt-5 max-w-[12em] font-heading text-[2.15rem] leading-[1.08] tracking-[-0.03em] text-balance text-foreground min-[400px]:text-[2.45rem] sm:max-w-none sm:text-5xl lg:text-[3.35rem]">
            Find the <Emphasis>right</Emphasis> role.
            <br />
            Know why you fit.
            <br />
            Reach the <Emphasis>right</Emphasis> person.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
            ApplyPilot turns a job posting into an actionable application
            strategy — analyzing your fit, uncovering gaps, finding relevant
            people, and preparing personalized outreach.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <PrimaryLink href="#agent">Analyze a Job</PrimaryLink>
            <SecondaryLink href="#workflow">See how it works</SecondaryLink>
          </div>
          <ul className="mt-8 flex flex-wrap gap-2">
            {trustPoints.map((label, index) => {
              const Icon = trustIcons[index];
              return (
                <li
                  key={label}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-cream/80 px-3 py-1.5 text-sm text-foreground"
                >
                  <Icon className="size-3.5 text-violet" aria-hidden="true" />
                  {label}
                </li>
              );
            })}
          </ul>
        </div>
      </Reveal>

      <Reveal delay={0.08} className="min-w-0">
        <div className="relative h-[380px] overflow-hidden rounded-[2rem] border border-border/80 bg-stage shadow-[0_30px_70px_-46px_rgba(74,61,100,0.65)] sm:h-[480px] lg:h-[560px]">
          <HeroCanvas />
        </div>
      </Reveal>
    </section>
  );
}
