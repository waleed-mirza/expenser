const SW_VERSION = "v1";
const CACHE_NAME = `expenser-${SW_VERSION}`;

const ASSETS_TO_CACHE = [
  "/",
  "/dashboard",
  "/transactions",
  "/analytics",
  "/settings",
  "/manifest.json",
  "/offline",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== "GET") {
    return;
  }

  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request))
    );
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok && url.pathname.startsWith("/")) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => caches.match(request).then((cached) => cached || caches.match("/offline")))
  );
});

// Background Sync for offline transactions
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-transactions") {
    event.waitUntil(syncTransactions());
  }
});

async function syncTransactions() {
  try {
    // Import IDB helper to access queued operations
    const { openDB } = await import("idb");
    const db = await openDB("expenser-offline", 1);

    const queuedOps = await db.getAll("queue");

    if (queuedOps.length === 0) {
      return;
    }

    const response = await fetch("/api/sync/batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ items: queuedOps }),
    });

    if (response.ok) {
      // Clear the queue on success
      await db.clear("queue");

      // Notify all clients about successful sync
      const clients = await self.clients.matchAll();
      clients.forEach((client) => {
        client.postMessage({
          type: "SYNC_COMPLETE",
          count: queuedOps.length,
        });
      });
    }
  } catch (error) {
    console.error("Background sync failed:", error);
    throw error; // Re-throw to let browser retry
  }
}

// Periodic Background Sync (if supported)
self.addEventListener("periodicsync", (event) => {
  if (event.tag === "sync-transactions-periodic") {
    event.waitUntil(syncTransactions());
  }
});
