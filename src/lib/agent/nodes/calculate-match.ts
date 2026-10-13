import type { AnalysisStateType, AnalysisStateUpdate } from "@/lib/agent/state";
import { timedNode, traceEvent } from "@/lib/agent/trace";
import { AgentStateError } from "@/lib/ai/errors";
import { calculateMatch } from "@/lib/analysis/calculate-match";

export const CALCULATE_MATCH = "calculate_match";

/** Deterministic scoring. No model call. */
export function calculateMatchNode(state: AnalysisStateType) {
  const attempt = state.retryCount + 1;
  return timedNode(CALCULATE_MATCH, attempt, (elapsed): AnalysisStateUpdate => {
    if (!state.structuredAnalysis) throw new AgentStateError(CALCULATE_MATCH);
    const match = calculateMatch(state.structuredAnalysis);

    return {
      matchResult: match,
      trace: [
        traceEvent({
          node: CALCULATE_MATCH,
          step: "score",
          label: "Match score calculated",
          attempt,
          durationMs: elapsed(),
          detail: `${match.overall}% · ${match.label}`,
        }),
      ],
    };
  });
}
