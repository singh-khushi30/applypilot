export const trustPoints = [
  "Resume-aware",
  "Human-approved",
  "Agent-powered",
] as const;

export const workflowSteps = [
  {
    number: "01",
    title: "Understand the role",
    detail: "The posting becomes a brief.",
    approval: false,
  },
  {
    number: "02",
    title: "Read your resume",
    detail: "Experience stays the source of truth.",
    approval: false,
  },
  {
    number: "03",
    title: "Analyze your fit",
    detail: "A match you can explain.",
    approval: false,
  },
  {
    number: "04",
    title: "Find the gaps",
    detail: "Missing skills, named plainly.",
    approval: false,
  },
  {
    number: "05",
    title: "Research people",
    detail: "Relevant contacts, not a blast list.",
    approval: false,
  },
  {
    number: "06",
    title: "Draft outreach",
    detail: "A note shaped around the role.",
    approval: false,
  },
  {
    number: "07",
    title: "Ask for your approval",
    detail: "You decide what moves forward.",
    approval: true,
  },
] as const;

export const featureCards = [
  {
    title: "Explainable Matching",
    body: "Know exactly why a role matches your experience.",
    tone: "lavender",
  },
  {
    title: "Skill Gap Analysis",
    body: "See what is missing before you apply.",
    tone: "powder",
  },
  {
    title: "Contact Research",
    body: "Surface relevant people worth reaching out to.",
    tone: "cream",
  },
  {
    title: "Human-in-the-Loop",
    body: "Nothing consequential happens without your approval.",
    tone: "blush",
  },
] as const;

export const previewNav = [
  { label: "Overview", active: true },
  { label: "New Analysis", active: false },
  { label: "Applications", active: false },
  { label: "Contacts", active: false },
] as const;

export const previewDemo = {
  role: "Software Engineer",
  company: "Acme",
  match: 82,
  matches: ["TypeScript", "React", "Node.js", "API Design"],
  gaps: ["Kubernetes", "AWS"],
  activity: [
    { label: "Job understood", state: "done" },
    { label: "Resume analyzed", state: "done" },
    { label: "Skills compared", state: "done" },
    { label: "Researching relevant contacts", state: "active" },
    { label: "Preparing outreach", state: "pending" },
  ],
} as const;
