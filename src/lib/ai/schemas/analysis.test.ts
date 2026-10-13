import { analysisContentSchema } from "@/lib/ai/schemas/analysis";
import { toJsonSchema } from "@langchain/core/utils/json_schema";
import { describe, expect, it } from "vitest";

const valid = {
  job: {
    company: "Linear",
    roleTitle: "Software Engineer",
    location: "Remote",
    employmentType: "Full-time",
  },
  roleSummary: "Product engineering role on the editor and public API.",
  requirements: [{ skill: "TypeScript", category: "required", importance: "high" }],
  skillEvidence: [
    {
      skill: "TypeScript",
      status: "strong",
      evidence: "Shipped TypeScript services",
      source: "resume",
    },
  ],
  gaps: [{ skill: "Kubernetes", importance: "low", reason: "Not mentioned in the resume" }],
  domainAlignment: "strong",
  recommendation: {
    verdict: "strong_match",
    summary: "The resume supports the core product engineering work.",
    nextSteps: ["Tailor the resume"],
  },
};

describe("analysisContentSchema", () => {
  it("accepts a complete structured analysis", () => {
    expect(analysisContentSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects an unknown verdict and extra fields", () => {
    const verdict = analysisContentSchema.safeParse({
      ...valid,
      recommendation: { ...valid.recommendation, verdict: "perfect" },
    });
    expect(verdict.success).toBe(false);
    if (!verdict.success) {
      expect(verdict.error.issues[0]?.path.join(".")).toBe("recommendation.verdict");
      expect(verdict.error.issues[0]?.code).toBe("invalid_value");
    }

    const extra = analysisContentSchema.safeParse({ ...valid, score: 90 });
    expect(extra.success).toBe(false);
  });

  it("rejects empty strings where null is required", () => {
    const parsed = analysisContentSchema.safeParse({
      ...valid,
      job: { ...valid.job, company: "" },
    });
    expect(parsed.success).toBe(false);
  });

  it("converts to a JSON schema for structured model output", () => {
    const jsonSchema = toJsonSchema(analysisContentSchema);
    expect(JSON.stringify(jsonSchema)).toContain("domainAlignment");
    expect(JSON.stringify(jsonSchema)).not.toContain("chain-of-thought");
  });
});
