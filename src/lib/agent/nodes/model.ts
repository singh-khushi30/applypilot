import { analysisContentSchema } from "@/lib/ai/schemas/analysis";
import { withStructuredRetry } from "@/lib/ai/structured-output";

/**
 * One raw model request. `correction` is the layer 1 schema-repair message,
 * when one is needed. Tests replace this with a mock.
 */
export type AnalysisModel = (
  prompt: string,
  correction: string | null,
  signal?: AbortSignal,
) => Promise<unknown>;

/** Runs a prompt through retry layer 1 and returns schema-valid content. */
export function requestStructuredAnalysis(
  model: AnalysisModel,
  prompt: string,
  signal?: AbortSignal,
) {
  return withStructuredRetry({
    schema: analysisContentSchema,
    run: (correction) => model(prompt, correction, signal),
  });
}
