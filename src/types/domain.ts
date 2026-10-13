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
  label: string;
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
  trace: Array<Pick<AgentStep, "id" | "label">>;
};

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
