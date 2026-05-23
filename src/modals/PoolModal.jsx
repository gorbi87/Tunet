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
const BLUERIIOT_PH_STATE   = 'binary_sensor.poolsteuerung_d1_blueconnect_blueriiot_ph_state';
const BLUERIIOT_ORP        = 'sensor.poolsteuerung_d1_blueconnect_blueriiot_orp';
const BLUERIIOT_ORP_STATE  = 'binary_sensor.poolsteuerung_d1_blueconnect_blueriiot_orp_state';
const BLUERIIOT_TEMP       = 'sensor.poolsteuerung_d1_blueconnect_blueriiot_temperature';
const BLUERIIOT_CONDUCT    = 'sensor.poolsteuerung_d1_blueconnect_blueriiot_conductivity';
const BLUERIIOT_BATTERY    = 'sensor.poolsteuerung_d1_blueconnect_blueriiot_battery';
const BLUERIIOT_LAST_UPD   = 'sensor.poolsteuerung_d1_blueconnect_blueriiot_last_update';

function val(entity, decimals = 1) {
  if (!entity || entity.state === 'unavailable' || entity.state === 'unknown') return '–';
  const n = parseFloat(entity.state);
  return Number.isFinite(n) ? n.toFixed(decimals) : entity.state;
}

function SectionTitle({ children }) {
  return (
    <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--accent-color)]">
      {children}
    </p>
  );
}

function DataRow({ label, value, unit, warn, ok }) {
  const valueColor = warn
    ? 'text-orange-400'
    : ok
      ? 'text-[var(--status-success-fg)]'
      : 'text-[var(--text-primary)]';
  return (
    <div className="flex items-center justify-between py-2 border-b border-[var(--glass-border)] last:border-0">
      <span className="text-sm text-[var(--text-secondary)]">{label}</span>
      <span className={`text-sm font-semibold tabular-nums ${valueColor}`}>
        {value}{unit ? <span className="ml-1 text-xs font-normal text-[var(--text-muted)]">{unit}</span> : null}
      </span>
    </div>
  );
}

function SwitchRow({ label, on, onToggle }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <span className="text-sm text-[var(--text-secondary)]">{label}</span>
      <button
        onClick={onToggle}
        role="switch"
        aria-checked={on}
        aria-label={label}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${on ? 'bg-[var(--status-success-fg)]' : 'bg-[var(--glass-border)]'}`}
      >
        <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform duration-200 ${on ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
    </div>
  );
}

export default function PoolModal({ show, onClose, entities, callService }) {
  if (!show) return null;

  const modalTitleId = 'pool-modal-title';

  const vorlauf    = entities[VORLAUF];
  const ruecklauf  = entities[RUECKLAUF];
  const durchfluss = entities[DURCHFLUSS];
  const durchflussLh = (() => {
    const n = parseFloat(durchfluss?.state);
    return Number.isFinite(n) ? String(Math.round(n * 60)) : null;
  })();
  const filterpumpe = entities[FILTERPUMPE];
  const waermepumpe = entities[WAERMEPUMPE];
  const shellyPower  = entities[SHELLY_POWER];
  const shellyEnergy = entities[SHELLY_ENERGY];
  const chlorpumpeVor  = entities[CHLORPUMPE_VOR];
  const chlorpumpeRueck = entities[CHLORPUMPE_RUECK];
  const chlordosierung = entities[CHLORDOSIERUNG];
  const chlorSchaetz = entities[CHLOR_SCHAETZ];
  const chlorCounter = entities[CHLOR_COUNTER];

  const blueConnected = entities[BLUERIIOT_CONNECTION]?.state === 'on';
  const phState  = entities[BLUERIIOT_PH_STATE]?.state;
  const orpState = entities[BLUERIIOT_ORP_STATE]?.state;

  const vorlaufVal   = parseFloat(vorlauf?.state);
  const ruecklaufVal = parseFloat(ruecklauf?.state);
  const differenz    = Number.isFinite(vorlaufVal) && Number.isFinite(ruecklaufVal)
    ? (vorlaufVal - ruecklaufVal).toFixed(1)
    : '–';

  const toggle = (domain, entityId) => {
    const e = entities[entityId];
    if (!e) return;
    const action = e.state === 'on' ? 'turn_off' : 'turn_on';
    callService(domain, action, { entity_id: entityId });
  };

  const chlorMin = parseFloat(chlordosierung?.attributes?.min ?? 0);
  const chlorMax = parseFloat(chlordosierung?.attributes?.max ?? 100);
  const chlorStep = parseFloat(chlordosierung?.attributes?.step ?? 1);
  const chlorVal  = parseFloat(chlordosierung?.state ?? 0);

  return (
    <AccessibleModalShell
      open={show}
      onClose={onClose}
      titleId={modalTitleId}
      overlayClassName="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6"
      overlayStyle={{ backdropFilter: 'blur(20px)', backgroundColor: 'rgba(0,0,0,0.3)' }}
      panelClassName="popup-anim relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border p-6 font-sans backdrop-blur-xl md:rounded-[3rem] md:p-10"
      panelStyle={{
        background: 'linear-gradient(135deg, var(--card-bg) 0%, var(--modal-bg) 100%)',
        borderColor: 'var(--glass-border)',
        color: 'var(--text-primary)',
      }}
    >
      {() => (
        <>
          {/* Close */}
          <div className="absolute top-6 right-6 z-20 md:top-8 md:right-8">
            <button onClick={onClose} className="modal-close" aria-label="Schließen">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Header */}
          <div className="mb-8 flex items-center gap-4">
            <div className="rounded-2xl p-4" style={{ backgroundColor: 'rgba(56,189,248,0.12)', color: '#38bdf8' }}>
              <FaWaterLadder className="h-8 w-8" />
            </div>
            <div>
              <h3 id={modalTitleId} className="text-2xl leading-none font-light tracking-tight text-[var(--text-primary)] uppercase italic">
                Pool
              </h3>
              <div className="mt-2 inline-block rounded-full border px-3 py-1" style={{ backgroundColor: 'var(--glass-bg)', borderColor: 'var(--glass-border)', color: 'var(--text-secondary)' }}>
                <p className="text-[10px] font-bold tracking-widest uppercase italic">Poolsteuerung D1</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">

            {/* Temperaturen & Durchfluss */}
            <div className="popup-surface rounded-2xl p-5">
              <SectionTitle>Temperaturen & Durchfluss</SectionTitle>
              <DataRow label="Vorlauf"   value={val(vorlauf)}   unit="°C" />
              <DataRow label="Rücklauf"  value={val(ruecklauf)} unit="°C" />
              <DataRow label="Differenz" value={differenz}       unit="K" />
              <DataRow label="Durchfluss" value={durchflussLh ?? '–'} unit="l/h" />
            </div>

            {/* BlueConnect */}
            <div className="popup-surface rounded-2xl p-5">
              <SectionTitle>BlueConnect</SectionTitle>
              {blueConnected ? (
                <>
                  <DataRow
                    label="pH"
                    value={val(entities[BLUERIIOT_PH], 2)}
                    warn={phState === 'off'}
                    ok={phState === 'on'}
                  />
                  <DataRow
                    label="ORP / Redox"
                    value={val(entities[BLUERIIOT_ORP], 0)}
                    unit="mV"
                    warn={orpState === 'off'}
                    ok={orpState === 'on'}
                  />
                  <DataRow label="Temperatur"   value={val(entities[BLUERIIOT_TEMP])}    unit="°C" />
                  <DataRow label="Leitfähigkeit" value={val(entities[BLUERIIOT_CONDUCT], 0)} unit="µS/cm" />
                  <DataRow label="Batterie"     value={val(entities[BLUERIIOT_BATTERY], 0)} unit="%" />
                  <DataRow label="Letztes Update" value={
                    entities[BLUERIIOT_LAST_UPD]?.state && entities[BLUERIIOT_LAST_UPD].state !== 'unknown'
                      ? new Date(entities[BLUERIIOT_LAST_UPD].state).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
                      : '–'
                  } />
                </>
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 py-6 text-center">
                  <FaWaterLadder className="h-6 w-6 opacity-20" style={{ color: '#38bdf8' }} />
                  <p className="text-xs text-[var(--text-muted)]">
                    {entities[BLUERIIOT_CONNECTION]?.state === 'unknown'
                      ? 'Sensor noch nicht angeschlossen'
                      : 'Sensor nicht verbunden'}
                  </p>
                </div>
              )}
            </div>

            {/* Pumpen & Leistung */}
            <div className="popup-surface rounded-2xl p-5">
              <SectionTitle>Pumpen & Leistung</SectionTitle>
              <SwitchRow
                label="Filterpumpe"
                on={filterpumpe?.state === 'on'}
                onToggle={() => toggle('switch', FILTERPUMPE)}
              />
              <SwitchRow
                label="Wärmepumpe"
                on={waermepumpe?.state === 'on'}
                onToggle={() => toggle('switch', WAERMEPUMPE)}
              />
              <div className="mt-3 border-t border-[var(--glass-border)] pt-3">
                <DataRow label="Leistung" value={val(shellyPower, 0)} unit="W" />
                <DataRow label="Energie gesamt" value={val(shellyEnergy, 2)} unit="kWh" />
              </div>
            </div>

            {/* Chlor */}
            <div className="popup-surface rounded-2xl p-5">
              <SectionTitle>Chlor</SectionTitle>
              <DataRow label="Schätzwert" value={val(chlorSchaetz, 2)} unit="mg/l" />
              <DataRow label="Gesamtzähler" value={val(chlorCounter, 0)} unit="ml" />

              {/* Chlordosierung Slider */}
              <div className="mt-3 border-t border-[var(--glass-border)] pt-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs text-[var(--text-secondary)]">Chlordosierung</p>
                  <span className="text-xs font-semibold tabular-nums text-[var(--text-primary)]">
                    {Number.isFinite(chlorVal) ? chlorVal.toFixed(0) : '–'} ml
                  </span>
                </div>
                <input
                  type="range"
                  min={chlorMin}
                  max={chlorMax}
                  step={chlorStep}
                  value={Number.isFinite(chlorVal) ? chlorVal : chlorMin}
                  onChange={(e) =>
                    callService('number', 'set_value', {
                      entity_id: CHLORDOSIERUNG,
                      value: parseFloat(e.target.value),
                    })
                  }
                  className="w-full accent-[var(--accent-color)]"
                />
              </div>

              {/* Chlorpumpe Buttons */}
              <div className="mt-3 border-t border-[var(--glass-border)] pt-3">
                <p className="mb-2 text-xs text-[var(--text-secondary)]">Chlorpumpe</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => toggle('switch', CHLORPUMPE_VOR)}
                    className={`flex-1 rounded-xl border py-2 text-xs font-semibold transition-colors ${chlorpumpeVor?.state === 'on'
                      ? 'border-[var(--status-success-border)] bg-[var(--status-success-bg)] text-[var(--status-success-fg)]'
                      : 'border-[var(--glass-border)] bg-[var(--glass-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    ▶ Vorwärts
                  </button>
                  <button
                    onClick={() => toggle('switch', CHLORPUMPE_RUECK)}
                    className={`flex-1 rounded-xl border py-2 text-xs font-semibold transition-colors ${chlorpumpeRueck?.state === 'on'
                      ? 'border-orange-500/30 bg-orange-500/10 text-orange-400'
                      : 'border-[var(--glass-border)] bg-[var(--glass-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    ◀ Rückwärts
                  </button>
                </div>
                <button
                  onClick={() => callService('button', 'press', { entity_id: CHLORZUGABE })}
                  className="mt-2 w-full rounded-xl border border-[var(--accent-color)] bg-[var(--accent-bg)] py-2 text-xs font-semibold text-[var(--accent-color)] transition-colors hover:opacity-80"
                >
                  Chlorzugabe starten
                </button>
              </div>
            </div>

          </div>
        </>
      )}
    </AccessibleModalShell>
  );
}
