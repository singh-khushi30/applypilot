export const LOCAL_WORKSPACE_KEY = "local";

export const persistenceMessages = {
  notConfigured:
    "Supabase is not configured. Add the required environment variables to enable persistence.",
  saveFailed: "ApplyPilot couldn’t save this analysis. It was not stored.",
  loadFailed: "ApplyPilot couldn’t load saved applications right now.",
  statusFailed: "ApplyPilot couldn’t update that status. It is unchanged.",
  invalidStatus: "Choose one of the listed application statuses.",
  notFound: "That saved record could not be found.",
  unreadable: "A saved record could not be read.",
} as const;

export type SupabaseServerConfig = {
  url: string;
  secretKey: string;
};

/**
 * Server-only database credentials.
 * The secret key bypasses row level security. It must never be read in client code.
 * The publishable/anon key is not used for writes while authentication is absent.
 */
export function readSupabaseServerConfig(
  env: NodeJS.ProcessEnv = process.env,
): SupabaseServerConfig | null {
  const url = env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const secretKey = env.SUPABASE_SECRET_KEY?.trim() || env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !secretKey) return null;
  return { url, secretKey };
}
