'use strict';

var CACHE_NAME = 'dekasuke-cache-v1';
var APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', function (event) {
  try {
    event.waitUntil(
      caches.open(CACHE_NAME)
        .then(function (cache) {
          return cache.addAll(APP_SHELL).catch(function () {
            // 一部アセットの取得に失敗してもインストール自体は継続する
          });
        })
        .then(function () {
          return self.skipWaiting();
        })
    );
  } catch (e) { /* インストール処理でのエラーは無視して継続 */ }
});

self.addEventListener('activate', function (event) {
  try {
    event.waitUntil(
      caches.keys().then(function (keys) {
        return Promise.all(
          keys.map(function (key) {
            if (key !== CACHE_NAME) {
              return caches.delete(key);
            }
          })
        );
      }).then(function () {
        return self.clients.claim();
      })
    );
  } catch (e) { /* アクティベート処理でのエラーは無視して継続 */ }
});

self.addEventListener('fetch', function (event) {
  try {
    if (event.request.method !== 'GET') return;
    event.respondWith(
      caches.match(event.request).then(function (cached) {
        if (cached) return cached;
        return fetch(event.request)
          .then(function (response) {
            try {
              if (response && response.status === 200 && response.type === 'basic') {
                var responseClone = response.clone();
                caches.open(CACHE_NAME).then(function (cache) {
                  cache.put(event.request, responseClone);
                }).catch(function () {});
              }
            } catch (e) {}
            return response;
          })
          .catch(function () {
            return caches.match('./index.html');
          });
      })
    );
  } catch (e) { /* fetchハンドラのエラーはネットワークに任せる */ }
});
