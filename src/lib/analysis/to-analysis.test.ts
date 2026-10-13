import type { AnalysisContent } from "@/lib/ai/schemas/analysis";
import { calculateMatch } from "@/lib/analysis/calculate-match";
import { storedAnalysisSchema } from "@/lib/analysis/stored-analysis";
import { toAnalysis } from "@/lib/analysis/to-analysis";
import { describe, expect, it } from "vitest";

const content: AnalysisContent = {
  job: {
    company: "Model Co",
    roleTitle: "Model Title",
    location: null,
    employmentType: null,
  },
  roleSummary: "Backend role focused on APIs.",
  requirements: [
    { skill: "TypeScript", category: "required", importance: "high" },
    { skill: "Kubernetes", category: "preferred", importance: "medium" },
  ],
  skillEvidence: [
    {
      skill: "TypeScript",
      status: "strong",
      evidence: "Built TypeScript APIs",
      source: "resume",
    },
    {
      skill: "Kubernetes",
      status: "missing",
      evidence: null,
      source: "job_description",
    },
  ],
  gaps: [
    { skill: "Kubernetes", importance: "medium", reason: "The resume does not mention Kubernetes" },
  ],
  domainAlignment: "partial",
  recommendation: {
    verdict: "potential_match",
    summary: "Core language experience is present, with an infrastructure gap.",
    nextSteps: ["Tailor the resume", "Review the posting"],
  },
};

describe("toAnalysis", () => {
  it("builds a real analysis without resume text or a model score", () => {
    const analysis = toAnalysis(content, {
      id: "analysis-1",
      company: "Linear",
      roleTitle: null,
    });

    expect(analysis.demo).toBe(false);
    expect(analysis.job.company).toBe("Linear");
    expect(analysis.job.title).toBe("Model Title");
    expect(analysis.job.location).toBe("Not specified");
    expect(analysis.match).toEqual(calculateMatch(content));
    expect(analysis.alignments).toEqual([
      { skill: "TypeScript", evidence: "Built TypeScript APIs" },
    ]);
    expect(analysis.gaps[0]).toMatchObject({
      skill: "Kubernetes",
      finding: "The resume does not mention Kubernetes",
      requirement: "Preferred · medium importance",
    });
    expect(analysis.trace.map((step) => step.label)).toEqual([
      "Resume extracted",
      "Requirements structured",
      "Evidence compared",
      "Fit calculated",
      "Gaps identified",
      "Recommendation prepared",
    ]);
    expect(JSON.stringify(analysis)).not.toContain("resume text");
    expect(storedAnalysisSchema.safeParse(analysis).success).toBe(true);
  });

  it("uses a neutral evidence line when the model omits a phrase", () => {
    const analysis = toAnalysis(
      {
        ...content,
        skillEvidence: [
          { skill: "TypeScript", status: "partial", evidence: null, source: "resume" },
        ],
      },
      { id: "analysis-2", company: null, roleTitle: "Engineer" },
    );

    expect(analysis.alignments[0]?.evidence).toBe("Partially supported by the resume");
    expect(analysis.job.title).toBe("Engineer");
  });
});
