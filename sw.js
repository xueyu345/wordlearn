/* 学习通 Service Worker
 * 策略：
 *   - 页面导航：网络优先，失败时回退到缓存的 index.html
 *   - words.json：网络优先（保证词库更新能及时生效），失败用缓存
 *   - 其他静态资源：缓存优先，后台顺带更新
 */
"use strict";

const VERSION = "v2";
const SHELL_CACHE = "wordhero-shell-" + VERSION;
const WORD_CACHE = "wordhero-words-" + VERSION;

const SHELL_ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icons/icon.svg",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL_CACHE);
      // 单个资源失败不让整个安装失败
      await Promise.all(
        SHELL_ASSETS.map((url) => cache.add(new Request(url, { cache: "reload" })).catch(() => {}))
      );
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith("wordhero-") && key !== SHELL_CACHE && key !== WORD_CACHE)
          .map((key) => caches.delete(key))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // 词库：网络优先
  if (url.pathname.endsWith("/words.json")) {
    event.respondWith(networkFirst(request, WORD_CACHE));
    return;
  }

  // 页面导航：网络优先，离线回退 shell
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(request);
          const cache = await caches.open(SHELL_CACHE);
          cache.put("./index.html", fresh.clone());
          return fresh;
        } catch (error) {
          const cache = await caches.open(SHELL_CACHE);
          return (await cache.match("./index.html")) || (await cache.match("./")) || Response.error();
        }
      })()
    );
    return;
  }

  // 其他静态资源：缓存优先
  event.respondWith(
    (async () => {
      const cache = await caches.open(SHELL_CACHE);
      const cached = await cache.match(request);
      if (cached) {
        fetch(request)
          .then((response) => {
            if (response && response.ok) cache.put(request, response.clone());
          })
          .catch(() => {});
        return cached;
      }
      try {
        const response = await fetch(request);
        if (response && response.ok) cache.put(request, response.clone());
        return response;
      } catch (error) {
        return Response.error();
      }
    })()
  );
});

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response && response.ok) cache.put(request, response.clone());
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) return cached;
    // 忽略 query 再试一次（index.html 会带 ?v= 时间戳）
    const fallback = await cache.match(request, { ignoreSearch: true });
    if (fallback) return fallback;
    throw error;
  }
}

/* 允许页面主动要求跳过等待，更新后立刻生效 */
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});
