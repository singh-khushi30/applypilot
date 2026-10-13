import { CALCULATE_MATCH, calculateMatchNode } from "@/lib/agent/nodes/calculate-match";
import { CORRECT_ANALYSIS, createCorrectAnalysisNode } from "@/lib/agent/nodes/correct-analysis";
import {
  EVALUATE_ANALYSIS,
  evaluateAnalysisNode,
  routeAfterEvaluation,
} from "@/lib/agent/nodes/evaluate-analysis";
import {
  createPrepareResultNode,
  PREPARE_RESULT,
  REJECT_ANALYSIS,
  rejectAnalysisNode,
} from "@/lib/agent/nodes/finish";
import type { AnalysisModel } from "@/lib/agent/nodes/model";
import {
  createStructureAndCompareNode,
  STRUCTURE_AND_COMPARE,
} from "@/lib/agent/nodes/structure-and-compare";
import { AnalysisState, initialState, type AnalysisInput } from "@/lib/agent/state";
import { logAgentEvent, traceEvent } from "@/lib/agent/trace";
import { AgentStateError, AnalysisQualityError } from "@/lib/ai/errors";
import { analysisMessages } from "@/lib/analysis/messages";
import type { Analysis } from "@/types/domain";
import { END, START, StateGraph } from "@langchain/langgraph";

// The longest path is 7 node runs (structure, score, evaluate, correct,
// score, evaluate, finish). This stops a wiring mistake from looping.
const RECURSION_LIMIT = 12;

export type AnalysisGraphDeps = {
  model: AnalysisModel;
  createId?: () => string;
};

/**
 * START → structure_and_compare → calculate_match → evaluate_analysis
 *   evaluate_analysis ─passed──────────────→ prepare_result → END
 *   evaluate_analysis ─failed, retries left→ correct_analysis → calculate_match
 *   evaluate_analysis ─failed, no retries──→ reject_analysis → END
 */
export function createAnalysisGraph(deps: AnalysisGraphDeps) {
  return new StateGraph(AnalysisState)
    .addNode(STRUCTURE_AND_COMPARE, createStructureAndCompareNode(deps.model))
    .addNode(CALCULATE_MATCH, calculateMatchNode)
    .addNode(EVALUATE_ANALYSIS, evaluateAnalysisNode)
    .addNode(CORRECT_ANALYSIS, createCorrectAnalysisNode(deps.model))
    .addNode(PREPARE_RESULT, createPrepareResultNode(deps.createId ?? (() => crypto.randomUUID())))
    .addNode(REJECT_ANALYSIS, rejectAnalysisNode)
    .addEdge(START, STRUCTURE_AND_COMPARE)
    .addEdge(STRUCTURE_AND_COMPARE, CALCULATE_MATCH)
    .addEdge(CALCULATE_MATCH, EVALUATE_ANALYSIS)
    .addConditionalEdges(EVALUATE_ANALYSIS, routeAfterEvaluation, [
      PREPARE_RESULT,
      CORRECT_ANALYSIS,
      REJECT_ANALYSIS,
    ])
    .addEdge(CORRECT_ANALYSIS, CALCULATE_MATCH)
    .addEdge(PREPARE_RESULT, END)
    .addEdge(REJECT_ANALYSIS, END)
    .compile();
}

/** Runs the analysis workflow and returns the final client-safe analysis. */
export async function runAnalysisGraph(
  input: AnalysisInput,
  deps: AnalysisGraphDeps & { signal?: AbortSignal },
): Promise<Analysis> {
  const started = performance.now();
  const durationMs = () => Math.round(performance.now() - started);
  const state = initialState(input);
  state.trace = [
    traceEvent({ node: "input", step: "resume", label: "Resume text received", attempt: 1 }),
  ];

  try {
    const result = await createAnalysisGraph(deps).invoke(state, {
      recursionLimit: RECURSION_LIMIT,
      signal: deps.signal,
    });

    if (result.failure) {
      logAgentEvent("agent_run", {
        status: "failed",
        errorCode: result.failure.code,
        corrections: result.retryCount,
        issueCodes: result.failure.issueCodes,
        durationMs: durationMs(),
      });
      throw new AnalysisQualityError(analysisMessages.qualityFailed);
    }
    if (!result.finalAnalysis) throw new AgentStateError("runAnalysisGraph");

    logAgentEvent("agent_run", {
      status: "completed",
      corrections: result.retryCount,
      durationMs: durationMs(),
    });
    return result.finalAnalysis;
  } catch (error) {
    if (!(error instanceof AnalysisQualityError)) {
      logAgentEvent("agent_run", { status: "error", durationMs: durationMs() });
    }
    throw error;
  }
}
