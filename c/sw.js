'use strict';

self.addEventListener('push', function(event) {
  console.log('[Service Worker] Push received: "${event.data.text()}"');
  const title = 'Clean Air Cluj';
  var i = 'images/logo@2x.png', t = event.data.text(), n = (parseInt(t));
  if (!isNaN(n)) { if (n>=500) n=499; i = 'images/' + Math.floor(n/50) + '.png'; }
  const options = {
    body: t,
    icon: i,
    badge: 'images/badge.png', 
    "vibrate": [200, 100, 200, 100, 200, 100, 400]
    /* , "tag": "request", "actions": [ { "action": "yes", "title": "Yes", "icon": "images/y.png" },{ "action": "no", "title": "No", "icon": "images/.." } ] */ 
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function(event) {
  console.log('[Service Worker] Notification click Received.');
  event.notification.close();
  event.waitUntil(clients.openWindow('http://cluj.ml'));
});



/* check if window already open and focus on it: event.waitUntil(clients.matchAll({type: 'window'
  }).then(function(clientList) {
    for (var i = 0; i < clientList.length; i++) {var client = clientList[i];if (client.url === 'https://cluj.ml/' && 'focus' in client) {return client.focus();} }
    if (clients.openWindow) {return clients.openWindow('https://cluj.ml/');} }));  */