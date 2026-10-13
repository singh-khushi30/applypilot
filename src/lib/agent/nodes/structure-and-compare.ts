import { requestStructuredAnalysis, type AnalysisModel } from "@/lib/agent/nodes/model";
import type { AnalysisStateType, AnalysisStateUpdate } from "@/lib/agent/state";
import { plural, timedNode, traceEvent } from "@/lib/agent/trace";
import { buildAnalysisPrompt } from "@/lib/ai/prompts/analysis";
import type { LangGraphRunnableConfig } from "@langchain/langgraph";

export const STRUCTURE_AND_COMPARE = "structure_and_compare";

export function createStructureAndCompareNode(model: AnalysisModel) {
  return (state: AnalysisStateType, config: LangGraphRunnableConfig) =>
    timedNode(STRUCTURE_AND_COMPARE, 1, async (elapsed): Promise<AnalysisStateUpdate> => {
      const { value, attempts } = await requestStructuredAnalysis(
        model,
        buildAnalysisPrompt(state),
        config.signal,
      );
      const required = value.requirements.filter((item) => item.category === "required").length;
      const repaired = attempts > 1 ? " · response reformatted once" : "";

      return {
        structuredAnalysis: value,
        trace: [
          traceEvent({
            node: STRUCTURE_AND_COMPARE,
            step: "requirements",
            label: "Job requirements structured",
            attempt: 1,
            detail: `${plural(value.requirements.length, "requirement")} · ${required} required`,
          }),
          traceEvent({
            node: STRUCTURE_AND_COMPARE,
            step: "evidence",
            label: "Candidate evidence compared",
            attempt: 1,
            durationMs: elapsed(),
            detail: `${plural(value.skillEvidence.length, "skill")} compared${repaired}`,
          }),
        ],
      };
    });
}
