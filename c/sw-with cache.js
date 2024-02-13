/*
*
*  Push Notifications codelab
*  Copyright 2015 Google Inc. All rights reserved.
*
*  Licensed under the Apache License, Version 2.0 (the "License");
*  you may not use this file except in compliance with the License.
*  You may obtain a copy of the License at
*
*      https://www.apache.org/licenses/LICENSE-2.0
*
*  Unless required by applicable law or agreed to in writing, software
*  distributed under the License is distributed on an "AS IS" BASIS,
*  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
*  See the License for the specific language governing permissions and
*  limitations under the License
*
*/

/* eslint-env browser, serviceworker, es6 */

'use strict';

self.addEventListener('push', function(event) {
  console.log('[Service Worker] Push received: "${event.data.text()}"');
  const title = 'Clean Air Cluj';
  var i = 'images/logo@2x.png', t = event.data.text(), n = (parseInt(t));
  if (!isNaN(n)) { if (n>=500) n=499; i = 'images/' + Math.floor(n/50) + '.png'; }
  const options = {
    body: t,
    icon: i,
    badge: 'images/air-bad.png'
    /* , "vibrate": [200, 100, 200, 100, 200, 100, 400], "tag": "request", "actions": [ { "action": "yes", "title": "Yes", "icon": "images/y.png" },{ "action": "no", "title": "No", "icon": "images/.." } ] */ 
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function(event) {
  console.log('[Service Worker] Notification click Received.');
  event.notification.close();
  event.waitUntil(
    clients.openWindow('http://cluj.ml')
  );
});

const version = "1.16.0";
const cacheName = 'cleanair-${version}';
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(cacheName).then(cache => {
      return cache.addAll([
        '/',
        '/index.html',
        '/style.css',
        '/js/app.js',
        '/images/logo.png',
        '/images/exhaust.svg',
        '/images/molecule.svg',
'/images/icons/0.svg','/images/icons/1.svg','/images/icons/2.svg','/images/icons/3.svg','/images/icons/4.svg','/images/icons/5.svg','/images/icons/6.svg','/images/icons/7.svg','/images/icons/8.svg','images/icons/9.svg','/images/icons/clear-night.svg','/images/icons/partly-cloudy-night.svg','/images/icons/partly-cloudy-day.svg','/images/icons/partly-cloudy.svg','/images/icons/rain.svg','/images/icons/snow.svg','/images/icons/wind.svg','/images/icons/clear-day.svg','/images/icons/cloudy.svg','/images/icons/fog.svg',
        '/images/feelslike.svg',
        '/images/icon-umberella.png', '/images/dewpoint.svg', '/images/waterdrop.svg', '/images/cloudcover.svg', '/images/visibility.svg', '/images/sunblock.svg', '/images/windy.svg', '/images/icon-wind.png', '/images/icon-compass.png', '/images/pressure.svg', '/images/o3-cloud.svg', 
        '/images/bell.svg',
        '/images/silent.svg'
      ])
          .then(() => self.skipWaiting());
    })
  );
});

self.addEventListener("activate", function(event) {
  console.log('WORKER: activate event in progress.');
  event.waitUntil(
    caches.keys()
      .then(function (keys) {
        // We return a promise that settles when all outdated caches are deleted.
        return Promise.all(
          keys
            .filter(function (key) {
              // Filter by keys that don't start with the latest version prefix.
              return !key.startsWith(version);
            })
            .map(function (key) {
              // Return a promise that's fulfilled when each outdated cache is deleted.
              return caches.delete(key);
            })
        );
      })
      .then(function() {
        console.log('WORKER: activate completed.');
      })
  );
});

self.addEventListener("fetch", function(event) {
  console.log('WORKER: fetch event in progress.'); // We should only cache GET requests, and deal with the rest of method in the client-side, by handling failed POST,PUT,PATCH,etc. requests.
  if (event.request.method !== 'GET') { // If we don't block the event as shown below, then the request will go to the network as usual.
    console.log('WORKER: fetch event ignored.', event.request.method, event.request.url);
    return;
  }
  /* Similar to event.waitUntil in that it blocks the fetch event on a promise.
     Fulfillment result will be used as the response, and rejection will end in a
     HTTP response indicating failure. */
  event.respondWith(
    caches
      /* This method returns a promise that resolves to a cache entry matching
         the request. Once the promise is settled, we can then provide a response
         to the fetch request. */
      .match(event.request)
      .then(function(cached) {
        /* Even if the response is in our cache, we go to the network as well.
           This pattern is known for producing "eventually fresh" responses,
           where we return cached responses immediately, and meanwhile pull
           a network response and store that in the cache.
           Read more:
           https://ponyfoo.com/articles/progressive-networking-serviceworker */
        var networked = fetch(event.request)
          // We handle the network request with success and failure scenarios.
          .then(fetchedFromNetwork, unableToResolve)
          // We should catch errors on the fetchedFromNetwork handler as well.
          .catch(unableToResolve);
        /* We return the cached response immediately if there is one, and fall
           back to waiting on the network as usual.*/
        console.log('WORKER: fetch event', cached ? '(cached)' : '(network)', event.request.url);
        return cached || networked;

        function fetchedFromNetwork(response) {
          /* We copy the response before replying to the network request.
             This is the response that will be stored on the ServiceWorker cache. */
          var cacheCopy = response.clone();
          console.log('WORKER: fetch response from network.', event.request.url);
          caches // We open a cache to store the response for this request.
            .open(version + 'pages')
            .then(function add(cache) {
              /* We store the response for this request. It'll later become
                 available to caches.match(event.request) calls, when looking
                 for cached responses.*/
              cache.put(event.request, cacheCopy);
            })
            .then(function() {
              console.log('WORKER: fetch response stored in cache.', event.request.url);
            });
          // Return the response so that the promise is settled in fulfillment.
          return response;
        }

        /* When this method is called, it means we were unable to produce a response
           from either the cache or the network. This is our opportunity to produce
           a meaningful response even when all else fails. It's the last chance, so
           you probably want to display a "Service Unavailable" view or a generic
           error response. */
        function unableToResolve () {
          /* There's a couple of things we can do here.
             - Test the Accept header and then return one of the `offlineFundamentals`
               e.g: `return caches.match('/some/cached/image.png')`
             - You should also consider the origin. It's easier to decide what
               "unavailable" means for requests against your origins than for requests
               against a third party, such as an ad provider
             - Generate a Response programmaticaly, as shown below, and return that */
          console.log('WORKER: fetch request failed in both cache and network.');

          /* Here we're creating a response programmatically. The first parameter is the
             response body, and the second one defines the options for the response. */
          return new Response('<h1>Service Unavailable</h1>', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({
              'Content-Type': 'text/html'
            })
          });
        }
      })
  );
});

/*
self.addEventListener('activate', function(e) {
  console.log('[ServiceWorker] Activate');
  e.waitUntil(
    caches.keys().then(function(keyList) {
      return Promise.all(keyList.map(function(key) {
        if (key !== cacheName && key !== cacheName) {
          console.log('[ServiceWorker] Removing old cache', key);
          return caches.delete(key);
        }
      }));
    })
  );
  return self.clients.claim();
});	
*/

/* self.addEventListener('fetch', event => {
  console.log(event.request.url);    
  event.respondWith(
    caches.open(cacheName)
      .then(cache => cache.match(event.request, {ignoreSearch: true}))
      .then(response => {
      return response || fetch(event.request);
    })
  );
}); */

/*
self.addEventListener('fetch', function(e) {
  console.log('[Service Worker] Fetch', e.request.url);
  var dataUrl = 'api';
  console.log ('request.url='+e.request.url);
  if (e.request.url.indexOf(dataUrl) > -1) {
    e.respondWith(
      caches.open(cacheName).then(function(cache) { 
        return fetch(e.request).then(function(response){
          cache.put(e.request.url, response.clone());
          return response;
        });
      })
    );
  } else {
    e.respondWith(
      caches.open(cacheName)
      .then(cache => cache.match(e.request, {ignoreSearch: true}))
      .then(response => {
      return response || fetch(e.request);
      })
    );
  }
}); 
*/

/* '/images/0.png', '/images/1.png', '/images/2.png', '/images/3.png', '/images/4.png', '/images/5.png', '/images/6.png', '/images/7.png', '/images/8.png', '/images/9.png' */