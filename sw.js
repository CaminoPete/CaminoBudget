const CACHE_NAME = "trip-budget-tracker-v42";

const APP_FILES = [
  "./",
  "./index.html",
  "./css/styles.css?v=42",
  "./js/app.js?v=42",
  "./manifest.webmanifest",
  "./icon.svg"
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(APP_FILES);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (cacheNames) {
      return Promise.all(
        cacheNames
          .filter(function (cacheName) {
            return cacheName !== CACHE_NAME;
          })
          .map(function (cacheName) {
            return caches.delete(cacheName);
          })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("message", function (event) {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", function (event) {
  if (event.request.method !== "GET") {
    return;
  }

  if (event.request.mode === "navigate" || isAppAsset(event.request.url)) {
    event.respondWith(networkFirst(event.request));
    return;
  }

  event.respondWith(
    caches.match(event.request).then(function (cachedResponse) {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request)
        .then(function (networkResponse) {
          const responseClone = networkResponse.clone();

          caches.open(CACHE_NAME).then(function (cache) {
            cache.put(event.request, responseClone);
          });

          return networkResponse;
        })
        .catch(function () {
          if (event.request.mode === "navigate") {
            return caches.match("./index.html");
          }

          return new Response("", {
            status: 408,
            statusText: "Offline"
          });
        });
    })
  );
});

function isAppAsset(url) {
  return url.indexOf("/css/styles.css") !== -1 ||
    url.indexOf("/js/app.js") !== -1 ||
    url.indexOf("/manifest.webmanifest") !== -1 ||
    url.indexOf("/icon.svg") !== -1;
}

function networkFirst(request) {
  return fetch(request)
    .then(function (networkResponse) {
      const responseClone = networkResponse.clone();

      caches.open(CACHE_NAME).then(function (cache) {
        cache.put(request, responseClone);
      });

      return networkResponse;
    })
    .catch(function () {
      return caches.match(request).then(function (cachedResponse) {
        if (cachedResponse) {
          return cachedResponse;
        }

        if (request.mode === "navigate") {
          return caches.match("./index.html");
        }

        return new Response("", {
          status: 408,
          statusText: "Offline"
        });
      });
    });
}
