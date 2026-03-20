import { memo, useState } from 'react';
import { Camera, AlertCircle } from '../../icons';
import { getIconComponent } from '../../icons';
import { getSettings } from '../helpers';

const UnifiCameraCard = memo(function UnifiCameraCard({
  cardId,
  dragProps,
  controls,
  cardStyle,
  editMode,
  customNames,
  customIcons,
  settings,
  onOpen,
  onEdit,
  t,
}) {
  const [imgError, setImgError] = useState(false);

  // Auto-derive stream name from old cameraId (e.g. camera.terasse → terasse)
  const go2rtcStream = settings.go2rtcStream ||
    (settings.cameraId ? settings.cameraId.replace(/^camera\./, '') : '');
  const go2rtcUrl = (settings.go2rtcUrl || '').replace(/\/$/, '');
  const hasConfig = !!go2rtcUrl && !!go2rtcStream;

  const name = customNames?.[cardId] || go2rtcStream || 'UniFi Kamera';
  const iconName = customIcons?.[cardId];
  const Icon = iconName ? getIconComponent(iconName) || Camera : Camera;
  const isSmall = settings.size === 'small';
  const snapshotUrl = hasConfig
    ? `${go2rtcUrl}/api/snapshot?src=${encodeURIComponent(go2rtcStream)}`
    : null;

  const showSnapshot = hasConfig && snapshotUrl && !imgError;

  if (isSmall) {
    return (
      <div
        {...dragProps}
        data-haptic={editMode ? undefined : 'card'}
        className="glass-texture touch-feedback group relative flex h-full items-center gap-4 overflow-hidden rounded-3xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4 pl-5 font-sans backdrop-blur-xl transition-all duration-300"
        style={cardStyle}
        onClick={(e) => { e.stopPropagation(); if (!editMode) { if (hasConfig) onOpen?.(); else onEdit?.(); } }}
      >
        {controls}
        <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-2xl bg-[var(--glass-bg)]">
          {showSnapshot ? (
            <img
              src={snapshotUrl}
              alt={name}
              className="h-full w-full object-cover"
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[var(--text-secondary)]">
              <Icon className="h-6 w-6 stroke-[1.5px]" />
            </div>
          )}
        </div>
        <div className="flex min-w-0 flex-col justify-center">
          <p className="mb-1.5 truncate text-xs leading-none font-bold tracking-widest text-[var(--text-secondary)] uppercase opacity-60">
            {hasConfig ? t?.('camera.live') || 'Live' : 'go2rtc'}
          </p>
          <p className="truncate text-sm leading-none font-bold text-[var(--text-primary)]">{name}</p>
        </div>
        <span className={`ml-auto h-2.5 w-2.5 shrink-0 rounded-full ${hasConfig ? 'bg-emerald-400' : 'bg-amber-400'}`} />
      </div>
    );
  }

  return (
    <div
      {...dragProps}
      data-haptic={editMode ? undefined : 'card'}
      className={`glass-texture touch-feedback group relative h-full overflow-hidden rounded-3xl border bg-[var(--card-bg)] transition-all duration-500 ${editMode ? 'cursor-move' : 'cursor-pointer active:scale-[0.98]'}`}
      style={cardStyle}
      onClick={(e) => { e.stopPropagation(); if (!editMode) { if (hasConfig) onOpen?.(); else onEdit?.(); } }}
    >
      {controls}

      {showSnapshot ? (
        <img
          src={snapshotUrl}
          alt={name}
          className="absolute inset-0 h-full w-full object-cover"
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-[var(--glass-bg)]">
          <div className="flex flex-col items-center gap-2 text-[var(--text-secondary)] opacity-70">
            {hasConfig ? (
              <Icon className="h-10 w-10" />
            ) : (
              <>
                <AlertCircle className="h-10 w-10" />
                <p className="text-xs font-bold tracking-widest uppercase">
                  go2rtc-URL eintragen
                </p>
                <p className="text-[10px] opacity-60">Tippen zum Öffnen</p>
              </>
            )}
          </div>
        </div>
      )}

      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.20) 0%, transparent 35%, rgba(0,0,0,0.45) 100%)' }}
      />

      <div className="popup-surface absolute top-3 left-3 flex items-center gap-1.5 rounded-full border border-[var(--glass-border)] px-2.5 py-1 text-[10px] font-bold tracking-widest text-[var(--text-primary)] uppercase">
        <span className={`h-2 w-2 rounded-full ${hasConfig ? 'bg-emerald-400' : 'bg-amber-400'}`} />
        {hasConfig ? t?.('camera.live') || 'Live' : 'go2rtc'}
      </div>

      <div className="absolute right-3 bottom-3 left-3 flex items-end justify-between gap-3">
        <div className="popup-surface max-w-[75%] min-w-0 rounded-xl border border-[var(--glass-border)] px-3 py-2">
          <p className="truncate text-xs font-bold tracking-wide text-[var(--text-primary)] uppercase">{name}</p>
        </div>
        <div className="popup-surface shrink-0 rounded-xl border border-[var(--glass-border)] p-2 text-[var(--text-primary)]">
          <Icon className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
        </div>
      </div>
    </div>
  );
});

export function renderUnifiCameraCard(cardId, dragProps, getControls, cardStyle, settingsKey, ctx) {
  const {
    editMode,
    cardSettings,
    customNames,
    customIcons,
    setShowUnifiCameraModal,
    setShowEditCardModal,
    setEditCardSettingsKey,
    t,
  } = ctx;
  const settings = getSettings(cardSettings, settingsKey, cardId);

  return (
    <UnifiCameraCard
      key={cardId}
      cardId={cardId}
      dragProps={dragProps}
      controls={getControls(cardId)}
      cardStyle={cardStyle}
      editMode={editMode}
      customNames={customNames}
      customIcons={customIcons}
      settings={settings}
      onOpen={() => setShowUnifiCameraModal && setShowUnifiCameraModal(cardId)}
      onEdit={() => {
        if (setShowEditCardModal && setEditCardSettingsKey) {
          setEditCardSettingsKey(settingsKey);
          setShowEditCardModal(cardId);
        }
      }}
      t={t}
    />
  );
}
