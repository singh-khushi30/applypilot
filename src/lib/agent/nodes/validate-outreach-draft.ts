import type { OutreachStateType, OutreachStateUpdate } from "@/lib/agent/outreach-state";
import { timedNode, traceEvent } from "@/lib/agent/trace";
import { AgentStateError } from "@/lib/ai/errors";
import { outreachContentSchema } from "@/lib/ai/schemas/outreach";

export const VALIDATE_OUTREACH = "validate_outreach";

export function validateOutreachDraftNode(state: OutreachStateType) {
  return timedNode(VALIDATE_OUTREACH, state.modelAttempts || 1, (): OutreachStateUpdate => {
    const parsed = outreachContentSchema.safeParse(state.draft);
    if (!parsed.success || parsed.data.channel !== state.channel) {
      throw new AgentStateError(VALIDATE_OUTREACH);
    }

    return {
      draft: parsed.data,
      status: "awaiting_review",
      trace: [
        traceEvent({
          node: VALIDATE_OUTREACH,
          step: "validated",
          label: "Draft validated",
          attempt: state.modelAttempts || 1,
          detail: `${parsed.data.grounding.candidatePointsUsed.length} candidate points`,
        }),
        traceEvent({
          node: VALIDATE_OUTREACH,
          step: "review",
          label: "Awaiting human review",
          attempt: 1,
          detail: null,
        }),
      ],
    };
  });
}
