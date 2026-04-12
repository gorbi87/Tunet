import { memo } from 'react';
import { getIconComponent } from '../../icons';
import { AlertTriangle, Battery, Home, Pause, Play } from '../../icons';
import { Icon as MdiIcon } from '@mdi/react';
import { mdiRobotMower } from '@mdi/js';

function getMowerStateLabel(state) {
  const s = String(state || '').toLowerCase();
  if (s === 'mowing') return 'Mäht';
  if (s === 'paused') return 'Pausiert';
  if (s === 'docked') return 'Docked';
  if (s === 'returning') return 'Kehrt zurück';
  if (s === 'error') return 'Fehler';
  return state;
}

const NavimowCard = ({
  mowerId,
  dragProps,
  controls,
  cardStyle,
  entities,
  editMode,
  cardSettings,
  settingsKey,
  customNames,
  customIcons,
  getA,
  callService,
  onOpen,
  isMobile,
  t,
}) => {
  const entity = entities[mowerId];

  if (!entity) {
    if (editMode) {
      return (
        <div
          {...dragProps}
          className="touch-feedback relative flex h-full flex-col items-center justify-center overflow-hidden rounded-3xl border border-dashed border-[var(--status-error-border)] bg-[var(--card-bg)] p-4"
          style={cardStyle}
        >
          {controls}
          <AlertTriangle className="mb-2 h-8 w-8 text-[var(--status-error-fg)] opacity-80" />
          <p className="text-center text-xs font-bold tracking-widest text-[var(--status-error-fg)] uppercase">
            {t('common.missing')}
          </p>
          <p className="mt-1 line-clamp-2 text-center font-mono text-[10px] break-all text-[var(--status-error-fg)]/70">
            {mowerId}
          </p>
        </div>
      );
    }
    return null;
  }

  const settings = cardSettings[settingsKey] || cardSettings[mowerId] || {};
  const isSmall = settings.size === 'small';
  const state = entity?.state;
  const normalizedState = String(state || '').toLowerCase();
  const isUnavailable = state === 'unavailable' || state === 'unknown' || !state;
  const isErrorState = normalizedState === 'error';
  const isMowing = normalizedState === 'mowing';
  const isDocked = normalizedState === 'docked';
  const battery = getA(mowerId, 'battery') ?? entity?.attributes?.battery;
  const name = customNames[mowerId] || getA(mowerId, 'friendly_name', 'Navimow');
  const customIconName = customIcons[mowerId] || entity?.attributes?.icon;
  const statusText = getMowerStateLabel(state);
  const showBattery = typeof battery === 'number';

  const mowerColor = isMowing
    ? 'var(--color-green-500, #22c55e)'
    : isErrorState
      ? 'var(--status-error-fg)'
      : isDocked
        ? 'var(--text-secondary)'
        : 'var(--accent-color)';

  const cardBg = isErrorState
    ? 'var(--status-error-bg)'
    : isMowing
      ? 'color-mix(in srgb, var(--color-green-500, #22c55e) 8%, var(--card-bg))'
      : 'var(--card-bg)';

  const cardBorder = editMode
    ? 'rgba(59, 130, 246, 0.2)'
    : isErrorState
      ? 'var(--status-error-border)'
      : isMowing
        ? 'color-mix(in srgb, var(--color-green-500, #22c55e) 30%, transparent)'
        : 'var(--card-border)';

  const MowerIcon = customIconName ? getIconComponent(customIconName) : null;

  const renderIcon = (size) =>
    MowerIcon ? (
      <MowerIcon className={size} style={{ color: mowerColor }} />
    ) : (
      <MdiIcon path={mdiRobotMower} size={size === 'h-6 w-6' ? 1 : size === 'h-5 w-5' ? 0.85 : 0.7} color={mowerColor} />
    );

  const handleStart = (e) => {
    e.stopPropagation();
    if (isUnavailable) return;
    if (isMowing) {
      callService('lawn_mower', 'pause', { entity_id: mowerId });
    } else {
      callService('lawn_mower', 'start_mowing', { entity_id: mowerId });
    }
  };

  const handleDock = (e) => {
    e.stopPropagation();
    if (isUnavailable) return;
    callService('lawn_mower', 'dock', { entity_id: mowerId });
  };

  if (isSmall) {
    return (
      <div
        {...dragProps}
        data-haptic={editMode ? undefined : 'card'}
        onClick={(e) => { e.stopPropagation(); if (!editMode) onOpen(); }}
        className={`glass-texture touch-feedback group relative flex h-full items-center justify-between gap-3 overflow-hidden rounded-3xl border p-3 font-sans transition-all duration-500 ${!editMode ? 'cursor-pointer active:scale-[0.98]' : 'cursor-move'} ${isUnavailable ? 'opacity-70' : ''}`}
        style={{ ...cardStyle, backgroundColor: cardBg, borderColor: cardBorder }}
      >
        {controls}
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div
            className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl transition-all group-hover:scale-110 ${isMowing ? 'animate-pulse bg-[color-mix(in_srgb,var(--color-green-500,#22c55e)_15%,transparent)]' : 'bg-[var(--glass-bg)]'}`}
          >
            {renderIcon('h-5 w-5')}
          </div>
          <div className="flex min-w-0 flex-col">
            <p className="mb-0.5 truncate text-[10px] font-bold leading-none tracking-widest text-[var(--text-secondary)] uppercase opacity-60">
              {name}
            </p>
            <div className="flex min-w-0 items-center gap-1.5">
              <span className="truncate text-sm font-bold leading-none text-[var(--text-primary)]">
                {statusText}
              </span>
              {showBattery && (
                <span className="shrink-0 text-xs text-[var(--text-secondary)]">{battery}%</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex shrink-0 flex-row gap-1 rounded-2xl bg-[var(--glass-bg)] p-1">
          <button
            onClick={handleStart}
            className="flex h-7 w-7 items-center justify-center rounded-xl text-[var(--text-primary)] transition-colors hover:bg-[var(--glass-bg-hover)] active:scale-95"
          >
            {isMowing ? <Pause className="h-3.5 w-3.5 fill-current" /> : <Play className="ml-0.5 h-3.5 w-3.5 fill-current" />}
          </button>
          <button
            onClick={handleDock}
            className="flex h-7 w-7 items-center justify-center rounded-xl text-[var(--text-secondary)] transition-colors hover:bg-[var(--glass-bg-hover)] hover:text-[var(--text-primary)] active:scale-95"
          >
            <Home className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      {...dragProps}
      data-haptic={editMode ? undefined : 'card'}
      onClick={(e) => { e.stopPropagation(); if (!editMode) onOpen(); }}
      className={`glass-texture touch-feedback group relative flex h-full flex-col justify-between overflow-hidden rounded-3xl border font-sans transition-all duration-500 ${isMobile ? 'p-5' : 'p-7'} ${!editMode ? 'cursor-pointer active:scale-[0.98]' : 'cursor-move'} ${isUnavailable ? 'opacity-70' : ''}`}
      style={{ ...cardStyle, backgroundColor: cardBg, borderColor: cardBorder }}
    >
      {controls}

      <div className="flex items-start justify-between">
        <div
          className={`rounded-2xl p-3 transition-all group-hover:scale-110 group-hover:rotate-3 ${isMowing ? 'animate-pulse bg-[color-mix(in_srgb,var(--color-green-500,#22c55e)_15%,transparent)]' : 'bg-[var(--glass-bg)]'}`}
        >
          {renderIcon('h-5 w-5')}
        </div>
        <div className="flex flex-col items-end gap-2">
          {isErrorState && (
            <div className="flex items-center gap-1.5 rounded-full border border-[var(--status-error-border)] bg-[var(--status-error-bg)] px-3 py-1 text-[var(--status-error-fg)]">
              <AlertTriangle className="h-3 w-3" />
              <span className="text-xs font-bold tracking-widest uppercase">Fehler</span>
            </div>
          )}
          {showBattery && (
            <div className="flex items-center gap-1.5 rounded-full border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3 py-1 text-[var(--text-secondary)]">
              <Battery className="h-3 w-3" />
              <span className="text-xs font-bold tracking-widest uppercase">{battery}%</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-end justify-between">
        <div>
          <p className="mb-1 text-xs font-bold tracking-widest text-[var(--text-secondary)] uppercase opacity-60">
            {name}
          </p>
          <h3 className={`${isMobile ? 'text-[1.65rem]' : 'text-3xl'} leading-none font-thin text-[var(--text-primary)]`}>
            {statusText}
          </h3>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleStart}
            className={`${isMobile ? 'p-2.5' : 'p-3'} rounded-xl bg-[var(--glass-bg)] text-[var(--text-primary)] transition-colors hover:bg-[var(--glass-bg-hover)] active:scale-95`}
          >
            {isMowing ? <Pause className="h-5 w-5 fill-current" /> : <Play className="ml-0.5 h-5 w-5 fill-current" />}
          </button>
          <button
            onClick={handleDock}
            className={`${isMobile ? 'p-2.5' : 'p-3'} rounded-xl bg-[var(--glass-bg)] text-[var(--text-secondary)] transition-colors hover:bg-[var(--glass-bg-hover)] hover:text-[var(--text-primary)] active:scale-95`}
          >
            <Home className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default memo(NavimowCard);
