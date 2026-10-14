import { OutreachStateError } from "@/lib/ai/errors";
import type { OutreachContent } from "@/lib/ai/schemas/outreach";
import { applyReviewAction, createAwaitingReview } from "@/lib/outreach/review";
import type { TraceEvent } from "@/types/domain";
import { describe, expect, it } from "vitest";

const trace: TraceEvent[] = [
  {
    id: "review-1",
    node: "validate_outreach",
    label: "Awaiting human review",
    status: "completed",
    attempt: 1,
    durationMs: null,
    detail: null,
  },
];

const content: OutreachContent = {
  channel: "linkedin",
  subject: null,
  message: "Hi, I built TypeScript services and saw the frontend role.",
  grounding: {
    candidatePointsUsed: ["TypeScript: Built TypeScript services"],
    jobPointsUsed: ["Frontend Engineer at Northwind"],
  },
};

describe("outreach review", () => {
  it("starts a generated draft in awaiting review", () => {
    expect(createAwaitingReview(content, trace).status).toBe("awaiting_review");
    expect(createAwaitingReview(content, trace).humanEdited).toBe(false);
  });

  it("does not approve a draft unless approve is applied", () => {
    const draft = createAwaitingReview(content, trace);
    const edited = applyReviewAction(draft, {
      type: "edit",
      message: "Hi, I built TypeScript services.",
      subject: null,
    });
    expect(edited.status).toBe("awaiting_review");
    expect(applyReviewAction(draft, { type: "reject" }).status).toBe("rejected");
    expect(applyReviewAction(draft, { type: "approve" }).status).toBe("approved");
  });

  it("keeps a human-edited flag when the message changes", () => {
    const draft = createAwaitingReview(content, trace);
    const edited = applyReviewAction(draft, {
      type: "edit",
      message: "Hi Alex — I built TypeScript services.",
      subject: null,
    });
    expect(edited.humanEdited).toBe(true);
    expect(edited.message).toBe("Hi Alex — I built TypeScript services.");
    const approved = applyReviewAction(edited, { type: "approve" });
    expect(approved.status).toBe("approved");
    expect(approved.humanEdited).toBe(true);
    expect(approved.trace.map((event) => event.label)).toContain("Draft edited by user");
    expect(approved.trace.map((event) => event.label)).toContain("Draft approved by user");
  });

  it("rejects from awaiting review and refuses a later approve", () => {
    const rejected = applyReviewAction(createAwaitingReview(content, trace), { type: "reject" });
    expect(rejected.status).toBe("rejected");
    expect(() => applyReviewAction(rejected, { type: "approve" })).toThrow(OutreachStateError);
  });

  it("returns a regenerated draft to awaiting review", () => {
    const approved = applyReviewAction(createAwaitingReview(content, trace), { type: "approve" });
    const next = applyReviewAction(approved, {
      type: "regenerate",
      content: { ...content, message: "A new draft about the frontend role." },
      trace,
    });
    expect(next.status).toBe("awaiting_review");
    expect(next.humanEdited).toBe(false);
    expect(next.message).toBe("A new draft about the frontend role.");
  });

  it("refuses edit and approve after the draft is approved", () => {
    const approved = applyReviewAction(createAwaitingReview(content, trace), { type: "approve" });
    expect(() =>
      applyReviewAction(approved, { type: "edit", message: "Changed", subject: null }),
    ).toThrow(OutreachStateError);
    expect(() => applyReviewAction(approved, { type: "approve" })).toThrow(OutreachStateError);
  });
});
