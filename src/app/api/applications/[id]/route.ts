import { applicationIdSchema, errorResponse, persistenceResponse } from "@/lib/persistence/api";
import { persistenceMessages } from "@/lib/supabase/config";
import { getApplication, updateApplicationStatus } from "@/lib/supabase/repositories/applications";
import { isApplicationStatus } from "@/lib/persistence/status";
import { z } from "zod";

const statusBody = z.object({
  status: z.string(),
});

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  try {
    const { id } = await context.params;
    if (!applicationIdSchema.safeParse(id).success) {
      return errorResponse(400, "invalid_id", persistenceMessages.notFound);
    }
    const application = await getApplication(id);
    if (!application) return errorResponse(404, "not_found", persistenceMessages.notFound);
    return Response.json({ application });
  } catch (error) {
    return persistenceResponse(error);
  }
}

export async function PATCH(request: Request, context: Context) {
  try {
    const { id } = await context.params;
    if (!applicationIdSchema.safeParse(id).success) {
      return errorResponse(400, "invalid_id", persistenceMessages.notFound);
    }
    const body = statusBody.safeParse(await request.json().catch(() => null));
    if (!body.success || !isApplicationStatus(body.data.status)) {
      return errorResponse(400, "invalid_status", persistenceMessages.invalidStatus);
    }
    const application = await updateApplicationStatus(id, body.data.status);
    if (!application) return errorResponse(404, "not_found", persistenceMessages.notFound);
    return Response.json({ application });
  } catch (error) {
    return persistenceResponse(error);
  }
}
