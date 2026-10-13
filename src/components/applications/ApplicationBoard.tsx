import {
  applicationStages,
  demoApplications,
} from "@/data/demo-applications";
import type { ApplicationStage } from "@/types/domain";

const stageTone: Record<ApplicationStage, string> = {
  saved: "bg-secondary text-secondary-foreground",
  ready: "bg-lavender text-violet",
  applied: "bg-powder text-foreground",
  interview: "bg-blush text-foreground",
};

export function ApplicationBoard() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {applicationStages.map((stage) => {
        const cards = demoApplications.filter((item) => item.stage === stage.id);
        return (
          <section key={stage.id} aria-labelledby={`stage-${stage.id}`}>
            <div className="mb-3 flex items-center justify-between">
              <h2 id={`stage-${stage.id}`} className="text-sm font-medium">
                {stage.label}
              </h2>
              <span className="text-xs text-muted-foreground">{cards.length}</span>
            </div>
            <ul className="space-y-3">
              {cards.map((card) => (
                <li
                  key={card.id}
                  className="rounded-2xl border border-border bg-card p-4 shadow-[0_16px_40px_-32px_rgba(74,61,100,0.55)]"
                >
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium tracking-wide uppercase ${stageTone[card.stage]}`}
                  >
                    {stage.label}
                  </span>
                  <h3 className="mt-3 font-heading text-xl tracking-tight">{card.role}</h3>
                  <p className="text-sm text-muted-foreground">{card.company}</p>
                  <p className="mt-3 text-sm">
                    <span className="font-medium text-violet">{card.match}%</span>
                    <span className="text-muted-foreground"> match</span>
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">{card.note}</p>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
