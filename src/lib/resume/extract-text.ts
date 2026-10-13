import { ResumeExtractionError } from "@/lib/ai/errors";
import { analysisMessages } from "@/lib/analysis/messages";
import { extractText } from "unpdf";

const MIN_LETTERS = 40;
export const MAX_RESUME_TEXT = 20_000;

export function assertResumeText(text: string) {
  const collapsed = text.replace(/\s+/g, " ").trim();
  const letters = collapsed.replace(/[^A-Za-z]/g, "");
  if (letters.length < MIN_LETTERS) {
    throw new ResumeExtractionError(analysisMessages.unreadablePdf);
  }
  return collapsed.slice(0, MAX_RESUME_TEXT);
}

export async function extractResumeText(bytes: Uint8Array) {
  try {
    const { text } = await extractText(bytes, { mergePages: true });
    return assertResumeText(text);
  } catch (error) {
    if (error instanceof ResumeExtractionError) throw error;
    throw new ResumeExtractionError(analysisMessages.unreadablePdf);
  }
}
