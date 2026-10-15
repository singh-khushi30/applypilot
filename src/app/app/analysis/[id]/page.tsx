import { AnalysisView } from "@/components/analysis/AnalysisView";
import { PrimaryLink } from "@/components/landing/links";
import { persistenceMessages } from "@/lib/supabase/config";
import { PersistenceConfigError } from "@/lib/supabase/errors";
import { loadStoredAnalysis } from "@/lib/supabase/repositories/analyses";
import type { StoredAnalysis } from "@/lib/analysis/stored-analysis";
import { connection } from "next/server";

export const metadata = {
  title: "Analysis · ApplyPilot",
};

async function loadAnalysis(id: string): Promise<
  | { state: "ready"; analysis: StoredAnalysis }
  | { state: "missing" }
  | { state: "error"; message: string }
> {
  try {
    const analysis = await loadStoredAnalysis(id);
    return analysis ? { state: "ready", analysis } : { state: "missing" };
  } catch (error) {
    return {
      state: "error",
      message: error instanceof PersistenceConfigError ? error.message : persistenceMessages.loadFailed,
    };
  }
}

export default async function SavedAnalysisPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await connection();
  const result = await loadAnalysis(id);

  if (result.state === "missing") {
    return (
      <div className="max-w-xl">
        <h1 className="font-heading text-4xl tracking-tight sm:text-5xl">No analysis found.</h1>
        <p className="mt-4 text-base leading-7 text-muted-foreground">
          This link does not match a saved analysis.
        </p>
        <div className="mt-8">
          <PrimaryLink href="/app/new">Analyze a job</PrimaryLink>
        </div>
      </div>
    );
  }

  if (result.state === "error") {
    return (
      <div className="max-w-xl">
        <h1 className="font-heading text-4xl tracking-tight sm:text-5xl">Analysis unavailable.</h1>
        <p className="mt-4 text-base leading-7 text-muted-foreground">{result.message}</p>
      </div>
    );
  }

  return <AnalysisView analysis={result.analysis} />;
}
