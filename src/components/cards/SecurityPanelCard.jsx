import { memo, useCallback } from 'react';
import { Shield, Lock, Unlock, AlertTriangle, Camera, Activity, Bell, Home, LogOut, Moon, Sun, UserCheck } from '../../icons';

/* ── Entity config ───────────────────────────────────────────────────── */

const DETECTION_SWITCH    = 'switch.sicherheit_detection';
const SIMULATION_SWITCH   = 'switch.anwesenheitssimulation';
const ALARM_ENTITY        = 'alarm_control_panel.alarmo';

const LOCKS = [
  { entityId: 'lock.nuki_nuki_lock',               contactId: 'binary_sensor.turkontakt_haustur_contact', name: 'Haustür' },
  { entityId: 'lock.aqara_smart_lock_u200_schloss', contactId: 'binary_sensor.turkontakt_hwr_contact',     name: 'HWR Tür' },
];

const TUR_KONTAKTE = [
  { entityId: 'binary_sensor.turkontakt_haustur_contact',         name: 'Haustür'        },
  { entityId: 'binary_sensor.turkontakt_hwr_contact',             name: 'HWR'            },
  { entityId: 'binary_sensor.turkontakt_dach_contact',            name: 'Dach'           },
  { entityId: 'binary_sensor.turkontakt_terasse_kuche_contact',   name: 'Terrasse Küche' },
  { entityId: 'binary_sensor.turkontakt_esszimmer_contact',       name: 'Esszimmer'      },
  { entityId: 'binary_sensor.fensterkontakt_kinderzimmer_contact',name: 'Kinderzimmer'   },
];
const TUR_SUMMARY_ID = 'binary_sensor.sicherheit_turkontakte';

const FENSTER_KONTAKTE = [
  { entityId: 'binary_sensor.fensterkontakt_gaste_wc_contact',    name: 'Gäste WC'    },
  { entityId: 'binary_sensor.fensterkontakt_schlafzimmer_contact', name: 'Schlafzimmer'},
  { entityId: 'binary_sensor.fensterkontakt_badezimmer_contact',   name: 'Badezimmer'  },
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

/* ── Alarm state helpers ─────────────────────────────────────────────── */

const ALARM_STATES = {
  disarmed:           { label: 'Deaktiviert', color: 'text-[var(--text-muted)]',  Icon: Bell,    bg: 'var(--glass-bg-hover)',       fg: 'var(--text-muted)'  },
  armed_home:         { label: 'Zuhause',     color: 'text-blue-400',             Icon: Home,    bg: 'rgba(96,165,250,0.12)',        fg: '#60a5fa'             },
  armed_away:         { label: 'Abwesend',    color: 'text-orange-400',           Icon: LogOut,  bg: 'rgba(251,146,60,0.12)',        fg: '#fb923c'             },
  armed_night:        { label: 'Nacht',       color: 'text-indigo-400',           Icon: Moon,    bg: 'rgba(129,140,248,0.12)',       fg: '#818cf8'             },
  armed_vacation:     { label: 'Urlaub',      color: 'text-purple-400',           Icon: Sun,     bg: 'rgba(192,132,252,0.12)',       fg: '#c084fc'             },
  armed_custom_bypass:{ label: 'Custom',      color: 'text-blue-400',             Icon: Shield,  bg: 'rgba(96,165,250,0.12)',        fg: '#60a5fa'             },
  arming:             { label: 'Aktiviert…',  color: 'text-yellow-400',           Icon: Bell,    bg: 'rgba(234,179,8,0.12)',         fg: '#facc15'             },
  pending:            { label: 'Ausstehend',  color: 'text-yellow-400',           Icon: Bell,    bg: 'rgba(234,179,8,0.12)',         fg: '#facc15'             },
  triggered:          { label: 'ALARM!',      color: 'text-red-400 animate-pulse',Icon: Bell,    bg: 'rgba(239,68,68,0.15)',         fg: '#ef4444'             },
};

/* ── Shared layout helpers ───────────────────────────────────────────── */

const SectionLabel = ({ children }) => (
  <p className="mb-2 text-[10px] font-bold tracking-widest uppercase text-[var(--text-secondary)] opacity-50">
    {children}
  </p>
);

/* Section wrapper — handles borders in flex (desktop) and grid (mobile) */
const Section = ({ children, px = 'px-4', py = 'py-3', flex = false, borderRight = true, borderBottom = false, className = '' }) => (
  <div
    className={`flex flex-col justify-start ${px} ${py} ${borderRight ? 'border-r border-[var(--glass-border)]' : ''} ${borderBottom ? 'border-b border-[var(--glass-border)]' : ''} ${flex ? 'flex-1' : ''} ${className}`}
  >
    {children}
  </div>
);

/* ── Detection section ───────────────────────────────────────────────── */

const DetectionSection = memo(({ entity, callService, mobile }) => {
  const state = entity?.state;
  const isOn = state === 'on';
  const isUnavailable = !state || state === 'unavailable' || state === 'unknown';

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
      className={`flex items-center gap-2 w-full transition-all active:scale-[0.97] ${isUnavailable ? 'cursor-default opacity-50' : 'cursor-pointer'}`}
    >
      <div
        className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg"
        style={isUnavailable
          ? { backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444' }
          : isOn
          ? { backgroundColor: 'rgba(96,165,250,0.12)', color: '#60a5fa' }
          : { backgroundColor: 'var(--glass-bg-hover)', color: 'var(--text-muted)' }}
      >
        <Camera className="h-3.5 w-3.5 stroke-[1.5px]" />
      </div>
      <span className="text-xs font-medium text-[var(--text-primary)] flex-1 text-left">Kamera Detection</span>
      <span className={`text-[10px] font-bold ${isUnavailable ? 'text-red-400' : isOn ? 'text-blue-400' : 'text-[var(--text-muted)] opacity-60'}`}>
        {isUnavailable ? '⚠' : isOn ? 'Aktiv' : 'Inaktiv'}
      </span>
    </button>
  );
});

/* ── Lock row ────────────────────────────────────────────────────────── */

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
    ? { backgroundColor: 'rgba(34,197,94,0.1)', color: '#22c55e' }
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
      className="flex items-center gap-2 w-full transition-all active:scale-[0.98] cursor-pointer"
    >
      <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg" style={iconStyle}>
        {isUnavailable
          ? <AlertTriangle className="h-3.5 w-3.5 stroke-[1.5px]" />
          : <Icon className={`h-3.5 w-3.5 stroke-[1.5px] ${isTransition ? 'animate-pulse' : ''}`} />}
      </div>
      <span className="text-xs font-medium text-[var(--text-primary)] flex-1 text-left">{name}</span>
      <div className="flex items-center gap-1 flex-shrink-0">
        {isDoorOpen && <span className="text-[9px] font-bold text-orange-400">Tür auf</span>}
        <span className={`text-[10px] font-bold ${stateColor}`}>{stateLabel}</span>
      </div>
    </button>
  );
});

/* ── Contact summary row ─────────────────────────────────────────────── */

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
      className="flex items-center gap-2 w-full transition-all active:scale-[0.98] cursor-pointer"
    >
      <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg"
        style={isOpen
          ? { backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444' }
          : { backgroundColor: 'rgba(34,197,94,0.1)', color: '#22c55e' }}
      >
        <Shield className="h-3.5 w-3.5 stroke-[1.5px]" />
      </div>
      <span className="text-xs font-medium text-[var(--text-primary)] flex-1 text-left">{label}</span>
      <div className="flex items-center gap-1 flex-shrink-0">
        <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
        <span className={`text-[10px] font-bold ${stateColor}`}>{stateLabel}</span>
      </div>
    </button>
  );
});

/* ── Motion summary row ──────────────────────────────────────────────── */

const MotionRow = memo(({ entities, onClick }) => {
  const activeCount = MOTION_SENSORS.filter(({ entityId }) => entities[entityId]?.state === 'on').length;
  const isActive = activeCount > 0;

  return (
    <button
      type="button"
      data-haptic="card"
      onClick={onClick}
      style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
      className="flex items-center gap-2 w-full transition-all active:scale-[0.98] cursor-pointer"
    >
      <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg"
        style={isActive
          ? { backgroundColor: 'rgba(234,179,8,0.12)', color: '#facc15' }
          : { backgroundColor: 'rgba(34,197,94,0.1)',  color: '#22c55e' }}
      >
        <Activity className={`h-3.5 w-3.5 stroke-[1.5px] ${isActive ? 'animate-pulse' : ''}`} />
      </div>
      <span className="text-xs font-medium text-[var(--text-primary)] flex-1 text-left">Bewegungsmelder</span>
      <div className="flex items-center gap-1 flex-shrink-0">
        <span className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-yellow-400 animate-pulse' : 'bg-green-500'}`} />
        <span className={`text-[10px] font-bold ${isActive ? 'text-yellow-400' : 'text-green-400'}`}>
          {isActive ? `${activeCount} aktiv` : 'Keine'}
        </span>
      </div>
    </button>
  );
});

/* ── Alarm row ───────────────────────────────────────────────────────── */

const AlarmRow = memo(({ entity, onOpen }) => {
  const state = entity?.state;
  const isUnavailable = !state || state === 'unavailable' || state === 'unknown';
  const cfg = (!isUnavailable && ALARM_STATES[state]) || ALARM_STATES.disarmed;
  const { label, color, Icon, bg, fg } = cfg;

  return (
    <button
      type="button"
      data-haptic="card"
      onClick={onOpen}
      style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
      className="flex items-center gap-2 w-full transition-all active:scale-[0.98] cursor-pointer"
    >
      <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg"
        style={isUnavailable
          ? { backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444' }
          : { backgroundColor: bg, color: fg }}
      >
        {isUnavailable
          ? <AlertTriangle className="h-3.5 w-3.5 stroke-[1.5px]" />
          : <Icon className="h-3.5 w-3.5 stroke-[1.5px]" />}
      </div>
      <span className="text-xs font-medium text-[var(--text-primary)] flex-1 text-left">Alarmo</span>
      <span className={`text-[10px] font-bold flex-shrink-0 ${isUnavailable ? 'text-red-400' : color}`}>
        {isUnavailable ? '⚠' : label}
      </span>
    </button>
  );
});

/* ── Simulation switch row ───────────────────────────────────────────── */

const SimulationRow = memo(({ entity, callService }) => {
  const state = entity?.state;
  const isOn = state === 'on';
  const isUnavailable = !state || state === 'unavailable' || state === 'unknown';

  const toggle = useCallback(() => {
    if (isUnavailable) return;
    callService('switch', isOn ? 'turn_off' : 'turn_on', { entity_id: SIMULATION_SWITCH });
  }, [isOn, isUnavailable, callService]);

  return (
    <button
      type="button"
      data-haptic="card"
      disabled={isUnavailable}
      onClick={toggle}
      style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
      className={`flex items-center gap-2 w-full transition-all active:scale-[0.98] ${isUnavailable ? 'cursor-default opacity-50' : 'cursor-pointer'}`}
    >
      <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg"
        style={isOn
          ? { backgroundColor: 'rgba(96,165,250,0.12)', color: '#60a5fa' }
          : { backgroundColor: 'var(--glass-bg-hover)', color: 'var(--text-muted)' }}
      >
        <UserCheck className="h-3.5 w-3.5 stroke-[1.5px]" />
      </div>
      <span className="text-xs font-medium text-[var(--text-primary)] flex-1 text-left">Anwesenheit</span>
      <span className={`text-[10px] font-bold flex-shrink-0 ${isUnavailable ? 'text-red-400' : isOn ? 'text-blue-400' : 'text-[var(--text-muted)] opacity-60'}`}>
        {isUnavailable ? '⚠' : isOn ? 'Aktiv' : 'Inaktiv'}
      </span>
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
  setShowAlarmModal,
}) => {
  const layoutStyle = cardStyle ? {
    transform: cardStyle.transform,
    opacity: cardStyle.opacity,
    zIndex: cardStyle.zIndex,
    pointerEvents: cardStyle.pointerEvents,
    transition: cardStyle.transition,
  } : {};

  const p = isMobile ? 'px-3 py-3' : 'px-4 py-3';

  if (isMobile) {
    // Mobile: 3-column grid, 2 rows — no section labels, tight padding
    const b = 'border-[var(--glass-border)]';
    const mp = 'px-2.5 py-2';
    return (
      <div key={cardId} {...dragProps} className={`relative font-sans select-none ${editMode ? 'cursor-move' : ''}`} style={layoutStyle}>
        {controls}
        <div className="glass-texture rounded-2xl border border-[var(--glass-border)] bg-[var(--card-bg)] overflow-hidden">
          <div className="grid grid-cols-3">

            {/* Row 1 */}
            <div className={`${mp} flex flex-col gap-1.5 border-r border-b ${b}`}>
              <DetectionSection entity={entities[DETECTION_SWITCH]} callService={callService} mobile />
            </div>
            <div className={`${mp} flex flex-col gap-1.5 border-r border-b ${b}`}>
              {LOCKS.map((lock) => (
                <LockRow key={lock.entityId} {...lock} entities={entities} onOpen={setShowSecurityLockModal} />
              ))}
            </div>
            <div className={`${mp} flex flex-col gap-1.5 border-b ${b}`}>
              <ContactRow label="Türkontakte" summaryId={TUR_SUMMARY_ID} contacts={TUR_KONTAKTE} entities={entities}
                onClick={() => setShowSecurityContactsModal?.({ type: 'tür', contacts: TUR_KONTAKTE })} />
              <ContactRow label="Fensterkontakte" summaryId={FENSTER_SUMMARY_ID} contacts={FENSTER_KONTAKTE} entities={entities}
                onClick={() => setShowSecurityContactsModal?.({ type: 'fenster', contacts: FENSTER_KONTAKTE })} />
            </div>

            {/* Row 2 */}
            <div className={`${mp} flex flex-col justify-center border-r ${b}`}>
              <MotionRow entities={entities}
                onClick={() => setShowSecurityContactsModal?.({ type: 'bewegung', contacts: MOTION_SENSORS })} />
            </div>
            <div className={`${mp} flex flex-col justify-center border-r ${b}`}>
              <AlarmRow entity={entities[ALARM_ENTITY]} onOpen={() => setShowAlarmModal?.(ALARM_ENTITY)} />
            </div>
            <div className={`${mp} flex flex-col justify-center`}>
              <SimulationRow entity={entities[SIMULATION_SWITCH]} callService={callService} />
            </div>

          </div>
        </div>
      </div>
    );
  }

  // Desktop: single flex row
  return (
    <div key={cardId} {...dragProps} className={`relative font-sans select-none ${editMode ? 'cursor-move' : ''}`} style={layoutStyle}>
      {controls}
      <div className="glass-texture rounded-2xl border border-[var(--glass-border)] bg-[var(--card-bg)] overflow-hidden">
        <div className="flex items-stretch">

          {/* Detection */}
          <div className={`${p} flex flex-col gap-2 border-r border-[var(--glass-border)]`} style={{ minWidth: 180 }}>
            <SectionLabel>Detection</SectionLabel>
            <DetectionSection entity={entities[DETECTION_SWITCH]} callService={callService} />
          </div>

          {/* Schlösser */}
          <div className={`${p} flex flex-col gap-2 border-r border-[var(--glass-border)]`} style={{ minWidth: 180 }}>
            <SectionLabel>Schlösser</SectionLabel>
            {LOCKS.map((lock) => (
              <LockRow key={lock.entityId} {...lock} entities={entities} onOpen={setShowSecurityLockModal} />
            ))}
          </div>

          {/* Kontakte */}
          <div className={`${p} flex flex-col gap-2 border-r border-[var(--glass-border)]`} style={{ minWidth: 180 }}>
            <SectionLabel>Kontakte</SectionLabel>
            <ContactRow label="Türkontakte" summaryId={TUR_SUMMARY_ID} contacts={TUR_KONTAKTE} entities={entities}
              onClick={() => setShowSecurityContactsModal?.({ type: 'tür', contacts: TUR_KONTAKTE })} />
            <ContactRow label="Fensterkontakte" summaryId={FENSTER_SUMMARY_ID} contacts={FENSTER_KONTAKTE} entities={entities}
              onClick={() => setShowSecurityContactsModal?.({ type: 'fenster', contacts: FENSTER_KONTAKTE })} />
          </div>

          {/* Bewegung */}
          <div className={`${p} flex flex-col gap-2 border-r border-[var(--glass-border)]`} style={{ minWidth: 180 }}>
            <SectionLabel>Bewegung</SectionLabel>
            <MotionRow entities={entities}
              onClick={() => setShowSecurityContactsModal?.({ type: 'bewegung', contacts: MOTION_SENSORS })} />
          </div>

          {/* Alarm */}
          <div className={`${p} flex flex-col gap-2 border-r border-[var(--glass-border)]`} style={{ minWidth: 180 }}>
            <SectionLabel>Alarm</SectionLabel>
            <AlarmRow entity={entities[ALARM_ENTITY]} onOpen={() => setShowAlarmModal?.(ALARM_ENTITY)} />
          </div>

          {/* Anwesenheit */}
          <div className={`${p} flex flex-col gap-2 flex-1`} style={{ minWidth: 180 }}>
            <SectionLabel>Simulation</SectionLabel>
            <SimulationRow entity={entities[SIMULATION_SWITCH]} callService={callService} />
          </div>

        </div>
      </div>
    </div>
  );
};

export default memo(SecurityPanelCard);
