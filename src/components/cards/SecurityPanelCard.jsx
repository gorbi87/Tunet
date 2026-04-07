import { memo } from 'react';
import { Shield, DoorOpen, AlertTriangle } from '../../icons';

/* ── Entity config ───────────────────────────────────────────────────── */

const MOTION_SENSORS = [
  { entityId: 'binary_sensor.carport_bewegung',  name: 'Carport' },
  { entityId: 'binary_sensor.terasse_cell_motion_detection_3', name: 'Terrasse' },
  { entityId: 'binary_sensor.bewegung_hwr',      name: 'HWR' },
];

const DOOR_SENSORS = [
  { entityId: 'binary_sensor.turkontakt_haustur_contact', name: 'Haustür' },
  { entityId: 'binary_sensor.turkontakt_hwr_contact',     name: 'HWR Tür' },
];

const CONTACT_SUMMARY_ID = 'binary_sensor.sicherheit_fenster_und_turkontakte';

/* ── Motion strip ────────────────────────────────────────────────────── */
const MotionStrip = ({ entities, isMobile }) => (
  <div className="col-span-full glass-texture overflow-hidden rounded-2xl border border-[var(--glass-border)] bg-[var(--card-bg)]">
    <div className={`${isMobile ? 'px-3 py-2.5' : 'px-4 py-3'} flex flex-col gap-2`}>
      <p className="text-[10px] font-bold tracking-widest uppercase text-[var(--text-secondary)] opacity-60">
        Bewegung
      </p>
      <div className="flex flex-wrap gap-2">
        {MOTION_SENSORS.map(({ entityId, name }) => {
          const state = entities[entityId]?.state;
          const isOn = state === 'on';
          const isUnavailable = !state || state === 'unavailable';
          return (
            <span
              key={entityId}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold transition-all ${
                isUnavailable
                  ? 'border-[var(--glass-border)] bg-[var(--glass-bg)] text-[var(--text-muted)] opacity-40'
                  : isOn
                  ? 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400'
                  : 'border-[var(--glass-border)] bg-[var(--glass-bg)] text-[var(--text-secondary)]'
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${isUnavailable ? 'bg-gray-500' : isOn ? 'bg-yellow-400 animate-pulse' : 'bg-gray-500'}`} />
              {name}
            </span>
          );
        })}
      </div>
    </div>
  </div>
);

/* ── Door tile ───────────────────────────────────────────────────────── */
const DoorTileInner = memo(({ name, state, isMobile }) => {
  const isOpen = state === 'on';
  const isUnavailable = !state || state === 'unavailable';

  const px = isMobile ? 'px-3' : 'px-4';
  const py = isMobile ? 'py-3' : 'py-4';
  const iconSize = isMobile ? 'h-9 w-9 rounded-xl' : 'h-12 w-12 rounded-2xl';
  const iconInner = isMobile ? 'h-5 w-5' : 'h-6 w-6';
  const stateSize = isMobile ? 'text-base' : 'text-lg';

  const iconStyle = isUnavailable
    ? { backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444' }
    : isOpen
    ? { backgroundColor: 'rgba(251,146,60,0.12)', color: '#fb923c' }
    : { backgroundColor: 'rgba(34,197,94,0.1)', color: '#22c55e' };

  const Icon = DoorOpen;

  return (
    <div className={`glass-texture overflow-hidden rounded-2xl border border-[var(--glass-border)] bg-[var(--card-bg)] transition-all duration-300 ${isUnavailable ? 'opacity-50' : ''}`}>
      <div className={`flex w-full items-center ${px} ${py} gap-3`}>
        <div
          className={`flex flex-shrink-0 items-center justify-center ${iconSize} transition-all duration-300`}
          style={iconStyle}
        >
          {isUnavailable
            ? <AlertTriangle className={`${iconInner} stroke-[1.5px]`} />
            : <Icon className={`${iconInner} stroke-[1.5px]`} />
          }
        </div>
        <div className="min-w-0 flex-1">
          <p className={`mb-1.5 text-[10px] font-bold leading-tight tracking-widest uppercase text-[var(--text-secondary)] opacity-60 ${isMobile ? 'line-clamp-2 hyphens-auto' : 'truncate'}`} lang={isMobile ? 'de' : undefined}>
            {name}
          </p>
          <p className={`${stateSize} font-medium leading-none ${
            isUnavailable ? 'text-red-400' : isOpen ? 'text-orange-400' : 'text-green-400'
          }`}>
            {isUnavailable ? '⚠' : isOpen ? 'Offen' : 'Zu'}
          </p>
        </div>
      </div>
    </div>
  );
});

/* ── Contact summary tile ────────────────────────────────────────────── */
const ContactSummaryTile = memo(({ entity, isMobile }) => {
  const state = entity?.state;
  const isOpen = state === 'on';
  const isUnavailable = !state || state === 'unavailable';

  const px = isMobile ? 'px-3' : 'px-4';
  const py = isMobile ? 'py-3' : 'py-4';
  const iconSize = isMobile ? 'h-9 w-9 rounded-xl' : 'h-12 w-12 rounded-2xl';
  const iconInner = isMobile ? 'h-5 w-5' : 'h-6 w-6';
  const stateSize = isMobile ? 'text-base' : 'text-lg';

  const iconStyle = isUnavailable
    ? { backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444' }
    : isOpen
    ? { backgroundColor: 'rgba(239,68,68,0.12)', color: '#ef4444' }
    : { backgroundColor: 'rgba(34,197,94,0.1)', color: '#22c55e' };

  return (
    <div className={`col-span-full glass-texture overflow-hidden rounded-2xl border border-[var(--glass-border)] bg-[var(--card-bg)] transition-all duration-300 ${isUnavailable ? 'opacity-50' : ''}`}>
      <div className={`flex w-full items-center ${px} ${py} gap-3`}>
        <div
          className={`flex flex-shrink-0 items-center justify-center ${iconSize} transition-all duration-300`}
          style={iconStyle}
        >
          <Shield className={`${iconInner} stroke-[1.5px]`} />
        </div>
        <div className="min-w-0 flex-1">
          <p className={`mb-1.5 text-[10px] font-bold leading-tight tracking-widest uppercase text-[var(--text-secondary)] opacity-60 truncate`}>
            Fenster & Türkontakte
          </p>
          <p className={`${stateSize} font-medium leading-none ${
            isUnavailable ? 'text-red-400' : isOpen ? 'text-red-400' : 'text-green-400'
          }`}>
            {isUnavailable ? '⚠' : isOpen ? 'Geöffnet' : 'Alle zu'}
          </p>
        </div>
      </div>
    </div>
  );
});

/* ── Security Panel Card ─────────────────────────────────────────────── */
const SecurityPanelCard = ({
  cardId,
  dragProps,
  controls,
  cardStyle,
  editMode,
  entities,
  isMobile,
}) => {
  const cols = 2;

  const layoutStyle = cardStyle ? {
    transform: cardStyle.transform,
    opacity: cardStyle.opacity,
    zIndex: cardStyle.zIndex,
    pointerEvents: cardStyle.pointerEvents,
    transition: cardStyle.transition,
  } : {};

  return (
    <div
      key={cardId}
      {...dragProps}
      className={`relative flex flex-col gap-3 font-sans select-none ${editMode ? 'cursor-move' : ''}`}
      style={layoutStyle}
    >
      {controls}

      {/* Motion detection strip */}
      <div className="grid grid-cols-1 gap-3">
        <MotionStrip entities={entities} isMobile={isMobile} />
      </div>

      {/* Door tiles */}
      <div className={`grid gap-3 grid-cols-${cols}`}>
        {DOOR_SENSORS.map(({ entityId, name }) => (
          <DoorTileInner
            key={entityId}
            name={name}
            state={entities[entityId]?.state}
            isMobile={isMobile}
          />
        ))}
      </div>

      {/* Contact summary */}
      <div className="grid grid-cols-1 gap-3">
        <ContactSummaryTile
          entity={entities[CONTACT_SUMMARY_ID]}
          isMobile={isMobile}
        />
      </div>
    </div>
  );
};

export default memo(SecurityPanelCard);
