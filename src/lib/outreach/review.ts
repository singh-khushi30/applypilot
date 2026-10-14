import { OutreachStateError } from "@/lib/ai/errors";
import {
  EMAIL_MESSAGE_MAX,
  EMAIL_SUBJECT_MAX,
  LINKEDIN_MESSAGE_MAX,
  type OutreachContent,
} from "@/lib/ai/schemas/outreach";
import type { OutreachChannel, OutreachReviewStatus, TraceEvent } from "@/types/domain";

/**
 * Explicit human-review record.
 *
 * A generated draft is always `awaiting_review`. Approval happens only when
 * `applyReviewAction` receives `{ type: "approve" }`.
 */
export type OutreachReview = {
  status: OutreachReviewStatus;
  channel: OutreachChannel;
  subject: string | null;
  message: string;
  originalMessage: string;
  originalSubject: string | null;
  humanEdited: boolean;
  grounding: OutreachContent["grounding"];
  trace: TraceEvent[];
};

export type ReviewAction =
  | { type: "edit"; message: string; subject: string | null }
  | { type: "approve" }
  | { type: "reject" }
  | { type: "regenerate"; content: OutreachContent; trace: TraceEvent[] };

export function createAwaitingReview(
  content: OutreachContent,
  trace: TraceEvent[],
): OutreachReview {
  return {
    status: "awaiting_review",
    channel: content.channel,
    subject: content.subject,
    message: content.message,
    originalMessage: content.message,
    originalSubject: content.subject,
    humanEdited: false,
    grounding: content.grounding,
    trace,
  };
}

function userTrace(action: "edit" | "approve" | "reject", index: number): TraceEvent {
  const labels = {
    edit: "Draft edited by user",
    approve: "Draft approved by user",
    reject: "Draft rejected by user",
  } as const;
  return {
    id: `user-${action}-${index}`,
    node: "human_review",
    label: labels[action],
    status: "completed",
    attempt: 1,
    durationMs: null,
    detail: null,
  };
}

function assertAwaiting(review: OutreachReview) {
  if (review.status !== "awaiting_review") throw new OutreachStateError();
}

function editedCopy(review: OutreachReview, message: string, subject: string | null) {
  const nextMessage = message.trim();
  const nextSubject = subject?.trim() ? subject.trim() : null;
  if (!nextMessage) throw new OutreachStateError();

  const max = review.channel === "linkedin" ? LINKEDIN_MESSAGE_MAX : EMAIL_MESSAGE_MAX;
  if (nextMessage.length > max) throw new OutreachStateError();
  if (review.channel === "linkedin" && nextSubject) throw new OutreachStateError();
  if (review.channel === "email") {
    if (!nextSubject || nextSubject.length > EMAIL_SUBJECT_MAX) throw new OutreachStateError();
  }

  const changed = nextMessage !== review.message || nextSubject !== review.subject;
  return {
    ...review,
    message: nextMessage,
    subject: nextSubject,
    humanEdited: review.humanEdited || changed,
    trace: changed ? [...review.trace, userTrace("edit", review.trace.length + 1)] : review.trace,
  };
}

export function applyReviewAction(review: OutreachReview, action: ReviewAction): OutreachReview {
  switch (action.type) {
    case "edit":
      assertAwaiting(review);
      return editedCopy(review, action.message, action.subject);
    case "approve":
      assertAwaiting(review);
      return {
        ...review,
        status: "approved",
        trace: [...review.trace, userTrace("approve", review.trace.length + 1)],
      };
    case "reject":
      assertAwaiting(review);
      return {
        ...review,
        status: "rejected",
        trace: [...review.trace, userTrace("reject", review.trace.length + 1)],
      };
    case "regenerate":
      return createAwaitingReview(action.content, action.trace);
    default:
      throw new OutreachStateError();
  }
}
