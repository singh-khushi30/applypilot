export class AnalysisInputError extends Error {
  readonly code:
    | "missing_description"
    | "description_too_short"
    | "missing_file"
    | "invalid_pdf"
    | "file_too_large"
    | "empty_file"
    | "invalid_request";

  constructor(code: AnalysisInputError["code"], message: string) {
    super(message);
    this.name = "AnalysisInputError";
    this.code = code;
  }
}

export class ResumeExtractionError extends Error {
  readonly code = "unreadable_pdf";

  constructor(message: string) {
    super(message);
    this.name = "ResumeExtractionError";
  }
}

export class ModelOutputValidationError extends Error {
  readonly code = "model_output_invalid";

  constructor(message: string) {
    super(message);
    this.name = "ModelOutputValidationError";
  }
}

export class AnalysisServiceError extends Error {
  readonly code: "missing_api_key" | "rate_limit" | "unavailable" | "generic";

  constructor(code: AnalysisServiceError["code"], message: string) {
    super(message);
    this.name = "AnalysisServiceError";
    this.code = code;
  }
}
