"use client";

import { appNav, isNavActive } from "@/components/app-shell/nav-items";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Workspace" className="flex flex-col gap-1">
      {appNav.map((item) => {
        const active = isNavActive(pathname, item);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet",
              active
                ? "bg-lavender font-medium text-violet"
                : "text-foreground/80 hover:bg-secondary",
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function WorkspaceMark() {
  return (
    <div className="flex items-center gap-3 border-t border-border px-2 pt-4">
      <span className="grid size-9 place-items-center rounded-full bg-lavender text-sm font-medium text-violet">
        K
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-foreground">Khushi</p>
        <p className="truncate text-xs text-muted-foreground">Personal workspace</p>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="flex min-h-svh flex-1 bg-background text-foreground">
      <aside className="sticky top-0 hidden h-svh w-60 shrink-0 flex-col border-r border-border bg-cream/70 px-4 py-6 md:flex">
        <Link
          href="/app"
          className="mb-8 px-2 font-heading text-[1.7rem] leading-none tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet"
        >
          ApplyPilot
        </Link>
        <NavLinks />
        <div className="mt-auto">
          <WorkspaceMark />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border/80 bg-background/90 px-4 backdrop-blur-sm md:hidden">
          <Link href="/app" className="font-heading text-2xl tracking-tight">
            ApplyPilot
          </Link>
          <button
            type="button"
            className="inline-flex size-9 items-center justify-center rounded-full hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet"
            aria-expanded={open}
            aria-controls="workspace-drawer"
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X className="size-4" /> : <Menu className="size-4" />}
            <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
          </button>
        </header>

        {open ? (
          <button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 z-40 bg-ink/20 md:hidden"
            onClick={() => setOpen(false)}
          />
        ) : null}

        <div
          id="workspace-drawer"
          inert={open ? undefined : true}
          aria-hidden={!open}
          className={cn(
            "fixed inset-y-0 left-0 z-50 flex w-[min(100%,18rem)] flex-col bg-cream px-4 py-6 shadow-[0_24px_60px_-36px_rgba(74,61,100,0.7)] transition-transform duration-200 motion-reduce:transition-none md:hidden",
            open ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="mb-8 flex items-center justify-between px-2">
            <p className="font-heading text-[1.7rem] leading-none">ApplyPilot</p>
            <button
              type="button"
              className="inline-flex size-9 items-center justify-center rounded-full hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet"
              onClick={() => setOpen(false)}
            >
              <X className="size-4" />
              <span className="sr-only">Close menu</span>
            </button>
          </div>
          <NavLinks onNavigate={() => setOpen(false)} />
          <div className="mt-auto">
            <WorkspaceMark />
          </div>
        </div>

        <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:px-10 lg:py-12">
          {children}
        </div>
      </div>
    </div>
  );
}
