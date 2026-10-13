import "server-only";

import { AnalysisServiceError, ModelOutputValidationError } from "@/lib/ai/errors";
import { ANALYSIS_SYSTEM_PROMPT } from "@/lib/ai/prompts/analysis";
import { analysisContentSchema } from "@/lib/ai/schemas/analysis";
import { analysisMessages } from "@/lib/analysis/messages";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

export const GEMINI_MODEL = "gemini-2.5-flash";

// Per-request cap. The agent run also passes its own overall deadline.
const ATTEMPT_TIMEOUT_MS = 25_000;

function readStatus(error: unknown) {
  if (typeof error !== "object" || !error) return undefined;
  if ("status" in error && typeof error.status === "number") return error.status;
  if ("statusCode" in error && typeof error.statusCode === "number") return error.statusCode;
  return undefined;
}

export function mapProviderError(error: unknown) {
  const status = readStatus(error);
  if (status === 429) return new AnalysisServiceError("rate_limit", analysisMessages.rateLimit);
  if (status === 401 || status === 403 || status === 500 || status === 503) {
    return new AnalysisServiceError("unavailable", analysisMessages.generic);
  }

  const message = error instanceof Error ? `${error.name} ${error.message}` : "";
  if (/RESOURCE_EXHAUSTED|\b429\b|rate limit|quota/i.test(message)) {
    return new AnalysisServiceError("rate_limit", analysisMessages.rateLimit);
  }
  if (/API key|permission denied|UNAVAILABLE|ECONN|fetch failed|\b503\b|abort|timeout/i.test(message)) {
    return new AnalysisServiceError("unavailable", analysisMessages.generic);
  }
  return new AnalysisServiceError("generic", analysisMessages.generic);
}

function parseJsonText(text: string): unknown {
  const trimmed = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");
  try {
    return JSON.parse(trimmed);
  } catch {
    throw new ModelOutputValidationError("Model output was not JSON.");
  }
}

/**
 * Calls Gemini with the Zod schema as a response schema and returns the
 * unvalidated JSON. The caller always validates it with Zod, so the retry
 * prompt can name the exact schema paths that failed.
 */
export async function generateAnalysisContent(
  apiKey: string,
  prompt: string,
  correction: string | null,
  signal?: AbortSignal,
): Promise<unknown> {
  const model = new ChatGoogleGenerativeAI({
    model: GEMINI_MODEL,
    apiKey,
    temperature: 0,
    maxOutputTokens: 8192,
    maxRetries: 1,
    thinkingConfig: {
      includeThoughts: false,
      thinkingBudget: 0,
    },
  });
  const structured = model.withStructuredOutput(analysisContentSchema, {
    name: "job_analysis",
    includeRaw: true,
  });
  const messages = [new SystemMessage(ANALYSIS_SYSTEM_PROMPT), new HumanMessage(prompt)];
  if (correction) messages.push(new HumanMessage(correction));

  let result: Awaited<ReturnType<typeof structured.invoke>>;
  try {
    const timeout = AbortSignal.timeout(ATTEMPT_TIMEOUT_MS);
    result = await structured.invoke(messages, {
      signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
    });
  } catch (error) {
    throw mapProviderError(error);
  }

  if (result.parsed) return result.parsed;
  return parseJsonText(result.raw.text);
}
