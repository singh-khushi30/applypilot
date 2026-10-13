import { createAnalysisGraph, runAnalysisGraph } from "@/lib/agent/analysis-graph";
import type { AnalysisModel } from "@/lib/agent/nodes/model";
import { initialState } from "@/lib/agent/state";
import {
  AnalysisQualityError,
  AnalysisServiceError,
  ModelOutputValidationError,
} from "@/lib/ai/errors";
import type { AnalysisContent } from "@/lib/ai/schemas/analysis";
import { consistentAnalysis } from "@/test/analysis-fixtures";
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from "vitest";

const RESUME_SECRET = "RESUME_SECRET_jordan@example.com";
const JD_SECRET = "JD_SECRET_internal_comp_band";

const input = {
  jobDescription: `We need TypeScript and React engineers. ${JD_SECRET}`,
  resumeText: `Jordan built TypeScript services. ${RESUME_SECRET}`,
  company: null,
  roleTitle: null,
};

/** Fails evaluation: strong skill with no evidence. */
function ungrounded(): AnalysisContent {
  const content = consistentAnalysis();
  content.skillEvidence[0] = { ...content.skillEvidence[0]!, evidence: null };
  return content;
}

function mockModel(...responses: unknown[]): Mock<AnalysisModel> {
  const model = vi.fn<AnalysisModel>();
  for (const response of responses) model.mockResolvedValueOnce(response);
  return model;
}

let logs: string[];

beforeEach(() => {
  logs = [];
  const capture = (line: unknown) => {
    logs.push(String(line));
  };
  vi.spyOn(console, "info").mockImplementation(capture);
  vi.spyOn(console, "error").mockImplementation(capture);
});

afterEach(() => {
  vi.restoreAllMocks();
});

function nodesOf(trace: Array<{ node: string }>) {
  return trace.map((event) => event.node);
}

describe("analysis graph", () => {
  it("runs structure → score → evaluate → prepare on a clean analysis", async () => {
    const model = mockModel(consistentAnalysis());

    const analysis = await runAnalysisGraph(input, { model, createId: () => "run-1" });

    expect(model).toHaveBeenCalledTimes(1);
    expect(analysis.id).toBe("run-1");
    expect(analysis.match.label).toBe("Potential Match");
    expect(nodesOf(analysis.trace)).toEqual([
      "input",
      "structure_and_compare",
      "structure_and_compare",
      "calculate_match",
      "evaluate_analysis",
      "prepare_result",
    ]);
    expect(analysis.trace.map((event) => event.label)).not.toContain("Analysis corrected");
  });

  it("corrects once when evaluation fails, then scores and evaluates again", async () => {
    const model = mockModel(ungrounded(), consistentAnalysis());

    const analysis = await runAnalysisGraph(input, { model });

    expect(model).toHaveBeenCalledTimes(2);
    const correctivePrompt = model.mock.calls[1]?.[0] ?? "";
    expect(correctivePrompt).toContain("<PREVIOUS_ANALYSIS>");
    expect(correctivePrompt).toContain("supported_skill_without_evidence at skillEvidence.0");
    expect(correctivePrompt).toContain("<RESUME>");
    expect(correctivePrompt).not.toBe(model.mock.calls[0]?.[0]);

    expect(nodesOf(analysis.trace)).toEqual([
      "input",
      "structure_and_compare",
      "structure_and_compare",
      "calculate_match",
      "evaluate_analysis",
      "correct_analysis",
      "calculate_match",
      "evaluate_analysis",
      "prepare_result",
    ]);
    const quality = analysis.trace.filter((event) => event.node === "evaluate_analysis");
    expect(quality.map((event) => [event.status, event.attempt])).toEqual([
      ["failed", 1],
      ["completed", 2],
    ]);
    expect(new Set(analysis.trace.map((event) => event.id)).size).toBe(analysis.trace.length);
  });

  it("fails safely after one correction and never makes a third request", async () => {
    const model = mockModel(ungrounded(), ungrounded(), consistentAnalysis());

    await expect(runAnalysisGraph(input, { model })).rejects.toBeInstanceOf(AnalysisQualityError);
    expect(model).toHaveBeenCalledTimes(2);
  });

  it("routes to rejection with final state when correction does not help", async () => {
    const model = mockModel(ungrounded(), ungrounded());

    const state = await createAnalysisGraph({ model }).invoke(initialState(input));

    expect(state.retryCount).toBe(1);
    expect(state.finalAnalysis).toBeNull();
    expect(state.failure).toEqual({
      code: "evaluation_failed",
      issueCodes: ["supported_skill_without_evidence"],
    });
    expect(nodesOf(state.trace).at(-1)).toBe("reject_analysis");
  });

  it("keeps provider schema retries separate from the graph correction", async () => {
    // Layer 1 repairs a schema-invalid response inside one node. Layer 2 never runs.
    const model = mockModel({ ...consistentAnalysis(), domainAlignment: "very" }, consistentAnalysis());

    const analysis = await runAnalysisGraph(input, { model });

    expect(model).toHaveBeenCalledTimes(2);
    expect(model.mock.calls[0]?.[1]).toBeNull();
    expect(model.mock.calls[1]?.[1]).toContain("domainAlignment");
    expect(nodesOf(analysis.trace)).not.toContain("correct_analysis");
    expect(analysis.trace[2]?.detail).toContain("reformatted once");
  });

  it("bounds both layers together: at most four model requests", async () => {
    const invalid = { score: 99 };
    const model = mockModel(invalid, ungrounded(), invalid, invalid);

    await expect(runAnalysisGraph(input, { model })).rejects.toBeInstanceOf(
      ModelOutputValidationError,
    );
    expect(model).toHaveBeenCalledTimes(4);
  });

  it("propagates typed provider errors without retrying", async () => {
    const model = vi
      .fn<AnalysisModel>()
      .mockRejectedValue(new AnalysisServiceError("rate_limit", "busy"));

    await expect(runAnalysisGraph(input, { model })).rejects.toMatchObject({ code: "rate_limit" });
    expect(model).toHaveBeenCalledTimes(1);
  });

  it("does not put documents, prompts, or evaluator messages in the trace or logs", async () => {
    const model = mockModel(ungrounded(), consistentAnalysis());

    const analysis = await runAnalysisGraph(input, { model });
    const visible = JSON.stringify(analysis.trace) + logs.join("\n");

    for (const secret of [RESUME_SECRET, JD_SECRET, "<RESUME>", "PREVIOUS_ANALYSIS", "marked strong"]) {
      expect(visible).not.toContain(secret);
    }
    expect(JSON.stringify(analysis)).not.toContain(RESUME_SECRET);
    expect(logs.some((line) => line.includes('"event":"agent_node"'))).toBe(true);
    expect(logs.some((line) => line.includes('"issueCodes":["supported_skill_without_evidence"]'))).toBe(
      true,
    );
  });
});
