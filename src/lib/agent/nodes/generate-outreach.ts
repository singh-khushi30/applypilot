import type { OutreachStateType, OutreachStateUpdate } from "@/lib/agent/outreach-state";
import { timedNode, traceEvent } from "@/lib/agent/trace";
import { AgentStateError } from "@/lib/ai/errors";
import { buildOutreachPrompt } from "@/lib/ai/prompts/outreach";
import { requestOutreachDraft, type OutreachModel } from "@/lib/ai/request-outreach";
import type { LangGraphRunnableConfig } from "@langchain/langgraph";

export const GENERATE_OUTREACH = "generate_outreach";

export function createGenerateOutreachNode(model: OutreachModel) {
  return (state: OutreachStateType, config: LangGraphRunnableConfig) =>
    timedNode(GENERATE_OUTREACH, 1, async (elapsed): Promise<OutreachStateUpdate> => {
      if (!state.contact || !state.channel) throw new AgentStateError(GENERATE_OUTREACH);

      const { value, attempts } = await requestOutreachDraft({
        model,
        prompt: buildOutreachPrompt(state),
        channel: state.channel,
        candidatePoints: state.candidatePoints,
        jobPoints: state.jobPoints,
        signal: config.signal,
      });

      return {
        draft: value,
        modelAttempts: attempts,
        trace: [
          traceEvent({
            node: GENERATE_OUTREACH,
            step: "draft",
            label: "Outreach draft generated",
            attempt: attempts,
            durationMs: elapsed(),
            detail: state.channel,
          }),
        ],
      };
    });
}
