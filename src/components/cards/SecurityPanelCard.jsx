import { memo, useCallback } from 'react';
import { Shield, Lock, Unlock, AlertTriangle, Eye, EyeOff } from '../../icons';

/* ── Entity config ───────────────────────────────────────────────────── */

const DETECTION_SWITCH = 'switch.sicherheit_detection';

const LOCKS = [
  { entityId: 'lock.nuki_nuki_lock',               contactId: 'binary_sensor.turkontakt_haustur_contact', name: 'Haustür' },
  { entityId: 'lock.aqara_smart_lock_u200_schloss', contactId: 'binary_sensor.turkontakt_hwr_contact',     name: 'HWR Tür' },
];

const TUR_KONTAKTE = [
  { entityId: 'binary_sensor.turkontakt_haustur_contact',       name: 'Haustür'        },
  { entityId: 'binary_sensor.turkontakt_hwr_contact',           name: 'HWR'            },
  { entityId: 'binary_sensor.turkontakt_dach_contact',          name: 'Dach'           },
  { entityId: 'binary_sensor.turkontakt_terasse_kuche_contact', name: 'Terrasse Küche' },
  { entityId: 'binary_sensor.turkontakt_esszimmer_contact',     name: 'Esszimmer'      },
  { entityId: 'binary_sensor.fensterkontakt_kinderzimmer_contact', name: 'Kinderzimmer'},
];
const TUR_SUMMARY_ID = 'binary_sensor.sicherheit_turkontakte';

const FENSTER_KONTAKTE = [
  { entityId: 'binary_sensor.fensterkontakt_gaste_wc_contact',     name: 'Gäste WC'    },
  { entityId: 'binary_sensor.fensterkontakt_schlafzimmer_contact',  name: 'Schlafzimmer'},
  { entityId: 'binary_sensor.fensterkontakt_badezimmer_contact',    name: 'Badezimmer'  },
];
const FENSTER_SUMMARY_ID = 'binary_sensor.sicherheit_fensterkontakte';

const MOTION_SENSORS = [
  { entityId: 'binary_sensor.carport_bewegung',                                    name: 'Carport'  },
  { entityId: 'binary_sensor.terasse_motion',                                      name: 'Terrasse' },
  { entityId: 'binary_sensor.bewegung_eingang',                                    name: 'Eingang'  },
  { entityId: 'binary_sensor.bird_home_automation_doorbird_d1101fv_f_gb_bewegung', name: 'Doorbird' },
  { entityId: 'binary_sensor.bewegung_flur',                                       name: 'Flur EG'  },
  { entityId: 'binary_sensor.bewegung_flur_og',                                    name: 'Flur OG'  },
  { entityId: 'binary_sensor.bewegung_hwr',                                        name: 'HWR'      },
  { entityId: 'binary_sensor.bewegung_gaste_wc',                                   name: 'Gäste WC' },
  { entityId: 'binary_sensor.bewegung_buro_eg',                                    name: 'Büro EG'  },
];

/* ── Row components ──────────────────────────────────────────────────── */

const SectionLabel = ({ children }) => (
  <p className="text-[10px] font-bold tracking-widest uppercase text-[var(--text-secondary)] opacity-50">
    {children}
  </p>
);

const Divider = () => (
  <div className="border-t border-[var(--glass-border)] opacity-50" />
);

/* Detection row */
const DetectionRow = memo(({ entity, callService }) => {
  const state = entity?.state;
  const isOn = state === 'on';
  const isUnavailable = !state || state === 'unavailable' || state === 'unknown';
  const Icon = isOn ? Eye : EyeOff;

  const toggle = useCallback(() => {
    if (isUnavailable) return;
    callService('switch', isOn ? 'turn_off' : 'turn_on', { entity_id: DETECTION_SWITCH });
  }, [isOn, isUnavailable, callService]);

  return (
    <button
      type="button"
      data-haptic="card"
      disabled={isUnavailable}
      onClick={toggle}
      style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
      className={`flex w-full items-center gap-3 transition-all active:scale-[0.98] ${isUnavailable ? 'cursor-default opacity-50' : 'cursor-pointer'}`}
    >
      <div
        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl transition-all"
        style={isUnavailable
          ? { backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444' }
          : isOn
          ? { backgroundColor: 'rgba(96,165,250,0.12)', color: '#60a5fa' }
          : { backgroundColor: 'var(--glass-bg-hover)', color: 'var(--text-muted)' }}
      >
        <Icon className="h-4 w-4 stroke-[1.5px]" />
      </div>
      <span className="flex-1 text-sm font-medium text-[var(--text-primary)]">Kamera Detection</span>
      <span className={`text-xs font-semibold ${isUnavailable ? 'text-red-400' : isOn ? 'text-blue-400' : 'text-[var(--text-muted)] opacity-60'}`}>
        {isUnavailable ? '⚠' : isOn ? 'Aktiv' : 'Inaktiv'}
      </span>
    </button>
  );
});

/* Lock row */
const LockRow = memo(({ entityId, contactId, name, entities, onOpen }) => {
  const entity  = entities[entityId];
  const contact = entities[contactId];
  const state = entity?.state;
  const isLocked     = state === 'locked';
  const isJammed     = state === 'jammed';
  const isTransition = state === 'locking' || state === 'unlocking';
  const isUnavailable = !state || state === 'unavailable' || state === 'unknown';
  const isDoorOpen = contact?.state === 'on';

  const iconStyle = isUnavailable || isJammed
    ? { backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444' }
    : isLocked
    ? { backgroundColor: 'rgba(34,197,94,0.1)',  color: '#22c55e' }
    : isTransition
    ? { backgroundColor: 'rgba(96,165,250,0.1)', color: '#60a5fa' }
    : { backgroundColor: 'rgba(251,146,60,0.1)', color: '#fb923c' };

  const stateLabel = isUnavailable ? '⚠' : isJammed ? 'Blockiert' : isTransition ? '…' : isLocked ? 'Gesperrt' : 'Offen';
  const stateColor = isUnavailable || isJammed ? 'text-red-400' : isTransition ? 'text-blue-400' : isLocked ? 'text-green-400' : 'text-orange-400';

  const Icon = isLocked || state === 'locking' ? Lock : Unlock;

  return (
    <button
      type="button"
      data-haptic="card"
      onClick={() => onOpen?.({ entityId, contactId, name })}
      style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
      className="flex w-full items-center gap-3 transition-all active:scale-[0.98] cursor-pointer"
    >
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl transition-all" style={iconStyle}>
        {isUnavailable
          ? <AlertTriangle className="h-4 w-4 stroke-[1.5px]" />
          : <Icon className={`h-4 w-4 stroke-[1.5px] ${isTransition ? 'animate-pulse' : ''}`} />
        }
      </div>
      <span className="flex-1 text-sm font-medium text-[var(--text-primary)]">{name}</span>
      <div className="flex items-center gap-1.5">
        {isDoorOpen && <span className="text-[10px] font-semibold text-orange-400">Tür auf</span>}
        <span className={`text-xs font-semibold ${stateColor}`}>{stateLabel}</span>
      </div>
    </button>
  );
});

/* Contact summary row */
const ContactRow = memo(({ label, summaryId, contacts, entities, onClick }) => {
  const summary = entities[summaryId];
  const isOpen = summary?.state === 'on';
  const isUnavailable = !summary?.state || summary.state === 'unavailable';
  const openCount = contacts.filter(({ entityId }) => entities[entityId]?.state === 'on').length;

  const dotColor = isUnavailable ? 'bg-gray-500' : isOpen ? 'bg-red-500' : 'bg-green-500';
  const stateLabel = isUnavailable ? '⚠' : isOpen ? `${openCount} offen` : 'Alle zu';
  const stateColor = isUnavailable ? 'text-red-400' : isOpen ? 'text-red-400' : 'text-green-400';

  return (
    <button
      type="button"
      data-haptic="card"
      onClick={onClick}
      style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
      className="flex w-full items-center gap-3 transition-all active:scale-[0.98] cursor-pointer"
    >
      <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl`}
        style={isOpen
          ? { backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444' }
          : { backgroundColor: 'rgba(34,197,94,0.1)',  color: '#22c55e' }}
      >
        <Shield className="h-4 w-4 stroke-[1.5px]" />
      </div>
      <span className="flex-1 text-sm font-medium text-[var(--text-primary)]">{label}</span>
      <div className="flex items-center gap-1.5">
        <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
        <span className={`text-xs font-semibold ${stateColor}`}>{stateLabel}</span>
      </div>
    </button>
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
  const anyMotion = MOTION_SENSORS.some(({ entityId }) => entities[entityId]?.state === 'on');
  const p = isMobile ? 'px-3 py-3' : 'px-4 py-4';

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
      className={`relative font-sans select-none ${editMode ? 'cursor-move' : ''}`}
      style={layoutStyle}
    >
      {controls}

      <div className={`glass-texture rounded-2xl border border-[var(--glass-border)] bg-[var(--card-bg)] flex flex-col gap-0 overflow-hidden`}>

        {/* Detection */}
        <div className={p}>
          <DetectionRow entity={entities[DETECTION_SWITCH]} callService={callService} />
        </div>

        <Divider />

        {/* Locks */}
        <div className={`${p} flex flex-col gap-3`}>
          <SectionLabel>Schlösser</SectionLabel>
          {LOCKS.map((lock) => (
            <LockRow
              key={lock.entityId}
              {...lock}
              entities={entities}
              onOpen={setShowSecurityLockModal}
            />
          ))}
        </div>

        <Divider />

        {/* Contacts */}
        <div className={`${p} flex flex-col gap-3`}>
          <SectionLabel>Kontakte</SectionLabel>
          <ContactRow
            label="Türkontakte"
            summaryId={TUR_SUMMARY_ID}
            contacts={TUR_KONTAKTE}
            entities={entities}
            onClick={() => setShowSecurityContactsModal?.({ type: 'tür', contacts: TUR_KONTAKTE })}
          />
          <ContactRow
            label="Fensterkontakte"
            summaryId={FENSTER_SUMMARY_ID}
            contacts={FENSTER_KONTAKTE}
            entities={entities}
            onClick={() => setShowSecurityContactsModal?.({ type: 'fenster', contacts: FENSTER_KONTAKTE })}
          />
        </div>

        <Divider />

        {/* Motion */}
        <div className={`${p} flex flex-col gap-2.5`}>
          <div className="flex items-center justify-between">
            <SectionLabel>Bewegung</SectionLabel>
            {anyMotion && <span className="h-1.5 w-1.5 rounded-full bg-yellow-400 animate-pulse" />}
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
                      ? 'border-[var(--glass-border)] bg-[var(--glass-bg)] text-[var(--text-muted)] opacity-25'
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
    </div>
  );
};

export default memo(SecurityPanelCard);
