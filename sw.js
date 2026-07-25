/* Aeric Ryder reader — offline shell + chapter cache */
const CACHE = "aeric-ryder-v2";

const PRECACHE = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./manifest.webmanifest",
  "./chapters/chapter_01.md",
  "./chapters/chapter_02.md",
  "./images/chapter_01.png",
  "./images/chapter_03.png",
  "./images/mariusz.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png",
  "https://cdn.jsdelivr.net/npm/marked@15.0.12/marked.min.js",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then(async (cache) => {
      await Promise.all(
        PRECACHE.map((url) =>
          cache.add(url).catch((err) => {
            console.warn("Precache skipped:", url, err);
          })
        )
      );
      await self.skipWaiting();
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))
      )
      .then(() => self.clients.claim())
  );
});

function sameOrigin(url) {
  return url.origin === self.location.origin;
}

function shouldCache(request, response) {
  if (!response || !response.ok) return false;
  if (request.method !== "GET") return false;
  const url = new URL(request.url);
  if (sameOrigin(url)) return true;
  return url.hostname === "cdn.jsdelivr.net" || url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com";
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // App shell navigations: network first, offline fallback to cached index
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put("./index.html", copy));
          return response;
        })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }

  // Stale-while-revalidate for chapters, assets, CDN
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      const cached = await cache.match(request);

      const networkPromise = fetch(request)
        .then((response) => {
          if (shouldCache(request, response)) {
            cache.put(request, response.clone());
          }
          return response;
        })
        .catch(() => cached);

      // Prefer fresh chapters/app code when online; use cache immediately for images/icons
      const isChapterOrApp =
        sameOrigin(url) &&
        (url.pathname.endsWith(".md") ||
          url.pathname.endsWith("app.js") ||
          url.pathname.endsWith("styles.css") ||
          url.pathname.endsWith("index.html"));

      if (isChapterOrApp) {
        return (await networkPromise) || cached;
      }

      return cached || networkPromise;
    })()
  );
});
