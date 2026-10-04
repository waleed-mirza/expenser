const SW_VERSION = new URL(self.location.href).searchParams.get("v") || "v1";
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

  // Never cache API responses: they are per-user and must always be fresh.
  if (url.pathname.startsWith("/api/")) {
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

// Background Sync: the queue lives in IndexedDB and is flushed by the app
// (see flushQueue in src/lib/sync.ts), so just ask open clients to sync.
async function requestClientSync() {
  const clients = await self.clients.matchAll({ includeUncontrolled: true });
  clients.forEach((client) => client.postMessage({ type: "SYNC_REQUEST" }));
}

self.addEventListener("sync", (event) => {
  if (event.tag === "sync-transactions") {
    event.waitUntil(requestClientSync());
  }
});

// Periodic Background Sync (if supported)
self.addEventListener("periodicsync", (event) => {
  if (event.tag === "sync-transactions-periodic") {
    event.waitUntil(requestClientSync());
  }
});
