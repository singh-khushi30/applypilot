import { storedAnalysisSchema, type StoredAnalysis } from "@/lib/analysis/stored-analysis";
import { z } from "zod";

// Unsaved browser copy used only when Supabase did not store the analysis.
export const ANALYSIS_SESSION_KEY = "applypilot.analysis.v2";

const envelopeSchema = z.object({
  unsaved: z.boolean(),
  analysis: storedAnalysisSchema,
});

export type SessionAnalysis = z.infer<typeof envelopeSchema>;

export function saveAnalysis(analysis: StoredAnalysis, unsaved: boolean) {
  const record: SessionAnalysis = { unsaved, analysis };
  sessionStorage.setItem(ANALYSIS_SESSION_KEY, JSON.stringify(record));
}

export function readAnalysisSnapshot() {
  return sessionStorage.getItem(ANALYSIS_SESSION_KEY) ?? "";
}

export function parseSessionAnalysis(raw: string): SessionAnalysis | null {
  if (!raw) return null;
  try {
    const json: unknown = JSON.parse(raw);
    const envelope = envelopeSchema.safeParse(json);
    if (envelope.success) return envelope.data;
    const legacy = storedAnalysisSchema.safeParse(json);
    return legacy.success ? { unsaved: true, analysis: legacy.data } : null;
  } catch {
    return null;
  }
}
