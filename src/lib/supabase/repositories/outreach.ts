import "server-only";

import { outreachFromRow, outreachInsert, toOutreachUpdate } from "@/lib/persistence/records";
import type { OutreachContent } from "@/lib/ai/schemas/outreach";
import type { OutreachReview } from "@/lib/outreach/review";
import { persistenceMessages } from "@/lib/supabase/config";
import { persistenceFailure } from "@/lib/supabase/repositories/db";
import { requireSupabaseAdmin } from "@/lib/supabase/server";

export async function listOutreach(applicationId: string) {
  const supabase = requireSupabaseAdmin();
  const { data, error } = await supabase
    .from("outreach_drafts")
    .select("*")
    .eq("application_id", applicationId)
    .order("updated_at", { ascending: false });
  if (error) persistenceFailure(error, persistenceMessages.loadFailed);
  return (data ?? []).flatMap((row) => {
    const draft = outreachFromRow(row);
    return draft ? [draft] : [];
  });
}

export async function saveGeneratedOutreach(input: {
  applicationId: string;
  contactId: string;
  content: OutreachContent;
  trace: OutreachReview["trace"];
}) {
  const supabase = requireSupabaseAdmin();
  const row = outreachInsert(input);
  const { data: existing, error: existingError } = await supabase
    .from("outreach_drafts")
    .select("id")
    .eq("contact_id", input.contactId)
    .maybeSingle();
  if (existingError) persistenceFailure(existingError);

  const query = existing
    ? supabase.from("outreach_drafts").update(row).eq("id", existing.id)
    : supabase.from("outreach_drafts").insert(row);
  const { data, error } = await query.select("*").single();
  if (error) persistenceFailure(error);
  const saved = outreachFromRow(data);
  if (!saved) persistenceFailure(null, persistenceMessages.unreadable);

  await supabase
    .from("applications")
    .update({ status: "outreach" })
    .eq("id", input.applicationId)
    .eq("status", "ready");

  return saved;
}

export async function saveOutreachState(id: string, review: OutreachReview) {
  const supabase = requireSupabaseAdmin();
  const { data, error } = await supabase
    .from("outreach_drafts")
    .update(toOutreachUpdate(review))
    .eq("id", id)
    .select("*")
    .maybeSingle();
  if (error) persistenceFailure(error, persistenceMessages.saveFailed);
  if (!data) return null;
  const saved = outreachFromRow(data);
  if (!saved) persistenceFailure(null, persistenceMessages.unreadable);
  return saved;
}
