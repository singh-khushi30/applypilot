export type JobSource = "url" | "description";

export type Job = {
  source: JobSource;
  url: string | null;
  description: string | null;
  company: string | null;
  title: string | null;
};

export type Resume = {
  fileName: string;
  sizeBytes: number;
  mimeType: "application/pdf";
};

export type SkillMatch = {
  skill: string;
  evidence: string;
};

export type BreakdownDimension = {
  id: "required" | "experience" | "preferred" | "domain";
  label: string;
  score: number;
  omitted?: boolean;
};

export type MatchBreakdown = {
  overall: number;
  label: MatchLabel;
  dimensions: BreakdownDimension[];
  explanation: string;
};

export type GapImportance = "high" | "medium" | "low";

export type SkillGap = {
  skill: string;
  requirement: string;
  finding: string;
  importance: GapImportance;
};

export type AgentStepStatus = "done" | "active" | "pending";

export type AgentStep = {
  id: string;
  label: string;
  status: AgentStepStatus;
};

export type MatchLabel = "Strong Match" | "Potential Match" | "Stretch";

/**
 * One client-visible step from an agent run. Labels and details are written
 * by application code from counts and node names, never from model text,
 * prompts, or document content.
 */
export type TraceEvent = {
  id: string;
  node: string;
  label: string;
  status: "completed" | "failed";
  attempt: number;
  durationMs: number | null;
  detail: string | null;
};

export type Analysis = {
  id: string;
  demo: boolean;
  summary: string | null;
  job: {
    title: string;
    company: string;
    location: string;
    employmentType: string;
  };
  match: MatchBreakdown;
  alignments: SkillMatch[];
  gaps: SkillGap[];
  recommendation: string;
  nextSteps: string[];
  trace: TraceEvent[];
};

export const applicationStatuses = [
  "analyzing",
  "ready",
  "outreach",
  "applied",
  "interview",
  "offer",
  "rejected",
  "archived",
] as const;

export type ApplicationStatus = (typeof applicationStatuses)[number];

export type ApplicationStage = "saved" | "ready" | "applied" | "interview";

export type Application = {
  id: string;
  role: string;
  company: string;
  match: number;
  stage: ApplicationStage;
  note: string;
};

export type RecentAnalysis = {
  id: string;
  role: string;
  company: string;
  match: number;
  status: string;
  href: string | null;
};

export type WorkspaceStat = {
  label: string;
  value: string;
};

export type ContactSource = "demo" | "manual";

export type ContactRelevance =
  | "hiring_manager"
  | "recruiter"
  | "engineering_leader"
  | "potential_teammate"
  | "low_relevance";

/** A person the user is considering. Demo entries are examples, not lookup results. */
export type Contact = {
  id: string;
  source: ContactSource;
  name: string;
  title: string;
  company: string;
  context: string | null;
  /** User-typed URL. ApplyPilot does not fetch it. */
  profileUrl: string | null;
  relevance: ContactRelevance;
  relevanceReason: string;
};

export type OutreachChannel = "linkedin" | "email";

export type OutreachReviewStatus = "awaiting_review" | "approved" | "rejected";
