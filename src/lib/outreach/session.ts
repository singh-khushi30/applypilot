import { EMAIL_MESSAGE_MAX, EMAIL_SUBJECT_MAX } from "@/lib/ai/schemas/outreach";
import type { OutreachReview } from "@/lib/outreach/review";
import { z } from "zod";

export const OUTREACH_SESSION_KEY = "applypilot.outreach.v1";
const CHANGE_EVENT = "applypilot-outreach-change";

const contactSchema = z.object({
  id: z.string().min(1).max(80),
  source: z.enum(["demo", "manual"]),
  name: z.string().min(1).max(80),
  title: z.string().min(1).max(120),
  company: z.string().min(1).max(120),
  context: z.string().max(500).nullable(),
  profileUrl: z.string().max(300).nullable(),
  relevance: z.enum([
    "hiring_manager",
    "recruiter",
    "engineering_leader",
    "potential_teammate",
    "low_relevance",
  ]),
  relevanceReason: z.string().min(1).max(240),
});

const traceSchema = z.object({
  id: z.string().min(1).max(40),
  node: z.string().min(1).max(40),
  label: z.string().min(1).max(80),
  status: z.enum(["completed", "failed"]),
  attempt: z.number().int().min(1).max(3),
  durationMs: z.number().int().min(0).nullable(),
  detail: z.string().max(120).nullable(),
});

const reviewSchema = z.object({
  contactId: z.string().min(1).max(80),
  status: z.enum(["awaiting_review", "approved", "rejected"]),
  channel: z.enum(["linkedin", "email"]),
  subject: z.string().max(EMAIL_SUBJECT_MAX).nullable(),
  message: z.string().min(1).max(EMAIL_MESSAGE_MAX),
  originalMessage: z.string().min(1).max(EMAIL_MESSAGE_MAX),
  originalSubject: z.string().max(EMAIL_SUBJECT_MAX).nullable(),
  humanEdited: z.boolean(),
  grounding: z.object({
    candidatePointsUsed: z.array(z.string().max(160)).max(2),
    jobPointsUsed: z.array(z.string().max(160)).max(2),
  }),
  trace: z.array(traceSchema).max(16),
});

const sessionSchema = z.object({
  analysisId: z.string().min(1).max(80),
  manualContacts: z.array(contactSchema).max(20),
  review: reviewSchema.nullable(),
});

export type StoredOutreachReview = z.infer<typeof reviewSchema>;
export type OutreachSession = z.infer<typeof sessionSchema>;

export function emptyOutreachSession(analysisId: string): OutreachSession {
  return { analysisId, manualContacts: [], review: null };
}

export function parseOutreachSession(raw: string, analysisId: string): OutreachSession {
  if (!raw) return emptyOutreachSession(analysisId);
  try {
    const parsed = sessionSchema.safeParse(JSON.parse(raw));
    if (!parsed.success || parsed.data.analysisId !== analysisId) {
      return emptyOutreachSession(analysisId);
    }
    return parsed.data;
  } catch {
    return emptyOutreachSession(analysisId);
  }
}

export function reviewFromStored(stored: StoredOutreachReview): OutreachReview {
  return {
    status: stored.status,
    channel: stored.channel,
    subject: stored.subject,
    message: stored.message,
    originalMessage: stored.originalMessage,
    originalSubject: stored.originalSubject,
    humanEdited: stored.humanEdited,
    grounding: stored.grounding,
    trace: stored.trace,
  };
}

export function storedReview(contactId: string, review: OutreachReview): StoredOutreachReview {
  return { contactId, ...review };
}

export function readOutreachSnapshot() {
  return sessionStorage.getItem(OUTREACH_SESSION_KEY) ?? "";
}

export function saveOutreachSession(session: OutreachSession) {
  sessionStorage.setItem(OUTREACH_SESSION_KEY, JSON.stringify(session));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function subscribeOutreach(onStoreChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

