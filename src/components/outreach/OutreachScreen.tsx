"use client";

import { AgentTrace } from "@/components/analysis/AgentTrace";
import { PrimaryLink } from "@/components/landing/links";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { parseSessionAnalysis, readAnalysisSnapshot } from "@/lib/analysis/session";
import type { StoredAnalysis } from "@/lib/analysis/stored-analysis";
import type { SavedOutreach } from "@/lib/persistence/records";
import { outreachContentSchema, type OutreachContent } from "@/lib/ai/schemas/outreach";
import { demoContacts } from "@/lib/outreach/demo-contacts";
import { outreachMessages } from "@/lib/outreach/messages";
import { relevanceLabels } from "@/lib/outreach/relevance";
import {
  applyReviewAction,
  createAwaitingReview,
  type OutreachReview,
} from "@/lib/outreach/review";
import {
  parseOutreachSession,
  readOutreachSnapshot,
  reviewFromStored,
  saveOutreachSession,
  storedReview,
  subscribeOutreach,
  type OutreachSession,
} from "@/lib/outreach/session";
import { cn } from "@/lib/utils";
import type { Contact, OutreachChannel, TraceEvent } from "@/types/domain";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, useSyncExternalStore } from "react";

const PENDING = "\0pending";

const statusLabel = {
  awaiting_review: "Awaiting review",
  approved: "Approved",
  rejected: "Rejected",
} as const;

function subscribeAnalysis(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  return () => window.removeEventListener("storage", onStoreChange);
}

function findContact(contacts: Contact[], id: string) {
  return contacts.find((contact) => contact.id === id) ?? null;
}

export function OutreachScreen({
  persisted,
  applicationId,
  analysis: savedAnalysis,
  contacts,
  outreach,
  notice,
}: {
  persisted: boolean;
  applicationId: string;
  analysis: StoredAnalysis | null;
  contacts: Contact[];
  outreach: SavedOutreach | null;
  notice: string | null;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const contactId = params.get("contact") ?? "";
  const [override, setOverride] = useState<SavedOutreach | null>(null);
  const analysisRaw = useSyncExternalStore(subscribeAnalysis, readAnalysisSnapshot, () => PENDING);
  const outreachRaw = useSyncExternalStore(subscribeOutreach, readOutreachSnapshot, () => PENDING);
  const [channelChoice, setChannelChoice] = useState<OutreachChannel | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [subject, setSubject] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const sessionRecord = analysisRaw === PENDING ? null : parseSessionAnalysis(analysisRaw);
  const sessionAnalysis =
    !persisted && sessionRecord && (!applicationId || sessionRecord.analysis.id === applicationId)
      ? sessionRecord.analysis
      : null;
  const analysis = savedAnalysis ?? sessionAnalysis;
  const session = useMemo(() => {
    if (!analysis || outreachRaw === PENDING) return null;
    return parseOutreachSession(outreachRaw, analysis.id);
  }, [analysis, outreachRaw]);

  const contact = useMemo(() => {
    if (!analysis) return null;
    return findContact(
      [...demoContacts(analysis.job), ...contacts, ...(session?.manualContacts ?? [])],
      contactId,
    );
  }, [analysis, contacts, session, contactId]);

  const stored = persisted
    ? null
    : session?.review?.contactId === contactId
      ? session.review
      : null;
  const savedReview =
    override ?? (outreach && contact && outreach.contactId === contact.id ? outreach : null);
  const review = savedReview ?? (stored ? reviewFromStored(stored) : null);
  const channel = channelChoice ?? review?.channel ?? "linkedin";
  const draftMessage = message ?? review?.message ?? "";
  const draftSubject = subject ?? review?.subject ?? "";
  const activeChannel = review?.channel ?? channel;

  if (analysisRaw === PENDING || outreachRaw === PENDING) {
    return <p className="text-sm text-muted-foreground">Loading outreach…</p>;
  }

  if (!analysis || !session) {
    return (
      <div className="max-w-xl">
        <h1 className="font-heading text-4xl tracking-tight">No analysis found.</h1>
        <p className="mt-4 text-muted-foreground">Analyze a job before drafting outreach.</p>
        <div className="mt-8">
          <PrimaryLink href="/app/new">Analyze a job</PrimaryLink>
        </div>
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="max-w-xl">
        <h1 className="font-heading text-4xl tracking-tight">Choose a person.</h1>
        <p className="mt-4 text-muted-foreground">{outreachMessages.missingContact}</p>
        <div className="mt-8">
          <PrimaryLink href="/app/contacts">Back to contacts</PrimaryLink>
        </div>
      </div>
    );
  }

  function persist(nextSession: OutreachSession) {
    saveOutreachSession(nextSession);
  }

  function commitEdit(current: OutreachReview) {
    if (current.status !== "awaiting_review") return current;
    const nextMessage = (message ?? current.message).trim();
    const nextSubject = activeChannel === "email" ? (subject ?? current.subject ?? "").trim() : null;
    if (nextMessage === current.message && nextSubject === current.subject) return current;
    const next = applyReviewAction(current, {
      type: "edit",
      message: nextMessage,
      subject: nextSubject,
    });
    persist({ ...session!, review: storedReview(contact!.id, next) });
    setMessage(null);
    setSubject(null);
    return next;
  }

  async function generate(kind: "draft" | "regenerate") {
    setError(null);
    setPending(true);
    try {
      const response = await fetch("/api/outreach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel,
          applicationId: persisted ? applicationId : null,
          contact: {
            name: contact!.name,
            title: contact!.title,
            company: contact!.company,
            context: contact!.context,
            profileUrl: contact!.profileUrl,
            source: contact!.source,
            relevance: contact!.relevance,
          },
          analysis: {
            job: { title: analysis!.job.title, company: analysis!.job.company },
            summary: analysis!.summary,
            alignments: analysis!.alignments,
          },
        }),
      });
      const body = (await response.json()) as {
        draft?: OutreachContent;
        trace?: TraceEvent[];
        persisted?: boolean;
        contact?: Contact;
        outreach?: SavedOutreach;
        error?: { message?: string };
      };
      if (!response.ok || !body.draft || !body.trace) {
        setError(body.error?.message ?? outreachMessages.generic);
        return;
      }
      const parsed = outreachContentSchema.safeParse(body.draft);
      if (!parsed.success) {
        setError(outreachMessages.invalidOutput);
        return;
      }
      if (body.persisted && body.outreach && body.contact) {
        setOverride(body.outreach);
        setChannelChoice(null);
        setMessage(null);
        setSubject(null);
        router.replace(
          `/app/outreach?application=${applicationId}&contact=${encodeURIComponent(body.contact.id)}`,
        );
        router.refresh();
        return;
      }
      const next =
        kind === "regenerate" && review
          ? applyReviewAction(review, { type: "regenerate", content: parsed.data, trace: body.trace })
          : createAwaitingReview(parsed.data, body.trace);
      if (session) persist({ ...session, review: storedReview(contact!.id, next) });
      setChannelChoice(null);
      setMessage(null);
      setSubject(null);
    } catch {
      setError(outreachMessages.generic);
    } finally {
      setPending(false);
    }
  }

  async function decide(action: "approve" | "reject") {
    if (!review) return;
    setError(null);
    if (persisted && "id" in review) {
      const saved = review as SavedOutreach;
      setPending(true);
      try {
        const nextMessage = (message ?? saved.message).trim();
        const nextSubject = activeChannel === "email" ? (subject ?? saved.subject ?? "").trim() : null;
        let current = saved;
        if (nextMessage !== saved.message || nextSubject !== saved.subject) {
          const edited = await fetch(`/api/outreach/${saved.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type: "edit", message: nextMessage, subject: nextSubject }),
          });
          const editedBody = (await edited.json().catch(() => null)) as {
            outreach?: SavedOutreach;
            error?: { message?: string };
          } | null;
          if (!edited.ok || !editedBody?.outreach) {
            setError(editedBody?.error?.message ?? "ApplyPilot couldn’t update this draft. Refresh and try again.");
            return;
          }
          current = editedBody.outreach;
        }
        const response = await fetch(`/api/outreach/${current.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: action }),
        });
        const body = (await response.json().catch(() => null)) as {
          outreach?: SavedOutreach;
          error?: { message?: string };
        } | null;
        if (!response.ok || !body?.outreach) {
          setOverride(current);
          setError(body?.error?.message ?? "ApplyPilot couldn’t update this draft. Refresh and try again.");
          return;
        }
        setOverride(body.outreach);
        setMessage(null);
        setSubject(null);
        router.refresh();
      } catch {
        setError("ApplyPilot couldn’t update this draft. Refresh and try again.");
      } finally {
        setPending(false);
      }
      return;
    }
    try {
      const current = commitEdit(review);
      const next = applyReviewAction(current, { type: action });
      if (session) persist({ ...session, review: storedReview(contact!.id, next) });
      setMessage(null);
      setSubject(null);
    } catch {
      setError("ApplyPilot couldn’t update this draft. Refresh and try again.");
    }
  }

  const locked = review?.status === "approved" || review?.status === "rejected";

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-muted-foreground">
          {contact.source === "demo" ? "Demo contact · " : "Added by you · "}
          {analysis.job.title} at {analysis.job.company}
        </p>
        {notice ? <p className="mt-3 max-w-2xl text-sm text-muted-foreground">{notice}</p> : null}
        <h1 className="mt-1 font-heading text-4xl tracking-tight sm:text-5xl">{contact.name}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {contact.title}
          <span className="px-1.5" aria-hidden="true">
            ·
          </span>
          {contact.company}
        </p>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">
          {relevanceLabels[contact.relevance]}. {contact.relevanceReason}
        </p>
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Channel">
        {(["linkedin", "email"] as const).map((item) => (
          <button
            key={item}
            type="button"
            aria-pressed={channel === item}
            disabled={pending}
            onClick={() => setChannelChoice(item)}
            className={cn(
              "h-10 rounded-full px-4 text-sm",
              channel === item ? "bg-lavender font-medium text-violet" : "bg-secondary text-foreground",
            )}
          >
            {item === "linkedin" ? "LinkedIn message" : "Email"}
          </button>
        ))}
      </div>

      {review && channel !== review.channel ? (
        <p className="text-sm text-muted-foreground">
          Regenerate to draft a {channel === "linkedin" ? "LinkedIn message" : "email"}.
        </p>
      ) : null}

      {pending ? (
        <div aria-live="polite">
          <p className="text-sm text-muted-foreground">
            Drafting outreach. These are the parts of this request, not a live step log.
          </p>
          <ul className="mt-4 space-y-2 text-sm">
            {[
              "Checking contact context",
              "Selecting evidence",
              "Drafting outreach",
              "Validating the draft",
            ].map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {!review && !pending ? (
        <Button type="button" className="h-11 rounded-full px-5" onClick={() => void generate("draft")}>
          Draft outreach
        </Button>
      ) : null}

      {review ? (
        <section className="max-w-2xl space-y-4 rounded-[1.75rem] border border-border bg-card p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-medium">{statusLabel[review.status]}</p>
            {review.humanEdited ? (
              <p className="text-xs text-muted-foreground">Edited by you</p>
            ) : null}
          </div>
          {review.status === "approved" ? (
            <p className="text-sm">Approved by you. ApplyPilot will not send this message.</p>
          ) : null}
          {activeChannel === "email" ? (
            <Input
              aria-label="Subject"
              value={draftSubject ?? ""}
              disabled={locked || pending}
              maxLength={100}
              onChange={(event) => setSubject(event.target.value)}
              className="h-11 rounded-xl px-3"
            />
          ) : null}
          <Textarea
            aria-label="Message"
            value={draftMessage}
            disabled={locked || pending}
            onChange={(event) => setMessage(event.target.value)}
            className="min-h-40 rounded-xl px-3"
          />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-10 rounded-full px-4"
              disabled={pending}
              onClick={() => void generate("regenerate")}
            >
              Regenerate
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-10 rounded-full px-4"
              disabled={pending || review.status !== "awaiting_review"}
              onClick={() => decide("reject")}
            >
              Reject
            </Button>
            <Button
              type="button"
              className="h-10 rounded-full px-4"
              disabled={pending || review.status !== "awaiting_review"}
              onClick={() => decide("approve")}
            >
              Approve
            </Button>
          </div>
        </section>
      ) : null}

      {review ? <AgentTrace trace={review.trace} /> : null}
    </div>
  );
}
