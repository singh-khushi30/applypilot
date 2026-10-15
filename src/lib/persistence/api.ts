import { PersistenceConfigError, PersistenceError } from "@/lib/supabase/errors";
import { z } from "zod";

export function errorResponse(status: number, code: string, message: string) {
  return Response.json({ error: { code, message } }, { status });
}

export function persistenceResponse(error: unknown) {
  if (error instanceof PersistenceConfigError) return errorResponse(503, error.code, error.message);
  if (error instanceof PersistenceError) return errorResponse(503, error.code, error.message);
  console.error(JSON.stringify({ event: "persistence_failed", code: "generic" }));
  return errorResponse(500, "generic", "ApplyPilot couldn’t complete that request.");
}

export const applicationIdSchema = z.string().uuid();
