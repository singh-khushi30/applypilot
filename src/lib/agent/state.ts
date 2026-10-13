import type { Evaluation } from "@/lib/agent/evaluator";
import type { AnalysisContent } from "@/lib/ai/schemas/analysis";
import type { Analysis, MatchBreakdown, TraceEvent } from "@/types/domain";
import { Annotation } from "@langchain/langgraph";

export const MAX_CORRECTIONS = 1;

export type AgentFailure = {
  code: "evaluation_failed";
  /** Issue codes only, for server logs. */
  issueCodes: string[];
};

/**
 * Graph state. The input documents stay on the server: they are read by the
 * model nodes and never copied into the trace or the final analysis.
 */
export const AnalysisState = Annotation.Root({
  jobDescription: Annotation<string>(),
  resumeText: Annotation<string>(),
  company: Annotation<string | null>(),
  roleTitle: Annotation<string | null>(),

  structuredAnalysis: Annotation<AnalysisContent | null>(),
  matchResult: Annotation<MatchBreakdown | null>(),
  evaluation: Annotation<Evaluation | null>(),
  /** Graph-level corrective passes taken so far (retry layer 2). */
  retryCount: Annotation<number>(),
  trace: Annotation<TraceEvent[]>({
    reducer: (current, update) => current.concat(update),
    default: () => [],
  }),
  finalAnalysis: Annotation<Analysis | null>(),
  failure: Annotation<AgentFailure | null>(),
});

export type AnalysisStateType = typeof AnalysisState.State;
export type AnalysisStateUpdate = typeof AnalysisState.Update;

export type AnalysisInput = {
  jobDescription: string;
  resumeText: string;
  company: string | null;
  roleTitle: string | null;
};

export function initialState(input: AnalysisInput): AnalysisStateType {
  return {
    ...input,
    structuredAnalysis: null,
    matchResult: null,
    evaluation: null,
    retryCount: 0,
    trace: [],
    finalAnalysis: null,
    failure: null,
  };
}
