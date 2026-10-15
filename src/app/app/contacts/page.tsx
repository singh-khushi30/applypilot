import { ContactsScreen } from "@/components/contacts/ContactsScreen";
import type { StoredAnalysis } from "@/lib/analysis/stored-analysis";
import { persistenceMessages } from "@/lib/supabase/config";
import { PersistenceConfigError } from "@/lib/supabase/errors";
import { loadStoredAnalysis } from "@/lib/supabase/repositories/analyses";
import { getApplication } from "@/lib/supabase/repositories/applications";
import { listContacts } from "@/lib/supabase/repositories/contacts";
import type { Contact } from "@/types/domain";
import { connection } from "next/server";

export const metadata = {
  title: "Contacts · ApplyPilot",
};

async function loadContacts(applicationId: string): Promise<
  | { persisted: true; analysis: StoredAnalysis; contacts: Contact[]; notice: null }
  | { persisted: false; analysis: null; contacts: []; notice: string }
> {
  try {
    const [record, analysis, contacts] = await Promise.all([
      getApplication(applicationId),
      loadStoredAnalysis(applicationId),
      listContacts(applicationId),
    ]);
    if (!record || !analysis) {
      return {
        persisted: false,
        analysis: null,
        contacts: [],
        notice: "That saved application could not be found.",
      };
    }
    return { persisted: true, analysis, contacts, notice: null };
  } catch (error) {
    return {
      persisted: false,
      analysis: null,
      contacts: [],
      notice:
        error instanceof PersistenceConfigError
          ? persistenceMessages.notConfigured
          : persistenceMessages.loadFailed,
    };
  }
}

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<{ application?: string }>;
}) {
  const { application = "" } = await searchParams;
  if (!application) {
    return (
      <ContactsScreen persisted={false} applicationId="" analysis={null} contacts={[]} notice={null} />
    );
  }

  await connection();
  const result = await loadContacts(application);
  return (
    <ContactsScreen
      persisted={result.persisted}
      applicationId={application}
      analysis={result.analysis}
      contacts={result.contacts}
      notice={result.notice}
    />
  );
}
