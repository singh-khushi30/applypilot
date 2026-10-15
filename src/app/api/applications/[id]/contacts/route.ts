import { applicationIdSchema, errorResponse, persistenceResponse } from "@/lib/persistence/api";
import { classifyContact } from "@/lib/outreach/relevance";
import { persistenceMessages } from "@/lib/supabase/config";
import { getApplication } from "@/lib/supabase/repositories/applications";
import { saveContact } from "@/lib/supabase/repositories/contacts";
import { z } from "zod";

const contactBody = z.object({
  name: z.string().trim().min(1).max(80),
  title: z.string().trim().min(1).max(120),
  company: z.string().trim().min(1).max(120),
  context: z.string().trim().max(500).nullable(),
  profileUrl: z.string().trim().max(300).nullable(),
  source: z.enum(["manual", "demo"]),
});

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Context) {
  try {
    const { id } = await context.params;
    if (!applicationIdSchema.safeParse(id).success) {
      return errorResponse(400, "invalid_id", persistenceMessages.notFound);
    }
    const body = contactBody.safeParse(await request.json().catch(() => null));
    if (!body.success) return errorResponse(400, "invalid_contact", "Add a name, title, and company.");
    if (body.data.profileUrl && !/^https?:\/\//.test(body.data.profileUrl)) {
      return errorResponse(400, "invalid_contact", "Enter a full profile URL starting with https://, or leave it blank.");
    }

    const application = await getApplication(id);
    if (!application) return errorResponse(404, "not_found", persistenceMessages.notFound);
    const relevance = classifyContact({
      jobTitle: application.roleTitle,
      jobCompany: application.company,
      personTitle: body.data.title,
      personCompany: body.data.company,
    });
    const contact = await saveContact(id, {
      ...body.data,
      context: body.data.context || null,
      profileUrl: body.data.profileUrl || null,
      ...relevance,
    });
    if (!contact) return errorResponse(404, "not_found", persistenceMessages.notFound);
    return Response.json({ contact });
  } catch (error) {
    return persistenceResponse(error);
  }
}
