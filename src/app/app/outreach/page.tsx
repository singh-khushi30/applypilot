import { OutreachScreen } from "@/components/outreach/OutreachScreen";
import type { StoredAnalysis } from "@/lib/analysis/stored-analysis";
import type { SavedOutreach } from "@/lib/persistence/records";
import { persistenceMessages } from "@/lib/supabase/config";
import { PersistenceConfigError } from "@/lib/supabase/errors";
import { loadStoredAnalysis } from "@/lib/supabase/repositories/analyses";
import { listContacts } from "@/lib/supabase/repositories/contacts";
import { listOutreach } from "@/lib/supabase/repositories/outreach";
import type { Contact } from "@/types/domain";
import { connection } from "next/server";
import { Suspense } from "react";

export const metadata = {
  title: "Outreach · ApplyPilot",
};

async function loadOutreach(applicationId: string, contactId: string): Promise<{
  persisted: boolean;
  analysis: StoredAnalysis | null;
  contacts: Contact[];
  outreach: SavedOutreach | null;
  notice: string | null;
}> {
  try {
    const [stored, people, drafts] = await Promise.all([
      loadStoredAnalysis(applicationId),
      listContacts(applicationId),
      listOutreach(applicationId),
    ]);
    if (!stored) {
      return {
        persisted: false,
        analysis: null,
        contacts: [],
        outreach: null,
        notice: "That saved application could not be found.",
      };
    }
    return {
      persisted: true,
      analysis: stored,
      contacts: people,
      outreach: drafts.find((draft) => draft.contactId === contactId) ?? null,
      notice: null,
    };
  } catch (error) {
    return {
      persisted: false,
      analysis: null,
      contacts: [],
      outreach: null,
      notice:
        error instanceof PersistenceConfigError
          ? persistenceMessages.notConfigured
          : persistenceMessages.loadFailed,
    };
  }
}

export default async function OutreachPage({
  searchParams,
}: {
  searchParams: Promise<{ application?: string; contact?: string }>;
}) {
  const { application = "", contact = "" } = await searchParams;
  await connection();
  const result = application
    ? await loadOutreach(application, contact)
    : {
        persisted: false,
        analysis: null,
        contacts: [],
        outreach: null,
        notice: null,
      };

  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Loading outreach…</p>}>
      <OutreachScreen
        persisted={result.persisted}
        applicationId={application}
        analysis={result.analysis}
        contacts={result.contacts}
        outreach={result.outreach}
        notice={result.notice}
      />
    </Suspense>
  );
}
