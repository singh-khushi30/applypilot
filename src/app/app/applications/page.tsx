import { ApplicationsTracker } from "@/components/applications/ApplicationsTracker";
import { PrimaryLink } from "@/components/landing/links";
import type { SavedApplication } from "@/lib/persistence/records";
import { persistenceMessages } from "@/lib/supabase/config";
import { PersistenceConfigError } from "@/lib/supabase/errors";
import { listApplications } from "@/lib/supabase/repositories/applications";
import { connection } from "next/server";

export const metadata = {
  title: "Applications · ApplyPilot",
};

async function loadApplications(): Promise<
  | { state: "ready"; applications: SavedApplication[] }
  | { state: "error"; message: string }
> {
  try {
    return { state: "ready", applications: await listApplications() };
  } catch (error) {
    return {
      state: "error",
      message: error instanceof PersistenceConfigError ? error.message : persistenceMessages.loadFailed,
    };
  }
}

export default async function ApplicationsPage() {
  await connection();
  const result = await loadApplications();

  if (result.state === "error") {
    return (
      <div className="max-w-xl">
        <h1 className="font-heading text-4xl tracking-tight sm:text-5xl">Applications</h1>
        <p className="mt-4 text-base leading-7 text-muted-foreground">{result.message}</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-heading text-4xl tracking-tight sm:text-5xl">Applications</h1>
      <p className="mt-3 max-w-xl text-base leading-7 text-muted-foreground">
        Roles you have analyzed. Nothing here is submitted automatically.
      </p>
      {result.applications.length === 0 ? (
        <div className="mt-8 max-w-xl">
          <p className="text-sm text-muted-foreground">No saved applications yet.</p>
          <div className="mt-6">
            <PrimaryLink href="/app/new">Analyze a job</PrimaryLink>
          </div>
        </div>
      ) : (
        <div className="mt-8">
          <ApplicationsTracker applications={result.applications} />
        </div>
      )}
    </div>
  );
}
