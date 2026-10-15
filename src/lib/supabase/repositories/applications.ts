import "server-only";

import { applicationFromRow } from "@/lib/persistence/records";
import { LOCAL_WORKSPACE_KEY, persistenceMessages } from "@/lib/supabase/config";
import { persistenceFailure } from "@/lib/supabase/repositories/db";
import { requireSupabaseAdmin } from "@/lib/supabase/server";
import type { ApplicationStatus } from "@/types/domain";

export async function getApplication(id: string) {
  const supabase = requireSupabaseAdmin();
  const { data, error } = await supabase
    .from("applications")
    .select("*")
    .eq("id", id)
    .eq("workspace_key", LOCAL_WORKSPACE_KEY)
    .maybeSingle();
  if (error) persistenceFailure(error, persistenceMessages.loadFailed);
  if (!data) return null;
  const application = applicationFromRow(data);
  if (!application) persistenceFailure(null, persistenceMessages.unreadable);
  return application;
}

export async function listApplications() {
  const supabase = requireSupabaseAdmin();
  const { data, error } = await supabase
    .from("applications")
    .select("*")
    .eq("workspace_key", LOCAL_WORKSPACE_KEY)
    .order("created_at", { ascending: false });
  if (error) persistenceFailure(error, persistenceMessages.loadFailed);
  return (data ?? []).flatMap((row) => {
    const application = applicationFromRow(row);
    return application ? [application] : [];
  });
}

export async function updateApplicationStatus(id: string, status: ApplicationStatus) {
  const supabase = requireSupabaseAdmin();
  const { data, error } = await supabase
    .from("applications")
    .update({ status })
    .eq("id", id)
    .eq("workspace_key", LOCAL_WORKSPACE_KEY)
    .select("*")
    .maybeSingle();
  if (error) persistenceFailure(error, persistenceMessages.statusFailed);
  if (!data) return null;
  const application = applicationFromRow(data);
  if (!application) persistenceFailure(null, persistenceMessages.unreadable);
  return application;
}
