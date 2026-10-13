import { z } from "zod";

export const storedAnalysisSchema = z.object({
  id: z.string().min(1).max(80),
  demo: z.literal(false),
  summary: z.string().min(1).max(800).nullable(),
  job: z.object({
    title: z.string().min(1).max(160),
    company: z.string().min(1).max(160),
    location: z.string().min(1).max(160),
    employmentType: z.string().min(1).max(80),
  }),
  match: z.object({
    overall: z.number().int().min(0).max(100),
    label: z.string().min(1).max(40),
    explanation: z.string().min(1).max(600),
    dimensions: z
      .array(
        z.object({
          id: z.enum(["required", "experience", "preferred", "domain"]),
          label: z.string().min(1).max(40),
          score: z.number().int().min(0).max(100),
          omitted: z.boolean().optional(),
        }),
      )
      .length(4),
  }),
  alignments: z
    .array(
      z.object({
        skill: z.string().min(1).max(80),
        evidence: z.string().min(1).max(300),
      }),
    )
    .max(8),
  gaps: z
    .array(
      z.object({
        skill: z.string().min(1).max(80),
        requirement: z.string().min(1).max(200),
        finding: z.string().min(1).max(400),
        importance: z.enum(["high", "medium", "low"]),
      }),
    )
    .max(6),
  recommendation: z.string().min(1).max(800),
  nextSteps: z.array(z.string().min(1).max(160)).min(1).max(6),
  trace: z
    .array(
      z.object({
        id: z.string().min(1).max(40),
        label: z.string().min(1).max(80),
      }),
    )
    .max(8),
});

export type StoredAnalysis = z.infer<typeof storedAnalysisSchema>;
