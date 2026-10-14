import { pointIsSupplied } from "@/lib/outreach/evidence";
import {
  EMAIL_MESSAGE_MAX,
  EMAIL_SUBJECT_MAX,
  LINKEDIN_MESSAGE_MAX,
  outreachContentSchema,
} from "@/lib/ai/schemas/outreach";
import { describe, expect, it } from "vitest";

const grounding = {
  candidatePointsUsed: ["TypeScript: Built TypeScript services"],
  jobPointsUsed: ["Frontend Engineer at Northwind"],
};

function linkedin(message = "Hi, I built TypeScript services and saw the frontend role.") {
  return { channel: "linkedin" as const, subject: null, message, grounding };
}

describe("outreachContentSchema", () => {
  it("accepts a short LinkedIn draft without a subject", () => {
    expect(outreachContentSchema.safeParse(linkedin()).success).toBe(true);
  });

  it("rejects a LinkedIn message over 600 characters", () => {
    const parsed = outreachContentSchema.safeParse(linkedin("a".repeat(LINKEDIN_MESSAGE_MAX + 1)));
    expect(parsed.success).toBe(false);
  });

  it("rejects a LinkedIn subject", () => {
    const parsed = outreachContentSchema.safeParse({ ...linkedin(), subject: "Hello" });
    expect(parsed.success).toBe(false);
  });

  it("rejects an email without a subject and a subject over 100 characters", () => {
    const message = "Hello, I saw the frontend role and wanted to introduce myself.";
    expect(
      outreachContentSchema.safeParse({
        channel: "email",
        subject: null,
        message,
        grounding,
      }).success,
    ).toBe(false);
    expect(
      outreachContentSchema.safeParse({
        channel: "email",
        subject: "s".repeat(EMAIL_SUBJECT_MAX + 1),
        message,
        grounding,
      }).success,
    ).toBe(false);
    expect(
      outreachContentSchema.safeParse({
        channel: "email",
        subject: "Frontend role",
        message: "m".repeat(EMAIL_MESSAGE_MAX + 1),
        grounding,
      }).success,
    ).toBe(false);
  });

  it("accepts an email inside the subject and body limits", () => {
    const parsed = outreachContentSchema.safeParse({
      channel: "email",
      subject: "Frontend role",
      message: "Hello, I saw the frontend role and wanted to introduce myself.",
      grounding,
    });
    expect(parsed.success).toBe(true);
  });
});

describe("pointIsSupplied", () => {
  const allowed = ["TypeScript: Built TypeScript services", "Frontend Engineer at Northwind"];

  it("accepts a phrase copied from supplied evidence", () => {
    expect(pointIsSupplied("Built TypeScript services", allowed)).toBe(true);
  });

  it("rejects a phrase that was not supplied", () => {
    expect(pointIsSupplied("10 years at Google", allowed)).toBe(false);
  });
});
