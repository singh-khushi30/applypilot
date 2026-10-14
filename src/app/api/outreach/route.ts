import {
  AnalysisServiceError,
  ModelOutputValidationError,
  OutreachInputError,
} from "@/lib/ai/errors";
import { selectOutreachEvidence } from "@/lib/outreach/evidence";
import { outreachMessages } from "@/lib/outreach/messages";
import { draftOutreach } from "@/lib/outreach/run";
import { z } from "zod";

export const maxDuration = 60;

const requestSchema = z.object({
  channel: z.enum(["linkedin", "email"]),
  contact: z.object({
    name: z.string().trim().min(1).max(80),
    title: z.string().trim().min(1).max(120),
    company: z.string().trim().min(1).max(120),
    context: z.string().trim().max(500).nullable(),
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

    const evidence = selectOutreachEvidence(parsed.data.analysis);
    if (evidence.jobPoints.length === 0) {
      throw new OutreachInputError("invalid_context", outreachMessages.invalidContext);
    }

    const generated = await draftOutreach({
      channel: parsed.data.channel,
      contact: parsed.data.contact,
      candidatePoints: evidence.candidatePoints,
      jobPoints: evidence.jobPoints,
    });

    return Response.json({
      draft: generated.content,
      trace: generated.trace,
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
    console.error(JSON.stringify({ event: "outreach_failed", code: "generic" }));
    return errorResponse(500, "generic", outreachMessages.generic);
  }
}
