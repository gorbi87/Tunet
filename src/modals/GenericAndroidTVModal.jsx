import { useEffect, useState } from 'react';
import {
  X,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  SkipBack,
  Play,
  Pause,
  SkipForward,
  Home,
  Settings,
  Gamepad2,
  Tv,
  Power,
  Volume2,
} from '../icons';
import AccessibleModalShell from '../components/ui/AccessibleModalShell';

export default function GenericAndroidTVModal({
  show,
  onClose,
  entities,
  mediaPlayerId,
  remoteId,
  linkedMediaPlayers,
  callService,
  getA,
  getEntityImageUrl,
  customNames,
  t,
}) {
  const [pictureFailed, setPictureFailed] = useState(false);
  const modalTitleId = `android-tv-modal-title-${(mediaPlayerId || 'media').replace(/[^a-zA-Z0-9_-]/g, '-')}`;

  const entity = entities[mediaPlayerId];

  // Determine priority entity for metadata
  let displayEntityId = mediaPlayerId;
  let linkedActive = false;

  if (linkedMediaPlayers && Array.isArray(linkedMediaPlayers)) {
    for (const linkedId of linkedMediaPlayers) {
      const linkedState = entities[linkedId]?.state;
      if (linkedState === 'playing' || linkedState === 'paused' || linkedState === 'buffering') {
        displayEntityId = linkedId;
        linkedActive = true;
        break;
      }
    }
  }
  const displayEntity = entities[displayEntityId];

  const state = entity?.state;
  const isOn = state !== 'off' && state !== 'unavailable' && state !== 'unknown';

  const displayState = displayEntity?.state;
  const isPlaying = displayState === 'playing';
  const isPaused = displayState === 'paused';

  let appName = getA(displayEntityId, 'app_name');
  let title = getA(displayEntityId, 'media_title');

  if (linkedActive) {
    const seriesTitle = getA(displayEntityId, 'media_series_title');
    if (seriesTitle) {
      // title already holds episode title from media_title
      appName = seriesTitle; // Series Name
    } else {
      // title already holds movie title from media_title
      if (!appName) {
        appName =
          displayEntityId !== mediaPlayerId
            ? customNames[displayEntityId] || displayEntity?.attributes?.friendly_name
            : null;
      }
    }
  } else {
    appName =
      appName ||
      (displayEntityId !== mediaPlayerId
        ? customNames[displayEntityId] || displayEntity?.attributes?.friendly_name
        : null);
  }

  const picture = getEntityImageUrl(displayEntity?.attributes?.entity_picture);
  useEffect(() => {
    setPictureFailed(false);
  }, [picture]);

  if (!show) return null;

  if (!entity) return null;

  const deviceName =
    customNames[mediaPlayerId] || entity?.attributes?.friendly_name || 'Android TV';

  // Status Logic
  const statusColor = isPlaying
    ? '#60a5fa'
    : isPaused
      ? '#fbbf24'
      : isOn
        ? '#a78bfa'
        : 'var(--text-secondary)';
  const statusBg = isPlaying
    ? 'rgba(59, 130, 246, 0.1)'
    : isPaused
      ? 'rgba(251, 191, 36, 0.1)'
      : isOn
        ? 'rgba(167, 139, 250, 0.1)'
        : 'var(--glass-bg)';

  const sendCommand = (command) => {
    if (remoteId) {
      callService('remote', 'send_command', { entity_id: remoteId, command });
    }
  };

  const controlMedia = (action) => {
    const targetId =
      action.includes('media') && displayEntityId !== mediaPlayerId
        ? displayEntityId
        : mediaPlayerId;
    callService('media_player', action, { entity_id: targetId });
  };

  return (
    <AccessibleModalShell
      open={show && !!entity}
      onClose={onClose}
      titleId={modalTitleId}
      overlayClassName="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 md:p-6"
      overlayStyle={{ backdropFilter: 'blur(20px)', backgroundColor: 'rgba(0,0,0,0.3)' }}
      panelClassName="popup-anim relative max-h-[calc(100dvh-1rem)] w-full max-w-5xl overflow-y-auto rounded-3xl border p-4 shadow-2xl backdrop-blur-xl sm:max-h-[80vh] sm:p-6 md:rounded-[3rem] md:p-12"
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
            className="modal-close absolute top-4 right-4 z-20 sm:top-6 sm:right-6 md:top-10 md:right-10"
            aria-label={t('common.close')}
          >
            <X className="h-4 w-4" />
          </button>

          {/* Header */}
          <div className="mb-4 flex items-center gap-3 pr-12 font-sans sm:mb-6 sm:gap-4">
            <div
              className="rounded-2xl p-3 transition-all duration-500 sm:p-4"
              style={{ backgroundColor: statusBg, color: statusColor }}
            >
              {isOn ? (
                <Gamepad2 className="h-6 w-6 sm:h-8 sm:w-8" />
              ) : (
                <Tv className="h-6 w-6 sm:h-8 sm:w-8" />
              )}
            </div>
            <div>
              <h3
                id={modalTitleId}
                className="text-xl leading-none font-light tracking-tight text-[var(--text-primary)] uppercase italic sm:text-2xl"
              >
                {deviceName}
              </h3>
              {!linkedActive && (
                <div
                  className="mt-2 inline-block rounded-full px-3 py-1 transition-all duration-500"
                  style={{ backgroundColor: statusBg, color: statusColor }}
                >
                  <p className="text-[10px] font-bold tracking-widest uppercase italic">
                    {t('status.statusLabel')}: {state}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 items-start gap-3 font-sans sm:gap-6 lg:grid-cols-5">
            {/* Left Column (Span 3) - Media Info & Controls */}
            <div className="space-y-3 sm:space-y-6 lg:col-span-3">
              <div className="popup-surface flex flex-col gap-2 rounded-2xl p-3 sm:gap-4 sm:p-4">
                {/* Album Art / Info Area */}
                <div className="group relative h-36 w-full overflow-hidden rounded-xl bg-black/20 sm:aspect-video sm:h-auto">
                  {picture && !pictureFailed ? (
                    <>
                      <img
                        src={picture}
                        alt={title}
                        className="h-full w-full object-cover opacity-80 transition-opacity duration-500 group-hover:opacity-60"
                        onError={() => setPictureFailed(true)}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                      <div className="absolute right-3 bottom-3 left-3 sm:right-6 sm:bottom-6 sm:left-6">
                        <p className="mb-1 text-xs font-bold tracking-widest text-[var(--accent-color)] uppercase">
                          {appName || t('media.homeScreen')}
                        </p>
                        <h2 className="line-clamp-2 text-lg leading-tight font-bold text-white sm:text-2xl">
                          {title || t('media.noneMedia')}
                        </h2>
                      </div>
                    </>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-[var(--text-muted)]">
                      <Tv className="mb-2 h-10 w-10 opacity-20 sm:mb-4 sm:h-16 sm:w-16" />
                      <span className="text-xs font-bold tracking-widest uppercase opacity-50">
                        {t('media.noneMedia')}
                      </span>
                    </div>
                  )}
                </div>

                {/* Playback Controls */}
                <div className="flex items-center justify-center gap-3 sm:gap-4">
                  <button
                    onClick={() => controlMedia('media_previous_track')}
                    className="rounded-full bg-[var(--glass-bg)] p-2.5 text-[var(--text-secondary)] transition-all hover:bg-[var(--glass-bg-hover)] hover:text-[var(--text-primary)] active:scale-95 sm:p-3"
                    aria-label="Previous track"
                  >
                    <SkipBack className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => controlMedia('media_play_pause')}
                    className="rounded-full bg-[var(--accent-color)] p-3.5 font-bold text-white shadow-lg transition-all hover:bg-[var(--accent-color)] active:scale-95 sm:p-5"
                    aria-label={isPlaying ? 'Pause' : 'Play'}
                  >
                    {isPlaying ? (
                      <Pause className="h-6 w-6 fill-current" />
                    ) : (
                      <Play className="ml-1 h-6 w-6 fill-current" />
                    )}
                  </button>
                  <button
                    onClick={() => controlMedia('media_next_track')}
                    className="rounded-full bg-[var(--glass-bg)] p-2.5 text-[var(--text-secondary)] transition-all hover:bg-[var(--glass-bg-hover)] hover:text-[var(--text-primary)] active:scale-95 sm:p-3"
                    aria-label="Next track"
                  >
                    <SkipForward className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column (Span 2) - Remote + Volume & Power */}
            {remoteId && (
              <div className="popup-surface flex flex-col items-center gap-3 rounded-2xl p-3 sm:gap-6 sm:p-4 lg:col-span-2">
                {/* D-Pad */}
                <div className="relative h-32 w-32 sm:h-44 sm:w-44">
                  {/* Up */}
                  <button
                    onClick={() => sendCommand('DPAD_UP')}
                    className="absolute top-0 left-1/2 flex h-11 w-11 -translate-x-1/2 items-center justify-center rounded-2xl bg-[var(--glass-bg)] text-[var(--text-secondary)] transition-all hover:bg-[var(--glass-bg-hover)] hover:text-[var(--text-primary)] active:scale-90 sm:h-14 sm:w-14"
                    aria-label="Up"
                  >
                    <ChevronUp className="h-5 w-5" />
                  </button>
                  {/* Left */}
                  <button
                    onClick={() => sendCommand('DPAD_LEFT')}
                    className="absolute top-1/2 left-0 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-2xl bg-[var(--glass-bg)] text-[var(--text-secondary)] transition-all hover:bg-[var(--glass-bg-hover)] hover:text-[var(--text-primary)] active:scale-90 sm:h-14 sm:w-14"
                    aria-label="Left"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  {/* Right */}
                  <button
                    onClick={() => sendCommand('DPAD_RIGHT')}
                    className="absolute top-1/2 right-0 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-2xl bg-[var(--glass-bg)] text-[var(--text-secondary)] transition-all hover:bg-[var(--glass-bg-hover)] hover:text-[var(--text-primary)] active:scale-90 sm:h-14 sm:w-14"
                    aria-label="Right"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                  {/* Down */}
                  <button
                    onClick={() => sendCommand('DPAD_DOWN')}
                    className="absolute bottom-0 left-1/2 flex h-11 w-11 -translate-x-1/2 items-center justify-center rounded-2xl bg-[var(--glass-bg)] text-[var(--text-secondary)] transition-all hover:bg-[var(--glass-bg-hover)] hover:text-[var(--text-primary)] active:scale-90 sm:h-14 sm:w-14"
                    aria-label="Down"
                  >
                    <ChevronDown className="h-5 w-5" />
                  </button>
                  {/* Center */}
                  <button
                    onClick={() => sendCommand('DPAD_CENTER')}
                    className="absolute top-1/2 left-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[var(--accent-color)] text-[10px] font-bold text-white shadow-lg transition-all hover:bg-[var(--accent-color)] active:scale-90 sm:h-12 sm:w-12"
                    aria-label="Select"
                  >
                    OK
                  </button>
                </div>

                {/* Nav Buttons */}
                <div className="grid w-full grid-cols-3 gap-2 sm:gap-4">
                  <button
                    onClick={() => sendCommand('BACK')}
                    className="group flex flex-col items-center gap-1 rounded-2xl bg-[var(--glass-bg)] p-2 transition-all hover:bg-[var(--glass-bg-hover)] active:scale-95 sm:gap-2 sm:p-3"
                  >
                    <ChevronLeft className="h-5 w-5 text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]" />
                    <span className="text-[10px] font-bold tracking-widest text-[var(--text-muted)] uppercase group-hover:text-[var(--text-secondary)]">
                      {t('shield.back')}
                    </span>
                  </button>
                  <button
                    onClick={() => sendCommand('HOME')}
                    className="group flex flex-col items-center gap-1 rounded-2xl bg-[var(--glass-bg)] p-2 transition-all hover:bg-[var(--glass-bg-hover)] active:scale-95 sm:gap-2 sm:p-3"
                  >
                    <Home className="h-5 w-5 text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]" />
                    <span className="text-[10px] font-bold tracking-widest text-[var(--text-muted)] uppercase group-hover:text-[var(--text-secondary)]">
                      {t('shield.home')}
                    </span>
                  </button>
                  <button
                    onClick={() => sendCommand('MENU')}
                    className="group flex flex-col items-center gap-1 rounded-2xl bg-[var(--glass-bg)] p-2 transition-all hover:bg-[var(--glass-bg-hover)] active:scale-95 sm:gap-2 sm:p-3"
                  >
                    <Settings className="h-5 w-5 text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]" />
                    <span className="text-[10px] font-bold tracking-widest text-[var(--text-muted)] uppercase group-hover:text-[var(--text-secondary)]">
                      Menu
                    </span>
                  </button>
                </div>

                {/* Volume & Power Controls */}
                <div className="flex w-full flex-col gap-3">
                  <div className="flex gap-3">
                    <button
                      onClick={() => controlMedia('volume_down')}
                      className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[var(--glass-bg)] py-2.5 transition-all hover:bg-[var(--glass-bg-hover)] active:scale-95 sm:py-3"
                      aria-label="Volume down"
                    >
                      <Volume2 className="h-4 w-4 opacity-50" />
                      <span className="text-lg font-bold">−</span>
                    </button>
                    <button
                      onClick={() => controlMedia('volume_up')}
                      className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[var(--glass-bg)] py-2.5 transition-all hover:bg-[var(--glass-bg-hover)] active:scale-95 sm:py-3"
                      aria-label="Volume up"
                    >
                      <span className="text-lg font-bold">+</span>
                      <Volume2 className="h-4 w-4 opacity-50" />
                    </button>
                  </div>
                  <button
                    onClick={() => (isOn ? controlMedia('turn_off') : controlMedia('turn_on'))}
                    className={`flex w-full items-center justify-center gap-2 rounded-2xl py-2.5 font-bold transition-all active:scale-95 sm:py-3 ${isOn ? 'bg-[var(--status-error-bg)] text-[var(--status-error-fg)] hover:opacity-90' : 'bg-[var(--status-success-bg)] text-[var(--status-success-fg)] hover:opacity-90'}`}
                  >
                    <Power className="h-5 w-5" />
                    {isOn ? t('shield.turnOff') : t('shield.turnOn')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </AccessibleModalShell>
  );
}
