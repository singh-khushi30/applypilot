import { applicationIdSchema, errorResponse, persistenceResponse } from "@/lib/persistence/api";
import { persistenceMessages } from "@/lib/supabase/config";
import { getApplication } from "@/lib/supabase/repositories/applications";
import { loadStoredAnalysis } from "@/lib/supabase/repositories/analyses";
import { listContacts } from "@/lib/supabase/repositories/contacts";
import { listOutreach } from "@/lib/supabase/repositories/outreach";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  try {
    const { id } = await context.params;
    if (!applicationIdSchema.safeParse(id).success) {
      return errorResponse(400, "invalid_id", persistenceMessages.notFound);
    }
    const [application, analysis, contacts, outreach] = await Promise.all([
      getApplication(id),
      loadStoredAnalysis(id),
      listContacts(id),
      listOutreach(id),
    ]);
    if (!application || !analysis) return errorResponse(404, "not_found", persistenceMessages.notFound);
    return Response.json({ application, analysis, contacts, outreach });
  } catch (error) {
    return persistenceResponse(error);
  }
}
