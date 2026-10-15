import { storedAnalysisSchema, type StoredAnalysis } from "@/lib/analysis/stored-analysis";
import type { OutreachContent } from "@/lib/ai/schemas/outreach";
import type { OutreachReview } from "@/lib/outreach/review";
import type {
  ApplicationStatus,
  Contact,
  ContactRelevance,
  ContactSource,
  MatchLabel,
  OutreachChannel,
} from "@/types/domain";
import { z } from "zod";

const unspecified = "Not specified";

export type SavedApplication = {
  id: string;
  company: string;
  roleTitle: string;
  location: string | null;
  employmentType: string | null;
  status: ApplicationStatus;
  matchScore: number | null;
  matchLabel: MatchLabel | null;
  sourceUrl: string | null;
  createdAt: string;
};

export type AnalysisBundle = {
  application: {
    id: string;
    company: string;
    roleTitle: string;
    location: string | null;
    employmentType: string | null;
    status: "ready";
    matchScore: number;
    matchLabel: MatchLabel;
    sourceUrl: null;
  };
  analysis: {
    id: string;
    applicationId: string;
    roleSummary: string | null;
    matchScore: number;
    matchLabel: MatchLabel;
    breakdown: StoredAnalysis["match"];
    alignments: StoredAnalysis["alignments"];
    gaps: StoredAnalysis["gaps"];
    recommendation: string;
    nextSteps: string[];
    trace: StoredAnalysis["trace"];
  };
};

function emptyToNull(value: string) {
  return value === unspecified ? null : value;
}

function nullToLabel(value: string | null) {
  return value?.trim() ? value : unspecified;
}

export function toAnalysisBundle(analysis: StoredAnalysis): AnalysisBundle {
  return {
    application: {
      id: analysis.id,
      company: analysis.job.company,
      roleTitle: analysis.job.title,
      location: emptyToNull(analysis.job.location),
      employmentType: emptyToNull(analysis.job.employmentType),
      status: "ready",
      matchScore: analysis.match.overall,
      matchLabel: analysis.match.label,
      sourceUrl: null,
    },
    analysis: {
      id: analysis.id,
      applicationId: analysis.id,
      roleSummary: analysis.summary,
      matchScore: analysis.match.overall,
      matchLabel: analysis.match.label,
      breakdown: analysis.match,
      alignments: analysis.alignments,
      gaps: analysis.gaps,
      recommendation: analysis.recommendation,
      nextSteps: analysis.nextSteps,
      trace: analysis.trace,
    },
  };
}

const rowAnalysisSchema = z.object({
  id: z.string().uuid(),
  application_id: z.string().uuid(),
  role_summary: z.string().nullable(),
  match_score: z.number().int(),
  match_label: z.enum(["Strong Match", "Potential Match", "Stretch"]),
  breakdown: z.unknown(),
  alignments: z.unknown(),
  gaps: z.unknown(),
  recommendation: z.string(),
  next_steps: z.unknown(),
  safe_trace: z.unknown(),
});

const rowApplicationSchema = z.object({
  id: z.string().uuid(),
  company: z.string(),
  role_title: z.string(),
  location: z.string().nullable(),
  employment_type: z.string().nullable(),
  status: z.enum([
    "analyzing",
    "ready",
    "outreach",
    "applied",
    "interview",
    "offer",
    "rejected",
    "archived",
  ]),
  match_score: z.number().int().nullable(),
  match_label: z.enum(["Strong Match", "Potential Match", "Stretch"]).nullable(),
  source_url: z.string().nullable(),
  created_at: z.string(),
});

export function applicationFromRow(row: unknown): SavedApplication | null {
  const parsed = rowApplicationSchema.safeParse(row);
  if (!parsed.success) return null;
  return {
    id: parsed.data.id,
    company: parsed.data.company,
    roleTitle: parsed.data.role_title,
    location: parsed.data.location,
    employmentType: parsed.data.employment_type,
    status: parsed.data.status,
    matchScore: parsed.data.match_score,
    matchLabel: parsed.data.match_label,
    sourceUrl: parsed.data.source_url,
    createdAt: parsed.data.created_at,
  };
}

export function analysisFromRows(application: unknown, analysis: unknown): StoredAnalysis | null {
  const app = rowApplicationSchema.safeParse(application);
  const row = rowAnalysisSchema.safeParse(analysis);
  if (!app.success || !row.success || app.data.id !== row.data.application_id) return null;

  const stored = storedAnalysisSchema.safeParse({
    id: app.data.id,
    demo: false,
    summary: row.data.role_summary,
    job: {
      title: app.data.role_title,
      company: app.data.company,
      location: nullToLabel(app.data.location),
      employmentType: nullToLabel(app.data.employment_type),
    },
    match: row.data.breakdown,
    alignments: row.data.alignments,
    gaps: row.data.gaps,
    recommendation: row.data.recommendation,
    nextSteps: row.data.next_steps,
    trace: row.data.safe_trace,
  });
  if (!stored.success) return null;
  if (stored.data.match.overall !== row.data.match_score) return null;
  if (stored.data.match.label !== row.data.match_label) return null;
  return stored.data;
}

const contactRowSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  title: z.string(),
  company: z.string(),
  context: z.string().nullable(),
  profile_url: z.string().nullable(),
  relevance: z.enum([
    "hiring_manager",
    "recruiter",
    "engineering_leader",
    "potential_teammate",
    "low_relevance",
  ]),
  relevance_reason: z.string(),
  source: z.enum(["manual", "demo"]),
});

export function contactFromRow(row: unknown): Contact | null {
  const parsed = contactRowSchema.safeParse(row);
  if (!parsed.success) return null;
  return {
    id: parsed.data.id,
    name: parsed.data.name,
    title: parsed.data.title,
    company: parsed.data.company,
    context: parsed.data.context,
    profileUrl: parsed.data.profile_url,
    relevance: parsed.data.relevance,
    relevanceReason: parsed.data.relevance_reason,
    source: parsed.data.source,
  };
}

export type ContactDraft = {
  name: string;
  title: string;
  company: string;
  context: string | null;
  profileUrl: string | null;
  relevance: ContactRelevance;
  relevanceReason: string;
  source: ContactSource;
};

const groundingSchema = z.object({
  candidatePointsUsed: z.array(z.string().max(160)).max(2),
  jobPointsUsed: z.array(z.string().max(160)).max(2),
});

const outreachRowSchema = z.object({
  id: z.string().uuid(),
  contact_id: z.string().uuid().nullable(),
  channel: z.enum(["linkedin", "email"]),
  subject: z.string().nullable(),
  message: z.string(),
  original_message: z.string(),
  original_subject: z.string().nullable(),
  status: z.enum(["awaiting_review", "approved", "rejected"]),
  human_edited: z.boolean(),
  grounding: z.unknown(),
  safe_trace: z.unknown(),
});

export type SavedOutreach = OutreachReview & {
  id: string;
  contactId: string | null;
};

export function outreachFromRow(row: unknown): SavedOutreach | null {
  const parsed = outreachRowSchema.safeParse(row);
  if (!parsed.success) return null;
  const grounding = groundingSchema.safeParse(parsed.data.grounding);
  const trace = storedAnalysisSchema.shape.trace.safeParse(parsed.data.safe_trace);
  if (!grounding.success || !trace.success) return null;
  return {
    id: parsed.data.id,
    contactId: parsed.data.contact_id,
    status: parsed.data.status,
    channel: parsed.data.channel,
    subject: parsed.data.subject,
    message: parsed.data.message,
    originalMessage: parsed.data.original_message,
    originalSubject: parsed.data.original_subject,
    humanEdited: parsed.data.human_edited,
    grounding: grounding.data,
    trace: trace.data,
  };
}

export function toOutreachUpdate(review: OutreachReview) {
  return {
    channel: review.channel,
    subject: review.subject,
    message: review.message,
    original_message: review.originalMessage,
    original_subject: review.originalSubject,
    status: review.status,
    human_edited: review.humanEdited,
    grounding: review.grounding,
    safe_trace: review.trace,
  };
}

export function outreachInsert(input: {
  applicationId: string;
  contactId: string;
  content: OutreachContent;
  trace: OutreachReview["trace"];
}) {
  return {
    application_id: input.applicationId,
    contact_id: input.contactId,
    channel: input.content.channel satisfies OutreachChannel,
    subject: input.content.subject,
    message: input.content.message,
    original_message: input.content.message,
    original_subject: input.content.subject,
    status: "awaiting_review" as const,
    human_edited: false,
    grounding: input.content.grounding,
    safe_trace: input.trace,
  };
}
