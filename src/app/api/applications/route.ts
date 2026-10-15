import { persistenceResponse } from "@/lib/persistence/api";
import { listApplications } from "@/lib/supabase/repositories/applications";

export async function GET() {
  try {
    const applications = await listApplications();
    return Response.json({ applications });
  } catch (error) {
    return persistenceResponse(error);
  }
}
