import { formatBytes } from "@/lib/utils/format";
import type { Job, Resume } from "@/types/domain";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 border-b border-border py-4 last:border-b-0 sm:grid-cols-[8rem_minmax(0,1fr)] sm:gap-6">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-sm break-words text-foreground">{value}</p>
    </div>
  );
}

export function ReviewStep({ job, resume }: { job: Job; resume: Resume }) {
  const jobValue =
    job.source === "url"
      ? (job.url ?? "Not provided")
      : (job.description ?? "Not provided");

  return (
    <div className="rounded-[1.5rem] border border-border bg-card px-5 sm:px-6">
      <Row label="Job" value={jobValue} />
      <Row label="Company" value={job.company ?? "Not provided"} />
      <Row label="Role" value={job.title ?? "Not provided"} />
      <Row
        label="Resume"
        value={`${resume.fileName} · ${formatBytes(resume.sizeBytes)}`}
      />
    </div>
  );
}
