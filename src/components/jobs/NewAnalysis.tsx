"use client";

import { ProcessingExperience } from "@/components/agent/ProcessingExperience";
import { JobStep } from "@/components/jobs/JobStep";
import { ResumeStep } from "@/components/jobs/ResumeStep";
import { ReviewStep } from "@/components/jobs/ReviewStep";
import { Button } from "@/components/ui/button";
import { analysisMessages } from "@/lib/analysis/messages";
import { saveAnalysis } from "@/lib/analysis/session";
import { persistenceMessages } from "@/lib/supabase/config";
import { storedAnalysisSchema } from "@/lib/analysis/stored-analysis";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Job, JobSource, Resume } from "@/types/domain";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

const steps = [
  { id: 1, label: "Job" },
  { id: 2, label: "Resume" },
  { id: 3, label: "Review" },
] as const;

type StepId = (typeof steps)[number]["id"];

function jobFromForm(
  source: JobSource,
  url: string,
  description: string,
  company: string,
  title: string,
): Job {
  return {
    source,
    url: source === "url" ? url.trim() : null,
    description: source === "description" ? description.trim() : null,
    company: company.trim() || null,
    title: title.trim() || null,
  };
}

const JOB_ERRORS = new Set(["missing_description", "description_too_short"]);
const RESUME_ERRORS = new Set([
  "missing_file",
  "invalid_pdf",
  "file_too_large",
  "empty_file",
  "unreadable_pdf",
]);

function readApiError(payload: unknown): { code: string; message: string } {
  const fallback = { code: "generic", message: analysisMessages.generic };
  if (!payload || typeof payload !== "object" || !("error" in payload)) return fallback;
  const error = (payload as { error?: { code?: unknown; message?: unknown } }).error;
  const message = error?.message;
  if (typeof message !== "string" || !message || message.length > 240) return fallback;
  return { code: typeof error?.code === "string" ? error.code : "generic", message };
}

// Send the user back to the step that needs fixing. Their inputs stay in state.
function stepForError(code: string): StepId {
  if (JOB_ERRORS.has(code)) return 1;
  if (RESUME_ERRORS.has(code)) return 2;
  return 3;
}

export function NewAnalysis() {
  const router = useRouter();
  const reduce = useReducedMotion() === true;
  const [phase, setPhase] = useState<"form" | "processing">("form");
  const [step, setStep] = useState<StepId>(1);
  const [source, setSource] = useState<JobSource>("description");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [company, setCompany] = useState("");
  const [title, setTitle] = useState("");
  const [resume, setResume] = useState<Resume | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [unsavedResult, setUnsavedResult] = useState(false);

  const job = jobFromForm(source, url, description, company, title);

  function continueFromJob() {
    if (source === "url") {
      setError(analysisMessages.urlUnavailable);
      return;
    }
    if (!description.trim()) {
      setError(analysisMessages.missingDescription);
      return;
    }
    if (description.trim().length < 40) {
      setError(analysisMessages.descriptionTooShort);
      return;
    }
    setError(null);
    setStep(2);
  }

  function continueFromResume() {
    if (!resume || !resumeFile) {
      setError(analysisMessages.missingFile);
      return;
    }
    setError(null);
    setStep(3);
  }

  async function startAnalysis() {
    if (source !== "description" || description.trim().length < 40) {
      setError(
        description.trim() ? analysisMessages.descriptionTooShort : analysisMessages.missingDescription,
      );
      setSource("description");
      setStep(1);
      return;
    }
    if (!resumeFile) {
      setError(analysisMessages.missingFile);
      setStep(2);
      return;
    }

    setError(null);
    setPhase("processing");
    const body = new FormData();
    body.set("description", description.trim());
    if (company.trim()) body.set("company", company.trim());
    if (title.trim()) body.set("title", title.trim());
    body.set("resume", resumeFile);

    try {
      const response = await fetch("/api/analysis", { method: "POST", body });
      const payload: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        const failure = readApiError(payload);
        setError(failure.message);
        setStep(stepForError(failure.code));
        setPhase("form");
        return;
      }
      const analysis = storedAnalysisSchema.safeParse(
        payload && typeof payload === "object" && "analysis" in payload
          ? (payload as { analysis: unknown }).analysis
          : null,
      );
      const persisted =
        payload &&
        typeof payload === "object" &&
        "persisted" in payload &&
        (payload as { persisted?: unknown }).persisted === true;
      if (!response.ok) {
        if (analysis.success && persisted === false) {
          saveAnalysis(analysis.data, true);
          setUnsavedResult(true);
          setError(readApiError(payload).message || persistenceMessages.saveFailed);
          setPhase("form");
          return;
        }
        const failure = readApiError(payload);
        setError(failure.message);
        setStep(stepForError(failure.code));
        setPhase("form");
        return;
      }
      if (!analysis.success || !persisted) {
        setError(analysisMessages.generic);
        setPhase("form");
        return;
      }
      setUnsavedResult(false);
      router.push(`/app/analysis/${analysis.data.id}`);
      return;
    } catch {
      setError(analysisMessages.generic);
      setPhase("form");
    }
  }

  if (phase === "processing") {
    return <ProcessingExperience />;
  }

  return (
    <div>
      <p className="text-xs font-medium tracking-[0.16em] text-violet uppercase">
        New analysis
      </p>
      <h1 className="mt-3 font-heading text-4xl tracking-tight sm:text-5xl">
        Analyze a role
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
        Give ApplyPilot the role you’re considering and your resume. The agent
        will turn them into an application strategy.
      </p>

      <ol className="mt-8 flex flex-wrap gap-2" aria-label="Analysis steps">
        {steps.map((item) => {
          const active = item.id === step;
          const complete = item.id < step;
          return (
            <li key={item.id}>
              <span
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm",
                  active
                    ? "border-violet/20 bg-lavender text-violet"
                    : "border-border bg-card text-muted-foreground",
                  complete && "text-foreground",
                )}
              >
                <span className="text-xs">{String(item.id).padStart(2, "0")}</span>
                {item.label}
              </span>
            </li>
          );
        })}
      </ol>

      <div className="mt-8">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={step}
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: reduce ? 0 : 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            {step === 1 ? (
              <JobStep
                source={source}
                url={url}
                description={description}
                company={company}
                title={title}
                error={error}
                onSourceChange={(next) => {
                  setSource(next);
                  setError(null);
                }}
                onUrlChange={setUrl}
                onDescriptionChange={setDescription}
                onCompanyChange={setCompany}
                onTitleChange={setTitle}
              />
            ) : null}
            {step === 2 ? (
              <ResumeStep
                resume={resume}
                error={error}
                onSelect={(next, file) => {
                  setResume(next);
                  setResumeFile(file);
                  setError(null);
                }}
                onClear={() => {
                  setResume(null);
                  setResumeFile(null);
                }}
                onError={setError}
              />
            ) : null}
            {step === 3 && resume ? <ReviewStep job={job} resume={resume} /> : null}
          </motion.div>
        </AnimatePresence>
      </div>

      {error && step === 3 ? (
        <div className="mt-6 space-y-3" role="alert">
          <p className="text-sm text-destructive">{error}</p>
          {unsavedResult ? (
            <Link href="/app/analysis/result" className="text-sm font-medium text-violet">
              View the unsaved result in this session
            </Link>
          ) : null}
        </div>
      ) : null}

      <div className="mt-8 flex flex-wrap items-center gap-3">
        {step > 1 ? (
          <Button
            type="button"
            variant="outline"
            className="h-11 rounded-full px-5"
            onClick={() => {
              setError(null);
              setStep((current) => (current === 3 ? 2 : 1));
            }}
          >
            Back
          </Button>
        ) : null}
        {step < 3 ? (
          <Button
            type="button"
            className="h-11 rounded-full px-5"
            onClick={step === 1 ? continueFromJob : continueFromResume}
          >
            Continue
          </Button>
        ) : (
          <Button
            type="button"
            className="h-11 rounded-full px-5"
            onClick={() => void startAnalysis()}
          >
            Start agent analysis
          </Button>
        )}
      </div>
    </div>
  );
}
