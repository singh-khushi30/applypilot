import { storedAnalysisSchema, type StoredAnalysis } from "@/lib/analysis/stored-analysis";

// v2: trace events recorded by the agent graph.
export const ANALYSIS_SESSION_KEY = "applypilot.analysis.v2";

export function saveAnalysis(analysis: StoredAnalysis) {
  sessionStorage.setItem(ANALYSIS_SESSION_KEY, JSON.stringify(analysis));
}

export function readAnalysisSnapshot() {
  return sessionStorage.getItem(ANALYSIS_SESSION_KEY) ?? "";
}

export function parseStoredAnalysis(raw: string): StoredAnalysis | null {
  if (!raw) return null;
  try {
    const parsed = storedAnalysisSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
