import { calculateMatch, classifyMatch } from "@/lib/analysis/calculate-match";
import type { AnalysisContent } from "@/lib/ai/schemas/analysis";
import { describe, expect, it } from "vitest";

function content(patch: Partial<AnalysisContent> = {}): AnalysisContent {
  return {
    job: {
      company: "Linear",
      roleTitle: "Software Engineer",
      location: "Remote",
      employmentType: "Full-time",
    },
    roleSummary: "Product engineering role.",
    requirements: [],
    skillEvidence: [],
    gaps: [],
    domainAlignment: "strong",
    recommendation: {
      summary: "Enough overlap to apply.",
      nextSteps: ["Tailor the resume"],
    },
    ...patch,
  };
}

function evidence(
  skill: string,
  status: "strong" | "partial" | "missing",
  source: "resume" | "job_description" = "resume",
) {
  return { skill, status, evidence: status === "missing" ? null : `${skill} on the resume`, source };
}

describe("calculateMatch", () => {
  it("scores an all-strong comparison at 100", () => {
    const match = calculateMatch(
      content({
        requirements: [
          { skill: "TypeScript", category: "required", importance: "high" },
          { skill: "React", category: "required", importance: "high" },
          { skill: "AWS", category: "preferred", importance: "medium" },
        ],
        skillEvidence: [
          evidence("TypeScript", "strong"),
          evidence("React", "strong"),
          evidence("AWS", "strong"),
        ],
        domainAlignment: "strong",
      }),
    );

    expect(match.overall).toBe(100);
    expect(match.label).toBe("Strong Match");
    expect(match.dimensions.map((item) => item.score)).toEqual([100, 100, 100, 100]);
  });

  it("scores mixed strong, partial, and missing evidence at 50", () => {
    const match = calculateMatch(
      content({
        domainAlignment: "partial",
        requirements: [
          { skill: "TypeScript", category: "required", importance: "high" },
          { skill: "React", category: "required", importance: "high" },
          { skill: "Kubernetes", category: "required", importance: "medium" },
          { skill: "AWS", category: "preferred", importance: "low" },
        ],
        skillEvidence: [
          evidence("TypeScript", "strong"),
          evidence("React", "partial"),
          evidence("Kubernetes", "missing"),
          evidence("AWS", "partial"),
        ],
      }),
    );

    expect(match.overall).toBe(50);
    expect(match.dimensions.find((item) => item.id === "required")?.score).toBe(50);
  });

  it("leaves preferred skills out when the posting lists none", () => {
    const match = calculateMatch(
      content({
        requirements: [
          { skill: "TypeScript", category: "required", importance: "high" },
          { skill: "React", category: "required", importance: "high" },
        ],
        skillEvidence: [evidence("TypeScript", "strong"), evidence("React", "strong")],
      }),
    );

    expect(match.overall).toBe(100);
    expect(match.dimensions.find((item) => item.id === "preferred")).toMatchObject({
      omitted: true,
      score: 0,
    });
  });

  it("penalizes missing required skills more than a strong preferred skill", () => {
    const match = calculateMatch(
      content({
        requirements: [
          { skill: "Kubernetes", category: "required", importance: "high" },
          { skill: "AWS", category: "required", importance: "high" },
          { skill: "GraphQL", category: "preferred", importance: "low" },
        ],
        skillEvidence: [
          evidence("Kubernetes", "missing"),
          evidence("AWS", "missing"),
          evidence("GraphQL", "strong"),
        ],
      }),
    );

    expect(match.overall).toBe(38);
    expect(match.dimensions.find((item) => item.id === "required")?.score).toBe(0);
    expect(match.label).toBe("Stretch");
  });

  it("returns a zero score for empty comparisons", () => {
    const match = calculateMatch(content({ domainAlignment: "limited" }));
    expect(match.overall).toBe(0);
    expect(match.dimensions.every((item) => item.omitted)).toBe(true);
  });

  it("classifies scores only by the fixed thresholds", () => {
    expect(classifyMatch(100)).toBe("Strong Match");
    expect(classifyMatch(80)).toBe("Strong Match");
    expect(classifyMatch(79)).toBe("Potential Match");
    expect(classifyMatch(60)).toBe("Potential Match");
    expect(classifyMatch(59)).toBe("Stretch");
    expect(classifyMatch(0)).toBe("Stretch");
  });

  it("is deterministic", () => {
    const input = content({
      requirements: [{ skill: "TypeScript", category: "required", importance: "high" }],
      skillEvidence: [evidence("TypeScript", "partial")],
      domainAlignment: "limited",
    });
    expect(calculateMatch(input)).toEqual(calculateMatch(input));
  });
});
