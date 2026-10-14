import type { ContactRelevance } from "@/types/domain";

export const relevanceLabels: Record<ContactRelevance, string> = {
  hiring_manager: "Hiring Manager",
  recruiter: "Recruiter / Talent",
  engineering_leader: "Engineering Leader",
  potential_teammate: "Potential Teammate",
  low_relevance: "Low Relevance",
};

const UNKNOWN_COMPANY = new Set(["", "unknown", "not specified", "n a"]);

type WorkFunction = "engineering" | "product" | "design" | "data" | "other";

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/\b(inc|llc|ltd|corp|co|company)\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function sameCompany(jobCompany: string, personCompany: string) {
  const job = normalize(jobCompany);
  const person = normalize(personCompany);
  if (UNKNOWN_COMPANY.has(job) || UNKNOWN_COMPANY.has(person)) return false;
  return job === person;
}

function isRecruiter(title: string) {
  return /\b(recruit\w*|talent|sourc\w*|people partner|human resources)\b|\bhr\b/.test(title);
}

function isLeadership(title: string) {
  return /\b(manager|director|head|vp|vice president|chief|team lead)\b/.test(title);
}

function workFunction(title: string): WorkFunction {
  if (/\b(engineer\w*|engineering|developer|software|frontend|backend|fullstack|full stack|sre|devops|platform)\b/.test(title)) {
    return "engineering";
  }
  if (/\b(product)\b/.test(title)) return "product";
  if (/\b(design\w*)\b/.test(title)) return "design";
  if (/\b(data|machine learning|ml)\b/.test(title)) return "data";
  return "other";
}

export function classifyContact(input: {
  jobTitle: string;
  jobCompany: string;
  personTitle: string;
  personCompany: string;
}): { relevance: ContactRelevance; relevanceReason: string } {
  const title = normalize(input.personTitle);
  const jobTitle = normalize(input.jobTitle);
  const personFn = workFunction(title);
  const jobFn = workFunction(jobTitle);
  const atTarget = sameCompany(input.jobCompany, input.personCompany);
  const displayTitle = input.personTitle.trim() || "This person";

  if (isRecruiter(title)) {
    return {
      relevance: "recruiter",
      relevanceReason:
        "Recruiting or talent title; often part of hiring conversations. Not confirmed to own this opening.",
    };
  }

  if (isLeadership(title) && personFn === jobFn && personFn !== "other" && atTarget) {
    return {
      relevance: "hiring_manager",
      relevanceReason: `${displayTitle} at the target company; likely relevant to the role.`,
    };
  }

  if (personFn === "engineering" && isLeadership(title)) {
    return {
      relevance: "engineering_leader",
      relevanceReason: "Engineering leadership title. Not confirmed to be involved in this opening.",
    };
  }

  if (atTarget && personFn === jobFn && personFn !== "other") {
    return {
      relevance: "potential_teammate",
      relevanceReason: "Similar function at the target company. Not confirmed as the hiring owner.",
    };
  }

  return {
    relevance: "low_relevance",
    relevanceReason: "This title does not line up closely with the role.",
  };
}
