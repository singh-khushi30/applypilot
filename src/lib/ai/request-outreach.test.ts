import { requestOutreachDraft, type OutreachModel } from "@/lib/ai/request-outreach";
import { afterEach, describe, expect, it, vi } from "vitest";

const allowed = {
  candidatePoints: ["TypeScript: Built TypeScript services"],
  jobPoints: ["Frontend Engineer at Northwind"],
};

const valid = {
  channel: "linkedin",
  subject: null,
  message: "Hi, I built TypeScript services and saw the frontend role.",
  grounding: {
    candidatePointsUsed: ["Built TypeScript services"],
    jobPointsUsed: ["Frontend Engineer at Northwind"],
  },
};

const invented = {
  ...valid,
  grounding: {
    candidatePointsUsed: ["Won an award the resume does not mention"],
    jobPointsUsed: ["Frontend Engineer at Northwind"],
  },
};

describe("requestOutreachDraft", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("retries once when grounding is not from the supplied evidence", async () => {
    const errors: string[] = [];
    vi.spyOn(console, "error").mockImplementation((line: unknown) => {
      errors.push(String(line));
    });
    const model = vi
      .fn<OutreachModel>()
      .mockResolvedValueOnce(invented)
      .mockResolvedValueOnce(valid);

    const result = await requestOutreachDraft({
      model,
      prompt: "prompt",
      channel: "linkedin",
      ...allowed,
    });

    expect(result.attempts).toBe(2);
    expect(result.value.grounding.candidatePointsUsed).toEqual(["Built TypeScript services"]);
    expect(errors.join("\n")).toContain("outreach_validation_failure");
    expect(errors.join("\n")).not.toContain("Won an award");
    expect(errors.join("\n")).not.toContain(valid.message);
  });
});
