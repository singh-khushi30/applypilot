import { createOutreachGraph, runOutreachGeneration } from "@/lib/agent/outreach-graph";
import { initialOutreachState, type OutreachGraphInput } from "@/lib/agent/outreach-state";
import type { OutreachModel } from "@/lib/ai/request-outreach";
import { Command, MemorySaver } from "@langchain/langgraph";
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from "vitest";

const SECRET = "SECRET_PROFILE_NOTE_9988";
const PROMPT_MARK = "OUTREACH_PROMPT_SHOULD_NOT_LEAK";

const input: OutreachGraphInput = {
  channel: "linkedin",
  contact: {
    name: "Alex Example",
    title: "Engineering Manager",
    company: "Northwind",
    context: SECRET,
    relevanceLabel: "Hiring Manager",
  },
  candidatePoints: ["TypeScript: Built TypeScript services"],
  jobPoints: ["Frontend Engineer at Northwind"],
};

const draft = {
  channel: "linkedin",
  subject: null,
  message: "Hi Alex, I built TypeScript services and saw the frontend role.",
  grounding: {
    candidatePointsUsed: ["Built TypeScript services"],
    jobPointsUsed: ["Frontend Engineer at Northwind"],
  },
};

function mockModel(): Mock<OutreachModel> {
  return vi.fn<OutreachModel>(async () => draft);
}

let logs: string[];

beforeEach(() => {
  logs = [];
  const capture = (line: unknown) => {
    logs.push(String(line));
  };
  vi.spyOn(console, "info").mockImplementation(capture);
  vi.spyOn(console, "error").mockImplementation(capture);
});

afterEach(() => {
  vi.restoreAllMocks();
});

function thread(id: string) {
  return { configurable: { thread_id: id } };
}

describe("outreach graph", () => {
  it("pauses for human review and does not approve the draft", async () => {
    const graph = createOutreachGraph({ model: mockModel(), checkpointer: new MemorySaver() });

    const paused = await graph.invoke(initialOutreachState(input), thread("pause"));
    const interrupts = (paused as { __interrupt__?: unknown[] }).__interrupt__;

    expect(paused.status).toBe("awaiting_review");
    expect(interrupts?.length).toBeGreaterThan(0);
    expect(paused.trace.map((event) => event.label)).toEqual([
      "Contact context validated",
      "Candidate evidence selected",
      "Outreach draft generated",
      "Draft validated",
      "Awaiting human review",
    ]);
    expect(JSON.stringify(paused.trace)).not.toContain(SECRET);
    expect(logs.join("\n")).not.toContain(SECRET);
    expect(logs.join("\n")).not.toContain(PROMPT_MARK);
  });

  it("resumes into the approved branch only after an approve command", async () => {
    const graph = createOutreachGraph({ model: mockModel(), checkpointer: new MemorySaver() });
    const config = thread("approve");
    await graph.invoke(initialOutreachState(input), config);

    const approved = await graph.invoke(new Command({ resume: { action: "approve" } }), config);

    expect(approved.status).toBe("approved");
    expect(approved.humanEdited).toBe(false);
    expect(approved.trace.map((event) => event.label)).toContain("Draft approved by user");
  });

  it("resumes into the rejected branch", async () => {
    const graph = createOutreachGraph({ model: mockModel(), checkpointer: new MemorySaver() });
    const config = thread("reject");
    await graph.invoke(initialOutreachState(input), config);

    const rejected = await graph.invoke(new Command({ resume: { action: "reject" } }), config);

    expect(rejected.status).toBe("rejected");
    expect(rejected.trace.map((event) => event.label)).toContain("Draft rejected by user");
    expect(rejected.trace.map((event) => event.label)).not.toContain("Draft approved by user");
  });

  it("rejects an unsupported resume action", async () => {
    const graph = createOutreachGraph({ model: mockModel(), checkpointer: new MemorySaver() });
    const config = thread("bad");
    await graph.invoke(initialOutreachState(input), config);

    await expect(
      graph.invoke(new Command({ resume: { action: "send" } }), config),
    ).rejects.toThrow();
  });

  it("returns a paused draft from generation without a document or prompt in the trace", async () => {
    const model = vi.fn<OutreachModel>(async (prompt) => {
      expect(prompt).toContain(SECRET);
      expect(prompt).not.toContain(PROMPT_MARK);
      return draft;
    });

    const generated = await runOutreachGeneration(input, {
      model,
      checkpointer: new MemorySaver(),
    });

    expect(generated.content.message).toBe(draft.message);
    expect(generated.trace.map((event) => event.label)).toContain("Awaiting human review");
    expect(generated.trace.map((event) => event.label)).not.toContain("Draft approved by user");
    expect(JSON.stringify(generated.trace)).not.toContain(SECRET);
    expect(logs.join("\n")).not.toContain(SECRET);
    expect(logs.join("\n")).not.toContain(draft.message);
  });
});
