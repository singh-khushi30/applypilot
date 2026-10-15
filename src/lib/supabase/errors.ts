import { persistenceMessages } from "@/lib/supabase/config";

export class PersistenceConfigError extends Error {
  readonly code = "supabase_not_configured";

  constructor() {
    super(persistenceMessages.notConfigured);
    this.name = "PersistenceConfigError";
  }
}

export class PersistenceError extends Error {
  readonly code = "persistence_failed";

  constructor(message: string = persistenceMessages.saveFailed) {
    super(message);
    this.name = "PersistenceError";
  }
}
