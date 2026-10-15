"use client";

import { commitStatusChange } from "@/lib/persistence/status";
import type { SavedApplication } from "@/lib/persistence/records";
import { persistenceMessages } from "@/lib/supabase/config";
import type { ApplicationStatus } from "@/types/domain";
import Link from "next/link";
import { useState } from "react";

const columns: Array<{ id: ApplicationStatus; label: string }> = [
  { id: "ready", label: "Ready" },
  { id: "outreach", label: "Outreach" },
  { id: "applied", label: "Applied" },
  { id: "interview", label: "Interview" },
  { id: "offer", label: "Offer" },
  { id: "rejected", label: "Rejected" },
];

const choices: ApplicationStatus[] = [
  "ready",
  "outreach",
  "applied",
  "interview",
  "offer",
  "rejected",
  "archived",
];

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function ApplicationsTracker({ applications }: { applications: SavedApplication[] }) {
  const [items, setItems] = useState(applications);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function changeStatus(id: string, status: ApplicationStatus) {
    setPendingId(id);
    const result = await commitStatusChange(items, id, status, async () => {
      const response = await fetch(`/api/applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
        throw new Error(payload?.error?.message ?? persistenceMessages.statusFailed);
      }
    });
    setItems(result.items);
    setError(result.error);
    setPendingId(null);
  }

  const archived = items.filter((item) => item.status === "archived");

  return (
    <div>
      {error ? (
        <p className="mb-4 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {columns.map((column) => {
          const cards = items.filter((item) => item.status === column.id);
          return (
            <section key={column.id} aria-labelledby={`stage-${column.id}`}>
              <div className="mb-3 flex items-center justify-between">
                <h2 id={`stage-${column.id}`} className="text-sm font-medium">
                  {column.label}
                </h2>
                <span className="text-xs text-muted-foreground">{cards.length}</span>
              </div>
              <ul className="space-y-3">
                {cards.map((card) => (
                  <li
                    key={card.id}
                    className="rounded-2xl border border-border bg-card p-4 shadow-[0_16px_40px_-32px_rgba(74,61,100,0.55)]"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <label className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                        Status
                        <select
                          className="mt-1 block rounded-full bg-lavender px-2 py-1 text-xs font-medium tracking-normal text-violet uppercase"
                          value={card.status}
                          disabled={pendingId === card.id}
                          onChange={(event) =>
                            void changeStatus(card.id, event.target.value as ApplicationStatus)
                          }
                        >
                          {choices.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </label>
                      <span className="text-xs text-muted-foreground">{formatDate(card.createdAt)}</span>
                    </div>
                    <Link href={`/app/analysis/${card.id}`} className="mt-3 block">
                      <h3 className="font-heading text-xl tracking-tight">{card.roleTitle}</h3>
                      <p className="text-sm text-muted-foreground">{card.company}</p>
                    </Link>
                    <p className="mt-3 text-sm">
                      <span className="font-medium text-violet">{card.matchScore ?? 0}%</span>
                      <span className="text-muted-foreground">
                        {" "}
                        {card.matchLabel ?? "match"}
                      </span>
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
      {archived.length > 0 ? (
        <section className="mt-8">
          <h2 className="text-sm font-medium">Archived</h2>
          <ul className="mt-3 space-y-2">
            {archived.map((card) => (
              <li key={card.id}>
                <Link href={`/app/analysis/${card.id}`} className="text-sm text-muted-foreground">
                  {card.roleTitle} · {card.company}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
