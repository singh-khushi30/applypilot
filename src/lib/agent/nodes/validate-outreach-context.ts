import type { OutreachStateType, OutreachStateUpdate } from "@/lib/agent/outreach-state";
import { plural, timedNode, traceEvent } from "@/lib/agent/trace";
import { OutreachInputError } from "@/lib/ai/errors";
import { outreachMessages } from "@/lib/outreach/messages";

export const VALIDATE_CONTEXT = "validate_context";

export function validateOutreachContextNode(state: OutreachStateType) {
  return timedNode(VALIDATE_CONTEXT, 1, (): OutreachStateUpdate => {
    const contact = state.contact;
    if (!contact?.name.trim() || !contact.title.trim() || !contact.company.trim()) {
      throw new OutreachInputError("invalid_contact", outreachMessages.invalidContact);
    }
    if (state.jobPoints.length === 0) {
      throw new OutreachInputError("invalid_context", outreachMessages.invalidContext);
    }

    return {
      trace: [
        traceEvent({
          node: VALIDATE_CONTEXT,
          step: "context",
          label: "Contact context validated",
          attempt: 1,
          detail: state.channel,
        }),
        traceEvent({
          node: VALIDATE_CONTEXT,
          step: "evidence",
          label: "Candidate evidence selected",
          attempt: 1,
          detail: plural(state.candidatePoints.length, "strength"),
        }),
      ],
    };
  });
}
