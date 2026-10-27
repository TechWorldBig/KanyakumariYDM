const CACHE_NAME = 'district-os-v3';

const OFFLINE_HTML = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#0b1329" />
    <title>Offline · Kanyakumari District OS</title>
    <style>
      :root {
        --bg: #090e1a;
        --card: #111a2e;
        --border: rgba(255, 255, 255, 0.08);
        --text: #f1f5f9;
        --muted: #94a3b8;
        --primary: #2563eb;
        --primary-hover: #1d4ed8;
        --rose: #f43f5e;
        --emerald: #10b981;
      }
      @media (prefers-color-scheme: light) {
        :root {
          --bg: #f8fafc;
          --card: #ffffff;
          --border: #e2e8f0;
          --text: #0f172a;
          --muted: #64748b;
          --primary: #2563eb;
          --primary-hover: #1d4ed8;
        }
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
        padding: 2.5rem 2rem;
        max-width: 480px;
        width: 100%;
        text-align: center;
        box-shadow: 0 20px 40px -15px rgba(0,0,0,0.4);
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
        background: rgba(244,63,94,0.12);
        border: 1px solid rgba(244,63,94,0.25);
        padding: 0.35rem 0.85rem;
        border-radius: 9999px;
        margin-bottom: 1.25rem;
      }
      .badge.restored {
        color: #6ee7b7;
        background: rgba(16,185,129,0.12);
        border-color: rgba(16,185,129,0.25);
      }
      .pulse {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--rose);
        box-shadow: 0 0 10px var(--rose);
        animation: pulse 1.5s infinite;
      }
      .badge.restored .pulse {
        background: var(--emerald);
        box-shadow: 0 0 10px var(--emerald);
      }
      @keyframes pulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.3; transform: scale(0.8); }
      }
      h1 {
        font-size: 1.5rem;
        font-weight: 700;
        margin-bottom: 0.5rem;
        letter-spacing: -0.02em;
        color: var(--text);
      }
      p {
        font-size: 0.875rem;
        color: var(--muted);
        line-height: 1.55;
        margin-bottom: 1.5rem;
      }
      .diagnostics {
        background: rgba(0, 0, 0, 0.15);
        border: 1px solid var(--border);
        border-radius: 0.85rem;
        padding: 1rem 1.2rem;
        margin-bottom: 1.5rem;
        text-align: left;
        font-size: 0.8rem;
      }
      .diag-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.4rem 0;
        border-bottom: 1px solid var(--border);
      }
      .diag-row:last-child { border-bottom: none; }
      .diag-label { color: var(--muted); }
      .diag-val { font-weight: 600; color: var(--text); font-family: ui-monospace, SFMono-Regular, monospace; font-size: 0.76rem; }
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
        transition: all 0.15s ease;
      }
      .btn:hover { background: var(--primary-hover); transform: translateY(-1px); }
      .btn:active { transform: translateY(0); }
      .footer {
        margin-top: 1.25rem;
        font-size: 0.75rem;
        color: var(--muted);
      }
      .spinner {
        display: none;
        width: 14px;
        height: 14px;
        border: 2px solid rgba(255,255,255,0.3);
        border-top-color: #fff;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
        margin-right: 8px;
      }
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
      .btn.checking .spinner {
        display: inline-block;
      }
    </style>
  </head>
  <body>
    <div class="card">
      <div class="badge" id="status-badge">
        <span class="pulse"></span>
        <span id="badge-text">Network Disconnected</span>
      </div>
      <h1 id="title-text">You Are Currently Offline</h1>
      <p id="desc-text">District OS detected that your internet connection was switched off. Please re-enable Wi-Fi or mobile data to reconnect to your workspace.</p>
      
      <div class="diagnostics">
        <div class="diag-row">
          <span class="diag-label">Device Connection:</span>
          <span class="diag-val" id="diag-conn" style="color:#f43f5e">Disconnected</span>
        </div>
        <div class="diag-row">
          <span class="diag-label">Cloud Gateway:</span>
          <span class="diag-val">kanyakumari-ydm.vercel.app</span>
        </div>
        <div class="diag-row">
          <span class="diag-label">Workspace State:</span>
          <span class="diag-val" style="color:#10b981">Safe & Preserved</span>
        </div>
      </div>

      <button class="btn" id="reload-btn" onclick="checkAndReload()">
        <span class="spinner" id="btn-spinner"></span>
        <span id="btn-text">Check Connection & Reload</span>
      </button>

      <div class="footer" id="footer-text">
        Auto-reconnecting as soon as network is restored...
      </div>
    </div>

    <script>
      function onRestored() {
        var badge = document.getElementById('status-badge');
        var badgeText = document.getElementById('badge-text');
        var title = document.getElementById('title-text');
        var desc = document.getElementById('desc-text');
        var diagConn = document.getElementById('diag-conn');
        var footer = document.getElementById('footer-text');
        if (badge) badge.className = 'badge restored';
        if (badgeText) badgeText.textContent = 'Connection Restored';
        if (title) title.textContent = 'Reconnecting to District OS...';
        if (desc) desc.textContent = 'Your network connection is restored. Returning to your secure workspace.';
        if (diagConn) { diagConn.textContent = 'Connected'; diagConn.style.color = '#10b981'; }
        if (footer) footer.textContent = 'Reloading workspace...';
        setTimeout(function() {
          window.location.reload();
        }, 600);
      }

      function checkAndReload() {
        var btn = document.getElementById('reload-btn');
        var btnText = document.getElementById('btn-text');
        if (btn) btn.classList.add('checking');
        if (btnText) btnText.textContent = 'Checking...';
        if (navigator.onLine) {
          fetch('/manifest.json?_t=' + Date.now(), { method: 'HEAD', cache: 'no-store' })
            .then(function() {
              onRestored();
            })
            .catch(function() {
              setTimeout(function() {
                if (btn) btn.classList.remove('checking');
                if (btnText) btnText.textContent = 'Check Connection & Reload';
              }, 800);
            });
        } else {
          setTimeout(function() {
            if (btn) btn.classList.remove('checking');
            if (btnText) btnText.textContent = 'Check Connection & Reload';
          }, 600);
        }
      }

      window.addEventListener('online', function() {
        onRestored();
      });

      setInterval(function() {
        if (navigator.onLine) {
          fetch('/manifest.json?_t=' + Date.now(), { method: 'HEAD', cache: 'no-store' })
            .then(function() {
              onRestored();
            })
            .catch(function() {});
        }
      }, 1500);
    </script>
  </body>
</html>`;

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      try {
        // Cache standalone fallback offline page
        await cache.put(
          '/offline.html',
          new Response(OFFLINE_HTML, {
            status: 200,
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
          })
        );

        // Fetch index.html and pre-cache its linked CSS/JS bundles
        const response = await fetch('/', { cache: 'no-cache' });
        if (response && response.status === 200) {
          const htmlText = await response.clone().text();
          await cache.put('/', response.clone());
          await cache.put('/index.html', response);

          // Extract and pre-cache assets so app shell is fully cached
          const assetUrls = [];
          const matches = htmlText.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g);
          for (const match of matches) {
            if (match[1]) assetUrls.push(match[1]);
          }

          await Promise.all(
            assetUrls.map(async (url) => {
              try {
                const assetRes = await fetch(url, { cache: 'no-cache' });
                if (assetRes && assetRes.status === 200) {
                  await cache.put(url, assetRes);
                }
              } catch (_) {
                // Ignore individual asset prefetch failures
              }
            })
          );
        }
      } catch (err) {
        // Offline during installation
      }
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((k) => caches.delete(k)))
      ),
    ])
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
      (async () => {
        // If the browser is currently offline, return the standalone offline page immediately
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
          return new Response(OFFLINE_HTML, {
            status: 200,
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
          });
        }

        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3500);

          const response = await fetch(request, { signal: controller.signal });
          clearTimeout(timeoutId);

          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, copy.clone());
              cache.put('/', copy);
            });
          }
          return response;
        } catch (err) {
          // Device is offline or network timed out — serve guaranteed offline page
          const cachedOffline = await caches.match('/offline.html');
          if (cachedOffline) return cachedOffline;

          return new Response(OFFLINE_HTML, {
            status: 200,
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
          });
        }
      })()
    );
    return;
  }

  // 2. Static assets (JS, CSS, images, fonts)
  event.respondWith(
    (async () => {
      const cached = await caches.match(request);
      if (cached) {
        if (typeof navigator !== 'undefined' && navigator.onLine) {
          fetch(request)
            .then((res) => {
              if (res && res.status === 200) {
                caches.open(CACHE_NAME).then((cache) => cache.put(request, res));
              }
            })
            .catch(() => {});
        }
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
          return new Response(
            '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="m4.93 4.93 14.14 14.14"/></svg>',
            { headers: { 'Content-Type': 'image/svg+xml' } }
          );
        }
        if (request.destination === 'style' || url.pathname.endsWith('.css')) {
          return new Response('/* offline */\n', {
            headers: { 'Content-Type': 'text/css; charset=utf-8' },
          });
        }
        if (request.destination === 'script' || url.pathname.endsWith('.js')) {
          return new Response('// offline placeholder\n', {
            headers: { 'Content-Type': 'application/javascript; charset=utf-8' },
          });
        }
        return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
      }
    })()
  );
});
