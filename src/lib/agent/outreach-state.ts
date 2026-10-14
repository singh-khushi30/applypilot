import type { OutreachContent } from "@/lib/ai/schemas/outreach";
import type { OutreachChannel, OutreachReviewStatus, TraceEvent } from "@/types/domain";
import { Annotation } from "@langchain/langgraph";

export type OutreachContactInput = {
  name: string;
  title: string;
  company: string;
  context: string | null;
  relevanceLabel: string;
};

export type OutreachGraphInput = {
  channel: OutreachChannel;
  contact: OutreachContactInput;
  candidatePoints: string[];
  jobPoints: string[];
};

/**
 * Outreach graph state.
 *
 * Contact notes stay available to the draft node and are never copied into
 * the trace. Approval is not a field the model can set.
 */
export const OutreachState = Annotation.Root({
  channel: Annotation<OutreachChannel>(),
  contact: Annotation<OutreachContactInput>(),
  candidatePoints: Annotation<string[]>(),
  jobPoints: Annotation<string[]>(),
  draft: Annotation<OutreachContent | null>(),
  /** Resting status. Generation stops at awaiting_review until a human resumes the graph. */
  status: Annotation<OutreachReviewStatus | "pending">(),
  humanEdited: Annotation<boolean>(),
  modelAttempts: Annotation<number>(),
  trace: Annotation<TraceEvent[]>({
    reducer: (current, update) => current.concat(update),
    default: () => [],
  }),
});

export type OutreachStateType = typeof OutreachState.State;
export type OutreachStateUpdate = typeof OutreachState.Update;

export function initialOutreachState(input: OutreachGraphInput): OutreachStateType {
  return {
    ...input,
    draft: null,
    status: "pending",
    humanEdited: false,
    modelAttempts: 0,
    trace: [],
  };
}
