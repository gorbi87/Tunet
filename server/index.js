import express from 'express';
import rateLimit from 'express-rate-limit';
import { existsSync, readFileSync, readdirSync } from 'fs';
import { join, dirname, extname, basename } from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { request as httpRequest } from 'http';
import { request as httpsRequest } from 'https';
import { URL } from 'url';
import { WebSocket, WebSocketServer } from 'ws';
import profilesRouter from './routes/profiles.js';
import iconsRouter from './routes/icons.js';
import settingsRouter from './routes/settings.js';
import { createHomeAssistantAuthMiddleware } from './haAuth.js';
import db from './db.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = parseInt(process.env.PORT || '3002', 10);
const isProduction = process.env.NODE_ENV === 'production';

const packageJsonPath = join(__dirname, '..', 'package.json');
let appVersion = 'unknown';
try {
  const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
  appVersion = pkg?.version || 'unknown';
} catch {
  appVersion = 'unknown';
}

const app = express();
// Trust the HA ingress proxy (sets X-Forwarded-For) so rate-limiting works correctly
app.set('trust proxy', 1);
const homeAssistantAuth = createHomeAssistantAuthMiddleware();
app.disable('x-powered-by');
app.use((_req, res, next) => {
  res.removeHeader('X-Powered-By');

  // --- Content-Security-Policy ---
  // Restricts which origins can load scripts, styles, images, etc.
  // "self" = same origin only; external CDNs are explicitly allowed.
  const csp = [
    "default-src 'self'",
    // Scripts: own bundle only (inline for Vite dev handled by nonce/hash in dev mode)
    "script-src 'self'",
    // Styles: own + Google Fonts + inline (Tailwind / dynamic styles)
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    // Fonts: own + Google Fonts CDN
    "font-src 'self' https://fonts.gstatic.com",
    // Images: own, HA instance (any origin – URL is user-configured), weather icons, media logos, map tiles, data/blob URIs
    "img-src 'self' data: blob: http: https: https://cdn.jsdelivr.net https://cdn.simpleicons.org https://*.basemaps.cartocdn.com https://*.tile.openstreetmap.org",
    // WebSocket connections to the user's HA instance (any origin, since URL is user-configured)
    "connect-src 'self' ws: wss: http: https:",
    // Video/audio: own origin + blob URLs (created from proxy-fetched clips)
    "media-src 'self' blob:",
    // Leaflet map iframe + HA panels (energy dashboard etc.)
    "frame-src 'self' https://www.openstreetmap.org",
    // Block all object/embed/plugin
    "object-src 'none'",
    // Restrict base-uri to prevent base tag injection
    "base-uri 'self'",
    // Only allow forms to submit to same origin
    "form-action 'self'",
  ].join('; ');

  res.setHeader('Content-Security-Policy', csp);
  next();
});

// Parse JSON bodies
app.use(express.json({ limit: '2mb' }));

const apiRateLimiter = rateLimit({
  windowMs: Math.max(Number(process.env.API_RATE_LIMIT_WINDOW_MS) || 60_000, 1_000),
  max: Math.max(Number(process.env.API_RATE_LIMIT_MAX) || 300, 10),
  standardHeaders: true,
  legacyHeaders: false,
});

const assetFallbackRateLimiter = rateLimit({
  windowMs: Math.max(Number(process.env.ASSET_FALLBACK_RATE_LIMIT_WINDOW_MS) || 60_000, 1_000),
  max: Math.max(Number(process.env.ASSET_FALLBACK_RATE_LIMIT_MAX) || 120, 10),
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api', apiRateLimiter);

// Ingress support — strip X-Ingress-Path prefix from request URL
app.use((req, _res, next) => {
  const ingressPath = req.headers['x-ingress-path'];
  if (ingressPath && req.url.startsWith(ingressPath)) {
    req.url = req.url.slice(ingressPath.length) || '/';
  }
  next();
});

// API routes
app.use('/api/profiles', homeAssistantAuth, profilesRouter);
app.use('/api/icons', iconsRouter);
app.use('/api/settings', homeAssistantAuth, settingsRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', version: appVersion });
});

// Shared HA config — served from addon options (HA_URL + HA_TOKEN env vars).
// No auth required: allows all devices to auto-connect without per-device setup.
app.get('/api/ha-config', (_req, res) => {
  const haUrl = process.env.HA_URL || '';
  const haToken = process.env.HA_TOKEN || '';
  if (!haUrl || !haToken) return res.json(null);
  return res.json({ url: haUrl, token: haToken });
});

// go2rtc HTTP proxy — avoids mixed-content blocking when Tunet is served over HTTPS.
// For m3u8 playlists the proxy rewrites segment URLs so the browser can fetch
// them through this same proxy (native HLS players resolve segments relative
// to the playlist URL, which would otherwise break).
app.get('/api/go2rtc-proxy', (req, res) => {
  const { url: targetUrl } = req.query;
  if (!targetUrl) return res.status(400).end();

  let target;
  try { target = new URL(targetUrl); } catch { return res.status(400).end(); }
  const lib = target.protocol === 'https:' ? httpsRequest : httpRequest;
  const forwardHeaders = {};
  if (req.headers['range']) forwardHeaders['range'] = req.headers['range'];
  const proxyReq = lib(target.href, { timeout: 8000, headers: forwardHeaders }, (proxyRes) => {
    const contentType = (proxyRes.headers['content-type'] || '').toLowerCase();
    const isM3u8 = contentType.includes('mpegurl') || target.pathname.endsWith('.m3u8');

    if (isM3u8) {
      // Buffer and rewrite segment URLs so they go through this proxy
      let body = '';
      proxyRes.setEncoding('utf8');
      proxyRes.on('data', (chunk) => { body += chunk; });
      proxyRes.on('end', () => {
        const rewritten = body.split('\n').map((line) => {
          const t = line.trim();
          if (!t || t.startsWith('#')) return line;
          try {
            const abs = new URL(t, target.href).href;
            return `/api/go2rtc-proxy?url=${encodeURIComponent(abs)}`;
          } catch { return line; }
        }).join('\n');
        res.status(proxyRes.statusCode || 200)
          .setHeader('content-type', 'application/vnd.apple.mpegurl')
          .setHeader('access-control-allow-origin', '*')
          .send(rewritten);
      });
      proxyRes.on('error', () => { try { res.status(502).end(); } catch {} });
    } else {
      res.status(proxyRes.statusCode || 200);
      for (const [k, v] of Object.entries(proxyRes.headers)) {
        if (!['transfer-encoding', 'connection'].includes(k.toLowerCase())) res.setHeader(k, v);
      }
      proxyRes.pipe(res);
    }
  });
  proxyReq.on('error', () => { try { res.status(502).end(); } catch {} });
  proxyReq.end();
});

// Serve static frontend files in production
if (isProduction) {
  const distPath = join(__dirname, '..', 'dist');
  if (existsSync(distPath)) {
    const assetsPath = join(distPath, 'assets');
    const indexHtmlPath = join(distPath, 'index.html');
    const indexHtml = existsSync(indexHtmlPath) ? readFileSync(indexHtmlPath, 'utf8') : null;
    const assetFiles = existsSync(assetsPath) ? readdirSync(assetsPath) : [];
    const hashedAssetFallbackMap = new Map();

    assetFiles.forEach((fileName) => {
      const fileExt = extname(fileName).toLowerCase();
      if (fileExt !== '.js' && fileExt !== '.css') return;

      const baseName = basename(fileName, fileExt);
      const hashSeparatorIndex = baseName.lastIndexOf('-');
      if (hashSeparatorIndex <= 0) return;

      const stem = baseName.slice(0, hashSeparatorIndex);
      const key = `${stem}${fileExt}`;
      hashedAssetFallbackMap.set(key, fileName);
    });

    const setNoCacheHeaders = (res) => {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    };

    const sendSpaIndex = (res) => {
      setNoCacheHeaders(res);
      if (indexHtml !== null) {
        return res.type('html').send(indexHtml);
      }
      return res.status(503).send('Frontend unavailable');
    };

    app.use(
      '/assets',
      express.static(assetsPath, {
        fallthrough: true,
        immutable: true,
        maxAge: '1y',
      })
    );

    app.get('/assets/{*path}', assetFallbackRateLimiter, (req, res, next) => {
      const requested = basename(req.path || '');
      if (!requested) return next();

      const fileExt = extname(requested).toLowerCase();
      if (fileExt !== '.js' && fileExt !== '.css') return next();

      const requestedBase = basename(requested, fileExt);
      const hashSeparatorIndex = requestedBase.lastIndexOf('-');
      if (hashSeparatorIndex <= 0) return next();

      const stem = requestedBase.slice(0, hashSeparatorIndex);
      const fallbackKey = `${stem}${fileExt}`;
      const fallbackFileName = hashedAssetFallbackMap.get(fallbackKey);
      if (!fallbackFileName || fallbackFileName === requested) return next();

      res.setHeader('X-Tunet-Asset-Fallback', fallbackFileName);
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      return res.sendFile(join(assetsPath, fallbackFileName));
    });

    app.use(
      express.static(distPath, {
        index: false,
        setHeaders: (res, filePath) => {
          if (filePath.endsWith('.html')) {
            setNoCacheHeaders(res);
          }
          if (filePath.endsWith('sw.js')) {
            setNoCacheHeaders(res);
            res.setHeader('Service-Worker-Allowed', '/');
          }
        },
      })
    );

    app.get('/index.html', (_req, res) => {
      sendSpaIndex(res);
    });

    // SPA fallback — serve index.html for all non-API routes
    app.get('{*path}', (req, res) => {
      if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'Not found' });
      }
      if (req.path.includes('.')) {
        return res.status(404).end();
      }
      sendSpaIndex(res);
    });
  } else {
    console.warn('[server] dist/ folder not found. Only API routes will be available.');
  }
}

// WebSocket proxy for go2rtc — lets browser connect via WSS through Tunet's HTTPS server
const httpServer = createServer(app);
const wss = new WebSocketServer({ noServer: true });

wss.on('connection', (clientWs, _req, { base, src }) => {
  const wsBase = base.replace(/^http:\/\//, 'ws://').replace(/^https:\/\//, 'wss://').replace(/\/$/, '');
  const targetUrl = `${wsBase}/api/ws?src=${encodeURIComponent(src)}`;
  const targetWs = new WebSocket(targetUrl);
  targetWs.binaryType = 'arraybuffer';

  // Abort if go2rtc doesn't connect within 5 s — prevents infinite spinner in the popup
  const connectTimer = setTimeout(() => {
    if (targetWs.readyState === WebSocket.CONNECTING) targetWs.terminate();
  }, 5000);
  const pendingToTarget = [];
  targetWs.on('open', () => {
    clearTimeout(connectTimer);
    for (const { data, isBinary } of pendingToTarget) {
      try { targetWs.send(data, { binary: isBinary }); } catch {}
    }
    pendingToTarget.length = 0;
  });

  targetWs.on('message', (data, isBinary) => {
    if (clientWs.readyState === WebSocket.OPEN) clientWs.send(data, { binary: isBinary });
  });
  targetWs.on('close', () => { clearTimeout(connectTimer); try { clientWs.close(); } catch {} });
  // Use 1011 (internal error) so the browser knows it's not a normal close and can show the error/snapshot fallback
  targetWs.on('error', () => { clearTimeout(connectTimer); try { clientWs.close(1011, 'upstream error'); } catch {} });

  clientWs.on('message', (data, isBinary) => {
    if (targetWs.readyState === WebSocket.OPEN) targetWs.send(data, { binary: isBinary });
    else if (targetWs.readyState === WebSocket.CONNECTING) pendingToTarget.push({ data, isBinary });
  });
  clientWs.on('close', () => { try { targetWs.close(); } catch {} });
  clientWs.on('error', () => { try { targetWs.close(); } catch {} });
});

httpServer.on('upgrade', (req, socket, head) => {
  const ingressPath = req.headers['x-ingress-path'];
  let url = req.url;
  if (ingressPath && url.startsWith(ingressPath)) url = url.slice(ingressPath.length) || '/';

  if (!url.startsWith('/api/go2rtc-ws')) { socket.destroy(); return; }

  let params;
  try { params = new URL(url, 'http://localhost').searchParams; } catch { socket.destroy(); return; }
  const base = params.get('base');
  const src = params.get('src');
  if (!base || !src) { socket.destroy(); return; }

  wss.handleUpgrade(req, socket, head, (ws) => {
    wss.emit('connection', ws, req, { base, src });
  });
});

// Shared mode: migrate existing user data to __shared__ once on startup
if (process.env.HA_URL && process.env.HA_TOKEN) {
  try {
    const SHARED = '__shared__';

    const hasSharedProfiles = db.prepare('SELECT 1 FROM profiles WHERE ha_user_id = ? LIMIT 1').get(SHARED);
    if (!hasSharedProfiles) {
      const sourceUserId = db.prepare(
        "SELECT ha_user_id FROM profiles WHERE ha_user_id != ? ORDER BY updated_at DESC LIMIT 1"
      ).get(SHARED)?.ha_user_id;
      if (sourceUserId) {
        const rows = db.prepare('SELECT * FROM profiles WHERE ha_user_id = ?').all(sourceUserId);
        const stmt = db.prepare(
          'INSERT OR IGNORE INTO profiles (id, ha_user_id, name, device_label, data, data_enc, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
        );
        for (const p of rows) stmt.run(p.id, SHARED, p.name, p.device_label, p.data, p.data_enc, p.created_at, p.updated_at);
        console.log(`[server] Migrated ${rows.length} profile(s) from ${sourceUserId} to __shared__`);
      }
    }

    const hasSharedSettings = db.prepare('SELECT 1 FROM current_settings WHERE ha_user_id = ? LIMIT 1').get(SHARED);
    if (!hasSharedSettings) {
      const sourceUserId = db.prepare(
        "SELECT ha_user_id FROM current_settings WHERE ha_user_id != ? ORDER BY updated_at DESC LIMIT 1"
      ).get(SHARED)?.ha_user_id;
      if (sourceUserId) {
        const rows = db.prepare('SELECT * FROM current_settings WHERE ha_user_id = ?').all(sourceUserId);
        const settingsStmt = db.prepare(
          'INSERT OR IGNORE INTO current_settings (ha_user_id, device_id, data, data_enc, revision, updated_at, device_label) VALUES (?, ?, ?, ?, ?, ?, ?)'
        );
        const histStmt = db.prepare(
          'INSERT OR IGNORE INTO current_settings_history (ha_user_id, device_id, revision, data, data_enc, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
        );
        for (const s of rows) {
          settingsStmt.run(SHARED, s.device_id, s.data, s.data_enc, s.revision, s.updated_at, s.device_label || null);
          const hist = db.prepare('SELECT * FROM current_settings_history WHERE ha_user_id = ? AND device_id = ?').all(sourceUserId, s.device_id);
          for (const h of hist) histStmt.run(SHARED, h.device_id, h.revision, h.data, h.data_enc, h.updated_at);
        }
        console.log(`[server] Migrated ${rows.length} device setting(s) from ${sourceUserId} to __shared__`);
      }
    }
  } catch (err) {
    console.error('[server] Shared mode migration failed:', err);
  }
}

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(
    `[server] Tunet backend running on port ${PORT} (${isProduction ? 'production' : 'development'})`
  );
});

export default app;
