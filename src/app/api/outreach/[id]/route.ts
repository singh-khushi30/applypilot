import { OutreachStateError } from "@/lib/ai/errors";
import { persistenceResponse, errorResponse } from "@/lib/persistence/api";
import { applyReviewAction } from "@/lib/outreach/review";
import { persistenceMessages } from "@/lib/supabase/config";
import { requireSupabaseAdmin } from "@/lib/supabase/server";
import { outreachFromRow } from "@/lib/persistence/records";
import { saveOutreachState } from "@/lib/supabase/repositories/outreach";
import { z } from "zod";

const actionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("edit"),
    message: z.string().trim().min(1).max(1500),
    subject: z.string().trim().max(100).nullable(),
  }),
  z.object({ type: z.literal("approve") }),
  z.object({ type: z.literal("reject") }),
]);

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  try {
    const { id } = await context.params;
    if (!z.string().uuid().safeParse(id).success) {
      return errorResponse(400, "invalid_id", persistenceMessages.notFound);
    }
    const action = actionSchema.safeParse(await request.json().catch(() => null));
    if (!action.success) return errorResponse(400, "invalid_request", "That review action is not available.");

    const supabase = requireSupabaseAdmin();
    const { data, error } = await supabase.from("outreach_drafts").select("*").eq("id", id).maybeSingle();
    if (error) return persistenceResponse(error);
    const current = outreachFromRow(data);
    if (!current) return errorResponse(404, "not_found", persistenceMessages.notFound);

    let next;
    try {
      next = applyReviewAction(current, action.data);
    } catch (reviewError) {
      if (reviewError instanceof OutreachStateError) {
        return errorResponse(409, reviewError.code, "That review action is not available.");
      }
      throw reviewError;
    }
    const saved = await saveOutreachState(id, next);
    if (!saved) return errorResponse(404, "not_found", persistenceMessages.notFound);
    return Response.json({ outreach: saved });
  } catch (error) {
    return persistenceResponse(error);
  }
}
