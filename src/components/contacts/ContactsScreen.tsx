"use client";

import { PrimaryLink } from "@/components/landing/links";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { parseStoredAnalysis, readAnalysisSnapshot } from "@/lib/analysis/session";
import { demoContacts } from "@/lib/outreach/demo-contacts";
import { outreachMessages } from "@/lib/outreach/messages";
import { classifyContact, relevanceLabels } from "@/lib/outreach/relevance";
import {
  emptyOutreachSession,
  parseOutreachSession,
  readOutreachSnapshot,
  saveOutreachSession,
  subscribeOutreach,
} from "@/lib/outreach/session";
import type { Contact } from "@/types/domain";
import Link from "next/link";
import { useMemo, useState, useSyncExternalStore, type FormEvent } from "react";

const PENDING = "\0pending";

function subscribeAnalysis(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  return () => window.removeEventListener("storage", onStoreChange);
}

function optionalProfileUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "http:" && url.protocol !== "https:") return undefined;
    return trimmed.slice(0, 300);
  } catch {
    return undefined;
  }
}

function ContactCard({ contact }: { contact: Contact }) {
  return (
    <li className="rounded-[1.5rem] border border-border bg-card p-5">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="font-heading text-2xl tracking-tight">{contact.name}</h3>
        {contact.source === "demo" ? (
          <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium tracking-wide text-violet uppercase">
            Demo
          </span>
        ) : (
          <span className="rounded-full bg-powder px-2 py-0.5 text-[11px] font-medium tracking-wide uppercase">
            Added by you
          </span>
        )}
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        {contact.title}
        <span className="px-1.5" aria-hidden="true">
          ·
        </span>
        {contact.company}
      </p>
      <p className="mt-4 text-sm font-medium">{relevanceLabels[contact.relevance]}</p>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">{contact.relevanceReason}</p>
      {contact.context ? (
        <p className="mt-3 text-sm leading-6 text-muted-foreground">{contact.context}</p>
      ) : null}
      <div className="mt-5">
        <Link
          href={`/app/outreach?contact=${encodeURIComponent(contact.id)}`}
          className="inline-flex h-10 items-center rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground"
        >
          Draft outreach
        </Link>
      </div>
    </li>
  );
}

export function ContactsScreen() {
  const analysisRaw = useSyncExternalStore(subscribeAnalysis, readAnalysisSnapshot, () => PENDING);
  const outreachRaw = useSyncExternalStore(subscribeOutreach, readOutreachSnapshot, () => PENDING);
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [context, setContext] = useState("");
  const [profileUrl, setProfileUrl] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const analysis = analysisRaw === PENDING ? null : parseStoredAnalysis(analysisRaw);
  const session = useMemo(() => {
    if (!analysis) return null;
    if (outreachRaw === PENDING) return emptyOutreachSession(analysis.id);
    return parseOutreachSession(outreachRaw, analysis.id);
  }, [analysis, outreachRaw]);

  if (analysisRaw === PENDING || outreachRaw === PENDING) {
    return <p className="text-sm text-muted-foreground">Loading contacts…</p>;
  }

  if (!analysis || !session) {
    return (
      <div className="max-w-xl">
        <h1 className="font-heading text-4xl tracking-tight sm:text-5xl">Contacts</h1>
        <p className="mt-4 text-base leading-7 text-muted-foreground">
          Analyze a job first. ApplyPilot can then help you draft outreach for people you choose.
        </p>
        <div className="mt-8">
          <PrimaryLink href="/app/new">Analyze a job</PrimaryLink>
        </div>
      </div>
    );
  }

  const examples = demoContacts(analysis.job);

  function addPerson(event: FormEvent) {
    event.preventDefault();
    const nextName = name.trim();
    const nextTitle = title.trim();
    const nextCompany = company.trim();
    if (!nextName || !nextTitle || !nextCompany) {
      setFormError(outreachMessages.invalidContact);
      return;
    }
    const url = optionalProfileUrl(profileUrl);
    if (url === undefined) {
      setFormError("Enter a full profile URL starting with https://, or leave it blank.");
      return;
    }
    const relevance = classifyContact({
      jobTitle: analysis!.job.title,
      jobCompany: analysis!.job.company,
      personTitle: nextTitle,
      personCompany: nextCompany,
    });
    const contact: Contact = {
      id: crypto.randomUUID(),
      source: "manual",
      name: nextName,
      title: nextTitle,
      company: nextCompany,
      context: context.trim() ? context.trim().slice(0, 500) : null,
      profileUrl: url,
      ...relevance,
    };
    saveOutreachSession({
      ...session!,
      manualContacts: [...session!.manualContacts, contact].slice(0, 20),
    });
    setName("");
    setTitle("");
    setCompany("");
    setContext("");
    setProfileUrl("");
    setFormError(null);
  }

  return (
    <div className="space-y-10">
      <div>
        <p className="text-sm text-muted-foreground">{analysis.job.company}</p>
        <h1 className="mt-1 font-heading text-4xl tracking-tight sm:text-5xl">Contacts</h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
          People for the {analysis.job.title} role. Example contacts are fictional. Anyone you add
          is stored only in this browser session. ApplyPilot does not look people up.
        </p>
      </div>

      <section>
        <h2 className="font-heading text-3xl tracking-tight">Example contacts</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Demo data for this role. These are not live-discovered people.
        </p>
        <ul className="mt-5 grid gap-3 lg:grid-cols-3">
          {examples.map((contact) => (
            <ContactCard key={contact.id} contact={contact} />
          ))}
        </ul>
      </section>

      <section className="max-w-xl">
        <h2 className="font-heading text-3xl tracking-tight">Add person manually</h2>
        <form className="mt-5 space-y-3" onSubmit={addPerson}>
          <Input
            aria-label="Name"
            placeholder="Name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={80}
            className="h-11 rounded-xl px-3"
          />
          <Input
            aria-label="Job title"
            placeholder="Job title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={120}
            className="h-11 rounded-xl px-3"
          />
          <Input
            aria-label="Company"
            placeholder="Company"
            value={company}
            onChange={(event) => setCompany(event.target.value)}
            maxLength={120}
            className="h-11 rounded-xl px-3"
          />
          <Textarea
            aria-label="Context"
            placeholder="Optional context. ApplyPilot will not treat this as verified facts."
            value={context}
            onChange={(event) => setContext(event.target.value)}
            maxLength={500}
            className="min-h-24 rounded-xl px-3"
          />
          <Input
            aria-label="Profile URL"
            placeholder="Optional profile URL"
            value={profileUrl}
            onChange={(event) => setProfileUrl(event.target.value)}
            maxLength={300}
            className="h-11 rounded-xl px-3"
          />
          {formError ? <p className="text-sm text-destructive">{formError}</p> : null}
          <Button type="submit" className="h-11 rounded-full px-5">
            Add person
          </Button>
        </form>
      </section>

      <section>
        <h2 className="font-heading text-3xl tracking-tight">People you added</h2>
        {session.manualContacts.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No one added in this session yet.</p>
        ) : (
          <ul className="mt-5 grid gap-3 lg:grid-cols-2">
            {session.manualContacts.map((contact) => (
              <ContactCard key={contact.id} contact={contact} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
