"use client";

import { PrimaryLink } from "@/components/landing/links";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";

const links = [
  { href: "#workflow", label: "How it works" },
  { href: "#features", label: "Features" },
  { href: "#agent", label: "Agent" },
] as const;

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const query = window.matchMedia("(min-width: 768px)");
    const close = () => {
      if (query.matches) setOpen(false);
    };
    query.addEventListener("change", close);
    return () => query.removeEventListener("change", close);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 transition-colors duration-200",
        scrolled
          ? "border-b border-border/80 bg-background/90 backdrop-blur-sm"
          : "border-b border-transparent bg-background/70",
      )}
    >
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-3 px-5 lg:px-8">
        <a
          href="#top"
          className="font-heading text-[1.7rem] leading-none tracking-tight text-foreground"
        >
          ApplyPilot
        </a>

        <nav
          aria-label="Primary"
          className="ml-auto hidden items-center gap-8 md:flex"
        >
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 md:ml-6">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X /> : <Menu />}
            <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
          </Button>
          <PrimaryLink href="#agent" className="h-9 px-3.5 text-[13px] sm:h-10 sm:px-4 sm:text-sm">
            Try ApplyPilot
          </PrimaryLink>
        </div>
      </div>

      {open ? (
        <nav
          id="mobile-nav"
          aria-label="Mobile"
          className="border-t border-border/80 px-5 py-3 md:hidden"
        >
          <ul className="flex flex-col">
            {links.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-xl px-2 py-2.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </header>
  );
}
