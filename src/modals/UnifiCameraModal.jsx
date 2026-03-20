import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { X, RefreshCw, Video, Camera } from '../icons';
import { getIconComponent } from '../icons';
import AccessibleModalShell from '../components/ui/AccessibleModalShell';

export default function UnifiCameraModal({
  show,
  onClose,
  entityId,
  entity,
  customName,
  customIcon,
  conn,
  getEntityImageUrl,
  t,
}) {
  const [hlsUrl, setHlsUrl] = useState(null);
  const [hlsError, setHlsError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('stream'); // 'stream' | 'snapshot'
  const [snapshotTs, setSnapshotTs] = useState(Date.now());
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const modalTitleId = `unifi-camera-modal-${(entityId || 'camera').replace(/[^a-zA-Z0-9_-]/g, '-')}`;

  const attrs = entity?.attributes || {};
  const name = customName || attrs.friendly_name || entityId || '';
  const iconName = customIcon || attrs.icon;
  const Icon = iconName ? getIconComponent(iconName) || Camera : Camera;

  const accessToken = attrs.access_token || '';
  const snapshotBase = entityId
    ? `${getEntityImageUrl(`/api/camera_proxy/${entityId}${accessToken ? `?token=${encodeURIComponent(accessToken)}` : ''}`)}` +
      (accessToken ? `&_ts=${snapshotTs}` : `?_ts=${snapshotTs}`)
    : null;

  // Fetch HLS stream URL via WebSocket
  useEffect(() => {
    if (!show || !entityId || !conn || viewMode !== 'stream') return;
    let cancelled = false;
    setLoading(true);
    setHlsError(false);
    setHlsUrl(null);

    conn
      .sendMessagePromise({ type: 'camera/stream', entity_id: entityId })
      .then((res) => {
        if (cancelled) return;
        const url = res?.url;
        if (!url) { setHlsError(true); setLoading(false); return; }
        setHlsUrl(getEntityImageUrl(url));
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) { setHlsError(true); setLoading(false); }
      });

    return () => { cancelled = true; };
  }, [show, entityId, conn, viewMode, getEntityImageUrl]);

  // Attach Hls.js (or native) once URL is ready
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !hlsUrl || viewMode !== 'stream') return;

    // Destroy previous instance
    if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }

    if (Hls.isSupported()) {
      const hls = new Hls({ enableWorker: false, lowLatencyMode: true });
      hlsRef.current = hls;
      hls.loadSource(hlsUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => video.play().catch(() => {}));
      hls.on(Hls.Events.ERROR, (_e, data) => {
        if (data.fatal) { setHlsError(true); hls.destroy(); }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari — native HLS
      video.src = hlsUrl;
      video.play().catch(() => {});
    } else {
      setHlsError(true);
    }

    return () => {
      if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
      if (video) { video.pause(); video.src = ''; }
    };
  }, [hlsUrl, viewMode]);

  // Cleanup on close
  useEffect(() => {
    if (!show) {
      if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
      const video = videoRef.current;
      if (video) { video.pause(); video.src = ''; }
      setHlsUrl(null);
      setHlsError(false);
      setLoading(true);
      setViewMode('stream');
    }
  }, [show]);

  const handleRefresh = () => {
    setSnapshotTs(Date.now());
    if (viewMode === 'stream') {
      setHlsUrl(null);
      setHlsError(false);
      setLoading(true);
      // Re-trigger the fetch effect by toggling a key — easiest: reset hlsUrl
      if (conn) {
        conn
          .sendMessagePromise({ type: 'camera/stream', entity_id: entityId })
          .then((res) => {
            const url = res?.url;
            if (url) { setHlsUrl(getEntityImageUrl(url)); setLoading(false); }
            else { setHlsError(true); setLoading(false); }
          })
          .catch(() => { setHlsError(true); setLoading(false); });
      }
    }
  };

  if (!show || !entityId || !entity) return null;

  const isCompact = window.innerHeight < 900 ||
    window.matchMedia('(hover: none) and (pointer: coarse)').matches;

  return (
    <AccessibleModalShell
      open={show && !!entityId && !!entity}
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
                  {entityId}
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

            {/* HLS stream */}
            {viewMode === 'stream' && !hlsError && (
              <video
                ref={videoRef}
                className="h-full w-full object-contain"
                autoPlay
                playsInline
                muted
                controls={!isCompact}
              />
            )}

            {/* Snapshot fallback */}
            {(viewMode === 'snapshot' || hlsError) && snapshotBase && (
              <img
                src={snapshotBase}
                alt={name}
                className="h-full w-full object-contain"
                referrerPolicy="no-referrer"
              />
            )}

            {/* Loading overlay */}
            {viewMode === 'stream' && loading && !hlsError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/70">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--accent-color)] border-t-transparent" />
                <p className="text-xs text-[var(--text-secondary)]">Stream wird geladen…</p>
              </div>
            )}

            {/* Error banner */}
            {viewMode === 'stream' && hlsError && (
              <div className="absolute inset-x-0 bottom-0 border-t border-amber-500/30 bg-amber-500/10 px-4 py-2 text-center text-xs text-amber-300">
                Stream nicht verfügbar — Snapshot wird angezeigt
              </div>
            )}
          </div>
        </>
      )}
    </AccessibleModalShell>
  );
}
