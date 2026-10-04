import { useEffect, useState } from "react";
import { QUEUE_CHANGED_EVENT, SYNCED_EVENT } from "@/lib/sync";

/**
 * Counters that tick when the local queue changes (something was saved or
 * edited on this device) and when a sync round-trip finishes (the server now
 * has it). Lists use `queued` to re-merge local data instantly and `synced`
 * to refetch from the server.
 */
export function useDataVersions() {
  const [queued, setQueued] = useState(0);
  const [synced, setSynced] = useState(0);

  useEffect(() => {
    const onQueued = () => setQueued((n) => n + 1);
    const onSynced = () => setSynced((n) => n + 1);
    window.addEventListener(QUEUE_CHANGED_EVENT, onQueued);
    window.addEventListener(SYNCED_EVENT, onSynced);
    return () => {
      window.removeEventListener(QUEUE_CHANGED_EVENT, onQueued);
      window.removeEventListener(SYNCED_EVENT, onSynced);
    };
  }, []);

  return { queued, synced };
}
