import { useState } from 'react';
import { X } from '../icons';
import { FaWaterLadder } from 'react-icons/fa6';
import AccessibleModalShell from '../components/ui/AccessibleModalShell';

const VORLAUF     = 'sensor.poolsteuerung_d1_blueconnect_vorlauf';
const RUECKLAUF   = 'sensor.poolsteuerung_d1_blueconnect_r_cklauf';
const DURCHFLUSS  = 'sensor.poolsteuerung_d1_blueconnect_durchflussmesser';
const FILTERPUMPE = 'switch.poolsteuerung_d1_blueconnect_filterpumpe';
const WAERMEPUMPE = 'switch.poolsteuerung_d1_blueconnect_w_rmepumpe';
const CHLORPUMPE_VOR   = 'switch.poolsteuerung_d1_blueconnect_chlorpumpe_vorw_rts';
const CHLORPUMPE_RUECK = 'switch.poolsteuerung_d1_blueconnect_chlorpumpe_r_ckw_rts';
const CHLORDOSIERUNG   = 'number.poolsteuerung_d1_blueconnect_chlordosierung';
const CHLORZUGABE      = 'button.poolsteuerung_d1_blueconnect_chlorzugabe';
const CHLOR_SCHAETZ    = 'sensor.pool_chlor_schatzwert';
const SHELLY_POWER     = 'sensor.shellypmminig3_power';
const SHELLY_ENERGY    = 'sensor.shellypmminig3_energy';
const CHLOR_COUNTER    = 'input_number.pool_chlorine_total_counter';

const BLUERIIOT_CONNECTION = 'binary_sensor.poolsteuerung_d1_blueconnect_blueriiot_connection_state';
const BLUERIIOT_PH         = 'sensor.poolsteuerung_d1_blueconnect_blueriiot_ph';
const BLUERIIOT_ORP        = 'sensor.poolsteuerung_d1_blueconnect_blueriiot_orp';
const BLUERIIOT_TEMP       = 'sensor.poolsteuerung_d1_blueconnect_blueriiot_temperature';
const BLUERIIOT_CONDUCT    = 'sensor.poolsteuerung_d1_blueconnect_blueriiot_conductivity';
const BLUERIIOT_LAST_UPD   = 'sensor.poolsteuerung_d1_blueconnect_blueriiot_last_update';
const BLUERIIOT_READ       = 'switch.poolsteuerung_d1_blueconnect_blueriiot_read_sensors';
const CHLOR_AUTO           = 'automation.automatische_chlordosierung_variabel';
const LETZTE_DOSIERMENGE   = 'input_number.pool_letzte_dosiermenge';

const ACCENT = '#38bdf8';
const POOL_VOLUMEN_L = 8300;
const CHLOR_KONZENTRATION = 0.135; // Summer Fun Professional 12–15%, Mittelwert 13.5%
const CHLOR_ZIEL_MGL = 0.5;       // Zielwert freies Chlor in mg/l

const PH_SCALE = {
  min: 6.8, max: 7.8,
  stops: [
    { at: 6.8, color: '#ef4444' },
    { at: 7.0, color: '#f97316' },
    { at: 7.2, color: '#22c55e' },
    { at: 7.4, color: '#22c55e' },
    { at: 7.6, color: '#f97316' },
    { at: 7.8, color: '#ef4444' },
  ],
  labels: ['niedrig', 'optimal', 'hoch'],
};

const ORP_SCALE = {
  min: 400, max: 900,
  stops: [
    { at: 400, color: '#ef4444' },
    { at: 550, color: '#f97316' },
    { at: 650, color: '#22c55e' },
    { at: 750, color: '#22c55e' },
    { at: 850, color: '#f97316' },
    { at: 900, color: '#ef4444' },
  ],
  labels: ['niedrig', 'optimal', 'hoch'],
};

function interpolateColor(stops, value, min, max) {
  const clamped = Math.max(min, Math.min(max, value));
  for (let i = 0; i < stops.length - 1; i++) {
    if (clamped <= stops[i + 1].at) {
      const t = (clamped - stops[i].at) / (stops[i + 1].at - stops[i].at);
      return t < 0.5 ? stops[i].color : stops[i + 1].color;
    }
  }
  return stops[stops.length - 1].color;
}

function QualityScale({ value, config }) {
  const { min, max, stops, labels } = config;
  if (!Number.isFinite(value)) return null;
  const pct = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
  const dotColor = interpolateColor(stops, value, min, max);
  const gradient = stops.map(s => {
    const p = ((s.at - min) / (max - min) * 100).toFixed(1);
    return `${s.color} ${p}%`;
  }).join(', ');
  return (
    <div className="mt-2 mb-0.5">
      <div className="relative h-1.5 rounded-full" style={{ background: `linear-gradient(to right, ${gradient})` }}>
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-3.5 w-3.5 rounded-full bg-[var(--popup-surface-bg,var(--card-bg))] shadow-md"
          style={{ left: `${pct}%`, boxShadow: `0 0 0 2.5px ${dotColor}` }}
        />
      </div>
      {labels && (
        <div className="mt-1.5 flex justify-between">
          {labels.map((l) => (
            <span key={l} className="text-[9px] text-[var(--text-muted)] uppercase tracking-wide">{l}</span>
          ))}
        </div>
      )}
    </div>
  );
}

function val(entity, decimals = 1) {
  if (!entity || entity.state === 'unavailable' || entity.state === 'unknown') return '–';
  const n = parseFloat(entity.state);
  return Number.isFinite(n) ? n.toFixed(decimals) : entity.state;
}

function SectionTitle({ children }) {
  return (
    <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>
      {children}
    </p>
  );
}

function DataRow({ label, value, unit, scale }) {
  return (
    <div className={`border-b py-2 last:border-0 ${scale ? 'pb-1' : ''}`} style={{ borderColor: 'var(--glass-border)' }}>
      <div className="flex items-center justify-between">
        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{label}</span>
        <span className="text-sm font-semibold tabular-nums" style={{ color: 'var(--text-primary)' }}>
          {value}{unit ? <span className="ml-1 text-xs font-normal" style={{ color: 'var(--text-muted)' }}>{unit}</span> : null}
        </span>
      </div>
      {scale}
    </div>
  );
}

function SwitchRow({ label, on, onToggle }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{label}</span>
      <button
        onClick={onToggle}
        role="switch"
        aria-checked={on}
        aria-label={label}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none`}
        style={{ backgroundColor: on ? 'var(--status-success-fg)' : 'var(--glass-border)' }}
      >
        <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform duration-200 ${on ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
    </div>
  );
}

function InfoTile({ label, value, unit, color }) {
  return (
    <div className="popup-surface flex flex-col items-center justify-center gap-1 rounded-2xl p-4">
      <p className="text-[10px] font-bold tracking-[0.15em] uppercase" style={{ color: 'var(--text-muted)' }}>{label}</p>
      <p className="text-xl font-light" style={{ color: color || 'var(--text-primary)' }}>
        {value}{unit ? <span className="ml-1 text-xs" style={{ color: 'var(--text-muted)' }}>{unit}</span> : null}
      </p>
    </div>
  );
}

const TABS = [
  { key: 'wasser', label: 'Wasser' },
  { key: 'pumpen', label: 'Pumpen & Strom' },
  { key: 'chlor', label: 'Chlor' },
];

export default function PoolModal({ show, onClose, entities, callService }) {
  const [tab, setTab] = useState('wasser');
  const modalTitleId = 'pool-modal-title';

  if (!show) return null;

  const toggle = (domain, entityId) => {
    const e = entities[entityId];
    if (!e) return;
    callService(domain, e.state === 'on' ? 'turn_off' : 'turn_on', { entity_id: entityId });
  };

  const filterpumpe = entities[FILTERPUMPE];
  const waermepumpe = entities[WAERMEPUMPE];
  const filterOn = filterpumpe?.state === 'on';
  const waermeOn = waermepumpe?.state === 'on';
  const isActive = filterOn || waermeOn;

  const phVal  = parseFloat(entities[BLUERIIOT_PH]?.state);
  const orpVal = parseFloat(entities[BLUERIIOT_ORP]?.state);
  const blueConnected = entities[BLUERIIOT_CONNECTION]?.state === 'on' || Number.isFinite(phVal);

  const vorlaufVal   = parseFloat(entities[VORLAUF]?.state);
  const ruecklaufVal = parseFloat(entities[RUECKLAUF]?.state);
  const differenz    = Number.isFinite(vorlaufVal) && Number.isFinite(ruecklaufVal)
    ? (vorlaufVal - ruecklaufVal).toFixed(1) : '–';

  const durchflussLh = (() => {
    const n = parseFloat(entities[DURCHFLUSS]?.state);
    return Number.isFinite(n) ? String(Math.round(n * 60)) : null;
  })();

  const chlordosierung = entities[CHLORDOSIERUNG];
  const chlorMin  = parseFloat(chlordosierung?.attributes?.min ?? 0);
  const chlorMax  = parseFloat(chlordosierung?.attributes?.max ?? 100);
  const chlorStep = parseFloat(chlordosierung?.attributes?.step ?? 1);
  const chlorVal  = parseFloat(chlordosierung?.state ?? 0);

  const lastUpdateDisplay = (() => {
    const raw = entities[BLUERIIOT_LAST_UPD]?.state;
    if (!raw || raw === 'unknown' || raw === 'unavailable') return '–';
    const normalized = raw.replace(/(\d{2})\.(\d{2})$/, '$1:$2');
    const d = new Date(normalized);
    return Number.isFinite(d.getTime())
      ? d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
      : '–';
  })();

  const isCompact = window.innerHeight < 900 ||
    window.matchMedia('(hover: none) and (pointer: coarse)').matches;

  return (
    <AccessibleModalShell
      open={show}
      onClose={onClose}
      titleId={modalTitleId}
      overlayClassName={isCompact
        ? 'fixed inset-0 z-50 flex items-stretch justify-center'
        : 'fixed inset-0 z-50 flex items-center justify-center p-6'}
      overlayStyle={{ backdropFilter: 'blur(20px)', backgroundColor: 'rgba(0,0,0,0.3)' }}
      panelClassName={isCompact
        ? 'popup-anim relative flex flex-col w-full max-w-2xl h-full overflow-hidden rounded-none border font-sans backdrop-blur-xl'
        : 'popup-anim relative flex flex-col w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-[3rem] border font-sans backdrop-blur-xl'}
      panelStyle={{
        background: 'linear-gradient(135deg, var(--card-bg) 0%, var(--modal-bg) 100%)',
        borderColor: 'var(--glass-border)',
        color: 'var(--text-primary)',
      }}
    >
      {() => (
        <>
          {/* Fixed header */}
          <div
            className={`flex-shrink-0 border-b ${isCompact ? 'p-4 pb-3' : 'p-8 pb-5'}`}
            style={{ borderColor: 'var(--glass-border)' }}
          >
            <div className="absolute top-4 right-4 z-20">
              <button onClick={onClose} className="modal-close" aria-label="Schließen">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Icon + title */}
            <div className="mb-4 flex items-center gap-3 pr-10">
              <div className="rounded-2xl p-3" style={{ backgroundColor: 'rgba(56,189,248,0.15)', color: ACCENT }}>
                <FaWaterLadder className="h-6 w-6" />
              </div>
              <div>
                <h3 id={modalTitleId} className="text-xl leading-none font-light tracking-tight uppercase italic" style={{ color: 'var(--text-primary)' }}>
                  Pool
                </h3>
                <div
                  className="mt-2 inline-flex items-center gap-2 rounded-full border px-3 py-1"
                  style={{
                    backgroundColor: isActive ? 'var(--status-success-bg)' : 'var(--glass-bg)',
                    borderColor: isActive ? 'var(--status-success-border)' : 'var(--glass-border)',
                  }}
                >
                  <span className={`h-2 w-2 rounded-full ${isActive ? 'bg-[var(--status-success-fg)]' : 'bg-[var(--text-muted)]'}`} />
                  <p className="text-[10px] font-bold tracking-widest uppercase italic"
                    style={{ color: isActive ? 'var(--status-success-fg)' : 'var(--text-secondary)' }}>
                    {filterOn && waermeOn ? 'Filter & Heizung' : filterOn ? 'Filter' : waermeOn ? 'Heizung' : 'Standby'}
                  </p>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex rounded-2xl p-1" style={{ backgroundColor: 'var(--glass-bg)' }}>
              {TABS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className="flex-1 rounded-xl py-2 text-[11px] font-bold tracking-widest uppercase transition-all"
                  style={tab === key
                    ? { backgroundColor: 'rgba(56,189,248,0.15)', border: `1px solid ${ACCENT}`, color: ACCENT }
                    : { color: 'var(--text-secondary)' }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Scrollable content */}
          <div className={`flex-1 overflow-y-auto ${isCompact ? 'p-4' : 'p-8'}`}>

            {/* Tab: Wasser */}
            {tab === 'wasser' && (
              <>
                {blueConnected ? (
                  <>
                    <div className="mb-4 grid grid-cols-2 gap-3">
                      <InfoTile
                        label="pH"
                        value={Number.isFinite(phVal) ? phVal.toFixed(2) : '–'}
                        color={Number.isFinite(phVal)
                          ? phVal < 7.0 ? '#ef4444' : phVal < 7.2 ? '#f97316' : phVal <= 7.4 ? '#22c55e' : phVal <= 7.6 ? '#f97316' : '#ef4444'
                          : undefined}
                      />
                      <InfoTile
                        label="ORP / Redox"
                        value={Number.isFinite(orpVal) ? Math.round(orpVal) : '–'}
                        unit="mV"
                        color={Number.isFinite(orpVal)
                          ? orpVal < 650 ? '#ef4444' : orpVal <= 750 ? '#22c55e' : '#f97316'
                          : undefined}
                      />
                    </div>

                    <div className="popup-surface mb-4 rounded-2xl p-5">
                      <SectionTitle>pH-Wert</SectionTitle>
                      <QualityScale value={phVal} config={PH_SCALE} />
                    </div>

                    <div className="popup-surface mb-4 rounded-2xl p-5">
                      <SectionTitle>ORP / Redox</SectionTitle>
                      <QualityScale value={orpVal} config={ORP_SCALE} />
                    </div>

                    <div className="popup-surface rounded-2xl p-5">
                      <SectionTitle>Sensor</SectionTitle>
                      <DataRow label="Temperatur" value={val(entities[BLUERIIOT_TEMP])} unit="°C" />
                      <DataRow label="Leitfähigkeit" value={val(entities[BLUERIIOT_CONDUCT], 0)} unit="µS/cm" />
                      <DataRow label="Letztes Update" value={lastUpdateDisplay} />
                      <SwitchRow
                        label="Read Sensors"
                        on={entities[BLUERIIOT_READ]?.state === 'on'}
                        onToggle={() => toggle('switch', BLUERIIOT_READ)}
                      />
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                    <FaWaterLadder className="h-8 w-8 opacity-20" style={{ color: ACCENT }} />
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      {entities[BLUERIIOT_CONNECTION]?.state === 'unknown'
                        ? 'Sensor noch nicht angeschlossen'
                        : 'Sensor nicht verbunden'}
                    </p>
                  </div>
                )}
              </>
            )}

            {/* Tab: Pumpen & Strom */}
            {tab === 'pumpen' && (
              <>
                <div className="popup-surface mb-4 rounded-2xl p-5">
                  <SectionTitle>Pumpen</SectionTitle>
                  <SwitchRow label="Filterpumpe" on={filterOn} onToggle={() => toggle('switch', FILTERPUMPE)} />
                  <SwitchRow label="Wärmepumpe" on={waermeOn} onToggle={() => toggle('switch', WAERMEPUMPE)} />
                </div>

                <div className="mb-4 grid grid-cols-2 gap-3">
                  <InfoTile label="Leistung" value={val(entities[SHELLY_POWER], 0)} unit="W" />
                  <InfoTile label="Energie" value={val(entities[SHELLY_ENERGY], 2)} unit="kWh" />
                </div>

                <div className="popup-surface rounded-2xl p-5">
                  <SectionTitle>Temperaturen & Durchfluss</SectionTitle>
                  <DataRow label="Vorlauf" value={val(entities[VORLAUF])} unit="°C" />
                  <DataRow label="Rücklauf" value={val(entities[RUECKLAUF])} unit="°C" />
                  <DataRow label="Differenz" value={differenz} unit="K" />
                  <DataRow label="Durchfluss" value={durchflussLh ?? '–'} unit="l/h" />
                </div>
              </>
            )}

            {/* Tab: Chlor */}
            {tab === 'chlor' && (
              <>
                <div className="mb-4 grid grid-cols-2 gap-3">
                  <InfoTile label="Schätzwert" value={val(entities[CHLOR_SCHAETZ], 2)} unit="mg/l" />
                  <InfoTile label="Gesamtzähler" value={val(entities[CHLOR_COUNTER], 0)} unit="ml" />
                </div>

                {/* Dosierempfehlung */}
                {(() => {
                  const current = parseFloat(entities[CHLOR_SCHAETZ]?.state);
                  if (!Number.isFinite(current)) return null;
                  const delta = CHLOR_ZIEL_MGL - current;
                  if (delta <= 0) {
                    return (
                      <div className="mb-4 rounded-2xl border p-4 text-center"
                        style={{ borderColor: 'var(--status-success-border)', backgroundColor: 'var(--status-success-bg)' }}>
                        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--status-success-fg)' }}>
                          Chlorgehalt optimal
                        </p>
                        <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                          Kein Chlor erforderlich
                        </p>
                      </div>
                    );
                  }
                  const ml = Math.round(delta * POOL_VOLUMEN_L / (CHLOR_KONZENTRATION * 1000));
                  return (
                    <div className="mb-4 rounded-2xl border p-4"
                      style={{ borderColor: ACCENT, backgroundColor: 'rgba(56,189,248,0.08)' }}>
                      <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>
                        Dosierempfehlung
                      </p>
                      <div className="flex items-end gap-2">
                        <span className="text-3xl font-light" style={{ color: ACCENT }}>{ml}</span>
                        <span className="mb-1 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>ml</span>
                        <span className="mb-1 ml-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                          um auf {CHLOR_ZIEL_MGL} mg/l zu kommen
                        </span>
                      </div>
                      <p className="mt-2 text-[10px]" style={{ color: 'var(--text-muted)' }}>
                        Summer Fun 12–15% · 8300 L · Istwert {current.toFixed(2)} mg/l
                      </p>
                    </div>
                  );
                })()}

                <div className="popup-surface mb-4 rounded-2xl p-5">
                  <SectionTitle>Chlordosierung</SectionTitle>
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Menge</span>
                    <span className="text-sm font-semibold tabular-nums" style={{ color: 'var(--text-primary)' }}>
                      {Number.isFinite(chlorVal) ? chlorVal.toFixed(0) : '–'} ml
                    </span>
                  </div>
                  <input
                    type="range"
                    min={chlorMin}
                    max={chlorMax}
                    step={chlorStep}
                    value={Number.isFinite(chlorVal) ? chlorVal : chlorMin}
                    onChange={(e) => callService('number', 'set_value', {
                      entity_id: CHLORDOSIERUNG,
                      value: parseFloat(e.target.value),
                    })}
                    className="w-full accent-[var(--accent-color)]"
                  />
                </div>

                <div className="popup-surface rounded-2xl p-5">
                  <SectionTitle>Chlorpumpe</SectionTitle>
                  <div className="flex gap-2 mb-3">
                    <button
                      onClick={() => toggle('switch', CHLORPUMPE_VOR)}
                      className={`flex-1 rounded-xl border py-2.5 text-xs font-semibold transition-colors ${entities[CHLORPUMPE_VOR]?.state === 'on'
                        ? 'border-[var(--status-success-border)] bg-[var(--status-success-bg)] text-[var(--status-success-fg)]'
                        : 'border-[var(--glass-border)] bg-[var(--glass-bg)] text-[var(--text-secondary)]'}`}
                    >
                      ▶ Vorwärts
                    </button>
                    <button
                      onClick={() => toggle('switch', CHLORPUMPE_RUECK)}
                      className={`flex-1 rounded-xl border py-2.5 text-xs font-semibold transition-colors ${entities[CHLORPUMPE_RUECK]?.state === 'on'
                        ? 'border-orange-500/30 bg-orange-500/10 text-orange-400'
                        : 'border-[var(--glass-border)] bg-[var(--glass-bg)] text-[var(--text-secondary)]'}`}
                    >
                      ◀ Rückwärts
                    </button>
                  </div>
                  <button
                    onClick={() => callService('button', 'press', { entity_id: CHLORZUGABE })}
                    className="w-full rounded-xl border py-2.5 text-xs font-semibold transition-colors hover:opacity-80"
                    style={{ borderColor: ACCENT, backgroundColor: 'rgba(56,189,248,0.1)', color: ACCENT }}
                  >
                    Chlorzugabe starten
                  </button>
                </div>

                {/* Automatische Dosierung */}
                {(() => {
                  const auto = entities[CHLOR_AUTO];
                  const autoOn = auto?.state === 'on';
                  const lastTriggered = auto?.attributes?.last_triggered;
                  const lastTriggeredDisplay = (() => {
                    if (!lastTriggered) return null;
                    const d = new Date(lastTriggered);
                    if (!Number.isFinite(d.getTime())) return null;
                    const today = new Date();
                    const isToday = d.toDateString() === today.toDateString();
                    return isToday
                      ? d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
                      : d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }) + ' ' + d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
                  })();
                  return (
                    <div className="popup-surface mt-4 rounded-2xl p-5">
                      <SectionTitle>Automatische Dosierung</SectionTitle>
                      <SwitchRow
                        label="Stündlich dosieren"
                        on={autoOn}
                        onToggle={() => callService('automation', autoOn ? 'turn_off' : 'turn_on', { entity_id: CHLOR_AUTO })}
                      />
                      <div className="mt-2 rounded-xl p-3" style={{ backgroundColor: 'var(--glass-bg)' }}>
                        <p className="text-[10px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                          {autoOn
                            ? 'Aktiv · Messung & Dosierung stündlich zur vollen Stunde wenn Filterpumpe läuft'
                            : 'Inaktiv · Keine automatische Dosierung'}
                        </p>
                        {lastTriggeredDisplay && (
                          <p className="mt-1 text-[10px]" style={{ color: 'var(--text-muted)' }}>
                            Zuletzt ausgeführt: {lastTriggeredDisplay}
                          </p>
                        )}
                      </div>
                      {(() => {
                        const letzteDosis = parseFloat(entities[LETZTE_DOSIERMENGE]?.state);
                        const hasDosis = Number.isFinite(letzteDosis) && letzteDosis > 0;
                        return (
                          <div className="mt-3 flex items-center justify-between border-t pt-3" style={{ borderColor: 'var(--glass-border)' }}>
                            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Letzte Dosiermenge</span>
                            <span className="text-sm font-semibold tabular-nums" style={{ color: hasDosis ? ACCENT : 'var(--text-muted)' }}>
                              {hasDosis ? `${letzteDosis.toFixed(0)} ml` : 'Noch nicht gelaufen'}
                            </span>
                          </div>
                        );
                      })()}
                    </div>
                  );
                })()}
              </>
            )}

          </div>
        </>
      )}
    </AccessibleModalShell>
  );
}
