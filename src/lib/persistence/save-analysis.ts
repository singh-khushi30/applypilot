import { toAnalysisBundle, type AnalysisBundle } from "@/lib/persistence/records";
import type { StoredAnalysis } from "@/lib/analysis/stored-analysis";
import { PersistenceConfigError, PersistenceError } from "@/lib/supabase/errors";
import { persistenceMessages } from "@/lib/supabase/config";

export type SaveAnalysisResult =
  | { persisted: true; analysis: StoredAnalysis }
  | { persisted: false; analysis: StoredAnalysis; error: PersistenceConfigError | PersistenceError };

/**
 * Saves an analysis that has already been produced.
 * The model runner is not called here, so a database failure cannot start another model run.
 */
export async function saveCompletedAnalysis(
  analysis: StoredAnalysis,
  save: (bundle: AnalysisBundle) => Promise<void>,
): Promise<SaveAnalysisResult> {
  try {
    await save(toAnalysisBundle(analysis));
    return { persisted: true, analysis };
  } catch (error) {
    if (error instanceof PersistenceConfigError) {
      return { persisted: false, analysis, error };
    }
    return {
      persisted: false,
      analysis,
      error: new PersistenceError(persistenceMessages.saveFailed),
    };
  }
}
