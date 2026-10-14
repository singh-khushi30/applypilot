export type OutreachEvidence = {
  candidatePoints: string[];
  jobPoints: string[];
};

/** Picks short, already-validated analysis lines. Does not read the resume or job description. */
export function selectOutreachEvidence(analysis: {
  job: { title: string; company: string };
  summary: string | null;
  alignments: Array<{ skill: string; evidence: string }>;
}): OutreachEvidence {
  const candidatePoints = analysis.alignments
    .slice(0, 4)
    .map((item) => `${item.skill}: ${item.evidence}`.slice(0, 160));

  const summary = analysis.summary?.trim().slice(0, 180) ?? "";
  const jobPoints = [`${analysis.job.title} at ${analysis.job.company}`.slice(0, 160)];
  if (summary) jobPoints.push(summary);

  return { candidatePoints, jobPoints: jobPoints.slice(0, 4) };
}

export function normalizePoint(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** A grounding phrase is allowed only when it repeats supplied evidence. */
export function pointIsSupplied(point: string, allowed: string[]) {
  const normalized = normalizePoint(point);
  if (normalized.length < 3) return false;
  return allowed.some((item) => {
    const source = normalizePoint(item);
    if (source.length < 3) return false;
    return source.includes(normalized) || normalized.includes(source);
  });
}
