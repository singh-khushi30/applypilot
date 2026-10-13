import { evaluateAnalysis, type EvaluationIssueCode } from "@/lib/agent/evaluator";
import type { AnalysisContent } from "@/lib/ai/schemas/analysis";
import { calculateMatch } from "@/lib/analysis/calculate-match";
import { consistentAnalysis } from "@/test/analysis-fixtures";
import { describe, expect, it } from "vitest";

function evaluate(content: AnalysisContent) {
  return evaluateAnalysis(content, calculateMatch(content));
}

function codes(content: AnalysisContent): EvaluationIssueCode[] {
  return evaluate(content).issues.map((issue) => issue.code);
}

describe("evaluateAnalysis", () => {
  it("passes a clean, consistent analysis", () => {
    expect(evaluate(consistentAnalysis())).toEqual({ passed: true, issues: [] });
  });

  it("fails a strong skill with no resume evidence", () => {
    const content = consistentAnalysis();
    content.skillEvidence[0] = { ...content.skillEvidence[0]!, evidence: null };

    const evaluation = evaluate(content);
    expect(evaluation.passed).toBe(false);
    expect(evaluation.issues[0]).toMatchObject({
      code: "supported_skill_without_evidence",
      path: "skillEvidence.0",
      correctable: true,
    });
  });

  it("fails a strong skill sourced from the job description", () => {
    const content = consistentAnalysis();
    content.skillEvidence[0] = { ...content.skillEvidence[0]!, source: "job_description" };
    expect(codes(content)).toContain("supported_skill_without_evidence");
  });

  it("fails a missing skill that cites resume evidence", () => {
    const content = consistentAnalysis();
    content.skillEvidence[2] = {
      skill: "Kubernetes",
      status: "missing",
      evidence: "Ran Kubernetes clusters",
      source: "resume",
    };
    expect(codes(content)).toContain("missing_skill_claims_evidence");
  });

  it("fails a skill marked both strong and missing", () => {
    const content = consistentAnalysis();
    content.skillEvidence.push({
      skill: "typescript",
      status: "missing",
      evidence: null,
      source: "job_description",
    });
    expect(codes(content)).toEqual(["contradictory_evidence"]);
  });

  it("fails a gap that contradicts strong evidence", () => {
    const content = consistentAnalysis();
    content.gaps.push({ skill: "TypeScript", importance: "high", reason: "Needs more depth." });
    expect(codes(content)).toEqual(["gap_contradicts_evidence"]);
  });

  it("fails a skill listed as both required and preferred", () => {
    const content = consistentAnalysis();
    content.requirements.push({ skill: "React", category: "preferred", importance: "low" });
    expect(codes(content)).toEqual(["conflicting_requirement_category"]);
  });

  it("fails a classification that does not match the deterministic thresholds", () => {
    const content = consistentAnalysis();
    const match = calculateMatch(content);
    const evaluation = evaluateAnalysis(content, { ...match, label: "Strong Match" });

    expect(match.label).not.toBe("Strong Match");
    expect(evaluation.passed).toBe(false);
    expect(evaluation.issues).toEqual([
      expect.objectContaining({ code: "classification_mismatch", correctable: false }),
    ]);
  });

  it("fails an out-of-range score and an incomplete breakdown", () => {
    const content = consistentAnalysis();
    const match = calculateMatch(content);
    const evaluation = evaluateAnalysis(content, {
      ...match,
      overall: 140,
      dimensions: match.dimensions.slice(1),
    });
    expect(evaluation.issues.map((issue) => issue.code)).toEqual([
      "score_out_of_range",
      "breakdown_invalid",
    ]);
  });

  it("fails a recommendation that is too thin to be useful", () => {
    const content = consistentAnalysis();
    content.recommendation = { summary: "Apply.", nextSteps: ["  "] };
    expect(codes(content)).toEqual(["recommendation_missing", "next_steps_missing"]);
  });

  it("fails when a required requirement has no evidence entry", () => {
    const content = consistentAnalysis();
    content.requirements.push({ skill: "PostgreSQL", category: "required", importance: "high" });

    const evaluation = evaluate(content);
    expect(evaluation.passed).toBe(false);
    expect(evaluation.issues).toEqual([
      expect.objectContaining({ code: "required_skill_unassessed", path: "requirements.3" }),
    ]);
  });

  it("fails when a missing high-importance required skill is not reported as a gap", () => {
    const content = consistentAnalysis();
    content.requirements.push({ skill: "Go", category: "required", importance: "high" });
    content.skillEvidence.push({ skill: "Go", status: "missing", evidence: null, source: "job_description" });
    expect(codes(content)).toEqual(["important_gap_unreported"]);
  });

  it("keeps evaluator messages free of document text beyond skill names", () => {
    const content = consistentAnalysis();
    content.skillEvidence[0] = { ...content.skillEvidence[0]!, evidence: null };
    const [issue] = evaluate(content).issues;
    expect(issue?.message).toBe('"TypeScript" is marked strong without a resume evidence phrase.');
  });
});
