"use client";

import { useCafes } from "@/components/providers/CafesProvider";

/** A background save/update/delete failed after its optimistic local change
 * already applied -- see CafesProvider. Global and dismissible rather than
 * threaded through every component that can trigger a mutation. */
export function SyncErrorBanner() {
  const { syncError, dismissSyncError } = useCafes();
  if (!syncError) return null;

  return (
    <div className="sync-error-banner" role="alert">
      <span>{syncError}</span>
      <button type="button" onClick={dismissSyncError} aria-label="Dismiss">
        ×
      </button>
    </div>
  );
}
