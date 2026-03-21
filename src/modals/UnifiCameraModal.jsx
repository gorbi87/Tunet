import { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import { X, RefreshCw, Video, Camera } from '../icons';
import { getIconComponent } from '../icons';
import AccessibleModalShell from '../components/ui/AccessibleModalShell';

// Proxy helpers — route go2rtc traffic through Tunet's own server to avoid mixed-content blocking
function makeHttpProxyUrl(targetUrl) {
  return `./api/go2rtc-proxy?url=${encodeURIComponent(targetUrl)}`;
}

function makeWsProxyUrl(base, src) {
  const url = new URL('./api/go2rtc-ws', document.baseURI);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  url.searchParams.set('base', base);
  url.searchParams.set('src', src);
  return url.toString();
}

export default function UnifiCameraModal({
  show,
  onClose,
  customName,
  customIcon,
  go2rtcUrl,
  go2rtcStream,
  t,
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [viewMode, setViewMode] = useState('stream');
  const [snapshotTs, setSnapshotTs] = useState(Date.now());

  const videoRef = useRef(null);
  const wsRef = useRef(null);
  const hlsRef = useRef(null);
  const msRef = useRef(null);
  const sbRef = useRef(null);
  const queueRef = useRef([]);
  const cancelledRef = useRef(false);

  const modalTitleId = 'unifi-camera-modal';

  const name = customName || go2rtcStream || 'UniFi Kamera';
  const iconName = customIcon;
  const Icon = iconName ? getIconComponent(iconName) || Camera : Camera;

  const snapshotUrl = go2rtcUrl && go2rtcStream
    ? makeHttpProxyUrl(`${go2rtcUrl}/api/frame.jpeg?src=${encodeURIComponent(go2rtcStream)}&_ts=${snapshotTs}`)
    : null;

  const stopAll = useCallback(() => {
    cancelledRef.current = true;
    if (wsRef.current) {
      try { wsRef.current.close(1000); } catch {}
      wsRef.current = null;
    }
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    const video = videoRef.current;
    if (video) {
      video.pause();
      video.src = '';
    }
    if (msRef.current && msRef.current.readyState === 'open') {
      try { msRef.current.endOfStream(); } catch {}
    }
    msRef.current = null;
    sbRef.current = null;
    queueRef.current = [];
  }, []);

  const tryHLS = useCallback((baseUrl, streamName) => {
    const video = videoRef.current;
    if (!video || cancelledRef.current) return;

    const hlsUrl = makeHttpProxyUrl(`${baseUrl}/api/stream.m3u8?src=${encodeURIComponent(streamName)}`);

    if (Hls.isSupported()) {
      const hls = new Hls({ enableWorker: false, lowLatencyMode: true });
      hlsRef.current = hls;
      hls.loadSource(hlsUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (cancelledRef.current) return;
        setLoading(false);
        video.play().catch(() => {});
      });
      hls.on(Hls.Events.ERROR, (_e, data) => {
        if (cancelledRef.current) return;
        if (data.fatal) { setError(true); setLoading(false); hls.destroy(); }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = hlsUrl;
      video.addEventListener('canplay', () => {
        if (!cancelledRef.current) setLoading(false);
      }, { once: true });
      video.play().catch(() => {});
    } else {
      setError(true);
      setLoading(false);
    }
  }, []);

  const startStream = useCallback(() => {
    if (!go2rtcUrl || !go2rtcStream) {
      setError(true);
      setLoading(false);
      return;
    }

    stopAll();
    cancelledRef.current = false;
    setLoading(true);
    setError(false);

    const video = videoRef.current;
    if (!video) return;

    // Try MSE over WebSocket first
    if (!window.MediaSource) {
      tryHLS(go2rtcUrl, go2rtcStream);
      return;
    }

    const ms = new MediaSource();
    msRef.current = ms;
    const objectUrl = URL.createObjectURL(ms);
    video.src = objectUrl;

    let firstData = true;

    ms.addEventListener('sourceopen', () => {
      if (cancelledRef.current) { URL.revokeObjectURL(objectUrl); return; }

      const ws = new WebSocket(makeWsProxyUrl(go2rtcUrl, go2rtcStream));
      wsRef.current = ws;
      ws.binaryType = 'arraybuffer';

      ws.onopen = () => {
        if (!cancelledRef.current) {
          ws.send(JSON.stringify({ type: 'mse', value: 'video/mp4; codecs="avc1.640029,mp4a.40.2"' }));
        }
      };

      const flushQueue = () => {
        const sb = sbRef.current;
        if (!sb || sb.updating || queueRef.current.length === 0) return;
        try { sb.appendBuffer(queueRef.current.shift()); } catch {}
      };

      ws.onmessage = (e) => {
        if (cancelledRef.current) return;
        if (typeof e.data === 'string') {
          try {
            const msg = JSON.parse(e.data);
            if (msg.type === 'mse' && ms.readyState === 'open') {
              const sb = ms.addSourceBuffer(msg.value);
              sb.mode = 'segments';
              sbRef.current = sb;
              sb.addEventListener('updateend', flushQueue);
            }
          } catch {}
        } else {
          const sb = sbRef.current;
          if (!sb) return;
          if (!sb.updating) {
            try {
              sb.appendBuffer(e.data);
              if (firstData) {
                firstData = false;
                setLoading(false);
                video.play().catch(() => {});
              }
            } catch {}
          } else {
            queueRef.current.push(e.data);
          }
        }
      };

      ws.onerror = () => {
        if (cancelledRef.current) return;
        URL.revokeObjectURL(objectUrl);
        msRef.current = null;
        sbRef.current = null;
        queueRef.current = [];
        tryHLS(go2rtcUrl, go2rtcStream);
      };

      ws.onclose = (e) => {
        if (cancelledRef.current || e.code === 1000) return;
        setError(true);
        setLoading(false);
      };
    }, { once: true });

    ms.addEventListener('error', () => {
      if (cancelledRef.current) return;
      URL.revokeObjectURL(objectUrl);
      tryHLS(go2rtcUrl, go2rtcStream);
    }, { once: true });
  }, [go2rtcUrl, go2rtcStream, stopAll, tryHLS]);

  // Start/stop stream
  useEffect(() => {
    if (!show || viewMode !== 'stream') {
      if (!show) stopAll();
      return;
    }
    startStream();
    return stopAll;
  }, [show, viewMode, startStream, stopAll]);

  // Reset on close
  useEffect(() => {
    if (!show) {
      setLoading(true);
      setError(false);
      setViewMode('stream');
    }
  }, [show]);

  const handleRefresh = () => {
    setSnapshotTs(Date.now());
    if (viewMode === 'stream') startStream();
  };

  if (!show) return null;

  const isCompact = window.innerWidth < 640 ||
    window.matchMedia('(hover: none) and (pointer: coarse)').matches;

  const notConfigured = !go2rtcUrl || !go2rtcStream;

  return (
    <AccessibleModalShell
      open={show}
      onClose={onClose}
      titleId={modalTitleId}
      overlayClassName="fixed inset-0 z-[130] flex items-center justify-center p-3 sm:p-5"
      overlayStyle={{ backdropFilter: 'blur(20px)', backgroundColor: 'rgba(0,0,0,0.5)' }}
      panelClassName={`popup-anim relative flex max-h-[92vh] w-full flex-col rounded-2xl border font-sans shadow-2xl backdrop-blur-xl sm:rounded-3xl ${isCompact ? 'max-w-2xl p-3' : 'max-w-5xl p-4 sm:p-6'}`}
      panelStyle={{
        background: 'linear-gradient(135deg, var(--card-bg) 0%, var(--modal-bg) 100%)',
        borderColor: 'var(--glass-border)',
        color: 'var(--text-primary)',
      }}
    >
      {() => (
        <>
          <button
            onClick={onClose}
            className="modal-close absolute top-3 right-3 z-10 sm:top-4 sm:right-4"
            aria-label={t?.('common.close') || 'Schließen'}
          >
            <X className="h-4 w-4" />
          </button>

          {/* Header */}
          <div className="mb-3 flex items-center justify-between gap-3 pr-10">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)]">
                <Icon className="h-4 w-4 text-[var(--text-primary)]" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-[10px] font-bold tracking-widest text-[var(--text-secondary)] uppercase">
                  {go2rtcStream || 'go2rtc'}
                </p>
                <h3 id={modalTitleId} className="truncate text-base font-bold text-[var(--text-primary)] sm:text-lg">
                  {name}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('stream')}
                className={`rounded-xl border px-3 py-1.5 text-[11px] font-bold tracking-widest uppercase transition-colors ${viewMode === 'stream' ? 'border-[var(--accent-color)] bg-[var(--accent-bg)] text-[var(--accent-color)]' : 'border-[var(--glass-border)] bg-[var(--glass-bg)] text-[var(--text-secondary)]'}`}
              >
                <span className="inline-flex items-center gap-1">
                  <Video className="h-3 w-3" /> Stream
                </span>
              </button>
              <button
                onClick={() => { setViewMode('snapshot'); setSnapshotTs(Date.now()); }}
                className={`rounded-xl border px-3 py-1.5 text-[11px] font-bold tracking-widest uppercase transition-colors ${viewMode === 'snapshot' ? 'border-[var(--accent-color)] bg-[var(--accent-bg)] text-[var(--accent-color)]' : 'border-[var(--glass-border)] bg-[var(--glass-bg)] text-[var(--text-secondary)]'}`}
              >
                <span className="inline-flex items-center gap-1">
                  <Camera className="h-3 w-3" /> Snapshot
                </span>
              </button>
              <button
                onClick={handleRefresh}
                className="rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] p-1.5 text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
                title="Aktualisieren"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Video area */}
          <div className="relative min-h-[240px] flex-1 overflow-hidden rounded-xl border border-[var(--glass-border)] bg-black">

            {/* go2rtc not configured */}
            {notConfigured && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center">
                <p className="text-sm font-bold text-amber-400">go2rtc nicht konfiguriert</p>
                <p className="text-xs text-[var(--text-secondary)]">
                  Bitte go2rtc-URL und Stream-Namen in den Karten-Einstellungen eintragen (Stift-Icon im Bearbeitungsmodus).
                </p>
              </div>
            )}

            {/* Stream video — hidden when error+snapshot fallback is active */}
            {!notConfigured && viewMode === 'stream' && !(error && snapshotUrl) && (
              <video
                ref={videoRef}
                className="absolute inset-0 h-full w-full object-contain"
                autoPlay
                playsInline
                muted
                controls={!isCompact}
              />
            )}

            {/* Snapshot */}
            {!notConfigured && viewMode === 'snapshot' && snapshotUrl && (
              <img
                src={snapshotUrl}
                alt={name}
                className="h-full w-full object-contain"
                referrerPolicy="no-referrer"
              />
            )}

            {/* Loading overlay */}
            {!notConfigured && viewMode === 'stream' && loading && !error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/70">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--accent-color)] border-t-transparent" />
                <p className="text-xs text-[var(--text-secondary)]">Stream wird geladen…</p>
              </div>
            )}

            {/* Error: stream failed, show snapshot instead */}
            {!notConfigured && viewMode === 'stream' && error && snapshotUrl && (
              <>
                <img
                  src={snapshotUrl}
                  alt={name}
                  className="h-full w-full object-contain"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-x-0 bottom-0 border-t border-amber-500/30 bg-amber-500/10 px-4 py-2 text-center text-xs text-amber-300">
                  Stream nicht verfügbar — Snapshot wird angezeigt
                </div>
              </>
            )}

            {/* Error without snapshot */}
            {!notConfigured && viewMode === 'stream' && error && !snapshotUrl && (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-xs text-amber-400">Stream nicht verfügbar</p>
              </div>
            )}
          </div>
        </>
      )}
    </AccessibleModalShell>
  );
}
