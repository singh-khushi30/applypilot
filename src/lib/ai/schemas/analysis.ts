import { z } from "zod";

const importance = z.enum(["high", "medium", "low"]);

const nullableText = (max: number) => z.union([z.string().trim().min(1).max(max), z.null()]);

const requirementSchema = z.strictObject({
  skill: z.string().trim().min(1).max(80),
  category: z.enum(["required", "preferred"]),
  importance,
});

const skillEvidenceSchema = z.strictObject({
  skill: z.string().trim().min(1).max(80),
  status: z.enum(["strong", "partial", "missing"]),
  evidence: nullableText(240),
  source: z.enum(["resume", "job_description"]),
});

const gapSchema = z.strictObject({
  skill: z.string().trim().min(1).max(80),
  importance,
  reason: z.string().trim().min(1).max(300),
});

export const analysisContentSchema = z
  .strictObject({
    job: z.strictObject({
      company: nullableText(120),
      roleTitle: z.string().trim().min(1).max(160),
      location: nullableText(160),
      employmentType: nullableText(80),
    }),
    roleSummary: z.string().trim().min(1).max(600),
    requirements: z.array(requirementSchema).max(30),
    skillEvidence: z.array(skillEvidenceSchema).max(40),
    gaps: z.array(gapSchema).max(12),
    domainAlignment: z.enum(["strong", "partial", "limited"]),
    recommendation: z.strictObject({
      verdict: z.enum(["strong_match", "potential_match", "stretch"]),
      summary: z.string().trim().min(1).max(800),
      nextSteps: z.array(z.string().trim().min(1).max(160)).min(1).max(6),
    }),
  })
  .describe(
    "Structured comparison of one job description and one resume. Do not include scores, percentages, or reasoning.",
  );

export type AnalysisContent = z.infer<typeof analysisContentSchema>;
