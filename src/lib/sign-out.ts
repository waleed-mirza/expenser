import { signOut } from "next-auth/react";

/** Sign out and drop the service worker's cached (per-user) pages. */
export async function signOutAndClearCaches(callbackUrl: string) {
  try {
    if (typeof caches !== "undefined") {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
    }
  } catch (err) {
    console.warn("Failed to clear caches on sign-out:", err);
  }
  await signOut({ callbackUrl });
}
