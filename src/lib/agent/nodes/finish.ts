import type { AnalysisStateType, AnalysisStateUpdate } from "@/lib/agent/state";
import { plural, timedNode, traceEvent } from "@/lib/agent/trace";
import { AgentStateError } from "@/lib/ai/errors";
import { toAnalysis } from "@/lib/analysis/to-analysis";

export const PREPARE_RESULT = "prepare_result";
export const REJECT_ANALYSIS = "reject_analysis";

export function createPrepareResultNode(createId: () => string) {
  return (state: AnalysisStateType) => {
    const attempt = state.retryCount + 1;
    return timedNode(PREPARE_RESULT, attempt, (elapsed): AnalysisStateUpdate => {
      if (!state.structuredAnalysis || !state.matchResult) {
        throw new AgentStateError(PREPARE_RESULT);
      }
      const content = state.structuredAnalysis;
      const event = traceEvent({
        node: PREPARE_RESULT,
        step: "recommendation",
        label: "Recommendation prepared",
        attempt,
        durationMs: elapsed(),
        detail: `${plural(content.gaps.length, "gap")} · ${plural(
          content.recommendation.nextSteps.length,
          "next step",
        )}`,
      });

      return {
        finalAnalysis: toAnalysis(content, state.matchResult, [...state.trace, event], {
          id: createId(),
          company: state.company,
          roleTitle: state.roleTitle,
        }),
        trace: [event],
      };
    });
  };
}

/** Terminal node when evaluation still fails after the corrective pass. */
export function rejectAnalysisNode(state: AnalysisStateType) {
  const attempt = state.retryCount + 1;
  return timedNode(REJECT_ANALYSIS, attempt, (): AnalysisStateUpdate => ({
    failure: {
      code: "evaluation_failed",
      issueCodes: state.evaluation?.issues.map((issue) => issue.code) ?? [],
    },
    trace: [
      traceEvent({
        node: REJECT_ANALYSIS,
        step: "rejected",
        label: "Analysis rejected",
        attempt,
        status: "failed",
      }),
    ],
  }));
}
