import type { Analysis } from "@/types/domain";

export const demoAnalysis: Analysis = {
  id: "demo-linear-swe",
  demo: true,
  summary: null,
  job: {
    title: "Software Engineer",
    company: "Linear",
    location: "San Francisco / Remote",
    employmentType: "Full-time",
  },
  match: {
    overall: 86,
    label: "Strong Match",
    dimensions: [
      { id: "required", label: "Required skills", score: 92 },
      { id: "experience", label: "Experience", score: 85 },
      { id: "preferred", label: "Preferred skills", score: 74 },
      { id: "domain", label: "Domain alignment", score: 81 },
    ],
    explanation:
      "ApplyPilot weighs required skills most heavily, then evaluates experience, preferred qualifications, and domain alignment.",
  },
  alignments: [
    { skill: "TypeScript", evidence: "Used across 3 projects" },
    { skill: "React", evidence: "Production frontend experience" },
    { skill: "Node.js", evidence: "Backend services in production" },
    { skill: "API Design", evidence: "Designed and shipped public APIs" },
    { skill: "PostgreSQL", evidence: "Primary datastore on recent work" },
  ],
  gaps: [
    {
      skill: "Kubernetes",
      requirement: "Mentioned as preferred",
      finding: "Not found in demo resume",
      importance: "medium",
    },
    {
      skill: "AWS",
      requirement: "2+ years preferred",
      finding: "Limited evidence in demo resume",
      importance: "high",
    },
    {
      skill: "System Design",
      requirement: "Role emphasizes distributed systems",
      finding: "Some evidence, but not strongly demonstrated",
      importance: "medium",
    },
  ],
  recommendation:
    "You’re a strong candidate for this role. Your core frontend and backend experience aligns well with the required stack. Before applying, strengthen how you communicate infrastructure experience and distributed-system work.",
  nextSteps: [
    "Tailor resume",
    "Research relevant people",
    "Prepare outreach",
    "Review before sending",
  ],
  trace: [
    { id: "extract", label: "Job extracted" },
    { id: "requirements", label: "Requirements structured" },
    { id: "resume", label: "Resume parsed" },
    { id: "skills", label: "Skills compared" },
    { id: "fit", label: "Fit calculated" },
    { id: "gaps", label: "Gaps identified" },
  ],
};
