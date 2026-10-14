import { z } from "zod";

export const LINKEDIN_MESSAGE_MAX = 600;
export const EMAIL_MESSAGE_MAX = 1500;
export const EMAIL_SUBJECT_MAX = 100;

const groundingPoint = z.string().trim().min(1).max(160);

export const outreachContentSchema = z
  .strictObject({
    channel: z.enum(["linkedin", "email"]),
    subject: z.union([z.string().trim().min(1).max(EMAIL_SUBJECT_MAX), z.null()]),
    message: z.string().trim().min(1).max(EMAIL_MESSAGE_MAX),
    grounding: z.strictObject({
      candidatePointsUsed: z.array(groundingPoint).max(2),
      jobPointsUsed: z.array(groundingPoint).max(2),
    }),
  })
  .superRefine((value, ctx) => {
    if (value.channel === "linkedin") {
      if (value.subject !== null) {
        ctx.addIssue({
          code: "custom",
          path: ["subject"],
          message: "LinkedIn messages do not include a subject.",
        });
      }
      if (value.message.length > LINKEDIN_MESSAGE_MAX) {
        ctx.addIssue({
          code: "too_big",
          origin: "string",
          maximum: LINKEDIN_MESSAGE_MAX,
          inclusive: true,
          path: ["message"],
          message: "LinkedIn message is too long.",
        });
      }
    }
    if (value.channel === "email" && !value.subject) {
      ctx.addIssue({
        code: "custom",
        path: ["subject"],
        message: "Email drafts need a subject.",
      });
    }
  })
  .describe("A grounded outreach draft. No scores, reasoning, or unstated facts.");

export type OutreachContent = z.infer<typeof outreachContentSchema>;
