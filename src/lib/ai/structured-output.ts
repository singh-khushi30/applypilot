import { ModelOutputValidationError } from "@/lib/ai/errors";
import { buildCorrectionPrompt } from "@/lib/ai/prompts/analysis";
import {
  logValidationFailure,
  validationIssueMetadata,
  type ValidationIssueMeta,
} from "@/lib/ai/validation-log";
import type { ZodType } from "zod";

const MAX_ATTEMPTS = 2;

/**
 * Runs a model call and validates its output with Zod. An invalid or
 * unparseable response is retried once with only the failing schema paths
 * and codes. Provider errors are not retried here.
 */
export async function withStructuredRetry<T>(options: {
  schema: ZodType<T>;
  run: (correction: string | null) => Promise<unknown>;
  maxAttempts?: number;
}): Promise<T> {
  const maxAttempts = Math.min(options.maxAttempts ?? MAX_ATTEMPTS, MAX_ATTEMPTS);
  let correction: string | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    let issues: ValidationIssueMeta[];
    try {
      const parsed = options.schema.safeParse(await options.run(correction));
      if (parsed.success) return parsed.data;
      issues = validationIssueMetadata(parsed.error);
    } catch (error) {
      if (!(error instanceof ModelOutputValidationError)) throw error;
      issues = [{ path: "(response)", code: "unparseable" }];
    }

    logValidationFailure(attempt, issues);
    correction = buildCorrectionPrompt(issues);
  }

  throw new ModelOutputValidationError("Structured model output stayed invalid.");
}
