import { calculateMatch } from "@/lib/analysis/calculate-match";
import type { AnalysisContent } from "@/lib/ai/schemas/analysis";
import type { Analysis, SkillGap } from "@/types/domain";

const REAL_TRACE: Analysis["trace"] = [
  { id: "resume", label: "Resume extracted" },
  { id: "requirements", label: "Requirements structured" },
  { id: "evidence", label: "Evidence compared" },
  { id: "fit", label: "Fit calculated" },
  { id: "gaps", label: "Gaps identified" },
  { id: "recommendation", label: "Recommendation prepared" },
];

function requirementLine(content: AnalysisContent, skill: string) {
  const match = content.requirements.find(
    (item) => item.skill.trim().toLowerCase() === skill.trim().toLowerCase(),
  );
  if (!match) return "Noted while comparing the role";
  const category = match.category === "required" ? "Required" : "Preferred";
  return `${category} · ${match.importance} importance`;
}

function alignmentsFrom(content: AnalysisContent): Analysis["alignments"] {
  const seen = new Set<string>();
  const alignments: Analysis["alignments"] = [];

  for (const item of content.skillEvidence) {
    if (item.source !== "resume" || item.status === "missing") continue;
    const key = item.skill.trim().toLowerCase();
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
    const key = gap.skill.trim().toLowerCase();
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

export function toAnalysis(
  content: AnalysisContent,
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
    match: calculateMatch(content),
    alignments: alignmentsFrom(content),
    gaps: gapsFrom(content),
    recommendation: content.recommendation.summary.trim(),
    nextSteps: content.recommendation.nextSteps.map((step) => step.trim()).slice(0, 6),
    trace: REAL_TRACE,
  };
}
