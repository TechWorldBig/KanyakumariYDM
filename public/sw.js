const CACHE_NAME = 'district-os-v2';

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
        --border: rgba(255,255,255,0.12);
        --text: #f8fafc;
        --muted: #94a3b8;
        --primary: #2563eb;
        --primary-hover: #1d4ed8;
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
        border-radius: 1.5rem;
        padding: 2.5rem 2rem;
        max-width: 490px;
        width: 100%;
        text-align: center;
        box-shadow: 0 25px 50px -12px rgba(0,0,0,0.6);
      }
      .badge {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.72rem;
        font-weight: 700;
        letter-spacing: 0.06em;
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
        50% { opacity: 0.3; transform: scale(0.8); }
      }
      h1 {
        font-size: 1.75rem;
        font-weight: 800;
        margin-bottom: 0.65rem;
        letter-spacing: -0.02em;
        color: #fff;
      }
      p {
        font-size: 0.92rem;
        color: var(--muted);
        line-height: 1.6;
        margin-bottom: 1.75rem;
      }
      .diagnostics {
        background: rgba(0,0,0,0.25);
        border: 1px solid var(--border);
        border-radius: 1rem;
        padding: 1.15rem;
        margin-bottom: 1.75rem;
        text-align: left;
        font-size: 0.82rem;
      }
      .diag-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.45rem 0;
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
        padding: 0.85rem 1.25rem;
        font-size: 0.875rem;
        font-weight: 700;
        color: #fff;
        background: var(--primary);
        border: none;
        border-radius: 0.85rem;
        cursor: pointer;
        transition: all 0.15s ease;
      }
      .btn:hover { background: var(--primary-hover); transform: translateY(-1px); }
      .btn:active { transform: translateY(0); }
      .footer {
        margin-top: 1.35rem;
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
      <p>District OS detected that your internet connection was switched off. Please re-enable Wi-Fi or mobile data to reconnect to your workspace.</p>
      
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
          <span class="diag-label">Local Workspace Data:</span>
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
      window.addEventListener('online', function() {
        window.location.reload();
      });
      setInterval(function() {
        if (navigator.onLine) {
          window.location.reload();
        }
      }, 2000);
    </script>
  </body>
</html>`;

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      try {
        const response = await fetch('/', { cache: 'no-cache' });
        if (response && response.status === 200) {
          await cache.put('/', response.clone());
          await cache.put('/index.html', response);
        }
      } catch (err) {
        // network fetch error during install
      }
    })
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

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Exclude backend API routes
  if (url.pathname.startsWith('/api/')) return;

  // 1. Navigation requests (HTML document)
  if (
    request.mode === 'navigate' ||
    request.destination === 'document' ||
    request.headers.get('accept')?.includes('text/html')
  ) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, copy.clone());
              cache.put('/', copy);
            });
          }
          return response;
        })
        .catch(async () => {
          // Device is offline
          const cached =
            (await caches.match(request)) ||
            (await caches.match('/')) ||
            (await caches.match('/index.html'));
          if (cached) return cached;

          // Always return 200 standalone District OS offline fallback page
          return new Response(OFFLINE_HTML, {
            status: 200,
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
          });
        })
    );
    return;
  }

  // 2. Static assets (JS, CSS, images, fonts)
  event.respondWith(
    caches.match(request).then(async (cached) => {
      if (cached) {
        fetch(request).then((res) => {
          if (res && res.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(request, res));
          }
        }).catch(() => {});
        return cached;
      }

      try {
        const response = await fetch(request);
        if (response && response.status === 200) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      } catch (err) {
        if (request.destination === 'image') {
          return new Response('<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="m4.93 4.93 14.14 14.14"/></svg>', {
            headers: { 'Content-Type': 'image/svg+xml' }
          });
        }
        return new Response('', { status: 408 });
      }
    })
  );
});
