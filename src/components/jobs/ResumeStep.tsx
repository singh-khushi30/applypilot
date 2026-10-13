"use client";

import { analysisMessages } from "@/lib/analysis/messages";
import { formatBytes, MAX_RESUME_BYTES } from "@/lib/utils/format";
import type { Resume } from "@/types/domain";
import { FileText, X } from "lucide-react";
import { useRef, useState } from "react";

type ResumeStepProps = {
  resume: Resume | null;
  error: string | null;
  onSelect: (resume: Resume, file: File) => void;
  onClear: () => void;
  onError: (message: string) => void;
};

function readResume(file: File): { resume: Resume } | { error: string } {
  if (file.type !== "application/pdf") {
    return { error: analysisMessages.invalidPdf };
  }
  if (file.size === 0) {
    return { error: analysisMessages.emptyFile };
  }
  if (file.size > MAX_RESUME_BYTES) {
    return { error: analysisMessages.fileTooLarge };
  }
  return {
    resume: {
      fileName: file.name,
      sizeBytes: file.size,
      mimeType: "application/pdf",
    },
  };
}

export function ResumeStep({ resume, error, onSelect, onClear, onError }: ResumeStepProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function takeFile(file: File | undefined) {
    if (!file) return;
    const result = readResume(file);
    if ("error" in result) {
      onError(result.error);
      return;
    }
    onSelect(result.resume, file);
  }

  return (
    <div className="space-y-4">
      <div
        className={`rounded-[1.75rem] border border-dashed px-6 py-12 text-center transition-colors ${
          dragging ? "border-violet bg-lavender/50" : "border-border bg-card"
        }`}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          takeFile(event.dataTransfer.files[0]);
        }}
      >
        <FileText className="mx-auto size-8 text-violet" aria-hidden="true" />
        <p className="mt-4 font-heading text-3xl tracking-tight">Drop your resume here</p>
        <p className="mt-2 text-sm text-muted-foreground">PDF only · Max 5 MB</p>
        <button
          type="button"
          className="mt-6 inline-flex h-10 items-center rounded-full border border-border bg-cream px-4 text-sm font-medium hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet"
          onClick={() => inputRef.current?.click()}
        >
          Browse files
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          className="sr-only"
          onChange={(event) => {
            takeFile(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
      </div>

      {resume ? (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-cream px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{resume.fileName}</p>
            <p className="text-xs text-muted-foreground">{formatBytes(resume.sizeBytes)}</p>
          </div>
          <button
            type="button"
            onClick={onClear}
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-full hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet"
          >
            <X className="size-4" />
            <span className="sr-only">Remove resume</span>
          </button>
        </div>
      ) : null}

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <p className="text-sm text-muted-foreground">
        Your resume is used only to analyze your fit for this role.
      </p>
    </div>
  );
}
