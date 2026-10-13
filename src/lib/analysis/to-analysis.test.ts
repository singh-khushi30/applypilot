import { calculateMatch } from "@/lib/analysis/calculate-match";
import { storedAnalysisSchema } from "@/lib/analysis/stored-analysis";
import { toAnalysis } from "@/lib/analysis/to-analysis";
import { consistentAnalysis } from "@/test/analysis-fixtures";
import type { TraceEvent } from "@/types/domain";
import { describe, expect, it } from "vitest";

const trace: TraceEvent[] = [
  {
    id: "score-1",
    node: "calculate_match",
    label: "Match score calculated",
    status: "completed",
    attempt: 1,
    durationMs: 2,
    detail: "64% · Potential Match",
  },
];

describe("toAnalysis", () => {
  it("builds a real analysis from content, the given match, and the given trace", () => {
    const content = consistentAnalysis();
    const match = calculateMatch(content);
    const analysis = toAnalysis(content, match, trace, {
      id: "analysis-1",
      company: "Acme",
      roleTitle: null,
    });

    expect(analysis.demo).toBe(false);
    expect(analysis.job.company).toBe("Acme");
    expect(analysis.job.title).toBe("Software Engineer");
    expect(analysis.match).toBe(match);
    expect(analysis.trace).toBe(trace);
    expect(analysis.alignments).toEqual([
      { skill: "TypeScript", evidence: "Built TypeScript services for payments" },
      { skill: "React", evidence: "Maintained a React admin tool" },
    ]);
    expect(analysis.gaps[0]).toMatchObject({
      skill: "Kubernetes",
      requirement: "Preferred · medium importance",
    });
    expect(storedAnalysisSchema.safeParse(analysis).success).toBe(true);
  });

  it("uses a neutral evidence line and fallbacks when fields are missing", () => {
    const content = consistentAnalysis();
    content.job.location = null;
    content.skillEvidence = [
      { skill: "TypeScript", status: "partial", evidence: null, source: "resume" },
    ];
    const analysis = toAnalysis(content, calculateMatch(content), trace, {
      id: "analysis-2",
      company: null,
      roleTitle: "Engineer",
    });

    expect(analysis.alignments[0]?.evidence).toBe("Partially supported by the resume");
    expect(analysis.job.title).toBe("Engineer");
    expect(analysis.job.location).toBe("Not specified");
  });
});
