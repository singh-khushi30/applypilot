import { ModelOutputValidationError } from "@/lib/ai/errors";
import { buildCorrectionPrompt } from "@/lib/ai/prompts/analysis";
import { outreachContentSchema, type OutreachContent } from "@/lib/ai/schemas/outreach";
import { pointIsSupplied } from "@/lib/outreach/evidence";
import {
  logValidationFailure,
  validationIssueMetadata,
  type ValidationIssueMeta,
} from "@/lib/ai/validation-log";
import type { OutreachChannel } from "@/types/domain";

const MAX_ATTEMPTS = 2;

export type OutreachModel = (
  prompt: string,
  correction: string | null,
  signal?: AbortSignal,
) => Promise<unknown>;

function groundingIssues(
  content: OutreachContent,
  allowed: { candidatePoints: string[]; jobPoints: string[] },
  channel: OutreachChannel,
): ValidationIssueMeta[] {
  const issues: ValidationIssueMeta[] = [];
  if (content.channel !== channel) issues.push({ path: "channel", code: "invalid_value" });

  content.grounding.candidatePointsUsed.forEach((point, index) => {
    if (!pointIsSupplied(point, allowed.candidatePoints)) {
      issues.push({ path: `grounding.candidatePointsUsed.${index}`, code: "custom" });
    }
  });
  content.grounding.jobPointsUsed.forEach((point, index) => {
    if (!pointIsSupplied(point, allowed.jobPoints)) {
      issues.push({ path: `grounding.jobPointsUsed.${index}`, code: "custom" });
    }
  });
  return issues;
}

/**
 * Structured-output retry for outreach. At most two model calls. The second
 * call only lists schema paths and codes. Provider errors are not retried.
 */
export async function requestOutreachDraft(options: {
  model: OutreachModel;
  prompt: string;
  channel: OutreachChannel;
  candidatePoints: string[];
  jobPoints: string[];
  signal?: AbortSignal;
}): Promise<{ value: OutreachContent; attempts: number }> {
  let correction: string | null = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    let issues: ValidationIssueMeta[];
    try {
      const parsed = outreachContentSchema.safeParse(
        await options.model(options.prompt, correction, options.signal),
      );
      if (parsed.success) {
        issues = groundingIssues(parsed.data, options, options.channel);
        if (issues.length === 0) return { value: parsed.data, attempts: attempt };
      } else {
        issues = validationIssueMetadata(parsed.error);
      }
    } catch (error) {
      if (!(error instanceof ModelOutputValidationError)) throw error;
      issues = [{ path: "(response)", code: "unparseable" }];
    }

    logValidationFailure(attempt, issues, "outreach_validation_failure");
    correction = buildCorrectionPrompt(issues);
  }

  throw new ModelOutputValidationError("Structured outreach output stayed invalid.");
}
