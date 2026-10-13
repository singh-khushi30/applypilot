import type { AnalysisContent } from "@/lib/ai/schemas/analysis";

/** A clean, internally consistent analysis that passes evaluation. */
export function consistentAnalysis(): AnalysisContent {
  return {
    job: {
      company: "Linear",
      roleTitle: "Software Engineer",
      location: "Remote",
      employmentType: "Full-time",
    },
    roleSummary: "Product engineering role on the editor and public API.",
    requirements: [
      { skill: "TypeScript", category: "required", importance: "high" },
      { skill: "React", category: "required", importance: "high" },
      { skill: "Kubernetes", category: "preferred", importance: "medium" },
    ],
    skillEvidence: [
      {
        skill: "TypeScript",
        status: "strong",
        evidence: "Built TypeScript services for payments",
        source: "resume",
      },
      { skill: "React", status: "partial", evidence: "Maintained a React admin tool", source: "resume" },
      { skill: "Kubernetes", status: "missing", evidence: null, source: "job_description" },
    ],
    gaps: [
      { skill: "Kubernetes", importance: "medium", reason: "The resume does not mention Kubernetes." },
    ],
    domainAlignment: "partial",
    recommendation: {
      summary: "Core language experience is present, with an infrastructure gap to address.",
      nextSteps: ["Tailor the resume to the editor work", "Prepare an example of React work"],
    },
  };
}
