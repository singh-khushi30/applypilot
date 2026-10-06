import { cn } from "@/lib/utils";

type SquiggleProps = {
  className?: string;
};

export function Squiggle({ className }: SquiggleProps) {
  return (
    <svg
      viewBox="0 0 140 16"
      fill="none"
      aria-hidden="true"
      className={cn("text-violet", className)}
    >
      <path
        d="M2 10c10-7 16 5 26 1s14-7 24-2 14 7 24 2 16-6 26-1 14 5 34 0"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
