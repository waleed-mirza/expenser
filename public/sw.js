const SW_VERSION = new URL(self.location.href).searchParams.get("v") || "v1";
// Bump CACHE_REV when the caching strategy changes so stale entries are dropped.
const CACHE_REV = 2;
const CACHE_NAME = `expenser-${SW_VERSION}-r${CACHE_REV}`;

// Only public, redirect-free assets are precached. The signed-in pages are
// cached when first visited: fetching them at install time (possibly signed
// out) would store the /signin redirect under their URLs.
const ASSETS_TO_CACHE = ["/manifest.json", "/offline"];

// Signed-in pages open instantly from cache (stale-while-revalidate), so a
// launch from the home screen never waits on the network or a cold server.
const APP_PAGES = ["/dashboard", "/transactions", "/analytics", "/settings"];

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

// A redirected response can't answer a navigation, and a signed-out
// /signin page must never be stored under an app URL.
function isCacheable(response) {
  return response.ok && response.type === "basic" && !response.redirected;
}

async function putInCache(request, response) {
  const cache = await caches.open(CACHE_NAME);
  await cache.put(request, response);
}

async function offlineFallback() {
  return (await caches.match("/offline")) || Response.error();
}

async function revalidate(request) {
  const response = await fetch(request);
  if (isCacheable(response)) {
    await putInCache(request, response.clone());
  } else if (response.type === "opaqueredirect") {
    // Signed out (or session expired): don't keep serving the stale page.
    const cache = await caches.open(CACHE_NAME);
    await cache.delete(request);
  }
  return response;
}

async function appPage(event) {
  const cached = await caches.match(event.request);
  if (cached) {
    event.waitUntil(revalidate(event.request).catch(() => {}));
    return cached;
  }
  try {
    return await revalidate(event.request);
  } catch {
    return offlineFallback();
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (isCacheable(response)) {
      await putInCache(request, response.clone());
    }
    return response;
  } catch {
    return (await caches.match(request)) || offlineFallback();
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== "GET" || url.origin !== self.location.origin) {
    return;
  }

  // Never cache API responses: they are per-user and must always be fresh.
  if (url.pathname.startsWith("/api/")) {
    return;
  }

  // Hashed build assets are immutable: cache-first, stored on first use.
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response.ok) {
              const clone = response.clone();
              event.waitUntil(putInCache(request, clone));
            }
            return response;
          })
      )
    );
    return;
  }

  if (request.mode === "navigate" && APP_PAGES.includes(url.pathname)) {
    event.respondWith(appPage(event));
    return;
  }

  event.respondWith(networkFirst(request));
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
