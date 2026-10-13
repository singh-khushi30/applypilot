import { PrimaryLink } from "@/components/landing/links";
import {
  demoAgentActivity,
  recentAnalyses,
  workspaceStats,
} from "@/data/demo-applications";
import Link from "next/link";

export const metadata = {
  title: "Overview · ApplyPilot",
};

export default function DashboardPage() {
  return (
    <div>
      <h1 className="font-heading text-4xl leading-[1.12] tracking-tight sm:text-5xl">
        Good morning.
        <br />
        Let’s make your next application count.
      </h1>
      <div className="mt-8">
        <PrimaryLink href="/app/new">Analyze a new job</PrimaryLink>
      </div>

      <p className="mt-10 text-xs font-medium tracking-[0.16em] text-violet uppercase">
        Sample figures
      </p>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {workspaceStats.map((stat) => (
          <li
            key={stat.label}
            className="rounded-2xl border border-border bg-card px-5 py-4"
          >
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <p className="mt-2 font-heading text-4xl tracking-tight">{stat.value}</p>
          </li>
        ))}
      </ul>

      <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_16rem]">
        <section>
          <h2 className="font-heading text-3xl tracking-tight">Recent analyses</h2>
          <ul className="mt-4 space-y-3">
            {recentAnalyses.map((item) => {
              const body = (
                <>
                  <div>
                    <p className="font-heading text-2xl tracking-tight">{item.role}</p>
                    <p className="text-sm text-muted-foreground">{item.company}</p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="font-medium text-violet">{item.match}% match</p>
                    <p className="text-sm text-muted-foreground">{item.status}</p>
                  </div>
                </>
              );
              return (
                <li key={item.id}>
                  {item.href ? (
                    <Link
                      href={item.href}
                      className="flex flex-col gap-3 rounded-2xl border border-border bg-card px-5 py-4 transition hover:bg-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet sm:flex-row sm:items-center sm:justify-between"
                    >
                      {body}
                    </Link>
                  ) : (
                    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                      {body}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>

        <aside className="h-fit rounded-[1.5rem] border border-border bg-cream p-5">
          <h2 className="text-sm font-medium">Agent activity</h2>
          <p className="mt-1 text-xs text-muted-foreground">Sample</p>
          <ul className="mt-4 space-y-2">
            {demoAgentActivity.map((item, index) => (
              <li key={item} className="flex items-center gap-2 text-sm">
                <span aria-hidden="true" className="text-violet">
                  {index === demoAgentActivity.length - 1 ? "●" : "✓"}
                </span>
                {item}
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}
