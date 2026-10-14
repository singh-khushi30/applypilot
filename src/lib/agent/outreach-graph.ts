import { AWAIT_HUMAN_REVIEW, awaitHumanReviewNode } from "@/lib/agent/nodes/await-human-review";
import { createGenerateOutreachNode, GENERATE_OUTREACH } from "@/lib/agent/nodes/generate-outreach";
import {
  VALIDATE_OUTREACH,
  validateOutreachDraftNode,
} from "@/lib/agent/nodes/validate-outreach-draft";
import {
  VALIDATE_CONTEXT,
  validateOutreachContextNode,
} from "@/lib/agent/nodes/validate-outreach-context";
import {
  initialOutreachState,
  OutreachState,
  type OutreachGraphInput,
  type OutreachStateType,
} from "@/lib/agent/outreach-state";
import { logAgentEvent } from "@/lib/agent/trace";
import { AgentStateError } from "@/lib/ai/errors";
import type { OutreachModel } from "@/lib/ai/request-outreach";
import type { OutreachContent } from "@/lib/ai/schemas/outreach";
import type { TraceEvent } from "@/types/domain";
import { END, isGraphInterrupt, MemorySaver, START, StateGraph } from "@langchain/langgraph";

const RECURSION_LIMIT = 12;

export type OutreachGraphDeps = {
  model: OutreachModel;
  /**
   * Required for interrupt/resume. A MemorySaver lives in one process only.
   * Cross-request resume needs a durable checkpointer, which this app does not have yet.
   */
  checkpointer: MemorySaver;
};

function routeAfterReview(state: OutreachStateType) {
  if (state.status === "approved" || state.status === "rejected") return END;
  return AWAIT_HUMAN_REVIEW;
}

/**
 * START → validate_context → generate_outreach → validate_outreach → await_human_review
 * await_human_review interrupts. Resume with approve or reject ends the graph.
 * Resume with edit records the edit and interrupts again.
 */
export function createOutreachGraph(deps: OutreachGraphDeps) {
  return new StateGraph(OutreachState)
    .addNode(VALIDATE_CONTEXT, validateOutreachContextNode)
    .addNode(GENERATE_OUTREACH, createGenerateOutreachNode(deps.model))
    .addNode(VALIDATE_OUTREACH, validateOutreachDraftNode)
    .addNode(AWAIT_HUMAN_REVIEW, awaitHumanReviewNode)
    .addEdge(START, VALIDATE_CONTEXT)
    .addEdge(VALIDATE_CONTEXT, GENERATE_OUTREACH)
    .addEdge(GENERATE_OUTREACH, VALIDATE_OUTREACH)
    .addEdge(VALIDATE_OUTREACH, AWAIT_HUMAN_REVIEW)
    .addConditionalEdges(AWAIT_HUMAN_REVIEW, routeAfterReview, [AWAIT_HUMAN_REVIEW, END])
    .compile({ checkpointer: deps.checkpointer });
}

type InterruptedState = OutreachStateType & {
  __interrupt__?: Array<{ value?: unknown }>;
};

function isInterrupted(result: InterruptedState) {
  return Array.isArray(result.__interrupt__) && result.__interrupt__.length > 0;
}

export type GeneratedOutreach = {
  content: OutreachContent;
  trace: TraceEvent[];
};

/**
 * Runs generation and stops at the human-review interrupt.
 * The checkpointer passed in is not kept by the API, so this call cannot be
 * resumed later. The session review state machine owns edit, approve, and reject.
 */
function pausedDraft(result: InterruptedState): GeneratedOutreach {
  if (!isInterrupted(result) || result.status !== "awaiting_review" || !result.draft) {
    throw new AgentStateError(AWAIT_HUMAN_REVIEW);
  }
  return { content: result.draft, trace: result.trace };
}

export async function runOutreachGeneration(
  input: OutreachGraphInput,
  deps: OutreachGraphDeps & { signal?: AbortSignal },
): Promise<GeneratedOutreach> {
  const started = performance.now();
  const graph = createOutreachGraph(deps);
  const config = {
    configurable: { thread_id: crypto.randomUUID() },
    recursionLimit: RECURSION_LIMIT,
    signal: deps.signal,
  };

  try {
    const result = (await graph.invoke(initialOutreachState(input), config)) as InterruptedState;
    const generated = pausedDraft(result);
    logAgentEvent("agent_run", {
      status: "interrupted",
      durationMs: Math.round(performance.now() - started),
    });
    return generated;
  } catch (error) {
    if (isGraphInterrupt(error)) {
      const snapshot = await graph.getState(config);
      const generated = pausedDraft(snapshot.values as InterruptedState);
      logAgentEvent("agent_run", {
        status: "interrupted",
        durationMs: Math.round(performance.now() - started),
      });
      return generated;
    }
    logAgentEvent("agent_run", {
      status: "error",
      durationMs: Math.round(performance.now() - started),
    });
    throw error;
  }
}
