import {
  AnalysisServiceError,
  ModelOutputValidationError,
  OutreachInputError,
} from "@/lib/ai/errors";
import { persistenceResponse } from "@/lib/persistence/api";
import { selectOutreachEvidence } from "@/lib/outreach/evidence";
import { classifyContact } from "@/lib/outreach/relevance";
import { outreachMessages } from "@/lib/outreach/messages";
import { draftOutreach } from "@/lib/outreach/run";
import { loadStoredAnalysis } from "@/lib/supabase/repositories/analyses";
import { saveContact } from "@/lib/supabase/repositories/contacts";
import { saveGeneratedOutreach } from "@/lib/supabase/repositories/outreach";
import { PersistenceConfigError, PersistenceError } from "@/lib/supabase/errors";
import { z } from "zod";

export const maxDuration = 60;

const requestSchema = z.object({
  channel: z.enum(["linkedin", "email"]),
  applicationId: z.string().uuid().nullable(),
  contact: z.object({
    name: z.string().trim().min(1).max(80),
    title: z.string().trim().min(1).max(120),
    company: z.string().trim().min(1).max(120),
    context: z.string().trim().max(500).nullable(),
    profileUrl: z.string().trim().max(300).nullable(),
    source: z.enum(["manual", "demo"]),
    relevance: z.enum([
      "hiring_manager",
      "recruiter",
      "engineering_leader",
      "potential_teammate",
      "low_relevance",
    ]),
  }),
  analysis: z.object({
    job: z.object({
      title: z.string().trim().min(1).max(160),
      company: z.string().trim().min(1).max(160),
    }),
    summary: z.string().trim().max(800).nullable(),
    alignments: z
      .array(
        z.object({
          skill: z.string().trim().min(1).max(80),
          evidence: z.string().trim().min(1).max(300),
        }),
      )
      .max(8),
  }),
});

function errorResponse(status: number, code: string, message: string) {
  return Response.json({ error: { code, message } }, { status });
}

export async function POST(request: Request) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      throw new OutreachInputError("invalid_request", outreachMessages.invalidContact);
    }
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      throw new OutreachInputError("invalid_request", outreachMessages.invalidContact);
    }

    const savedAnalysis = parsed.data.applicationId
      ? await loadStoredAnalysis(parsed.data.applicationId)
      : null;
    if (parsed.data.applicationId && !savedAnalysis) {
      return errorResponse(404, "not_found", "That saved analysis could not be found.");
    }
    const evidenceSource = savedAnalysis ?? {
      job: parsed.data.analysis.job,
      summary: parsed.data.analysis.summary,
      alignments: parsed.data.analysis.alignments,
    };
    const evidence = selectOutreachEvidence(evidenceSource);
    if (evidence.jobPoints.length === 0) {
      throw new OutreachInputError("invalid_context", outreachMessages.invalidContext);
    }

    const generated = await draftOutreach({
      channel: parsed.data.channel,
      contact: parsed.data.contact,
      candidatePoints: evidence.candidatePoints,
      jobPoints: evidence.jobPoints,
    });

    if (!parsed.data.applicationId || !savedAnalysis) {
      return Response.json({
        draft: generated.content,
        trace: generated.trace,
        persisted: false,
      });
    }

    const relevance = classifyContact({
      jobTitle: savedAnalysis.job.title,
      jobCompany: savedAnalysis.job.company,
      personTitle: parsed.data.contact.title,
      personCompany: parsed.data.contact.company,
    });
    const contact = await saveContact(parsed.data.applicationId, {
      name: parsed.data.contact.name,
      title: parsed.data.contact.title,
      company: parsed.data.contact.company,
      context: parsed.data.contact.context,
      profileUrl: parsed.data.contact.profileUrl,
      source: parsed.data.contact.source,
      ...relevance,
    });
    if (!contact) return errorResponse(404, "not_found", "That saved analysis could not be found.");
    const outreach = await saveGeneratedOutreach({
      applicationId: parsed.data.applicationId,
      contactId: contact.id,
      content: generated.content,
      trace: generated.trace,
    });

    return Response.json({
      draft: generated.content,
      trace: generated.trace,
      persisted: true,
      contact,
      outreach,
    });
  } catch (error) {
    if (error instanceof OutreachInputError) {
      return errorResponse(400, error.code, error.message);
    }
    if (error instanceof ModelOutputValidationError) {
      console.error(JSON.stringify({ event: "outreach_failed", code: error.code }));
      return errorResponse(502, error.code, outreachMessages.invalidOutput);
    }
    if (error instanceof AnalysisServiceError) {
      console.error(JSON.stringify({ event: "outreach_failed", code: error.code }));
      const status = error.code === "missing_api_key" ? 503 : error.code === "rate_limit" ? 429 : 503;
      return errorResponse(status, error.code, error.message);
    }
    if (error instanceof PersistenceConfigError || error instanceof PersistenceError) {
      return persistenceResponse(error);
    }
    console.error(JSON.stringify({ event: "outreach_failed", code: "generic" }));
    return errorResponse(500, "generic", outreachMessages.generic);
  }
}
