import type { AnalysisContent } from "@/lib/ai/schemas/analysis";
import { skillKey } from "@/lib/analysis/calculate-match";
import type { Analysis, MatchBreakdown, SkillGap, TraceEvent } from "@/types/domain";

function requirementLine(content: AnalysisContent, skill: string) {
  const match = content.requirements.find((item) => skillKey(item.skill) === skillKey(skill));
  if (!match) return "Noted while comparing the role";
  const category = match.category === "required" ? "Required" : "Preferred";
  return `${category} · ${match.importance} importance`;
}

function alignmentsFrom(content: AnalysisContent): Analysis["alignments"] {
  const seen = new Set<string>();
  const alignments: Analysis["alignments"] = [];

  for (const item of content.skillEvidence) {
    if (item.source !== "resume" || item.status === "missing") continue;
    const key = skillKey(item.skill);
    if (seen.has(key)) continue;
    seen.add(key);
    const evidence =
      item.evidence ??
      (item.status === "strong" ? "Supported by the resume" : "Partially supported by the resume");
    alignments.push({ skill: item.skill.trim(), evidence });
    if (alignments.length === 8) break;
  }

  return alignments;
}

function gapsFrom(content: AnalysisContent): SkillGap[] {
  const seen = new Set<string>();
  const gaps: SkillGap[] = [];

  for (const gap of content.gaps) {
    const key = skillKey(gap.skill);
    if (seen.has(key)) continue;
    seen.add(key);
    gaps.push({
      skill: gap.skill.trim(),
      importance: gap.importance,
      requirement: requirementLine(content, gap.skill),
      finding: gap.reason.trim(),
    });
    if (gaps.length === 6) break;
  }

  return gaps;
}

function specified(value: string | null | undefined, fallback: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : fallback;
}

/**
 * Builds the client-facing analysis from validated model content, the
 * deterministic match result, and the agent trace. Input documents are not
 * part of the output.
 */
export function toAnalysis(
  content: AnalysisContent,
  match: MatchBreakdown,
  trace: TraceEvent[],
  options: { id: string; company: string | null; roleTitle: string | null },
): Analysis {
  return {
    id: options.id,
    demo: false,
    summary: content.roleSummary.trim(),
    job: {
      title: specified(options.roleTitle, content.job.roleTitle),
      company: specified(options.company, specified(content.job.company, "Not specified")),
      location: specified(content.job.location, "Not specified"),
      employmentType: specified(content.job.employmentType, "Not specified"),
    },
    match,
    alignments: alignmentsFrom(content),
    gaps: gapsFrom(content),
    recommendation: content.recommendation.summary.trim(),
    nextSteps: content.recommendation.nextSteps.map((step) => step.trim()).slice(0, 6),
    trace,
  };
}
