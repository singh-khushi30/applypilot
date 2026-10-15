import { persistenceMessages } from "@/lib/supabase/config";
import { PersistenceError } from "@/lib/supabase/errors";

export function persistenceFailure(
  error: { code?: string } | null,
  message: string = persistenceMessages.saveFailed,
): never {
  console.error(
    JSON.stringify({
      event: "persistence_failed",
      code: error?.code ?? "unknown",
    }),
  );
  throw new PersistenceError(message);
}
