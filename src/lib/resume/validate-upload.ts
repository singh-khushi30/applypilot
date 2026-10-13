import { AnalysisInputError } from "@/lib/ai/errors";
import { analysisMessages } from "@/lib/analysis/messages";
import { MAX_RESUME_BYTES } from "@/lib/utils/format";

const PDF_MAGIC = [0x25, 0x50, 0x44, 0x46];

export function validateResumeUpload(file: {
  type: string;
  name: string;
  byteLength: number;
  bytes: Uint8Array;
}) {
  if (file.byteLength === 0 || file.bytes.byteLength === 0) {
    throw new AnalysisInputError("empty_file", analysisMessages.emptyFile);
  }
  if (file.byteLength > MAX_RESUME_BYTES || file.bytes.byteLength > MAX_RESUME_BYTES) {
    throw new AnalysisInputError("file_too_large", analysisMessages.fileTooLarge);
  }

  const typedPdf = file.type === "application/pdf";
  const magic = PDF_MAGIC.every((byte, index) => file.bytes[index] === byte);
  if (!typedPdf || !magic) {
    throw new AnalysisInputError("invalid_pdf", analysisMessages.invalidPdf);
  }
}
