const CACHE_NAME = 'district-os-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

const OFFLINE_HTML = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#172d55" />
    <title>Offline · District OS</title>
    <style>
      :root {
        --bg: #0b1329;
        --card: #131e3a;
        --border: rgba(255,255,255,0.1);
        --text: #f8fafc;
        --muted: #94a3b8;
        --primary: #2563eb;
        --rose: #f43f5e;
      }
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        background: var(--bg);
        color: var(--text);
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1.5rem;
      }
      .card {
        background: var(--card);
        border: 1px solid var(--border);
        border-radius: 1.25rem;
        padding: 2.25rem 2rem;
        max-width: 480px;
        width: 100%;
        text-align: center;
        box-shadow: 0 20px 40px rgba(0,0,0,0.5);
      }
      .badge {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.75rem;
        font-weight: 700;
        letter-spacing: 0.05em;
        text-transform: uppercase;
        color: #fda4af;
        background: rgba(244,63,94,0.15);
        border: 1px solid rgba(244,63,94,0.3);
        padding: 0.35rem 0.85rem;
        border-radius: 9999px;
        margin-bottom: 1.25rem;
      }
      .pulse {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--rose);
        box-shadow: 0 0 10px var(--rose);
        animation: pulse 1.5s infinite;
      }
      @keyframes pulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.4; transform: scale(0.85); }
      }
      h1 {
        font-size: 1.65rem;
        font-weight: 800;
        margin-bottom: 0.65rem;
        letter-spacing: -0.02em;
      }
      p {
        font-size: 0.9rem;
        color: var(--muted);
        line-height: 1.6;
        margin-bottom: 1.75rem;
      }
      .diagnostics {
        background: rgba(0,0,0,0.25);
        border: 1px solid var(--border);
        border-radius: 0.85rem;
        padding: 1rem;
        margin-bottom: 1.75rem;
        text-align: left;
        font-size: 0.8rem;
      }
      .diag-row {
        display: flex;
        justify-content: space-between;
        padding: 0.4rem 0;
        border-bottom: 1px solid rgba(255,255,255,0.06);
      }
      .diag-row:last-child { border-bottom: none; }
      .diag-label { color: var(--muted); }
      .diag-val { font-weight: 600; color: var(--text); }
      .btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        padding: 0.8rem 1.25rem;
        font-size: 0.875rem;
        font-weight: 600;
        color: #fff;
        background: var(--primary);
        border: none;
        border-radius: 0.75rem;
        cursor: pointer;
        transition: transform 0.1s, opacity 0.2s;
      }
      .btn:hover { opacity: 0.92; }
      .btn:active { transform: scale(0.98); }
      .footer {
        margin-top: 1.25rem;
        font-size: 0.75rem;
        color: var(--muted);
      }
    </style>
  </head>
  <body>
    <div class="card">
      <div class="badge">
        <span class="pulse"></span>
        <span>Network Disconnected</span>
      </div>
      <h1>You Are Currently Offline</h1>
      <p>District OS detected that your internet connection was switched off. Please turn on your Wi-Fi or mobile data to reconnect.</p>
      
      <div class="diagnostics">
        <div class="diag-row">
          <span class="diag-label">Device Connection:</span>
          <span class="diag-val" style="color:#f43f5e">Disconnected</span>
        </div>
        <div class="diag-row">
          <span class="diag-label">Cloud Gateway:</span>
          <span class="diag-val">kanyakumari-ydm.vercel.app</span>
        </div>
        <div class="diag-row">
          <span class="diag-label">Local Data:</span>
          <span class="diag-val" style="color:#10b981">Safe & Preserved</span>
        </div>
      </div>

      <button class="btn" onclick="window.location.reload()">
        Check Connection & Reload
      </button>

      <div class="footer">
        Auto-reconnecting as soon as network is restored...
      </div>
    </div>

    <script>
      window.addEventListener('online', () => {
        window.location.reload();
      });
      setInterval(() => {
        if (navigator.onLine) {
          window.location.reload();
        }
      }, 2500);
    </script>
  </body>
</html>`;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => undefined);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Skip backend API calls
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // HTML navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          const indexCached = (await caches.match('/index.html')) || (await caches.match('/'));
          if (indexCached) return indexCached;
          return new Response(OFFLINE_HTML, {
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
          });
        })
    );
    return;
  }

  // Static assets (JS, CSS, images, fonts)
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(request, networkResponse));
          }
        }).catch(() => undefined);
        return cachedResponse;
      }

      return fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return networkResponse;
        })
        .catch(() => {
          if (request.destination === 'image') {
            return new Response('<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="m4.93 4.93 14.14 14.14"/></svg>', {
              headers: { 'Content-Type': 'image/svg+xml' }
            });
          }
          return new Response('', { status: 408, statusText: 'Offline' });
        });
    })
  );
});
