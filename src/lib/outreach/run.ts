import "server-only";

import { runOutreachGeneration } from "@/lib/agent/outreach-graph";
import { AnalysisServiceError } from "@/lib/ai/errors";
import { generateOutreachContent } from "@/lib/ai/gemini";
import { outreachMessages } from "@/lib/outreach/messages";
import { relevanceLabels } from "@/lib/outreach/relevance";
import type { Contact, OutreachChannel } from "@/types/domain";
import { MemorySaver } from "@langchain/langgraph";

const RUN_BUDGET_MS = 40_000;

export async function draftOutreach(input: {
  channel: OutreachChannel;
  contact: Pick<Contact, "name" | "title" | "company" | "context" | "relevance">;
  candidatePoints: string[];
  jobPoints: string[];
}) {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    const development = process.env.NODE_ENV !== "production";
    throw new AnalysisServiceError(
      development ? "missing_api_key" : "unavailable",
      development ? outreachMessages.missingApiKey : outreachMessages.generic,
    );
  }

  const signal = AbortSignal.timeout(RUN_BUDGET_MS);
  try {
    return await runOutreachGeneration(
      {
        channel: input.channel,
        contact: {
          name: input.contact.name,
          title: input.contact.title,
          company: input.contact.company,
          context: input.contact.context,
          relevanceLabel: relevanceLabels[input.contact.relevance],
        },
        candidatePoints: input.candidatePoints,
        jobPoints: input.jobPoints,
      },
      {
        model: (prompt, correction, callSignal) =>
          generateOutreachContent(apiKey, prompt, correction, callSignal),
        checkpointer: new MemorySaver(),
        signal,
      },
    );
  } catch (error) {
    if (signal.aborted && !(error instanceof AnalysisServiceError)) {
      throw new AnalysisServiceError("unavailable", outreachMessages.generic);
    }
    if (error instanceof AnalysisServiceError && error.code !== "missing_api_key") {
      throw new AnalysisServiceError(
        error.code === "rate_limit" ? "rate_limit" : "unavailable",
        error.code === "rate_limit" ? outreachMessages.rateLimit : outreachMessages.generic,
      );
    }
    throw error;
  }
}
