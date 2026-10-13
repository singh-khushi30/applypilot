import { AnalysisServiceError, ModelOutputValidationError } from "@/lib/ai/errors";
import { analysisContentSchema } from "@/lib/ai/schemas/analysis";
import { withStructuredRetry } from "@/lib/ai/structured-output";
import { validationIssueMetadata } from "@/lib/ai/validation-log";
import { afterEach, describe, expect, it, vi } from "vitest";

const resumeSecret = "SECRET_RESUME_BODY_SHOULD_NOT_BE_LOGGED";

const valid = {
  job: {
    company: null,
    roleTitle: "Engineer",
    location: null,
    employmentType: null,
  },
  roleSummary: "A general engineering role.",
  requirements: [],
  skillEvidence: [],
  gaps: [],
  domainAlignment: "limited",
  recommendation: {
    summary: "There is not enough evidence to call this a strong match.",
    nextSteps: ["Review the posting"],
  },
};

describe("structured output retry", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("retries once with schema issues and then accepts valid data", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const run = vi
      .fn()
      .mockResolvedValueOnce({ ...valid, domainAlignment: "nope" })
      .mockResolvedValueOnce(valid);

    const result = await withStructuredRetry({ schema: analysisContentSchema, run });

    expect(result.value.domainAlignment).toBe("limited");
    expect(result.attempts).toBe(2);
    expect(run).toHaveBeenCalledTimes(2);
    expect(run.mock.calls[1]?.[0]).toContain("domainAlignment");
    expect(run.mock.calls[1]?.[0]).toContain("invalid_value");
    expect(run.mock.calls[1]?.[0]).not.toContain(resumeSecret);
    expect(errorSpy.mock.calls[0]?.[0]).toContain("analysis_validation_failure");
    expect(String(errorSpy.mock.calls[0]?.[0])).not.toContain(resumeSecret);
  });

  it("stops after two invalid responses", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const run = vi.fn().mockResolvedValue({ score: 99 });

    await expect(withStructuredRetry({ schema: analysisContentSchema, run })).rejects.toBeInstanceOf(
      ModelOutputValidationError,
    );
    expect(run).toHaveBeenCalledTimes(2);
  });

  it("retries an unparseable response once", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const run = vi
      .fn()
      .mockRejectedValueOnce(new ModelOutputValidationError("not json"))
      .mockResolvedValueOnce(valid);

    await expect(withStructuredRetry({ schema: analysisContentSchema, run })).resolves.toEqual({ value: valid, attempts: 2 });
    expect(run.mock.calls[1]?.[0]).toContain("unparseable");
  });

  it("never exceeds two attempts", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const run = vi.fn().mockResolvedValue({});

    await expect(
      withStructuredRetry({ schema: analysisContentSchema, run, maxAttempts: 10 }),
    ).rejects.toBeInstanceOf(ModelOutputValidationError);
    expect(run).toHaveBeenCalledTimes(2);
  });

  it("does not retry provider failures", async () => {
    const run = vi.fn().mockRejectedValue(new AnalysisServiceError("rate_limit", "busy"));

    await expect(withStructuredRetry({ schema: analysisContentSchema, run })).rejects.toMatchObject({
      code: "rate_limit",
    });
    expect(run).toHaveBeenCalledTimes(1);
  });

  it("does not retry unexpected errors as validation failures", async () => {
    const run = vi.fn().mockRejectedValue(new Error("boom"));

    await expect(withStructuredRetry({ schema: analysisContentSchema, run })).rejects.toThrow("boom");
    expect(run).toHaveBeenCalledTimes(1);
  });

  it("logs only path and code from a schema error", () => {
    const parsed = analysisContentSchema.safeParse({
      ...valid,
      recommendation: { ...valid.recommendation, summary: resumeSecret.repeat(40) },
    });
    expect(parsed.success).toBe(false);
    if (parsed.success) return;

    const issues = validationIssueMetadata(parsed.error);
    expect(issues).toEqual([{ path: "recommendation.summary", code: "too_big" }]);
    expect(JSON.stringify(issues)).not.toContain("SECRET_RESUME");
  });
});
