import { AnalysisServiceError } from "@/lib/ai/errors";
import { mapProviderError } from "@/lib/ai/gemini";
import { analysisMessages } from "@/lib/analysis/messages";
import { describe, expect, it } from "vitest";

describe("mapProviderError", () => {
  it("maps rate limits", () => {
    expect(mapProviderError({ status: 429 }).code).toBe("rate_limit");
    expect(mapProviderError(new Error("[429 Too Many Requests] RESOURCE_EXHAUSTED")).code).toBe(
      "rate_limit",
    );
  });

  it("maps outages, auth failures, and timeouts to unavailable", () => {
    expect(mapProviderError({ status: 503 }).code).toBe("unavailable");
    expect(mapProviderError(new Error("API key not valid")).code).toBe("unavailable");
    const timeout = new Error("The operation was aborted due to timeout");
    timeout.name = "TimeoutError";
    expect(mapProviderError(timeout).code).toBe("unavailable");
  });

  it("never passes the raw provider message to the user", () => {
    const mapped = mapProviderError(new Error("400 Bad Request: secret internal detail"));
    expect(mapped).toBeInstanceOf(AnalysisServiceError);
    expect(mapped.code).toBe("generic");
    expect(mapped.message).toBe(analysisMessages.generic);
  });
});
