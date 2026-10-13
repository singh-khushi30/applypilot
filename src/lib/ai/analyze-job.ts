import { AnalysisServiceError } from "@/lib/ai/errors";
import { generateAnalysisContent } from "@/lib/ai/gemini";
import { buildAnalysisPrompt } from "@/lib/ai/prompts/analysis";
import { analysisContentSchema } from "@/lib/ai/schemas/analysis";
import { withStructuredRetry } from "@/lib/ai/structured-output";
import { logValidationFailure, validationIssueMetadata } from "@/lib/ai/validation-log";
import { analysisMessages } from "@/lib/analysis/messages";
import { storedAnalysisSchema } from "@/lib/analysis/stored-analysis";
import { toAnalysis } from "@/lib/analysis/to-analysis";

export async function analyzeJobFit(input: {
  jobDescription: string;
  resumeText: string;
  company: string | null;
  roleTitle: string | null;
}) {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    const development = process.env.NODE_ENV !== "production";
    throw new AnalysisServiceError(
      development ? "missing_api_key" : "unavailable",
      development ? analysisMessages.missingApiKey : analysisMessages.generic,
    );
  }

  const prompt = buildAnalysisPrompt(input);
  const content = await withStructuredRetry({
    schema: analysisContentSchema,
    run: (correction) => generateAnalysisContent(apiKey, prompt, correction),
  });
  const analysis = toAnalysis(content, {
    id: crypto.randomUUID(),
    company: input.company,
    roleTitle: input.roleTitle,
  });
  const stored = storedAnalysisSchema.safeParse(analysis);
  if (!stored.success) {
    logValidationFailure(0, validationIssueMetadata(stored.error));
    throw new AnalysisServiceError("generic", analysisMessages.generic);
  }
  return stored.data;
}
