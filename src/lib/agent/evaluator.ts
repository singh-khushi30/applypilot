import type { AnalysisContent } from "@/lib/ai/schemas/analysis";
import { classifyMatch, skillKey } from "@/lib/analysis/calculate-match";
import type { MatchBreakdown } from "@/types/domain";

export type EvaluationIssueCode =
  | "supported_skill_without_evidence"
  | "missing_skill_claims_evidence"
  | "required_skill_unassessed"
  | "contradictory_evidence"
  | "gap_contradicts_evidence"
  | "conflicting_requirement_category"
  | "recommendation_missing"
  | "next_steps_missing"
  | "important_gap_unreported"
  | "score_out_of_range"
  | "classification_mismatch"
  | "breakdown_invalid";

export type EvaluationIssue = {
  code: EvaluationIssueCode;
  path: string;
  /** Short and written by this module. Sent to the model on correction, never to the client. */
  message: string;
  /** False when the model cannot fix it, such as a scoring defect in our code. */
  correctable: boolean;
};

export type Evaluation = {
  passed: boolean;
  issues: EvaluationIssue[];
};

const MIN_RECOMMENDATION_LENGTH = 20;
const MAX_ISSUES = 20;
const DIMENSION_IDS = ["required", "experience", "preferred", "domain"] as const;

type Status = AnalysisContent["skillEvidence"][number]["status"];

function statusesBySkill(content: AnalysisContent) {
  const statuses = new Map<string, Set<Status>>();
  for (const item of content.skillEvidence) {
    const key = skillKey(item.skill);
    const set = statuses.get(key) ?? new Set<Status>();
    set.add(item.status);
    statuses.set(key, set);
  }
  return statuses;
}

function checkGrounding(content: AnalysisContent, issues: EvaluationIssue[]) {
  content.skillEvidence.forEach((item, index) => {
    const path = `skillEvidence.${index}`;
    const supported = item.status === "strong" || item.status === "partial";
    if (supported && (!item.evidence?.trim() || item.source !== "resume")) {
      issues.push({
        code: "supported_skill_without_evidence",
        path,
        message: `"${item.skill}" is marked ${item.status} without a resume evidence phrase.`,
        correctable: true,
      });
    }
    if (item.status === "missing" && item.source === "resume" && item.evidence?.trim()) {
      issues.push({
        code: "missing_skill_claims_evidence",
        path,
        message: `"${item.skill}" is marked missing but cites resume evidence.`,
        correctable: true,
      });
    }
  });
}

function checkCoverage(
  content: AnalysisContent,
  statuses: Map<string, Set<Status>>,
  issues: EvaluationIssue[],
) {
  // Scoring counts an unassessed requirement as missing, so every required
  // skill needs its own evidence entry.
  content.requirements.forEach((item, index) => {
    if (item.category !== "required" || statuses.has(skillKey(item.skill))) return;
    issues.push({
      code: "required_skill_unassessed",
      path: `requirements.${index}`,
      message: `Required skill "${item.skill}" has no skillEvidence entry with the same name.`,
      correctable: true,
    });
  });
}

function checkConsistency(
  content: AnalysisContent,
  statuses: Map<string, Set<Status>>,
  issues: EvaluationIssue[],
) {
  const reported = new Set<string>();
  content.skillEvidence.forEach((item, index) => {
    const key = skillKey(item.skill);
    const set = statuses.get(key);
    if (reported.has(key) || !set?.has("strong") || !set.has("missing")) return;
    reported.add(key);
    issues.push({
      code: "contradictory_evidence",
      path: `skillEvidence.${index}`,
      message: `"${item.skill}" is marked both strong and missing.`,
      correctable: true,
    });
  });

  content.gaps.forEach((gap, index) => {
    if (!statuses.get(skillKey(gap.skill))?.has("strong")) return;
    issues.push({
      code: "gap_contradicts_evidence",
      path: `gaps.${index}`,
      message: `"${gap.skill}" is listed as a gap but marked strong.`,
      correctable: true,
    });
  });

  const categories = new Map<string, string>();
  const conflicted = new Set<string>();
  content.requirements.forEach((item, index) => {
    const key = skillKey(item.skill);
    const first = categories.get(key);
    if (first === undefined) categories.set(key, item.category);
    if (first !== undefined && first !== item.category && !conflicted.has(key)) {
      conflicted.add(key);
      issues.push({
        code: "conflicting_requirement_category",
        path: `requirements.${index}`,
        message: `"${item.skill}" is listed as both required and preferred.`,
        correctable: true,
      });
    }
  });
}

function checkUsefulness(
  content: AnalysisContent,
  statuses: Map<string, Set<Status>>,
  issues: EvaluationIssue[],
) {
  if (content.recommendation.summary.trim().length < MIN_RECOMMENDATION_LENGTH) {
    issues.push({
      code: "recommendation_missing",
      path: "recommendation.summary",
      message: "The recommendation summary is missing or too short to be useful.",
      correctable: true,
    });
  }
  if (content.recommendation.nextSteps.filter((step) => step.trim()).length === 0) {
    issues.push({
      code: "next_steps_missing",
      path: "recommendation.nextSteps",
      message: "No next steps were provided.",
      correctable: true,
    });
  }

  const gapKeys = new Set(content.gaps.map((gap) => skillKey(gap.skill)));
  content.requirements.forEach((item, index) => {
    if (item.category !== "required" || item.importance !== "high") return;
    const key = skillKey(item.skill);
    const set = statuses.get(key);
    if (!set || set.has("strong") || set.has("partial") || gapKeys.has(key)) return;
    issues.push({
      code: "important_gap_unreported",
      path: `requirements.${index}`,
      message: `High-importance required skill "${item.skill}" is missing but not listed in gaps.`,
      correctable: true,
    });
  });
}

function checkScoring(match: MatchBreakdown, issues: EvaluationIssue[]) {
  const validScore = (value: number) => Number.isInteger(value) && value >= 0 && value <= 100;

  if (!validScore(match.overall)) {
    issues.push({
      code: "score_out_of_range",
      path: "match.overall",
      message: "The overall score is not an integer from 0 to 100.",
      correctable: false,
    });
  } else if (match.label !== classifyMatch(match.overall)) {
    issues.push({
      code: "classification_mismatch",
      path: "match.label",
      message: "The match label does not follow the score thresholds.",
      correctable: false,
    });
  }

  const ids = match.dimensions.map((dimension) => dimension.id);
  const complete =
    ids.length === DIMENSION_IDS.length && DIMENSION_IDS.every((id) => ids.includes(id));
  if (!complete || match.dimensions.some((dimension) => !validScore(dimension.score))) {
    issues.push({
      code: "breakdown_invalid",
      path: "match.dimensions",
      message: "The score breakdown is incomplete or out of range.",
      correctable: false,
    });
  }
}

/**
 * Deterministic quality check for a schema-valid analysis and its score.
 * No model call and no free-form reasoning: each rule emits a fixed code.
 */
export function evaluateAnalysis(content: AnalysisContent, match: MatchBreakdown): Evaluation {
  const issues: EvaluationIssue[] = [];
  const statuses = statusesBySkill(content);

  checkGrounding(content, issues);
  checkCoverage(content, statuses, issues);
  checkConsistency(content, statuses, issues);
  checkUsefulness(content, statuses, issues);
  checkScoring(match, issues);

  return { passed: issues.length === 0, issues: issues.slice(0, MAX_ISSUES) };
}
