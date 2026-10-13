import type { MatchBreakdown } from "@/types/domain";

const tones = ["bg-violet", "bg-lavender", "bg-blush", "bg-powder"] as const;

export function MatchScore({ match }: { match: MatchBreakdown }) {
  return (
    <div className="rounded-[1.75rem] border border-border bg-card p-6 sm:p-7">
      <p className="font-heading text-6xl tracking-tight text-violet sm:text-7xl">
        {match.overall}%
      </p>
      <p className="mt-1 text-sm font-medium tracking-[0.14em] text-violet uppercase">
        {match.label}
      </p>
      <div
        className="mt-6 flex h-2 overflow-hidden rounded-full bg-muted"
        role="img"
        aria-label={`${match.overall} percent ${match.label}`}
      >
        {match.dimensions.map((dimension, index) => {
          const total = match.dimensions.reduce(
            (sum, item) => sum + (item.omitted ? 0 : item.score),
            0,
          );
          if (dimension.omitted || total === 0) return null;
          return (
          <span
            key={dimension.id}
            className={tones[index]}
            style={{ width: `${(dimension.score / total) * 100}%` }}
          />
          );
        })}
      </div>
      <ul className="mt-4 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
        {match.dimensions.map((dimension, index) => (
          <li key={dimension.id} className="flex items-center gap-2">
            <span className={`size-2 rounded-full ${tones[index]}`} aria-hidden="true" />
            {dimension.omitted ? `${dimension.label} not listed` : dimension.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
