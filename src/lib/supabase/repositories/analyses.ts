import "server-only";

import { analysisFromRows, type AnalysisBundle } from "@/lib/persistence/records";
import { LOCAL_WORKSPACE_KEY, persistenceMessages } from "@/lib/supabase/config";
import { persistenceFailure } from "@/lib/supabase/repositories/db";
import { requireSupabaseAdmin } from "@/lib/supabase/server";
import type { StoredAnalysis } from "@/lib/analysis/stored-analysis";

export async function saveAnalysisBundle(bundle: AnalysisBundle) {
  const supabase = requireSupabaseAdmin();
  const { error: applicationError } = await supabase.from("applications").insert({
    id: bundle.application.id,
    workspace_key: LOCAL_WORKSPACE_KEY,
    company: bundle.application.company,
    role_title: bundle.application.roleTitle,
    location: bundle.application.location,
    employment_type: bundle.application.employmentType,
    status: bundle.application.status,
    match_score: bundle.application.matchScore,
    match_label: bundle.application.matchLabel,
    source_url: bundle.application.sourceUrl,
  });
  if (applicationError) persistenceFailure(applicationError);

  const { error: analysisError } = await supabase.from("analyses").insert({
    id: bundle.analysis.id,
    application_id: bundle.analysis.applicationId,
    role_summary: bundle.analysis.roleSummary,
    match_score: bundle.analysis.matchScore,
    match_label: bundle.analysis.matchLabel,
    breakdown: bundle.analysis.breakdown,
    alignments: bundle.analysis.alignments,
    gaps: bundle.analysis.gaps,
    recommendation: bundle.analysis.recommendation,
    next_steps: bundle.analysis.nextSteps,
    safe_trace: bundle.analysis.trace,
  });
  if (analysisError) {
    await supabase.from("applications").delete().eq("id", bundle.application.id);
    persistenceFailure(analysisError);
  }
}

export async function loadStoredAnalysis(id: string): Promise<StoredAnalysis | null> {
  const supabase = requireSupabaseAdmin();
  const { data: application, error: applicationError } = await supabase
    .from("applications")
    .select("*")
    .eq("id", id)
    .eq("workspace_key", LOCAL_WORKSPACE_KEY)
    .maybeSingle();
  if (applicationError) persistenceFailure(applicationError, persistenceMessages.loadFailed);
  if (!application) return null;

  const { data: analysis, error: analysisError } = await supabase
    .from("analyses")
    .select("*")
    .eq("application_id", id)
    .maybeSingle();
  if (analysisError) persistenceFailure(analysisError, persistenceMessages.loadFailed);
  if (!analysis) persistenceFailure(null, persistenceMessages.unreadable);

  const stored = analysisFromRows(application, analysis);
  if (!stored) persistenceFailure(null, persistenceMessages.unreadable);
  return stored;
}
