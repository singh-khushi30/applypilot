import { applicationStatuses, type ApplicationStatus } from "@/types/domain";

export function isApplicationStatus(value: string): value is ApplicationStatus {
  return (applicationStatuses as readonly string[]).includes(value);
}

export function replaceStatus<T extends { id: string; status: ApplicationStatus }>(
  items: T[],
  id: string,
  status: ApplicationStatus,
): T[] {
  return items.map((item) => (item.id === id ? { ...item, status } : item));
}

/**
 * Applies a status only after the save succeeds.
 * A failed save returns the original list, so the UI cannot keep a status that was not stored.
 */
export async function commitStatusChange<T extends { id: string; status: ApplicationStatus }>(
  items: T[],
  id: string,
  status: ApplicationStatus,
  persist: () => Promise<void>,
): Promise<{ items: T[]; error: string | null }> {
  try {
    await persist();
    return { items: replaceStatus(items, id, status), error: null };
  } catch (error) {
    const message = error instanceof Error && error.message ? error.message : "Status was not saved.";
    return { items, error: message };
  }
}
