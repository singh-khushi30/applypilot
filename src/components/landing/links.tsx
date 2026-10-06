import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

const focus =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export function PrimaryLink({
  href,
  children,
  className,
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <a
      href={href}
      className={cn(
        "inline-flex h-11 items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-medium whitespace-nowrap text-primary-foreground shadow-[0_14px_30px_-18px_var(--violet)] transition duration-200 hover:bg-[#3f3456] motion-safe:hover:-translate-y-0.5",
        focus,
        className,
      )}
    >
      {children}
    </a>
  );
}

export function SecondaryLink({
  href,
  children,
  className,
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <a
      href={href}
      className={cn(
        "inline-flex h-11 items-center justify-center rounded-full border border-border bg-cream/80 px-5 text-sm font-medium whitespace-nowrap text-foreground transition duration-200 hover:bg-white",
        focus,
        className,
      )}
    >
      {children}
    </a>
  );
}
