import type { OutreachStateType, OutreachStateUpdate } from "@/lib/agent/outreach-state";
import { traceEvent } from "@/lib/agent/trace";
import { AgentStateError, OutreachStateError } from "@/lib/ai/errors";
import {
  EMAIL_MESSAGE_MAX,
  EMAIL_SUBJECT_MAX,
  LINKEDIN_MESSAGE_MAX,
} from "@/lib/ai/schemas/outreach";
import { interrupt } from "@langchain/langgraph";
import { z } from "zod";

export const AWAIT_HUMAN_REVIEW = "await_human_review";

const resumeSchema = z.strictObject({
  action: z.enum(["approve", "reject", "edit"]),
  message: z.string().max(EMAIL_MESSAGE_MAX).optional(),
  subject: z.string().max(EMAIL_SUBJECT_MAX).nullable().optional(),
});

/**
 * Pauses the graph until a human resumes it with approve, reject, or edit.
 * The interrupt value is only the status. The draft itself stays in graph state.
 */
export function awaitHumanReviewNode(state: OutreachStateType): OutreachStateUpdate {
  if (!state.draft || state.status !== "awaiting_review") {
    throw new AgentStateError(AWAIT_HUMAN_REVIEW);
  }

  const decision = resumeSchema.parse(
    interrupt({ status: "awaiting_review" as const }, { responseSchema: resumeSchema }),
  );

  if (decision.action === "approve") {
    return {
      status: "approved",
      trace: [
        traceEvent({
          node: AWAIT_HUMAN_REVIEW,
          step: "approved",
          label: "Draft approved by user",
          attempt: 1,
        }),
      ],
    };
  }

  if (decision.action === "reject") {
    return {
      status: "rejected",
      trace: [
        traceEvent({
          node: AWAIT_HUMAN_REVIEW,
          step: "rejected",
          label: "Draft rejected by user",
          attempt: 1,
        }),
      ],
    };
  }

  const message = decision.message?.trim() ?? "";
  const subject = decision.subject?.trim() ? decision.subject.trim() : null;
  const max = state.channel === "linkedin" ? LINKEDIN_MESSAGE_MAX : EMAIL_MESSAGE_MAX;
  if (!message || message.length > max) throw new OutreachStateError();
  if (state.channel === "linkedin" && subject) throw new OutreachStateError();
  if (state.channel === "email" && (!subject || subject.length > EMAIL_SUBJECT_MAX)) {
    throw new OutreachStateError();
  }

  return {
    status: "awaiting_review",
    humanEdited: true,
    draft: { ...state.draft, message, subject },
    trace: [
      traceEvent({
        node: AWAIT_HUMAN_REVIEW,
        step: "edited",
        label: "Draft edited by user",
        attempt: 1,
      }),
    ],
  };
}
