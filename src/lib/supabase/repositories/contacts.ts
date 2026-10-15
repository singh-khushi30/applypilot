import "server-only";

import { contactFromRow, type ContactDraft } from "@/lib/persistence/records";
import { LOCAL_WORKSPACE_KEY, persistenceMessages } from "@/lib/supabase/config";
import { persistenceFailure } from "@/lib/supabase/repositories/db";
import { requireSupabaseAdmin } from "@/lib/supabase/server";

async function applicationExists(id: string) {
  const supabase = requireSupabaseAdmin();
  const { data, error } = await supabase
    .from("applications")
    .select("id")
    .eq("id", id)
    .eq("workspace_key", LOCAL_WORKSPACE_KEY)
    .maybeSingle();
  if (error) persistenceFailure(error, persistenceMessages.loadFailed);
  return Boolean(data);
}

export async function listContacts(applicationId: string) {
  const supabase = requireSupabaseAdmin();
  const { data, error } = await supabase
    .from("contacts")
    .select("*")
    .eq("application_id", applicationId)
    .order("created_at", { ascending: true });
  if (error) persistenceFailure(error, persistenceMessages.loadFailed);
  return (data ?? []).flatMap((row) => {
    const contact = contactFromRow(row);
    return contact ? [contact] : [];
  });
}

export async function saveContact(applicationId: string, contact: ContactDraft) {
  if (!(await applicationExists(applicationId))) return null;
  const supabase = requireSupabaseAdmin();
  const { data, error } = await supabase
    .from("contacts")
    .upsert(
      {
        application_id: applicationId,
        name: contact.name,
        title: contact.title,
        company: contact.company,
        context: contact.context,
        profile_url: contact.profileUrl,
        relevance: contact.relevance,
        relevance_reason: contact.relevanceReason,
        source: contact.source,
      },
      { onConflict: "application_id,source,name" },
    )
    .select("*")
    .single();
  if (error) persistenceFailure(error);
  const saved = contactFromRow(data);
  if (!saved) persistenceFailure(null, persistenceMessages.unreadable);
  return saved;
}
