import { requestStructuredAnalysis, type AnalysisModel } from "@/lib/agent/nodes/model";
import type { AnalysisStateType, AnalysisStateUpdate } from "@/lib/agent/state";
import { plural, timedNode, traceEvent } from "@/lib/agent/trace";
import { AgentStateError } from "@/lib/ai/errors";
import { buildCorrectiveAnalysisPrompt } from "@/lib/ai/prompts/analysis";
import type { LangGraphRunnableConfig } from "@langchain/langgraph";

export const CORRECT_ANALYSIS = "correct_analysis";

/**
 * Retry layer 2: one corrective pass for a schema-valid analysis that failed
 * evaluation. The new output goes back through Zod (layer 1), scoring, and
 * evaluation.
 */
export function createCorrectAnalysisNode(model: AnalysisModel) {
  return (state: AnalysisStateType, config: LangGraphRunnableConfig) => {
    const attempt = state.retryCount + 2;
    return timedNode(CORRECT_ANALYSIS, attempt, async (elapsed): Promise<AnalysisStateUpdate> => {
      if (!state.structuredAnalysis || !state.evaluation) {
        throw new AgentStateError(CORRECT_ANALYSIS);
      }
      const issues = state.evaluation.issues;
      const { value } = await requestStructuredAnalysis(
        model,
        buildCorrectiveAnalysisPrompt(state, state.structuredAnalysis, issues),
        config.signal,
      );

      return {
        structuredAnalysis: value,
        matchResult: null,
        evaluation: null,
        retryCount: state.retryCount + 1,
        trace: [
          traceEvent({
            node: CORRECT_ANALYSIS,
            step: "correction",
            label: "Analysis corrected",
            attempt,
            durationMs: elapsed(),
            detail: `${plural(issues.length, "issue")} sent for correction`,
          }),
        ],
      };
    });
  };
}
