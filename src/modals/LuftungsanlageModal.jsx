import { useState, useEffect } from 'react';
import { Fan, Thermometer, X } from '../icons';
import { LUFTUNGSANLAGE_ENTITY_IDS } from '../components/cards/GenericLuftungsanlageCard';
import AccessibleModalShell from '../components/ui/AccessibleModalShell';
import { getHistoryRest, getHistory } from '../services/haClient';

const ACCENT = '#38bdf8';

function getThresholdColor(value, thresholds) {
  for (const t of thresholds) {
    if (t.max == null || value < t.max) return t.color;
  }
  return thresholds[thresholds.length - 1].color;
}

function ColoredHistoryGraph({ data, height = 120, thresholds, noDataLabel = 'Keine Verlaufsdaten' }) {
  if (!Array.isArray(data) || data.length < 2) {
    return (
      <div className="flex items-center justify-center text-xs" style={{ height, color: 'var(--text-muted)' }}>
        {noDataLabel}
      </div>
    );
  }
  const pad = { top: 16, right: 16, bottom: 24, left: 38 };
  const vbW = 600;
  const gW = vbW - pad.left - pad.right;
  const gH = height - pad.top - pad.bottom;
  const values = data.map((d) => d.value);
  let min = Math.min(...values);
  let max = Math.max(...values);
  if (min === max) { min -= 1; max += 1; }
  const toX = (i) => pad.left + (i / (data.length - 1)) * gW;
  const toY = (v) => pad.top + gH - ((v - min) / (max - min)) * gH;
  const yLabels = [
    { value: max, y: pad.top },
    { value: (max + min) / 2, y: pad.top + gH / 2 },
    { value: min, y: pad.top + gH },
  ];
  const xIdx = [0, Math.floor((data.length - 1) / 2), data.length - 1];
  const xLabels = xIdx.map((i, k) => ({
    x: toX(i),
    label: new Date(data[i].time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    anchor: k === 0 ? 'start' : k === 2 ? 'end' : 'middle',
  }));
  return (
    <div className="relative w-full select-none">
      <svg viewBox={`0 0 ${vbW} ${height}`} className="h-full w-full overflow-visible" preserveAspectRatio="none">
        {yLabels.map((l, i) => (
          <line key={i} x1={pad.left} y1={l.y} x2={vbW - pad.right} y2={l.y}
            stroke="currentColor" strokeOpacity="0.06" strokeDasharray="4 4" />
        ))}
        {data.slice(0, -1).map((d, i) => {
          const mid = (d.value + data[i + 1].value) / 2;
          return (
            <line key={i}
              x1={toX(i)} y1={toY(d.value)}
              x2={toX(i + 1)} y2={toY(data[i + 1].value)}
              stroke={getThresholdColor(mid, thresholds)}
              strokeWidth="2.5" strokeLinecap="round" opacity="0.9"
            />
          );
        })}
        {yLabels.map((l, i) => (
          <text key={i} x={pad.left - 6} y={l.y} textAnchor="end" dominantBaseline="middle"
            style={{ fill: 'var(--text-secondary)', fontSize: '10px', opacity: 0.55, fontFamily: 'monospace' }}>
            {l.value.toFixed(0)}
          </text>
        ))}
        {xLabels.map((l, i) => (
          <text key={i} x={l.x} y={height - 4} textAnchor={l.anchor}
            style={{ fill: 'var(--text-secondary)', fontSize: '10px', opacity: 0.55, fontFamily: 'monospace' }}>
            {l.label}
          </text>
        ))}
      </svg>
    </div>
  );
}

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
  if (!raw) return { src: '—', lvl: '' };
  const parts = raw.split('_');
  if (parts[0] === 'boost') return { src: 'Boost-Modus', lvl: 'Stufe 3' };
  if (parts[0] === 'manual') return { src: 'Manuell', lvl: '' };
  const FAN_LABELS = { low: 'Stufe 1 Low', medium: 'Stufe 2 Medium', high: 'Stufe 3 High', off: 'Aus' };
  const fanLvl = FAN_LABELS[parts[2]] || parts[2] || '';
  if (parts[1] === 'auto') return { src: 'Automatik (Temp)', lvl: fanLvl };
  if (parts[1] === 'aq')   return { src: 'Luftqualitäts-Override', lvl: fanLvl };
  if (parts[1] === 'off')  return { src: 'Temp niedrig oder Sperre', lvl: 'Aus' };
  return { src: raw, lvl: '' };
}

export default function LuftungsanlageModal({
  show,
  onClose,
  entities,
  customNames,
  cardId,
  callService,
  conn,
  haUrl,
  haToken,
  t,
}) {
  const translate = t || ((key) => key);
  const [mainTab, setMainTab] = useState('betrieb');
  const [co2History, setCo2History] = useState([]);
  const [vocHistory, setVocHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const modalTitleId = 'luftungsanlage-modal-title';

  useEffect(() => {
    if (!show || mainTab !== 'luftqualitaet') return;
    if (!conn && !haUrl) return;

    const fetchHistories = async () => {
      setHistoryLoading(true);
      const end = new Date();
      const start = new Date(end.getTime() - 24 * 60 * 60 * 1000);

      const fetchOne = async (entityId) => {
        try {
          const data = await getHistoryRest(haUrl, haToken, {
            entityId,
            start,
            end,
            minimal_response: false,
            no_attributes: false,
            significant_changes_only: false,
          });
          const raw = Array.isArray(data?.[0]) ? data[0] : (Array.isArray(data) ? data : []);
          return raw
            .filter((d) => !isNaN(parseFloat(d?.state)))
            .map((d) => ({
              value: parseFloat(d.state),
              time: new Date(d.last_changed || d.last_updated || d.lu || d.lc),
            }))
            .filter((d) => !isNaN(d.time.getTime()));
        } catch (_e) {
          try {
            const wsData = await getHistory(conn, { entityId, start, end });
            const raw = Array.isArray(wsData?.[0]) ? wsData[0] : (Array.isArray(wsData) ? wsData : []);
            return raw
              .filter((d) => !isNaN(parseFloat(d?.state)))
              .map((d) => ({
                value: parseFloat(d.state),
                time: new Date(d.last_changed || d.last_updated || d.lu || d.lc),
              }))
              .filter((d) => !isNaN(d.time.getTime()));
          } catch (_e2) {
            return [];
          }
        }
      };

      const [co2, voc] = await Promise.all([
        fetchOne(LUFTUNGSANLAGE_ENTITY_IDS.co2Eg),
        fetchOne(LUFTUNGSANLAGE_ENTITY_IDS.vocOg),
      ]);
      setCo2History(co2);
      setVocHistory(voc);
      setHistoryLoading(false);
    };

    fetchHistories();
  }, [show, mainTab, conn, haUrl, haToken]);

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

  const setTemperature = (temp) => {
    callService?.('climate', 'set_temperature', {
      entity_id: LUFTUNGSANLAGE_ENTITY_IDS.climate,
      temperature: temp,
    });
  };

  const hvacState = str(LUFTUNGSANLAGE_ENTITY_IDS.climate);
  const fanMode = e(LUFTUNGSANLAGE_ENTITY_IDS.climate)?.attributes?.fan_mode || null;
  const targetTemp = e(LUFTUNGSANLAGE_ENTITY_IDS.climate)?.attributes?.temperature ?? null;
  const currentTemp = e(LUFTUNGSANLAGE_ENTITY_IDS.climate)?.attributes?.current_temperature ?? null;
  const minTemp = e(LUFTUNGSANLAGE_ENTITY_IDS.climate)?.attributes?.min_temp ?? 15;
  const maxTemp = e(LUFTUNGSANLAGE_ENTITY_IDS.climate)?.attributes?.max_temp ?? 30;
  const tempActive = hvacState === 'heat' || hvacState === 'cool' || hvacState === 'auto';
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
  const outsideTemp = val(LUFTUNGSANLAGE_ENTITY_IDS.outsideTemp);
  const insideTemp = val(LUFTUNGSANLAGE_ENTITY_IDS.insideTemp);
  const automationState = str(LUFTUNGSANLAGE_ENTITY_IDS.automation);
  const saisonState = str(LUFTUNGSANLAGE_ENTITY_IDS.saison);
  const lockTs = str(LUFTUNGSANLAGE_ENTITY_IDS.lockTimestamp);

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
    { key: 'automatik', label: 'Automatik' },
  ];

  const { src: modeSrc, lvl: modeLvl } = parseLastMode(lastMode);

  // Automatik tab calculations (mirrors dashboard button-card logic)
  const isCold = outsideTemp != null && outsideTemp < 5;
  const isMild = outsideTemp != null && outsideTemp >= 5 && outsideTemp <= 15;
  const tLow = isCold ? 1.0 : 0.5;
  const tOff = isCold ? 2.0 : 2.5;
  const weatherLabel = isCold ? 'kalt (<5°C)' : isMild ? 'mild (5–15°C)' : 'warm (>15°C)';
  const diffTemp = insideTemp != null && zuluft != null ? insideTemp - zuluft : null;
  const tPct = diffTemp != null ? Math.min(100, Math.max(0, (diffTemp / (tOff + 1)) * 100)) : 0;
  const tColor = diffTemp == null ? '#aaaaaa' : diffTemp >= tOff ? '#ef9a9a' : diffTemp >= tLow ? '#ffb74d' : '#64b5f6';
  const co2Pct = co2Eg != null ? Math.min(100, (co2Eg / 2000) * 100) : 0;
  const co2CondColor = co2Eg == null ? '#aaaaaa' : co2Eg >= 1500 ? '#ef9a9a' : co2Eg >= 1200 ? '#ffb74d' : '#81c784';
  const vocPct = vocOg != null ? Math.min(100, (vocOg / 500) * 100) : 0;
  const vocCondColor = vocOg == null ? '#aaaaaa' : vocOg >= 400 ? '#ef9a9a' : vocOg >= 300 ? '#ffb74d' : '#81c784';
  const humidPct = feuchteEg != null ? Math.min(100, feuchteEg) : 0;
  const humidCondColor = feuchteEg == null ? '#aaaaaa' : feuchteEg >= 65 ? '#ef9a9a' : feuchteEg >= 60 ? '#ffb74d' : '#81c784';

  const lastModeRaw = lastMode || '';
  const modeparts = lastModeRaw.split('_');
  const driverTemp = modeparts[1] === 'auto';
  const driverAQ = modeparts[1] === 'aq';

  const autoOn = automationState === 'on';
  const saisonColor = saisonState?.startsWith('Win') ? '#64b5f6' : saisonState?.startsWith('Som') ? '#ffb74d' : '#81c784';

  // Lock time display
  let lockLabel = 'Keine aktive Sperre';
  if (lockTs) {
    const lockD = new Date(lockTs.replace(' ', 'T'));
    if (lockD > new Date()) {
      const hh = lockD.getHours().toString().padStart(2, '0');
      const mm = lockD.getMinutes().toString().padStart(2, '0');
      lockLabel = `Gesperrt bis ${hh}:${mm}`;
    }
  }

  const toggleAutomation = () => {
    callService?.('automation', 'toggle', { entity_id: LUFTUNGSANLAGE_ENTITY_IDS.automation });
  };
  const setSaison = (option) => {
    callService?.('input_select', 'select_option', {
      entity_id: LUFTUNGSANLAGE_ENTITY_IDS.saison,
      option,
    });
  };

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
        : 'popup-anim relative flex flex-col w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-[3rem] border font-sans backdrop-blur-xl'}
      panelStyle={{
        background: 'linear-gradient(135deg, var(--card-bg) 0%, var(--modal-bg) 100%)',
        borderColor: 'var(--glass-border)',
        color: 'var(--text-primary)',
      }}
    >
      {() => (
        <>
          {/* ── Fixed header: close + icon/title + tabs ── */}
          <div
            className={`flex-shrink-0 border-b ${isCompact ? 'p-4 pb-3' : 'p-8 pb-5'}`}
            style={{ borderColor: 'var(--glass-border)' }}
          >
          {/* Close button */}
          <div className="absolute top-4 right-4 z-20">
            <button onClick={onClose} className="modal-close" aria-label={translate('common.close')}>
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Header */}
          <div className="mb-4 flex items-center gap-3 pr-10 font-sans">
            <div
              className="rounded-2xl p-3 transition-all duration-500"
              style={{ backgroundColor: 'rgba(56, 189, 248, 0.15)', color: ACCENT }}
            >
              <Fan className="h-6 w-6" />
            </div>
            <div>
              <h3
                id={modalTitleId}
                className="text-xl leading-none font-light tracking-tight text-[var(--text-primary)] uppercase italic"
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
          <div className="flex rounded-2xl p-1" style={{ backgroundColor: 'var(--glass-bg)' }}>
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
          </div>{/* end fixed header */}

          {/* ── Scrollable content ── */}
          <div className={`flex-1 overflow-y-auto ${isCompact ? 'p-4' : 'p-8'}`}>

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
                    style={{ fontFamily: 'inherit', maxHeight: isCompact ? '220px' : undefined }}
                  >
                    {/* Flow arrows */}
                    {/* Top arrow: AUSSEN → WRG → ZULUFT */}
                    <line x1="55" y1="45" x2="110" y2="75" stroke="#64b5f6" strokeWidth="1.5" opacity="0.6" />
                    <line x1="190" y1="75" x2="245" y2="45" stroke="#81c784" strokeWidth="1.5" opacity="0.6" />
                    {/* Bottom arrow: ABLUFT → WRG → FORTLUFT */}
                    <line x1="245" y1="150" x2="190" y2="120" stroke="#ef9a9a" strokeWidth="1.5" opacity="0.6" />
                    <line x1="110" y1="120" x2="55" y2="150" stroke="#ffb74d" strokeWidth="1.5" opacity="0.6" />

                    {/* Center WRG box */}
                    <rect x="110" y="68" width="80" height="59" rx="8" fill="var(--glass-bg)" stroke="var(--glass-border)" strokeWidth="1" />
                    <text x="150" y="80" textAnchor="middle" fontSize="8" fontWeight="bold" fill={ACCENT} letterSpacing="0.05em">
                      {isBypass ? 'BYPASS' : 'WRG'}
                    </text>
                    {isActive ? (
                      <>
                        <text x="150" y="95" textAnchor="middle" fontSize="15" fontWeight="300" fill={ACCENT}>
                          {isBypass
                            ? `${bypass != null ? bypass.toFixed(0) : '—'}%`
                            : wrgEfficiency != null
                            ? `${wrgEfficiency}%`
                            : '—'}
                        </text>
                        <text x="150" y="106" textAnchor="middle" fontSize="7" fill={ACCENT} opacity="0.65">
                          {isBypass ? 'Bypass' : 'Wirkungsgrad'}
                        </text>
                        <text x="150" y="116" textAnchor="middle" fontSize="7" fill={ACCENT} opacity="0.55">
                          {isBypass
                            ? 'Bypass aktiv'
                            : aussenluft != null && zuluft != null
                            ? `+${(zuluft - aussenluft).toFixed(1)}°C Gewinn`
                            : ''}
                        </text>
                        {bypass != null && (
                          <text x="150" y="124" textAnchor="middle" fontSize="6.5" fill={ACCENT} opacity="0.4">
                            {`Bypass ${bypass.toFixed(0)}%`}
                          </text>
                        )}
                      </>
                    ) : (
                      <>
                        <text x="150" y="97" textAnchor="middle" fontSize="13" fontWeight="300" fill={ACCENT} opacity="0.6">
                          Aus
                        </text>
                        {bypass != null && (
                          <text x="150" y="112" textAnchor="middle" fontSize="7" fill={ACCENT} opacity="0.4">
                            {`Bypass ${bypass.toFixed(0)}%`}
                          </text>
                        )}
                      </>
                    )}

                    {/* AUSSEN — top left */}
                    <rect x="2" y="22" width="62" height="46" rx="8" fill="rgba(100,181,246,0.1)" stroke="rgba(100,181,246,0.4)" strokeWidth="1" />
                    <text x="33" y="38" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#64b5f6" letterSpacing="0.08em">AUSSEN</text>
                    <text x="33" y="56" textAnchor="middle" fontSize="14" fontWeight="300" fill="#64b5f6">
                      {aussenluft != null ? `${aussenluft.toFixed(1)}°` : '—'}
                    </text>

                    {/* ZULUFT — top right */}
                    <rect x="236" y="22" width="62" height="46" rx="8" fill="rgba(129,199,132,0.1)" stroke="rgba(129,199,132,0.4)" strokeWidth="1" />
                    <text x="267" y="34" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#81c784" letterSpacing="0.08em">ZULUFT</text>
                    <text x="267" y="50" textAnchor="middle" fontSize="14" fontWeight="300" fill="#81c784">
                      {zuluft != null ? `${zuluft.toFixed(1)}°` : '—'}
                    </text>
                    {zuluftRpm != null && (
                      <text x="267" y="63" textAnchor="middle" fontSize="7" fill="#81c784" opacity="0.7">
                        {zuluftRpm.toFixed(0)} RPM
                      </text>
                    )}

                    {/* ABLUFT — bottom right */}
                    <rect x="236" y="127" width="62" height="46" rx="8" fill="rgba(239,154,154,0.1)" stroke="rgba(239,154,154,0.4)" strokeWidth="1" />
                    <text x="267" y="139" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#ef9a9a" letterSpacing="0.08em">ABLUFT</text>
                    <text x="267" y="155" textAnchor="middle" fontSize="14" fontWeight="300" fill="#ef9a9a">
                      {abluft != null ? `${abluft.toFixed(1)}°` : '—'}
                    </text>
                    {abluftRpm != null && (
                      <text x="267" y="168" textAnchor="middle" fontSize="7" fill="#ef9a9a" opacity="0.7">
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
                  value={modeSrc}
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

                <div className="flex flex-wrap gap-6">
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

                  {/* Temperature control — only for heat/cool/auto modes */}
                  <div className="space-y-2" style={{ opacity: tempActive ? 1 : 0.35 }}>
                    <p className="text-[10px] font-bold tracking-widest text-[var(--text-secondary)] uppercase">
                      Zieltemperatur
                      {currentTemp != null && (
                        <span className="ml-2 font-normal normal-case opacity-60">
                          (Ist: {currentTemp}°C)
                        </span>
                      )}
                    </p>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => tempActive && targetTemp != null && targetTemp > minTemp && setTemperature(targetTemp - 1)}
                        disabled={!tempActive || targetTemp == null || targetTemp <= minTemp}
                        className="flex h-8 w-8 items-center justify-center rounded-xl border text-lg font-bold transition-colors"
                        style={{ borderColor: 'var(--glass-border)', color: ACCENT, background: 'var(--glass-bg)' }}
                      >
                        −
                      </button>
                      <div className="flex min-w-[56px] items-center justify-center gap-1 rounded-xl border px-3 py-1.5"
                        style={{ borderColor: ACCENT, background: 'rgba(56,189,248,0.08)' }}>
                        <Thermometer className="h-3.5 w-3.5" style={{ color: ACCENT }} />
                        <span className="text-sm font-bold" style={{ color: ACCENT }}>
                          {targetTemp != null ? `${targetTemp}°C` : '—'}
                        </span>
                      </div>
                      <button
                        onClick={() => tempActive && targetTemp != null && targetTemp < maxTemp && setTemperature(targetTemp + 1)}
                        disabled={!tempActive || targetTemp == null || targetTemp >= maxTemp}
                        className="flex h-8 w-8 items-center justify-center rounded-xl border text-lg font-bold transition-colors"
                        style={{ borderColor: 'var(--glass-border)', color: ACCENT, background: 'var(--glass-bg)' }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Tab: Automatik */}
          {mainTab === 'automatik' && (
            <div className="space-y-6 font-sans">
              {/* Header row: Automatik toggle + Saison */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={toggleAutomation}
                    className="rounded-full border px-4 py-1.5 text-[11px] font-bold tracking-wider uppercase transition-all"
                    style={
                      autoOn
                        ? { backgroundColor: 'rgba(74,222,128,0.15)', borderColor: '#4ade80', color: '#4ade80' }
                        : { backgroundColor: 'var(--glass-bg)', borderColor: 'var(--glass-border)', color: 'var(--text-muted)' }
                    }
                  >
                    Automatik {autoOn ? 'Ein' : 'Aus'}
                  </button>
                  <span
                    className="rounded-full border px-3 py-1 text-[11px] font-bold tracking-wider uppercase"
                    style={{ backgroundColor: `${saisonColor}22`, borderColor: `${saisonColor}66`, color: saisonColor }}
                  >
                    {saisonState || '—'}
                  </span>
                </div>
                {/* Saison selector */}
                <div className="flex gap-2">
                  {['Winter', 'Sommer'].map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setSaison(opt)}
                      className="rounded-full border px-3 py-1 text-[11px] font-bold tracking-wider uppercase transition-all"
                      style={
                        saisonState === opt
                          ? { backgroundColor: `${saisonColor}22`, borderColor: saisonColor, color: saisonColor }
                          : { backgroundColor: 'var(--glass-bg)', borderColor: 'var(--glass-border)', color: 'var(--text-secondary)' }
                      }
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status card */}
              <div className="popup-surface rounded-2xl p-4 space-y-2">
                <div className="flex items-baseline justify-between">
                  <p className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>{modeLvl || '—'}</p>
                  <p className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>{modeSrc}</p>
                </div>
                <div className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>
                  {outsideTemp != null ? outsideTemp.toFixed(1) : '—'}°C außen
                  {insideTemp != null ? ` / ${insideTemp.toFixed(1)}°C innen` : ''}
                  {zuluft != null ? ` / ${zuluft.toFixed(1)}°C Zuluft` : ''}
                </div>
                <div className="text-[12px] font-medium" style={{ color: lockLabel.startsWith('Gesperrt') ? '#fb923c' : 'var(--text-muted)' }}>
                  {lockLabel}
                </div>
              </div>

              {/* Condition bars */}
              <div className="popup-surface rounded-2xl p-4 space-y-3">
                <p className="text-[10px] font-bold tracking-[0.2em] uppercase mb-1" style={{ color: 'var(--text-muted)' }}>
                  Bedingungen · {weatherLabel} · Stufe1 ab {tLow}° · Aus ab {tOff}°
                </p>

                {/* ΔTemp */}
                <div
                  className="flex items-center gap-2 rounded-lg px-2 py-1.5"
                  style={{ backgroundColor: driverTemp ? 'rgba(100,181,246,0.1)' : 'transparent' }}
                >
                  <div className="h-2 w-2 flex-shrink-0 rounded-full" style={{ backgroundColor: tColor }} />
                  <span className="w-[60px] flex-shrink-0 text-[10px]" style={{ color: 'var(--text-secondary)' }}>Δ Inn/Zul</span>
                  <div className="relative flex-1 h-1 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--glass-border)' }}>
                    <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${tPct}%`, backgroundColor: tColor }} />
                  </div>
                  <span className="text-[10px] text-right min-w-[90px]" style={{ color: tColor }}>
                    {diffTemp != null ? diffTemp.toFixed(1) : '—'}° ({tLow}°/−{tOff}°C)
                  </span>
                </div>

                {/* CO₂ */}
                <div
                  className="flex items-center gap-2 rounded-lg px-2 py-1.5"
                  style={{ backgroundColor: driverAQ && co2Eg != null && co2Eg >= 1500 ? 'rgba(239,154,154,0.1)' : 'transparent' }}
                >
                  <div className="h-2 w-2 flex-shrink-0 rounded-full" style={{ backgroundColor: co2CondColor }} />
                  <span className="w-[60px] flex-shrink-0 text-[10px]" style={{ color: 'var(--text-secondary)' }}>CO₂</span>
                  <div className="relative flex-1 h-1 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--glass-border)' }}>
                    <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${co2Pct}%`, backgroundColor: co2CondColor }} />
                  </div>
                  <span className="text-[10px] text-right min-w-[90px]" style={{ color: co2CondColor }}>
                    {co2Eg != null ? co2Eg.toFixed(0) : '—'} / 1500 ppm
                  </span>
                </div>

                {/* VOC */}
                <div
                  className="flex items-center gap-2 rounded-lg px-2 py-1.5"
                  style={{ backgroundColor: driverAQ && vocOg != null && vocOg >= 400 ? 'rgba(239,154,154,0.1)' : 'transparent' }}
                >
                  <div className="h-2 w-2 flex-shrink-0 rounded-full" style={{ backgroundColor: vocCondColor }} />
                  <span className="w-[60px] flex-shrink-0 text-[10px]" style={{ color: 'var(--text-secondary)' }}>VOC</span>
                  <div className="relative flex-1 h-1 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--glass-border)' }}>
                    <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${vocPct}%`, backgroundColor: vocCondColor }} />
                  </div>
                  <span className="text-[10px] text-right min-w-[90px]" style={{ color: vocCondColor }}>
                    {vocOg != null ? vocOg.toFixed(0) : '—'} / 400
                  </span>
                </div>

                {/* Feuchte */}
                <div
                  className="flex items-center gap-2 rounded-lg px-2 py-1.5"
                  style={{ backgroundColor: driverAQ && feuchteEg != null && feuchteEg >= 65 ? 'rgba(239,154,154,0.1)' : 'transparent' }}
                >
                  <div className="h-2 w-2 flex-shrink-0 rounded-full" style={{ backgroundColor: humidCondColor }} />
                  <span className="w-[60px] flex-shrink-0 text-[10px]" style={{ color: 'var(--text-secondary)' }}>Feuchte</span>
                  <div className="relative flex-1 h-1 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--glass-border)' }}>
                    <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${humidPct}%`, backgroundColor: humidCondColor }} />
                  </div>
                  <span className="text-[10px] text-right min-w-[90px]" style={{ color: humidCondColor }}>
                    {feuchteEg != null ? feuchteEg.toFixed(0) : '—'}% / 65%
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Tab: Luftqualität */}
          {mainTab === 'luftqualitaet' && (
            <div className="space-y-8 font-sans">
              {/* EG */}
              <div className="space-y-3">
                <p className="text-[10px] font-bold tracking-[0.2em] text-[var(--text-muted)] uppercase">
                  {translate('luftungsanlage.eg') || 'EG'}
                </p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
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
                {/* CO₂ 24h chart */}
                <div className="popup-surface rounded-2xl p-4">
                  <p className="mb-2 text-[10px] font-bold tracking-[0.15em] uppercase" style={{ color: 'var(--text-muted)' }}>
                    CO₂ — 24h
                  </p>
                  {historyLoading ? (
                    <div className="flex h-[80px] items-center justify-center">
                      <div className="h-6 w-6 animate-spin rounded-full border-b-2 opacity-30" style={{ borderColor: ACCENT }} />
                    </div>
                  ) : (
                    <ColoredHistoryGraph
                      data={co2History}
                      height={isCompact ? 75 : 120}
                      thresholds={[
                        { max: 800, color: '#4ade80' },
                        { max: 1000, color: '#fb923c' },
                        { color: '#f87171' },
                      ]}
                    />
                  )}
                </div>
              </div>

              {/* OG */}
              <div className="space-y-3">
                <p className="text-[10px] font-bold tracking-[0.2em] text-[var(--text-muted)] uppercase">
                  {translate('luftungsanlage.og') || 'OG'}
                </p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
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
                {/* VOC 24h chart */}
                <div className="popup-surface rounded-2xl p-4">
                  <p className="mb-2 text-[10px] font-bold tracking-[0.15em] uppercase" style={{ color: 'var(--text-muted)' }}>
                    VOC — 24h
                  </p>
                  {historyLoading ? (
                    <div className="flex h-[80px] items-center justify-center">
                      <div className="h-6 w-6 animate-spin rounded-full border-b-2 opacity-30" style={{ borderColor: ACCENT }} />
                    </div>
                  ) : (
                    <ColoredHistoryGraph
                      data={vocHistory}
                      height={isCompact ? 75 : 120}
                      thresholds={[
                        { max: 300, color: '#4ade80' },
                        { max: 400, color: '#fb923c' },
                        { color: '#f87171' },
                      ]}
                    />
                  )}
                </div>
              </div>
            </div>
          )}
          </div>{/* end scrollable content */}
        </>
      )}
    </AccessibleModalShell>
  );
}
