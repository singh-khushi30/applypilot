import type {
  Application,
  ApplicationStage,
  RecentAnalysis,
  WorkspaceStat,
} from "@/types/domain";

export const workspaceStats: WorkspaceStat[] = [
  { label: "Applications", value: "12" },
  { label: "Strong matches", value: "5" },
  { label: "Awaiting outreach", value: "3" },
  { label: "Interviews", value: "2" },
];

export const recentAnalyses: RecentAnalysis[] = [
  {
    id: "linear",
    role: "Software Engineer",
    company: "Linear",
    match: 86,
    status: "Ready for outreach",
    href: "/app/analysis/demo",
  },
  {
    id: "perplexity",
    role: "AI Engineer",
    company: "Perplexity",
    match: 78,
    status: "Review gaps",
    href: null,
  },
  {
    id: "vercel",
    role: "Full Stack Engineer",
    company: "Vercel",
    match: 91,
    status: "Applied",
    href: null,
  },
];

export const demoAgentActivity = [
  "Job understood",
  "Resume analyzed",
  "Skills compared",
  "Researching relevant contacts",
] as const;

export const applicationStages: Array<{
  id: ApplicationStage;
  label: string;
}> = [
  { id: "saved", label: "Saved" },
  { id: "ready", label: "Ready" },
  { id: "applied", label: "Applied" },
  { id: "interview", label: "Interview" },
];

export const demoApplications: Application[] = [
  {
    id: "figma",
    role: "Software Engineer",
    company: "Figma",
    match: 73,
    stage: "saved",
    note: "Saved to revisit the posting.",
  },
  {
    id: "perplexity",
    role: "AI Engineer",
    company: "Perplexity",
    match: 78,
    stage: "saved",
    note: "Gaps still need a closer look.",
  },
  {
    id: "linear",
    role: "Software Engineer",
    company: "Linear",
    match: 86,
    stage: "ready",
    note: "Strategy is ready for your review.",
  },
  {
    id: "stripe",
    role: "Frontend Engineer",
    company: "Stripe",
    match: 80,
    stage: "ready",
    note: "Outreach is drafted, not sent.",
  },
  {
    id: "vercel",
    role: "Full Stack Engineer",
    company: "Vercel",
    match: 91,
    stage: "applied",
    note: "Application submitted.",
  },
  {
    id: "notion",
    role: "Product Engineer",
    company: "Notion",
    match: 84,
    stage: "interview",
    note: "Conversation scheduled.",
  },
];
