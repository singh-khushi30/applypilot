import { analyzeJobFit } from "@/lib/ai/analyze-job";
import { saveCompletedAnalysis } from "@/lib/persistence/save-analysis";
import { saveAnalysisBundle } from "@/lib/supabase/repositories/analyses";
import {
  AnalysisInputError,
  AnalysisQualityError,
  AnalysisServiceError,
  ModelOutputValidationError,
  ResumeExtractionError,
} from "@/lib/ai/errors";
import { analysisMessages } from "@/lib/analysis/messages";
import { extractResumeText } from "@/lib/resume/extract-text";
import { validateResumeUpload } from "@/lib/resume/validate-upload";
import { MAX_RESUME_BYTES } from "@/lib/utils/format";

export const maxDuration = 60;

const MAX_JOB_TEXT = 20_000;
const MIN_JOB_TEXT = 40;
// Resume limit plus room for the description and multipart overhead.
const MAX_REQUEST_BYTES = MAX_RESUME_BYTES + 256 * 1024;

function errorResponse(status: number, code: string, message: string) {
  return Response.json({ error: { code, message } }, { status });
}

function optionalText(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, 120) : null;
}

async function readForm(request: Request) {
  // Reject oversized bodies before buffering them.
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > MAX_REQUEST_BYTES) {
    throw new AnalysisInputError("file_too_large", analysisMessages.fileTooLarge);
  }
  try {
    return await request.formData();
  } catch {
    throw new AnalysisInputError("invalid_request", analysisMessages.generic);
  }
}

export async function POST(request: Request) {
  try {
    const form = await readForm(request);
    const descriptionValue = form.get("description");
    const description = typeof descriptionValue === "string" ? descriptionValue.trim() : "";
    if (!description) {
      throw new AnalysisInputError("missing_description", analysisMessages.missingDescription);
    }
    if (description.length < MIN_JOB_TEXT) {
      throw new AnalysisInputError("description_too_short", analysisMessages.descriptionTooShort);
    }

    const resume = form.get("resume");
    if (!(resume instanceof File)) {
      throw new AnalysisInputError("missing_file", analysisMessages.missingFile);
    }
    if (resume.size > MAX_RESUME_BYTES) {
      throw new AnalysisInputError("file_too_large", analysisMessages.fileTooLarge);
    }

    const bytes = new Uint8Array(await resume.arrayBuffer());
    validateResumeUpload({
      type: resume.type,
      name: resume.name,
      byteLength: resume.size,
      bytes,
    });

    const resumeText = await extractResumeText(bytes);
    const analysis = await analyzeJobFit({
      jobDescription: description.slice(0, MAX_JOB_TEXT),
      resumeText,
      company: optionalText(form.get("company")),
      roleTitle: optionalText(form.get("title")),
    });

    const saved = await saveCompletedAnalysis(analysis, saveAnalysisBundle);
    if (!saved.persisted) {
      return Response.json(
        {
          analysis: saved.analysis,
          persisted: false,
          error: { code: saved.error.code, message: saved.error.message },
        },
        { status: 503 },
      );
    }

    return Response.json({ analysis: saved.analysis, persisted: true });
  } catch (error) {
    if (error instanceof AnalysisInputError || error instanceof ResumeExtractionError) {
      const status = error instanceof ResumeExtractionError ? 422 : 400;
      return errorResponse(status, error.code, error.message);
    }
    if (error instanceof AnalysisQualityError) {
      return errorResponse(502, error.code, analysisMessages.qualityFailed);
    }
    if (error instanceof ModelOutputValidationError) {
      console.error(JSON.stringify({ event: "analysis_failed", code: error.code }));
      return errorResponse(502, error.code, analysisMessages.generic);
    }
    if (error instanceof AnalysisServiceError) {
      console.error(JSON.stringify({ event: "analysis_failed", code: error.code }));
      const status = error.code === "rate_limit" ? 429 : 503;
      return errorResponse(status, error.code, error.message);
    }
    console.error(JSON.stringify({ event: "analysis_failed", code: "generic" }));
    return errorResponse(500, "generic", analysisMessages.generic);
  }
}
