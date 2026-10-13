import "server-only";

import { runAnalysisGraph } from "@/lib/agent/analysis-graph";
import type { AnalysisInput } from "@/lib/agent/state";
import { AnalysisServiceError } from "@/lib/ai/errors";
import { generateAnalysisContent } from "@/lib/ai/gemini";
import { logValidationFailure, validationIssueMetadata } from "@/lib/ai/validation-log";
import { analysisMessages } from "@/lib/analysis/messages";
import { storedAnalysisSchema } from "@/lib/analysis/stored-analysis";

// Overall budget for every model call in one run, inside the route's 60s limit.
const RUN_BUDGET_MS = 55_000;

/** Server entry point: wires Gemini into the agent graph and checks the result. */
export async function analyzeJobFit(input: AnalysisInput) {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    const development = process.env.NODE_ENV !== "production";
    throw new AnalysisServiceError(
      development ? "missing_api_key" : "unavailable",
      development ? analysisMessages.missingApiKey : analysisMessages.generic,
    );
  }

  const signal = AbortSignal.timeout(RUN_BUDGET_MS);
  let analysis;
  try {
    analysis = await runAnalysisGraph(input, {
      model: (prompt, correction, callSignal) =>
        generateAnalysisContent(apiKey, prompt, correction, callSignal),
      signal,
    });
  } catch (error) {
    // LangGraph throws its own abort error between nodes once the budget is spent.
    if (signal.aborted && !(error instanceof AnalysisServiceError)) {
      throw new AnalysisServiceError("unavailable", analysisMessages.generic);
    }
    throw error;
  }

  const stored = storedAnalysisSchema.safeParse(analysis);
  if (!stored.success) {
    logValidationFailure(0, validationIssueMetadata(stored.error));
    throw new AnalysisServiceError("generic", analysisMessages.generic);
  }
  return stored.data;
}
