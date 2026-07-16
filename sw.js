// ================================================================
// Service Worker - المنظومة الإنتاجية
// ================================================================
// عند كل تحديث فعلي للتطبيق: غيّر رقم النسخة بالسطر التالي فقط (مثلاً v2 ثم v3 ...)
// هذا هو الزر الوحيد اللي بيخلي المتصفح يعرف إنه في نسخة جديدة ويرمي القديمة.
const CACHE_NAME = 'app-cache-v5';   // ← رُفع من v4 لـ v5 بسبب إضافة نظام الإشعارات
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-512-maskable.png',
  './badge-96.png'
];

// -- التنصيب: تخزين الملفات الأساسية + تفعيل فوري بدون انتظار --
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting(); // فعّل النسخة الجديدة فوراً بدل الانتظار لإغلاق كل التبويبات
});

// -- التفعيل: حذف أي نسخ كاش قديمة + أخذ السيطرة فوراً على الصفحة المفتوحة --
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// -- الجلب: نت أولاً (لضمان أحدث نسخة)، وإذا ما في نت نرجع للكاش (يشتغل offline) --
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request).then((cached) => cached || caches.match('./index.html')))
  );
});

// -- الضغط على إشعار: فتح التطبيق (أو التركيز على تبويب مفتوح أصلاً) --
self.addEventListener('notificationclick', event => {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({type:'window'}).then(clientList => {
            if(clientList.length>0) return clientList[0].focus();
            return clients.openWindow('./index.html');
        })
    );
});
