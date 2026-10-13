import type { AnalysisContent } from "@/lib/ai/schemas/analysis";
import type { MatchBreakdown, MatchLabel } from "@/types/domain";

const STATUS_WEIGHT = {
  strong: 1,
  partial: 0.5,
  missing: 0,
} as const;

const DOMAIN_WEIGHT = {
  strong: 1,
  partial: 0.5,
  limited: 0,
} as const;

const WEIGHTS = {
  required: 0.45,
  experience: 0.25,
  preferred: 0.15,
  domain: 0.15,
} as const;

export const MATCH_EXPLANATION =
  "ApplyPilot weighs required skills most heavily, then resume evidence, preferred qualifications, and domain alignment. If a posting does not list one of those groups, that portion is left out and the remaining weights are scaled to 100%. The percentage is calculated from the structured comparison, not estimated by the model.";

export function skillKey(skill: string) {
  return skill.trim().toLowerCase();
}

function roundPercent(value: number) {
  const clamped = Math.min(100, Math.max(0, value));
  return Math.round(clamped);
}

function mean(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function strongestEvidence(content: AnalysisContent, skill: string) {
  const key = skillKey(skill);
  const matches = content.skillEvidence.filter((item) => skillKey(item.skill) === key);
  if (matches.length === 0) return 0;
  return Math.max(...matches.map((item) => STATUS_WEIGHT[item.status]));
}

function categoryRatio(content: AnalysisContent, category: "required" | "preferred") {
  const items = content.requirements.filter((item) => item.category === category);
  if (items.length === 0) return null;
  return mean(items.map((item) => strongestEvidence(content, item.skill)));
}

function evidenceRatio(content: AnalysisContent) {
  const resumeItems = content.skillEvidence.filter((item) => item.source === "resume");
  const bySkill = new Map<string, number>();
  for (const item of resumeItems) {
    const key = skillKey(item.skill);
    const weight = STATUS_WEIGHT[item.status];
    bySkill.set(key, Math.max(bySkill.get(key) ?? 0, weight));
  }
  if (bySkill.size === 0) return null;
  return mean([...bySkill.values()]);
}

/** The only place a score becomes a match classification. */
export function classifyMatch(overall: number): MatchLabel {
  if (overall >= 80) return "Strong Match";
  if (overall >= 60) return "Potential Match";
  return "Stretch";
}

function zeroMatch(): MatchBreakdown {
  return {
    overall: 0,
    label: "Stretch",
    explanation: MATCH_EXPLANATION,
    dimensions: [
      { id: "required", label: "Required skills", score: 0, omitted: true },
      { id: "experience", label: "Resume evidence", score: 0, omitted: true },
      { id: "preferred", label: "Preferred skills", score: 0, omitted: true },
      { id: "domain", label: "Domain alignment", score: 0, omitted: true },
    ],
  };
}

export function calculateMatch(content: AnalysisContent): MatchBreakdown {
  const hasResumeEvidence = content.skillEvidence.some((item) => item.source === "resume");
  if (content.requirements.length === 0 && !hasResumeEvidence) {
    return zeroMatch();
  }

  const required = categoryRatio(content, "required");
  const preferred = categoryRatio(content, "preferred");
  const evidence = evidenceRatio(content);
  const domain = DOMAIN_WEIGHT[content.domainAlignment];

  const candidates: Array<{ weight: number; ratio: number } | null> = [
    required === null ? null : { weight: WEIGHTS.required, ratio: required },
    evidence === null ? null : { weight: WEIGHTS.experience, ratio: evidence },
    preferred === null ? null : { weight: WEIGHTS.preferred, ratio: preferred },
    { weight: WEIGHTS.domain, ratio: domain },
  ];
  const parts = candidates.filter((part): part is { weight: number; ratio: number } => part !== null);

  const weightSum = parts.reduce((sum, part) => sum + part.weight, 0);
  const overall = roundPercent(
    parts.reduce((sum, part) => sum + (part.weight / weightSum) * part.ratio, 0) * 100,
  );

  return {
    overall,
    label: classifyMatch(overall),
    explanation: MATCH_EXPLANATION,
    dimensions: [
      {
        id: "required",
        label: "Required skills",
        score: required === null ? 0 : roundPercent(required * 100),
        omitted: required === null,
      },
      {
        id: "experience",
        label: "Resume evidence",
        score: evidence === null ? 0 : roundPercent(evidence * 100),
        omitted: evidence === null,
      },
      {
        id: "preferred",
        label: "Preferred skills",
        score: preferred === null ? 0 : roundPercent(preferred * 100),
        omitted: preferred === null,
      },
      {
        id: "domain",
        label: "Domain alignment",
        score: roundPercent(domain * 100),
      },
    ],
  };
}
