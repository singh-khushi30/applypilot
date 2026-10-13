import { evaluateAnalysis } from "@/lib/agent/evaluator";
import { MAX_CORRECTIONS, type AnalysisStateType, type AnalysisStateUpdate } from "@/lib/agent/state";
import { logAgentEvent, plural, timedNode, traceEvent } from "@/lib/agent/trace";
import { AgentStateError } from "@/lib/ai/errors";

export const EVALUATE_ANALYSIS = "evaluate_analysis";

export function evaluateAnalysisNode(state: AnalysisStateType) {
  const attempt = state.retryCount + 1;
  return timedNode(EVALUATE_ANALYSIS, attempt, (elapsed): AnalysisStateUpdate => {
    if (!state.structuredAnalysis || !state.matchResult) {
      throw new AgentStateError(EVALUATE_ANALYSIS);
    }
    const evaluation = evaluateAnalysis(state.structuredAnalysis, state.matchResult);
    if (!evaluation.passed) {
      logAgentEvent("agent_node", {
        node: EVALUATE_ANALYSIS,
        status: "issues_found",
        attempt,
        issueCodes: evaluation.issues.map((issue) => issue.code),
      });
    }

    return {
      evaluation,
      trace: [
        traceEvent({
          node: EVALUATE_ANALYSIS,
          step: "quality",
          label: "Analysis quality checked",
          attempt,
          status: evaluation.passed ? "completed" : "failed",
          durationMs: elapsed(),
          detail: evaluation.passed
            ? "All checks passed"
            : `${plural(evaluation.issues.length, "issue")} found`,
        }),
      ],
    };
  });
}

export type EvaluationRoute = "prepare_result" | "correct_analysis" | "reject_analysis";

/**
 * Conditional edge after evaluation. A failed analysis gets one corrective
 * pass, and only when the model can fix the issues. Scoring defects are ours,
 * so those are rejected at once.
 */
export function routeAfterEvaluation(state: AnalysisStateType): EvaluationRoute {
  const evaluation = state.evaluation;
  if (evaluation?.passed) return "prepare_result";
  const correctable = evaluation?.issues.every((issue) => issue.correctable) ?? false;
  if (correctable && state.retryCount < MAX_CORRECTIONS) return "correct_analysis";
  return "reject_analysis";
}
