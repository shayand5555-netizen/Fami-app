const CACHE = 'fami-v0.39.0';
const APP_FILES = ['./','./index.html','./styles.css?v=0.39.0','./push-config.js?v=0.39.0','./cloud.js?v=0.39.0','./notifications.js?v=0.39.0','./family-recipes.js?v=0.39.0','./recipe-scanner.js?v=0.39.0','./app.js?v=0.39.0','./regional-events.json','./recipe-videos.json','./manifest.webmanifest','./icons/fami-icon.svg'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(APP_FILES)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(fetch(event.request).then(response => {
    const copy = response.clone();
    if (response.ok && new URL(event.request.url).origin === self.location.origin) caches.open(CACHE).then(cache => cache.put(event.request, copy));
    return response;
  }).catch(() => caches.match(event.request).then(cached => cached || caches.match('./index.html'))));
});

self.addEventListener('push', event => {
  let message = {};
  try { message = event.data?.json() || {}; }
  catch { message = {body:event.data?.text() || 'Ein Termin steht bald an.'}; }
  event.waitUntil(self.registration.showNotification(message.title || 'Fami erinnert dich', {
    body:message.body || 'Ein Termin steht bald an.',
    icon:'./icons/fami-icon.svg',
    badge:'./icons/fami-icon.svg',
    tag:message.tag || `fami-${Date.now()}`,
    data:{url:message.url || './?view=calendar',eventId:message.eventId || null}
  }));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || './?view=calendar', self.location.href).href;
  event.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(async windows => {
    const existing = windows.find(client => client.url.startsWith(self.location.origin));
    if (existing) {
      if ('navigate' in existing) await existing.navigate(target);
      return existing.focus();
    }
    return clients.openWindow(target);
  }));
});
