import { useState } from 'react';
import { Fan, X } from '../icons';
import { LUFTUNGSANLAGE_ENTITY_IDS } from '../components/cards/GenericLuftungsanlageCard';
import AccessibleModalShell from '../components/ui/AccessibleModalShell';

const ACCENT = '#38bdf8';

function SelectPills({ options, current, onSelect }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const isActive = opt.value === current;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onSelect(opt.value)}
            className="rounded-full border px-3 py-1.5 text-[11px] font-bold tracking-wider uppercase transition-all"
            style={
              isActive
                ? {
                    backgroundColor: 'rgba(56, 189, 248, 0.15)',
                    borderColor: ACCENT,
                    color: ACCENT,
                  }
                : {
                    backgroundColor: 'var(--glass-bg)',
                    borderColor: 'var(--glass-border)',
                    color: 'var(--text-secondary)',
                  }
            }
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function getCo2Color(ppm) {
  if (ppm == null) return 'var(--text-primary)';
  if (ppm < 800) return '#4ade80';
  if (ppm < 1000) return '#fb923c';
  return '#f87171';
}

function parseLastMode(raw) {
  if (!raw) return null;
  if (raw.startsWith('temp_auto_')) return `Temp-Auto (${raw.replace('temp_auto_', '')})`;
  if (raw.startsWith('aq_')) return `Luftqualität (${raw.replace('aq_', '')})`;
  if (raw.startsWith('boost_')) return `Boost (${raw.replace('boost_', '')})`;
  if (raw === 'temp_off') return 'Temperatur Aus';
  return raw;
}

export default function LuftungsanlageModal({
  show,
  onClose,
  entities,
  customNames,
  cardId,
  callService,
  t,
}) {
  const translate = t || ((key) => key);
  const [mainTab, setMainTab] = useState('betrieb');
  const modalTitleId = 'luftungsanlage-modal-title';

  if (!show) return null;

  const name = customNames?.[cardId] || translate('luftungsanlage.title');

  const e = (id) => entities?.[id];
  const val = (id) => {
    const v = parseFloat(e(id)?.state);
    return Number.isFinite(v) ? v : null;
  };
  const str = (id) => e(id)?.state || null;

  const setHvacMode = (mode) => {
    callService?.('climate', 'set_hvac_mode', {
      entity_id: LUFTUNGSANLAGE_ENTITY_IDS.climate,
      hvac_mode: mode,
    });
  };

  const setFanMode = (mode) => {
    callService?.('climate', 'set_fan_mode', {
      entity_id: LUFTUNGSANLAGE_ENTITY_IDS.climate,
      fan_mode: mode,
    });
  };

  const hvacState = str(LUFTUNGSANLAGE_ENTITY_IDS.climate);
  const fanMode = e(LUFTUNGSANLAGE_ENTITY_IDS.climate)?.attributes?.fan_mode || null;
  const aussenluft = val(LUFTUNGSANLAGE_ENTITY_IDS.aussenluft);
  const zuluft = val(LUFTUNGSANLAGE_ENTITY_IDS.zuluft);
  const abluft = val(LUFTUNGSANLAGE_ENTITY_IDS.abluft);
  const fortluft = val(LUFTUNGSANLAGE_ENTITY_IDS.fortluft);
  const bypass = val(LUFTUNGSANLAGE_ENTITY_IDS.bypass);
  const zuluftRpm = val(LUFTUNGSANLAGE_ENTITY_IDS.zuluftRpm);
  const abluftRpm = val(LUFTUNGSANLAGE_ENTITY_IDS.abluftRpm);
  const luftstufe = str(LUFTUNGSANLAGE_ENTITY_IDS.luftstufe);
  const filter = str(LUFTUNGSANLAGE_ENTITY_IDS.filter);
  const lastMode = str(LUFTUNGSANLAGE_ENTITY_IDS.lastMode);

  // WRG efficiency: (zuluft - aussen) / (abluft - aussen) * 100, only when bypass == 0
  const isBypass = bypass != null && bypass > 0;
  let wrgEfficiency = null;
  if (!isBypass && aussenluft != null && zuluft != null && abluft != null) {
    const denom = abluft - aussenluft;
    if (Math.abs(denom) > 0.1) {
      wrgEfficiency = Math.round(((zuluft - aussenluft) / denom) * 100);
    }
  }

  // CO2 / air quality
  const co2Eg = val(LUFTUNGSANLAGE_ENTITY_IDS.co2Eg);
  const feuchteEg = val(LUFTUNGSANLAGE_ENTITY_IDS.feuchteEg);
  const pm25Eg = val(LUFTUNGSANLAGE_ENTITY_IDS.pm25Eg);
  const luftqualitaetEg = str(LUFTUNGSANLAGE_ENTITY_IDS.luftqualitaetEg);
  const vocOg = val(LUFTUNGSANLAGE_ENTITY_IDS.vocOg);
  const feuchteOg = val(LUFTUNGSANLAGE_ENTITY_IDS.feuchteOg);
  const pm25Og = val(LUFTUNGSANLAGE_ENTITY_IDS.pm25Og);
  const tempOg = val(LUFTUNGSANLAGE_ENTITY_IDS.tempOg);

  const STATE_LABELS = {
    off: 'Aus',
    auto: 'Auto',
    fan_only: 'Lüften',
  };
  const hvacLabel = hvacState ? (STATE_LABELS[hvacState] ?? hvacState) : '—';
  const isActive = hvacState !== 'off' && hvacState != null;

  const hvacOptions = [
    { value: 'off', label: 'Aus' },
    { value: 'auto', label: 'Auto' },
    { value: 'fan_only', label: 'Lüften' },
  ];

  const fanOptions = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
  ];

  const mainTabs = [
    { key: 'betrieb', label: translate('luftungsanlage.betrieb') || 'Betrieb' },
    { key: 'luftqualitaet', label: translate('luftungsanlage.luftqualitaet') || 'Luftqualität' },
  ];

  const InfoTile = ({ label, value, color = 'var(--text-primary)', unit = '' }) => (
    <div className="popup-surface flex flex-col items-center justify-center gap-1 rounded-2xl p-4">
      <p className="text-[10px] font-bold tracking-[0.15em] uppercase" style={{ color: 'var(--text-muted)' }}>
        {label}
      </p>
      <p className="text-xl font-light" style={{ color }}>
        {value != null ? `${value}${unit}` : '—'}
      </p>
    </div>
  );

  return (
    <AccessibleModalShell
      open={show}
      onClose={onClose}
      titleId={modalTitleId}
      overlayClassName="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6"
      overlayStyle={{ backdropFilter: 'blur(20px)', backgroundColor: 'rgba(0,0,0,0.3)' }}
      panelClassName="popup-anim relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl border p-6 font-sans backdrop-blur-xl md:rounded-[3rem] md:p-12"
      panelStyle={{
        background: 'linear-gradient(135deg, var(--card-bg) 0%, var(--modal-bg) 100%)',
        borderColor: 'var(--glass-border)',
        color: 'var(--text-primary)',
      }}
    >
      {() => (
        <>
          {/* Close button */}
          <div className="absolute top-6 right-6 z-20 md:top-10 md:right-10">
            <button onClick={onClose} className="modal-close" aria-label={translate('common.close')}>
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Header */}
          <div className="mb-6 flex items-center gap-4 font-sans">
            <div
              className="rounded-2xl p-4 transition-all duration-500"
              style={{ backgroundColor: 'rgba(56, 189, 248, 0.15)', color: ACCENT }}
            >
              <Fan className="h-8 w-8" />
            </div>
            <div>
              <h3
                id={modalTitleId}
                className="text-2xl leading-none font-light tracking-tight text-[var(--text-primary)] uppercase italic"
              >
                {name}
              </h3>
              <div
                className="mt-2 inline-flex items-center gap-2 rounded-full border px-3 py-1 transition-all duration-500"
                style={{
                  backgroundColor: isActive ? 'var(--status-success-bg)' : 'var(--glass-bg)',
                  borderColor: isActive ? 'var(--status-success-border)' : 'var(--glass-border)',
                }}
              >
                <span
                  className={`h-2 w-2 rounded-full ${isActive ? 'bg-[var(--status-success-fg)]' : 'bg-[var(--text-muted)]'}`}
                />
                <p
                  className="text-[10px] font-bold tracking-widest uppercase italic"
                  style={{ color: isActive ? 'var(--status-success-fg)' : 'var(--text-secondary)' }}
                >
                  {hvacLabel}
                </p>
              </div>
            </div>
          </div>

          {/* Tab switcher */}
          <div className="mb-6 flex rounded-2xl p-1" style={{ backgroundColor: 'var(--glass-bg)' }}>
            {mainTabs.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setMainTab(key)}
                className="flex-1 rounded-xl py-2 text-[11px] font-bold tracking-widest uppercase transition-all"
                style={
                  mainTab === key
                    ? {
                        backgroundColor: 'rgba(56, 189, 248, 0.15)',
                        borderColor: ACCENT,
                        color: ACCENT,
                        border: `1px solid ${ACCENT}`,
                      }
                    : { color: 'var(--text-secondary)' }
                }
              >
                {label}
              </button>
            ))}
          </div>

          {/* Tab: Betrieb */}
          {mainTab === 'betrieb' && (
            <>
              {/* WRG Flow Diagram */}
              <div className="mb-6">
                <p className="mb-3 text-[10px] font-bold tracking-[0.2em] text-[var(--text-muted)] uppercase">
                  {translate('luftungsanlage.wrg') || 'Wärmerückgewinnung'}
                </p>
                <div className="popup-surface rounded-2xl p-4">
                  <svg
                    viewBox="0 0 300 195"
                    className="w-full"
                    style={{ fontFamily: 'inherit' }}
                  >
                    {/* Flow arrows */}
                    {/* Top arrow: AUSSEN → WRG → ZULUFT */}
                    <line x1="55" y1="45" x2="110" y2="75" stroke="#64b5f6" strokeWidth="1.5" opacity="0.6" />
                    <line x1="190" y1="75" x2="245" y2="45" stroke="#81c784" strokeWidth="1.5" opacity="0.6" />
                    {/* Bottom arrow: ABLUFT → WRG → FORTLUFT */}
                    <line x1="245" y1="150" x2="190" y2="120" stroke="#ef9a9a" strokeWidth="1.5" opacity="0.6" />
                    <line x1="110" y1="120" x2="55" y2="150" stroke="#ffb74d" strokeWidth="1.5" opacity="0.6" />

                    {/* Center WRG box */}
                    <rect x="110" y="72" width="80" height="51" rx="8" fill="var(--glass-bg)" stroke="var(--glass-border)" strokeWidth="1" />
                    <text x="150" y="91" textAnchor="middle" fontSize="9" fontWeight="bold" fill={ACCENT} letterSpacing="0.05em">
                      {isBypass ? 'BYPASS' : 'WRG'}
                    </text>
                    <text x="150" y="108" textAnchor="middle" fontSize="12" fontWeight="300" fill={ACCENT}>
                      {isBypass
                        ? `${bypass != null ? bypass.toFixed(0) : '—'}%`
                        : wrgEfficiency != null
                        ? `${wrgEfficiency}%`
                        : '—'}
                    </text>

                    {/* AUSSEN — top left */}
                    <rect x="2" y="22" width="62" height="46" rx="8" fill="rgba(100,181,246,0.1)" stroke="rgba(100,181,246,0.4)" strokeWidth="1" />
                    <text x="33" y="38" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#64b5f6" letterSpacing="0.08em">AUSSEN</text>
                    <text x="33" y="56" textAnchor="middle" fontSize="14" fontWeight="300" fill="#64b5f6">
                      {aussenluft != null ? `${aussenluft.toFixed(1)}°` : '—'}
                    </text>

                    {/* ZULUFT — top right */}
                    <rect x="236" y="22" width="62" height="46" rx="8" fill="rgba(129,199,132,0.1)" stroke="rgba(129,199,132,0.4)" strokeWidth="1" />
                    <text x="267" y="38" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#81c784" letterSpacing="0.08em">ZULUFT</text>
                    <text x="267" y="56" textAnchor="middle" fontSize="14" fontWeight="300" fill="#81c784">
                      {zuluft != null ? `${zuluft.toFixed(1)}°` : '—'}
                    </text>
                    {zuluftRpm != null && (
                      <text x="267" y="70" textAnchor="middle" fontSize="7" fill="#81c784" opacity="0.7">
                        {zuluftRpm.toFixed(0)} RPM
                      </text>
                    )}

                    {/* ABLUFT — bottom right */}
                    <rect x="236" y="127" width="62" height="46" rx="8" fill="rgba(239,154,154,0.1)" stroke="rgba(239,154,154,0.4)" strokeWidth="1" />
                    <text x="267" y="143" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#ef9a9a" letterSpacing="0.08em">ABLUFT</text>
                    <text x="267" y="161" textAnchor="middle" fontSize="14" fontWeight="300" fill="#ef9a9a">
                      {abluft != null ? `${abluft.toFixed(1)}°` : '—'}
                    </text>
                    {abluftRpm != null && (
                      <text x="267" y="175" textAnchor="middle" fontSize="7" fill="#ef9a9a" opacity="0.7">
                        {abluftRpm.toFixed(0)} RPM
                      </text>
                    )}

                    {/* FORTLUFT — bottom left */}
                    <rect x="2" y="127" width="62" height="46" rx="8" fill="rgba(255,183,77,0.1)" stroke="rgba(255,183,77,0.4)" strokeWidth="1" />
                    <text x="33" y="143" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#ffb74d" letterSpacing="0.08em">FORTLUFT</text>
                    <text x="33" y="161" textAnchor="middle" fontSize="14" fontWeight="300" fill="#ffb74d">
                      {fortluft != null ? `${fortluft.toFixed(1)}°` : '—'}
                    </text>
                  </svg>
                </div>
              </div>

              {/* Status info */}
              <div className="mb-6 grid grid-cols-3 gap-3">
                <InfoTile
                  label={translate('luftungsanlage.luftstufe') || 'Lüftungsstufe'}
                  value={luftstufe}
                  color={ACCENT}
                />
                <InfoTile
                  label={translate('luftungsanlage.filter') || 'Filter'}
                  value={filter}
                  color={filter && filter !== 'Normal' ? '#fb923c' : 'var(--text-primary)'}
                />
                <InfoTile
                  label={translate('luftungsanlage.modeSource') || 'Quelle'}
                  value={parseLastMode(lastMode)}
                />
              </div>

              {/* Controls */}
              <div
                className="space-y-5 border-t pt-6 font-sans"
                style={{ borderColor: 'var(--glass-border)' }}
              >
                <p className="text-[10px] font-bold tracking-[0.2em] text-[var(--text-muted)] uppercase">
                  {translate('luftungsanlage.steuerung') || 'Steuerung'}
                </p>

                <div className="space-y-2">
                  <p className="text-[10px] font-bold tracking-widest text-[var(--text-secondary)] uppercase">
                    {translate('luftungsanlage.hvacMode') || 'Betriebsmodus'}
                  </p>
                  <SelectPills
                    options={hvacOptions}
                    current={hvacState}
                    onSelect={setHvacMode}
                  />
                </div>

                {hvacState === 'fan_only' && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold tracking-widest text-[var(--text-secondary)] uppercase">
                      {translate('luftungsanlage.fanMode') || 'Lüftungsstufe'}
                    </p>
                    <SelectPills
                      options={fanOptions}
                      current={fanMode}
                      onSelect={setFanMode}
                    />
                  </div>
                )}
              </div>
            </>
          )}

          {/* Tab: Luftqualität */}
          {mainTab === 'luftqualitaet' && (
            <div className="grid grid-cols-1 gap-8 font-sans lg:grid-cols-2">
              {/* EG */}
              <div className="space-y-3">
                <p className="text-[10px] font-bold tracking-[0.2em] text-[var(--text-muted)] uppercase">
                  {translate('luftungsanlage.eg') || 'EG'}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="popup-surface flex flex-col items-center justify-center gap-1 rounded-2xl p-4">
                    <p className="text-[10px] font-bold tracking-[0.15em] uppercase" style={{ color: 'var(--text-muted)' }}>
                      {translate('luftungsanlage.co2') || 'CO₂'}
                    </p>
                    <p className="text-xl font-light" style={{ color: getCo2Color(co2Eg) }}>
                      {co2Eg != null ? `${co2Eg.toFixed(0)} ppm` : '—'}
                    </p>
                  </div>
                  <InfoTile
                    label={translate('luftungsanlage.feuchte') || 'Feuchte'}
                    value={feuchteEg != null ? `${feuchteEg.toFixed(0)} %` : null}
                  />
                  <InfoTile
                    label="PM2.5"
                    value={pm25Eg != null ? `${pm25Eg.toFixed(1)} µg/m³` : null}
                  />
                  <InfoTile
                    label={translate('luftungsanlage.luftqualitaet') || 'Luftqualität'}
                    value={luftqualitaetEg}
                  />
                </div>
              </div>

              {/* OG */}
              <div className="space-y-3">
                <p className="text-[10px] font-bold tracking-[0.2em] text-[var(--text-muted)] uppercase">
                  {translate('luftungsanlage.og') || 'OG'}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="popup-surface flex flex-col items-center justify-center gap-1 rounded-2xl p-4">
                    <p className="text-[10px] font-bold tracking-[0.15em] uppercase" style={{ color: 'var(--text-muted)' }}>
                      VOC
                    </p>
                    <p className="text-xl font-light" style={{ color: vocOg != null && vocOg > 200 ? '#fb923c' : 'var(--text-primary)' }}>
                      {vocOg != null ? vocOg.toFixed(0) : '—'}
                    </p>
                  </div>
                  <InfoTile
                    label={translate('luftungsanlage.feuchte') || 'Feuchte'}
                    value={feuchteOg != null ? `${feuchteOg.toFixed(0)} %` : null}
                  />
                  <InfoTile
                    label="PM2.5"
                    value={pm25Og != null ? `${pm25Og.toFixed(1)} µg/m³` : null}
                  />
                  <InfoTile
                    label={translate('luftungsanlage.temp') || 'Temperatur'}
                    value={tempOg != null ? `${tempOg.toFixed(1)} °C` : null}
                  />
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </AccessibleModalShell>
  );
}
