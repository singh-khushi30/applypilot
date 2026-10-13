import type { TraceEvent } from "@/types/domain";

/**
 * Safe trace and log helpers for the agent run.
 *
 * Trace events and log lines carry node names, statuses, attempt numbers,
 * durations, and counts. They never carry prompts, documents, model output,
 * or evaluator messages.
 */

export function traceEvent(event: {
  node: string;
  step: string;
  label: string;
  attempt: number;
  status?: TraceEvent["status"];
  durationMs?: number | null;
  detail?: string | null;
}): TraceEvent {
  return {
    id: `${event.step}-${event.attempt}`,
    node: event.node,
    label: event.label,
    status: event.status ?? "completed",
    attempt: event.attempt,
    durationMs: event.durationMs ?? null,
    detail: event.detail ?? null,
  };
}

export function plural(count: number, noun: string) {
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}

type LogFields = {
  node?: string;
  status: string;
  attempt?: number;
  durationMs?: number;
  errorCode?: string;
  corrections?: number;
  issueCodes?: string[];
};

export function logAgentEvent(event: "agent_node" | "agent_run", fields: LogFields) {
  const line = JSON.stringify({ event, ...fields });
  if (fields.status === "error" || fields.status === "failed") console.error(line);
  else console.info(line);
}

function errorCode(error: unknown) {
  if (typeof error === "object" && error && "code" in error && typeof error.code === "string") {
    return error.code;
  }
  return error instanceof Error ? error.name : "unknown";
}

/**
 * Times a node, logs safe metadata, and passes its result through. Errors are
 * logged with their type code and rethrown unchanged.
 */
export async function timedNode<T>(
  node: string,
  attempt: number,
  run: (elapsed: () => number) => Promise<T> | T,
): Promise<T> {
  const started = performance.now();
  const elapsed = () => Math.round(performance.now() - started);
  try {
    const result = await run(elapsed);
    logAgentEvent("agent_node", { node, status: "completed", attempt, durationMs: elapsed() });
    return result;
  } catch (error) {
    logAgentEvent("agent_node", {
      node,
      status: "error",
      attempt,
      durationMs: elapsed(),
      errorCode: errorCode(error),
    });
    throw error;
  }
}
