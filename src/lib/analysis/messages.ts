export const analysisMessages = {
  missingDescription: "Paste a job description to continue.",
  descriptionTooShort: "Paste a fuller job description so ApplyPilot can read the role.",
  missingFile: "Add a PDF resume to continue.",
  invalidPdf: "Upload a PDF resume.",
  fileTooLarge: "That file is larger than 5 MB.",
  emptyFile: "That PDF looks empty. Try exporting your resume again.",
  unreadablePdf:
    "We couldn’t read text from this PDF. Try exporting your resume as a text-based PDF.",
  urlUnavailable:
    "Job URL extraction isn’t available yet. Paste the job description to run this analysis.",
  missingApiKey: "Add GEMINI_API_KEY to .env.local to run an analysis.",
  rateLimit: "ApplyPilot is busy right now. Please try again in a moment.",
  generic: "ApplyPilot couldn’t complete the analysis right now. Please try again.",
} as const;
