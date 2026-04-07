import { memo, useCallback } from 'react';
import { Shield, Lock, Unlock, AlertTriangle, Eye, EyeOff } from '../../icons';

/* ── Static entity config ────────────────────────────────────────────── */

const DETECTION_SWITCH = 'switch.sicherheit_detection';

const LOCKS = [
  { entityId: 'lock.nuki_nuki_lock',             contactId: 'binary_sensor.turkontakt_haustur_contact', name: 'Haustür' },
  { entityId: 'lock.aqara_smart_lock_u200_schloss', contactId: 'binary_sensor.turkontakt_hwr_contact',   name: 'HWR Tür'  },
];

const TUR_KONTAKTE = [
  { entityId: 'binary_sensor.turkontakt_haustur_contact',      name: 'Haustür'         },
  { entityId: 'binary_sensor.turkontakt_hwr_contact',          name: 'HWR'             },
  { entityId: 'binary_sensor.turkontakt_dach_contact',         name: 'Dach'            },
  { entityId: 'binary_sensor.turkontakt_terasse_kuche_contact',name: 'Terrasse Küche'  },
  { entityId: 'binary_sensor.turkontakt_esszimmer_contact',    name: 'Esszimmer'       },
  { entityId: 'binary_sensor.fensterkontakt_kinderzimmer_contact', name: 'Kinderzimmer'},
];
const TUR_SUMMARY_ID  = 'binary_sensor.sicherheit_turkontakte';

const FENSTER_KONTAKTE = [
  { entityId: 'binary_sensor.fensterkontakt_gaste_wc_contact',    name: 'Gäste WC'    },
  { entityId: 'binary_sensor.fensterkontakt_schlafzimmer_contact', name: 'Schlafzimmer'},
  { entityId: 'binary_sensor.fensterkontakt_badezimmer_contact',   name: 'Badezimmer'  },
];
const FENSTER_SUMMARY_ID = 'binary_sensor.sicherheit_fensterkontakte';

const MOTION_SENSORS = [
  { entityId: 'binary_sensor.carport_bewegung',                                     name: 'Carport'   },
  { entityId: 'binary_sensor.terasse_motion',                                       name: 'Terrasse'  },
  { entityId: 'binary_sensor.bewegung_eingang',                                     name: 'Eingang'   },
  { entityId: 'binary_sensor.bird_home_automation_doorbird_d1101fv_f_gb_bewegung',  name: 'Doorbird'  },
  { entityId: 'binary_sensor.bewegung_flur',                                        name: 'Flur EG'   },
  { entityId: 'binary_sensor.bewegung_flur_og',                                     name: 'Flur OG'   },
  { entityId: 'binary_sensor.bewegung_hwr',                                         name: 'HWR'       },
  { entityId: 'binary_sensor.bewegung_gaste_wc',                                    name: 'Gäste WC'  },
  { entityId: 'binary_sensor.bewegung_buro_eg',                                     name: 'Büro EG'   },
];

/* ── Helpers ─────────────────────────────────────────────────────────── */
const px = (mobile) => mobile ? 'px-3' : 'px-4';
const py = (mobile) => mobile ? 'py-3' : 'py-4';
const iconBox  = (mobile) => mobile ? 'h-9 w-9 rounded-xl'   : 'h-12 w-12 rounded-2xl';
const iconInner = (mobile) => mobile ? 'h-5 w-5'              : 'h-6 w-6';
const stateText = (mobile) => mobile ? 'text-base'            : 'text-lg';

/* ── Detection Switch ────────────────────────────────────────────────── */
const DetectionTile = memo(({ entity, callService, isMobile }) => {
  const state = entity?.state;
  const isOn = state === 'on';
  const isUnavailable = !state || state === 'unavailable' || state === 'unknown';

  const toggle = useCallback(() => {
    if (isUnavailable) return;
    callService('switch', isOn ? 'turn_off' : 'turn_on', { entity_id: DETECTION_SWITCH });
  }, [isOn, isUnavailable, callService]);

  const iconStyle = isUnavailable
    ? { backgroundColor: 'rgba(239,68,68,0.1)',  color: '#ef4444' }
    : isOn
    ? { backgroundColor: 'rgba(96,165,250,0.12)', color: '#60a5fa' }
    : { backgroundColor: 'var(--glass-bg-hover)', color: 'var(--text-muted)' };

  const Icon = isOn ? Eye : EyeOff;

  return (
    <div className={`glass-texture overflow-hidden rounded-2xl border border-[var(--glass-border)] bg-[var(--card-bg)] transition-all ${isUnavailable ? 'opacity-50' : ''}`}>
      <button
        type="button"
        data-haptic="card"
        disabled={isUnavailable}
        onClick={toggle}
        style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
        className={`flex w-full items-center gap-3 ${px(isMobile)} ${py(isMobile)} text-left transition-all active:scale-[0.97] ${isUnavailable ? 'cursor-default' : 'cursor-pointer'}`}
      >
        <div className={`flex flex-shrink-0 items-center justify-center ${iconBox(isMobile)} transition-all`} style={iconStyle}>
          <Icon className={`${iconInner(isMobile)} stroke-[1.5px]`} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="mb-1.5 text-[10px] font-bold leading-tight tracking-widest uppercase text-[var(--text-secondary)] opacity-60 truncate">
            Kamera Detection
          </p>
          <p className={`${stateText(isMobile)} font-medium leading-none ${isUnavailable ? 'text-red-400' : isOn ? 'text-blue-400' : 'text-[var(--text-muted)] opacity-60'}`}>
            {isUnavailable ? '⚠' : isOn ? 'Aktiv' : 'Inaktiv'}
          </p>
        </div>
      </button>
    </div>
  );
});

/* ── Lock Tile ───────────────────────────────────────────────────────── */
const LockTile = memo(({ lockEntityId, contactId, name, entities, callService, isMobile, onOpen }) => {
  const entity = entities[lockEntityId];
  const contact = entities[contactId];
  const state = entity?.state;
  const isLocked   = state === 'locked';
  const isUnlocked = state === 'unlocked';
  const isJammed   = state === 'jammed';
  const isUnavailable = !state || state === 'unavailable' || state === 'unknown';
  const isDoorOpen = contact?.state === 'on';

  const iconStyle = isUnavailable
    ? { backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444' }
    : isJammed
    ? { backgroundColor: 'rgba(239,68,68,0.12)', color: '#ef4444' }
    : isLocked
    ? { backgroundColor: 'rgba(34,197,94,0.1)',  color: '#22c55e' }
    : { backgroundColor: 'rgba(251,146,60,0.12)', color: '#fb923c' };

  const Icon = isLocked ? Lock : Unlock;

  const stateLabel = isUnavailable ? '⚠' : isJammed ? 'Blockiert' : isLocked ? 'Gesperrt' : 'Offen';
  const stateColor = isUnavailable ? 'text-red-400' : isJammed ? 'text-red-400' : isLocked ? 'text-green-400' : 'text-orange-400';

  return (
    <div className={`glass-texture overflow-hidden rounded-2xl border border-[var(--glass-border)] bg-[var(--card-bg)] transition-all ${isUnavailable ? 'opacity-50' : ''}`}>
      <div className={`flex w-full items-center gap-3 ${px(isMobile)} ${py(isMobile)}`}>
        <button
          type="button"
          data-haptic="light"
          onClick={() => { if (onOpen) onOpen({ entityId: lockEntityId, contactId, name }); }}
          style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', ...iconStyle }}
          className={`flex flex-shrink-0 items-center justify-center ${iconBox(isMobile)} transition-all hover:opacity-80 active:scale-90 cursor-pointer`}
        >
          <Icon className={`${iconInner(isMobile)} stroke-[1.5px]`} />
        </button>
        <button
          type="button"
          data-haptic="card"
          onClick={() => { if (onOpen) onOpen({ entityId: lockEntityId, contactId, name }); }}
          style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
          className="min-w-0 flex-1 text-left transition-all active:scale-[0.97] cursor-pointer"
        >
          <p className="mb-1.5 text-[10px] font-bold leading-tight tracking-widest uppercase text-[var(--text-secondary)] opacity-60 truncate">
            {name}
          </p>
          <p className={`${stateText(isMobile)} font-medium leading-none ${stateColor}`}>
            {stateLabel}
            {isDoorOpen && <span className="ml-1.5 text-[10px] text-orange-400 opacity-80">· Tür auf</span>}
          </p>
        </button>
      </div>
    </div>
  );
});

/* ── Contact Summary Tile ────────────────────────────────────────────── */
const ContactSummaryTile = memo(({ label, icon: Icon, summaryId, contacts, entities, isMobile, onClick }) => {
  const summary = entities[summaryId];
  const summaryState = summary?.state;
  const isOpen = summaryState === 'on';
  const isUnavailable = !summaryState || summaryState === 'unavailable';

  const openCount = contacts.filter(({ entityId }) => entities[entityId]?.state === 'on').length;

  const iconStyle = isUnavailable
    ? { backgroundColor: 'rgba(239,68,68,0.1)',  color: '#ef4444' }
    : isOpen
    ? { backgroundColor: 'rgba(239,68,68,0.12)', color: '#ef4444' }
    : { backgroundColor: 'rgba(34,197,94,0.1)',  color: '#22c55e' };

  const stateLabel = isUnavailable ? '⚠' : isOpen ? `${openCount} offen` : 'Alle zu';
  const stateColor = isUnavailable ? 'text-red-400' : isOpen ? 'text-red-400' : 'text-green-400';

  return (
    <div className={`glass-texture overflow-hidden rounded-2xl border border-[var(--glass-border)] bg-[var(--card-bg)] transition-all ${isUnavailable ? 'opacity-50' : ''}`}>
      <button
        type="button"
        data-haptic="card"
        onClick={onClick}
        style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
        className={`flex w-full items-center gap-3 ${px(isMobile)} ${py(isMobile)} text-left transition-all active:scale-[0.97] cursor-pointer`}
      >
        <div className={`flex flex-shrink-0 items-center justify-center ${iconBox(isMobile)} transition-all`} style={iconStyle}>
          <Icon className={`${iconInner(isMobile)} stroke-[1.5px]`} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="mb-1.5 text-[10px] font-bold leading-tight tracking-widest uppercase text-[var(--text-secondary)] opacity-60 truncate">
            {label}
          </p>
          <p className={`${stateText(isMobile)} font-medium leading-none ${stateColor}`}>
            {stateLabel}
          </p>
        </div>
      </button>
    </div>
  );
});

/* ── Motion Strip ────────────────────────────────────────────────────── */
const MotionStrip = memo(({ entities, isMobile }) => {
  const anyActive = MOTION_SENSORS.some(({ entityId }) => entities[entityId]?.state === 'on');

  return (
    <div className="glass-texture overflow-hidden rounded-2xl border border-[var(--glass-border)] bg-[var(--card-bg)]">
      <div className={`${px(isMobile)} ${py(isMobile)} flex flex-col gap-2.5`}>
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-bold tracking-widest uppercase text-[var(--text-secondary)] opacity-60">
            Bewegung
          </p>
          {anyActive && <span className="h-2 w-2 rounded-full bg-yellow-400 animate-pulse" />}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {MOTION_SENSORS.map(({ entityId, name }) => {
            const state = entities[entityId]?.state;
            const isOn = state === 'on';
            const isUnavailable = !state || state === 'unavailable';
            return (
              <span
                key={entityId}
                className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-all ${
                  isUnavailable
                    ? 'border-[var(--glass-border)] bg-[var(--glass-bg)] text-[var(--text-muted)] opacity-30'
                    : isOn
                    ? 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400'
                    : 'border-[var(--glass-border)] bg-[var(--glass-bg)] text-[var(--text-secondary)] opacity-70'
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${isUnavailable ? 'bg-gray-600' : isOn ? 'bg-yellow-400 animate-pulse' : 'bg-gray-500'}`} />
                {name}
              </span>
            );
          })}
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
  callService,
  isMobile,
  setShowSecurityLockModal,
  setShowSecurityContactsModal,
}) => {
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

      {/* Detection switch — full width */}
      <DetectionTile
        entity={entities[DETECTION_SWITCH]}
        callService={callService}
        isMobile={isMobile}
      />

      {/* Locks — 2 cols */}
      <div className="grid grid-cols-2 gap-3">
        {LOCKS.map((lock) => (
          <LockTile
            key={lock.entityId}
            {...lock}
            entities={entities}
            callService={callService}
            isMobile={isMobile}
            onOpen={setShowSecurityLockModal}
          />
        ))}
      </div>

      {/* Contacts — 2 cols */}
      <div className="grid grid-cols-2 gap-3">
        <ContactSummaryTile
          label="Türkontakte"
          icon={Shield}
          summaryId={TUR_SUMMARY_ID}
          contacts={TUR_KONTAKTE}
          entities={entities}
          isMobile={isMobile}
          onClick={() => setShowSecurityContactsModal({ type: 'tür', contacts: TUR_KONTAKTE })}
        />
        <ContactSummaryTile
          label="Fensterkontakte"
          icon={Shield}
          summaryId={FENSTER_SUMMARY_ID}
          contacts={FENSTER_KONTAKTE}
          entities={entities}
          isMobile={isMobile}
          onClick={() => setShowSecurityContactsModal({ type: 'fenster', contacts: FENSTER_KONTAKTE })}
        />
      </div>

      {/* Motion sensors — full width */}
      <MotionStrip entities={entities} isMobile={isMobile} />
    </div>
  );
};

export default memo(SecurityPanelCard);
