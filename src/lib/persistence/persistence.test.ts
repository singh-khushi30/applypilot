import { saveCompletedAnalysis } from "@/lib/persistence/save-analysis";
import {
  analysisFromRows,
  applicationFromRow,
  contactFromRow,
  outreachFromRow,
  toAnalysisBundle,
  toOutreachUpdate,
} from "@/lib/persistence/records";
import { commitStatusChange, isApplicationStatus } from "@/lib/persistence/status";
import type { StoredAnalysis } from "@/lib/analysis/stored-analysis";
import { createAwaitingReview, applyReviewAction } from "@/lib/outreach/review";
import { readSupabaseServerConfig } from "@/lib/supabase/config";
import { PersistenceConfigError, PersistenceError } from "@/lib/supabase/errors";
import type { OutreachContent } from "@/lib/ai/schemas/outreach";
import { describe, expect, it, vi } from "vitest";

const id = "11111111-1111-4111-8111-111111111111";

const analysis: StoredAnalysis = {
  id,
  demo: false,
  summary: "A frontend role focused on TypeScript.",
  job: {
    title: "Senior Frontend Engineer",
    company: "Northwind Labs",
    location: "Remote",
    employmentType: "Full-time",
  },
  match: {
    overall: 72,
    label: "Potential Match",
    explanation: "Required skills carry the most weight.",
    dimensions: [
      { id: "required", label: "Required Skills", score: 70 },
      { id: "experience", label: "Experience / Evidence", score: 80 },
      { id: "preferred", label: "Preferred Skills", score: 50 },
      { id: "domain", label: "Domain Alignment", score: 75 },
    ],
  },
  alignments: [{ skill: "TypeScript", evidence: "Built TypeScript services" }],
  gaps: [],
  recommendation: "A plausible match with a few gaps.",
  nextSteps: ["Review the role"],
  trace: [],
};

const content: OutreachContent = {
  channel: "linkedin",
  subject: null,
  message: "Hi Alex, I built TypeScript services and saw the frontend role.",
  grounding: {
    candidatePointsUsed: ["Built TypeScript services"],
    jobPointsUsed: ["Senior Frontend Engineer at Northwind Labs"],
  },
};

describe("analysis persistence mapping", () => {
  it("maps a result into an application and analysis bundle", () => {
    const bundle = toAnalysisBundle(analysis);
    expect(bundle.application).toMatchObject({
      id,
      company: "Northwind Labs",
      roleTitle: "Senior Frontend Engineer",
      status: "ready",
      matchScore: 72,
      matchLabel: "Potential Match",
      sourceUrl: null,
    });
    expect(bundle.analysis.applicationId).toBe(id);
    expect(bundle.analysis.trace).toEqual([]);
    expect(JSON.stringify(bundle)).not.toContain("resume");
  });

  it("loads the same analysis from stored rows", () => {
    const bundle = toAnalysisBundle(analysis);
    const loaded = analysisFromRows(
      {
        id,
        company: bundle.application.company,
        role_title: bundle.application.roleTitle,
        location: bundle.application.location,
        employment_type: bundle.application.employmentType,
        status: "ready",
        match_score: 72,
        match_label: "Potential Match",
        source_url: null,
        created_at: "2026-10-14T00:00:00.000Z",
      },
      {
        id,
        application_id: id,
        role_summary: analysis.summary,
        match_score: 72,
        match_label: "Potential Match",
        breakdown: analysis.match,
        alignments: analysis.alignments,
        gaps: analysis.gaps,
        recommendation: analysis.recommendation,
        next_steps: analysis.nextSteps,
        safe_trace: analysis.trace,
      },
    );
    expect(loaded).toEqual(analysis);
  });

  it("rejects a malformed analysis record", () => {
    const bundle = toAnalysisBundle(analysis);
    expect(
      analysisFromRows(
        {
          id,
          company: bundle.application.company,
          role_title: bundle.application.roleTitle,
          location: null,
          employment_type: null,
          status: "ready",
          match_score: 72,
          match_label: "Potential Match",
          source_url: null,
          created_at: "2026-10-14T00:00:00.000Z",
        },
        {
          id,
          application_id: id,
          role_summary: analysis.summary,
          match_score: 72,
          match_label: "Potential Match",
          breakdown: { overall: 72 },
          alignments: analysis.alignments,
          gaps: [],
          recommendation: analysis.recommendation,
          next_steps: analysis.nextSteps,
          safe_trace: [],
        },
      ),
    ).toBeNull();
  });
});

describe("saveCompletedAnalysis", () => {
  it("saves once and does not ask for another model run when the database fails", async () => {
    const runModel = vi.fn(async () => analysis);
    const save = vi.fn(async () => {
      throw new Error("database down");
    });
    const produced = await runModel();
    const result = await saveCompletedAnalysis(produced, save);
    expect(runModel).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledTimes(1);
    expect(result.persisted).toBe(false);
    if (!result.persisted) expect(result.error).toBeInstanceOf(PersistenceError);
    expect(result.analysis).toBe(produced);
  });

  it("reports missing Supabase configuration without hiding the analysis", async () => {
    const result = await saveCompletedAnalysis(analysis, async () => {
      throw new PersistenceConfigError();
    });
    expect(result.persisted).toBe(false);
    if (!result.persisted) {
      expect(result.error).toBeInstanceOf(PersistenceConfigError);
      expect(result.error.message).toMatch(/Supabase is not configured/);
      expect(result.error.message).not.toMatch(/secret|service_role/i);
    }
  });
});

describe("application status", () => {
  const items = [{ id, status: "ready" as const }];

  it("rejects an unknown status", () => {
    expect(isApplicationStatus("submitted")).toBe(false);
    expect(isApplicationStatus("applied")).toBe(true);
  });

  it("keeps the previous status when the save fails", async () => {
    const result = await commitStatusChange(items, id, "applied", async () => {
      throw new Error("ApplyPilot couldn’t update that status. It is unchanged.");
    });
    expect(result.items).toEqual(items);
    expect(result.error).toMatch(/unchanged/);
  });

  it("returns the updated status after a successful save", async () => {
    const result = await commitStatusChange(items, id, "interview", async () => undefined);
    expect(result.items[0]?.status).toBe("interview");
    expect(result.error).toBeNull();
  });
});

describe("contacts and outreach records", () => {
  it("keeps a manual contact and a demo contact source", () => {
    const manual = contactFromRow({
      id,
      name: "Sam Manual",
      title: "Payroll Specialist",
      company: "Northwind Labs",
      context: null,
      profile_url: null,
      relevance: "low_relevance",
      relevance_reason: "This title does not line up closely with the role.",
      source: "manual",
    });
    const demo = contactFromRow({
      id: "22222222-2222-4222-8222-222222222222",
      name: "Alex Example",
      title: "Engineering Manager",
      company: "Northwind Labs",
      context: "Fictional example.",
      profile_url: null,
      relevance: "hiring_manager",
      relevance_reason: "Engineering Manager at the target company; likely relevant to the role.",
      source: "demo",
    });
    expect(manual?.source).toBe("manual");
    expect(demo?.source).toBe("demo");
  });

  it("persists approval and a human edit", () => {
    const draft = createAwaitingReview(content, analysis.trace);
    const edited = applyReviewAction(draft, {
      type: "edit",
      message: "Hi Alex, I built TypeScript services.",
      subject: null,
    });
    const approved = applyReviewAction(edited, { type: "approve" });
    const row = toOutreachUpdate(approved);
    expect(row.status).toBe("approved");
    expect(row.human_edited).toBe(true);
    expect(row.message).toBe("Hi Alex, I built TypeScript services.");

    const loaded = outreachFromRow({
      id,
      contact_id: "22222222-2222-4222-8222-222222222222",
      channel: row.channel,
      subject: row.subject,
      message: row.message,
      original_message: row.original_message,
      original_subject: row.original_subject,
      status: row.status,
      human_edited: row.human_edited,
      grounding: row.grounding,
      safe_trace: row.safe_trace,
    });
    expect(loaded?.status).toBe("approved");
    expect(loaded?.humanEdited).toBe(true);
  });

  it("rejects a malformed outreach trace", () => {
    expect(
      outreachFromRow({
        id,
        contact_id: null,
        channel: "linkedin",
        subject: null,
        message: "Hello",
        original_message: "Hello",
        original_subject: null,
        status: "awaiting_review",
        human_edited: false,
        grounding: { candidatePointsUsed: [], jobPointsUsed: [] },
        safe_trace: [{ id: "x", prompt: "hidden" }],
      }),
    ).toBeNull();
  });
});

describe("Supabase configuration", () => {
  it("is missing until both the URL and server secret are set", () => {
    expect(readSupabaseServerConfig({ NODE_ENV: "test" })).toBeNull();
    expect(
      readSupabaseServerConfig({
        NODE_ENV: "test",
        NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
        SUPABASE_SECRET_KEY: "secret",
      }),
    ).toEqual({
      url: "https://example.supabase.co",
      secretKey: "secret",
    });
  });

  it("reads a saved application summary", () => {
    expect(
      applicationFromRow({
        id,
        company: "Northwind Labs",
        role_title: "Senior Frontend Engineer",
        location: "Remote",
        employment_type: "Full-time",
        status: "ready",
        match_score: 72,
        match_label: "Potential Match",
        source_url: null,
        created_at: "2026-10-14T00:00:00.000Z",
      })?.roleTitle,
    ).toBe("Senior Frontend Engineer");
  });
});
