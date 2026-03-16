import { useState, useEffect } from 'react';
import { Sun, X } from '../icons';
import { PV_ENTITY_IDS } from '../components/cards/GenericPvCard';
import AccessibleModalShell from '../components/ui/AccessibleModalShell';
import { getHistoryRest, getHistory } from '../services/haClient';

const SOLAR_COLOR = '#fb923c';
const BATT_COLOR = '#f06292';
const GRID_COLOR = '#64b5f6';
const HOUSE_COLOR = '#81c784';
const ACCENT = SOLAR_COLOR;

function getBattSocColor(soc) {
  if (soc == null) return 'var(--text-muted)';
  if (soc >= 60) return '#4ade80';
  if (soc >= 30) return '#fb923c';
  return '#f87171';
}

// ─── SVG Power Flow Diagram ────────────────────────────────────────────────

function FlowLine({ x1, y1, x2, y2, color, active }) {
  return (
    <line
      x1={x1} y1={y1} x2={x2} y2={y2}
      stroke={color}
      strokeWidth={active ? '2' : '1'}
      strokeOpacity={active ? '0.7' : '0.2'}
      strokeDasharray={active ? '6 4' : 'none'}
    />
  );
}

function ArrowHead({ x, y, dir, color, active }) {
  if (!active) return null;
  const s = 7;
  let points;
  if (dir === 'down')  points = `${x},${y + s} ${x - s * 0.6},${y - s * 0.4} ${x + s * 0.6},${y - s * 0.4}`;
  if (dir === 'up')    points = `${x},${y - s} ${x - s * 0.6},${y + s * 0.4} ${x + s * 0.6},${y + s * 0.4}`;
  if (dir === 'right') points = `${x + s},${y} ${x - s * 0.4},${y - s * 0.6} ${x - s * 0.4},${y + s * 0.6}`;
  if (dir === 'left')  points = `${x - s},${y} ${x + s * 0.4},${y - s * 0.6} ${x + s * 0.4},${y + s * 0.6}`;
  return <polygon points={points} fill={color} opacity="0.85" />;
}

function PowerFlowSvg({ pvW, houseW, batteryInW, batteryOutW, gridImportW, gridExportW, batterySoc, pvDaily }) {
  // Derived states
  const solarActive = pvW != null && pvW > 10;
  const battCharge = batteryInW != null && batteryInW > 10;
  const battDischarge = !battCharge && batteryOutW != null && batteryOutW > 10;
  const gridExport = gridExportW != null && gridExportW > 10;
  const gridImport = !gridExport && gridImportW != null && gridImportW > 10;
  const houseActive = houseW != null && houseW > 10;

  const socColor = getBattSocColor(batterySoc);
  const fmt = (w) => w != null ? (w >= 1000 ? `${(w / 1000).toFixed(1)} kW` : `${Math.round(w)} W`) : '—';

  // Layout constants
  // viewBox 340 × 210
  const CX = 170; // center x
  const SOLAR = { x: 120, y: 8, w: 100, h: 44, cx: 170, cy: 30 };
  const BATT  = { x: 5,   y: 88, w: 82,  h: 50, cx: 46,  cy: 113 };
  const INV   = { x: 130, y: 88, w: 80,  h: 50, cx: 170, cy: 113 };
  const GRID  = { x: 253, y: 88, w: 82,  h: 50, cx: 294, cy: 113 };
  const HOUSE = { x: 120, y: 162, w: 100, h: 44, cx: 170, cy: 184 };

  return (
    <svg viewBox="0 0 340 210" className="w-full" style={{ fontFamily: 'inherit' }}>
      {/* ── Connecting lines ── */}
      {/* Solar → Inverter */}
      <FlowLine x1={CX} y1={SOLAR.y + SOLAR.h} x2={CX} y2={INV.y} color={SOLAR_COLOR} active={solarActive} />
      <ArrowHead x={CX} y={INV.y - 2} dir="down" color={SOLAR_COLOR} active={solarActive} />

      {/* Battery ↔ Inverter */}
      <FlowLine x1={BATT.x + BATT.w} y1={INV.cy} x2={INV.x} y2={INV.cy} color={BATT_COLOR} active={battCharge || battDischarge} />
      {battCharge   && <ArrowHead x={INV.x - 2}        y={INV.cy} dir="left"  color={BATT_COLOR} active />}
      {battDischarge && <ArrowHead x={BATT.x + BATT.w + 2} y={INV.cy} dir="right" color={BATT_COLOR} active />}

      {/* Inverter ↔ Grid */}
      <FlowLine x1={INV.x + INV.w} y1={INV.cy} x2={GRID.x} y2={INV.cy} color={GRID_COLOR} active={gridImport || gridExport} />
      {gridExport && <ArrowHead x={GRID.x + 2}          y={INV.cy} dir="right" color={GRID_COLOR} active />}
      {gridImport && <ArrowHead x={INV.x + INV.w - 2}   y={INV.cy} dir="left"  color={GRID_COLOR} active />}

      {/* Inverter → House */}
      <FlowLine x1={CX} y1={INV.y + INV.h} x2={CX} y2={HOUSE.y} color={HOUSE_COLOR} active={houseActive} />
      <ArrowHead x={CX} y={HOUSE.y - 2} dir="down" color={HOUSE_COLOR} active={houseActive} />

      {/* ── Solar box ── */}
      <rect x={SOLAR.x} y={SOLAR.y} width={SOLAR.w} height={SOLAR.h} rx="8" fill="rgba(251,146,60,0.08)" stroke={SOLAR_COLOR} strokeWidth="1" strokeOpacity="0.5" />
      <text x={SOLAR.cx} y={SOLAR.y + 14} textAnchor="middle" fontSize="7" fontWeight="bold" fill={SOLAR_COLOR} letterSpacing="0.08em" opacity="0.7">SOLAR</text>
      <text x={SOLAR.cx} y={SOLAR.y + 30} textAnchor="middle" fontSize="14" fontWeight="300" fill={SOLAR_COLOR}>{fmt(pvW)}</text>
      {pvDaily != null && (
        <text x={SOLAR.cx} y={SOLAR.y + 41} textAnchor="middle" fontSize="7" fill={SOLAR_COLOR} opacity="0.5">{pvDaily.toFixed(1)} kWh</text>
      )}

      {/* ── Inverter box (center) ── */}
      <rect x={INV.x} y={INV.y} width={INV.w} height={INV.h} rx="8" fill="var(--glass-bg)" stroke="var(--glass-border)" strokeWidth="1" />
      <text x={INV.cx} y={INV.y + 16} textAnchor="middle" fontSize="7" fontWeight="bold" fill="var(--text-secondary)" letterSpacing="0.08em" opacity="0.6">INV</text>
      <text x={INV.cx} y={INV.y + 30} textAnchor="middle" fontSize="8" fill="var(--text-secondary)" opacity="0.5">SolarEdge</text>
      <text x={INV.cx} y={INV.y + 41} textAnchor="middle" fontSize="7" fill="var(--text-muted)" opacity="0.4">SE5K</text>

      {/* ── Battery box ── */}
      <rect x={BATT.x} y={BATT.y} width={BATT.w} height={BATT.h} rx="8" fill="rgba(240,98,146,0.08)" stroke={BATT_COLOR} strokeWidth="1" strokeOpacity="0.4" />
      <text x={BATT.cx} y={BATT.y + 14} textAnchor="middle" fontSize="7" fontWeight="bold" fill={BATT_COLOR} letterSpacing="0.08em" opacity="0.7">BATT</text>
      <text x={BATT.cx} y={BATT.y + 30} textAnchor="middle" fontSize="14" fontWeight="300" fill={socColor}>
        {batterySoc != null ? `${batterySoc.toFixed(0)}%` : '—'}
      </text>
      <text x={BATT.cx} y={BATT.y + 43} textAnchor="middle" fontSize="7" fill={BATT_COLOR} opacity="0.5">
        {battCharge ? `+${fmt(batteryInW)}` : battDischarge ? `-${fmt(batteryOutW)}` : 'Standby'}
      </text>

      {/* ── Grid box ── */}
      <rect x={GRID.x} y={GRID.y} width={GRID.w} height={GRID.h} rx="8" fill="rgba(100,181,246,0.08)" stroke={GRID_COLOR} strokeWidth="1" strokeOpacity="0.4" />
      <text x={GRID.cx} y={GRID.y + 14} textAnchor="middle" fontSize="7" fontWeight="bold" fill={GRID_COLOR} letterSpacing="0.08em" opacity="0.7">NETZ</text>
      <text x={GRID.cx} y={GRID.y + 30} textAnchor="middle" fontSize="13" fontWeight="300"
        fill={gridExport ? '#4ade80' : gridImport ? '#f87171' : 'var(--text-secondary)'}>
        {gridExport ? `+${fmt(gridExportW)}` : gridImport ? `-${fmt(gridImportW)}` : '0 W'}
      </text>
      <text x={GRID.cx} y={GRID.y + 43} textAnchor="middle" fontSize="7" fill={GRID_COLOR} opacity="0.5">
        {gridExport ? 'Einspeisung' : gridImport ? 'Bezug' : 'Ausgeglichen'}
      </text>

      {/* ── House box ── */}
      <rect x={HOUSE.x} y={HOUSE.y} width={HOUSE.w} height={HOUSE.h} rx="8" fill="rgba(129,199,132,0.08)" stroke={HOUSE_COLOR} strokeWidth="1" strokeOpacity="0.4" />
      <text x={HOUSE.cx} y={HOUSE.y + 14} textAnchor="middle" fontSize="7" fontWeight="bold" fill={HOUSE_COLOR} letterSpacing="0.08em" opacity="0.7">HAUS</text>
      <text x={HOUSE.cx} y={HOUSE.y + 30} textAnchor="middle" fontSize="14" fontWeight="300" fill={HOUSE_COLOR}>{fmt(houseW)}</text>
      <text x={HOUSE.cx} y={HOUSE.y + 41} textAnchor="middle" fontSize="7" fill={HOUSE_COLOR} opacity="0.5">Verbrauch</text>
    </svg>
  );
}

// ─── Solcast Forecast Bar Chart ────────────────────────────────────────────

function ForecastBarChart({ forecastToday, forecastTomorrow, forecastDay3, pvHistory }) {
  const PAD = { top: 16, right: 12, bottom: 28, left: 38 };
  const VBW = 600;
  const HEIGHT = 160;
  const GW = VBW - PAD.left - PAD.right;
  const GH = HEIGHT - PAD.top - PAD.bottom;

  // Parse detailedForecast from entity attributes
  const parseForecast = (entity) => {
    const raw = entity?.attributes?.detailedForecast;
    if (!Array.isArray(raw)) return [];
    return raw.map((e) => ({
      time: new Date(e.period_start),
      kW: (e.pv_estimate || 0) * 2, // kWh per 30min → kW
      kW10: (e.pv_estimate10 || 0) * 2,
      kW90: (e.pv_estimate90 || 0) * 2,
    })).filter((e) => !isNaN(e.time.getTime()));
  };

  const todayEntries = parseForecast(forecastToday);
  const tomorrowEntries = parseForecast(forecastTomorrow);
  const day3Entries = parseForecast(forecastDay3);

  // Combine: today + tomorrow + day3 (limited to daylight hours 4:00–22:00 local)
  const inDaylight = (d) => { const h = d.getHours(); return h >= 4 && h <= 22; };
  const todayBars = todayEntries.filter((e) => inDaylight(e.time));
  const tomorrowBars = tomorrowEntries.filter((e) => inDaylight(e.time));
  const day3Bars = day3Entries.filter((e) => inDaylight(e.time));

  // Combine with day separator gaps
  // We draw each day group separately with a small gap between
  const allBars = [
    ...todayBars.map((b) => ({ ...b, day: 0 })),
    ...tomorrowBars.map((b) => ({ ...b, day: 1 })),
    ...day3Bars.map((b) => ({ ...b, day: 2 })),
  ];

  if (allBars.length === 0) {
    return (
      <div className="flex h-[160px] items-center justify-center text-xs" style={{ color: 'var(--text-muted)' }}>
        Keine Prognosedaten
      </div>
    );
  }

  const maxKw = Math.max(...allBars.map((b) => b.kW90 || b.kW), 1);
  const toY = (kw) => PAD.top + GH - (kw / maxKw) * GH;
  const barH = (kw) => (kw / maxKw) * GH;

  // Group sizes
  const sizes = [todayBars.length, tomorrowBars.length, day3Bars.length].filter((s) => s > 0);
  const nGroups = sizes.length;
  const gapBetween = 12; // px gap between day groups
  const totalBars = allBars.length;
  const totalGap = (nGroups - 1) * gapBetween;
  const barW = Math.max(2, (GW - totalGap) / totalBars - 1);
  const barGap = 1;

  // Compute x for each bar considering group gaps
  let xOffset = PAD.left;
  let dayGroup = allBars[0]?.day;
  const bars = allBars.map((b, i) => {
    if (i > 0 && b.day !== allBars[i - 1].day) xOffset += gapBetween;
    const x = xOffset;
    xOffset += barW + barGap;
    return { ...b, x };
  });

  // Day labels
  const dayColors = ['#fb923c', '#fbbf24', '#94a3b8'];
  const dayLabels = ['Heute', 'Morgen', 'Übermorgen'];
  const dayLabelX = [0, 1, 2].map((d) => {
    const group = bars.filter((b) => b.day === d);
    if (!group.length) return null;
    return { x: (group[0].x + group[group.length - 1].x + barW) / 2, label: dayLabels[d], color: dayColors[d] };
  }).filter(Boolean);

  // pvHistory overlay (actual production line)
  const historyLine = Array.isArray(pvHistory) && pvHistory.length > 1 ? pvHistory : null;
  let histPoints = null;
  if (historyLine) {
    const minTime = bars[0].time.getTime();
    const maxTime = bars[bars.length - 1].time.getTime() + 30 * 60 * 1000;
    const timeRange = maxTime - minTime;
    histPoints = historyLine
      .filter((p) => p.time.getTime() >= minTime && p.time.getTime() <= maxTime)
      .map((p) => {
        const px = PAD.left + ((p.time.getTime() - minTime) / timeRange) * GW;
        const py = toY(p.value / 1000); // W → kW
        return `${px.toFixed(1)},${py.toFixed(1)}`;
      });
  }

  // Y axis labels
  const yLabels = [maxKw, maxKw / 2, 0].map((v, i) => ({
    value: v,
    y: toY(v),
  }));

  return (
    <div className="relative w-full select-none">
      <svg viewBox={`0 0 ${VBW} ${HEIGHT}`} className="h-full w-full overflow-visible" preserveAspectRatio="none">
        {/* Grid lines */}
        {yLabels.map((l, i) => (
          <line key={i} x1={PAD.left} y1={l.y} x2={VBW - PAD.right} y2={l.y}
            stroke="currentColor" strokeOpacity="0.06" strokeDasharray="4 4" />
        ))}

        {/* Confidence band (10–90) */}
        {bars.map((b, i) => b.kW90 > 0 && (
          <rect key={`conf-${i}`}
            x={b.x} y={toY(b.kW90)}
            width={barW} height={Math.max(1, barH(b.kW90) - barH(b.kW10))}
            fill={dayColors[b.day]} opacity="0.12" rx="1"
          />
        ))}

        {/* Forecast bars */}
        {bars.map((b, i) => (
          <rect key={`bar-${i}`}
            x={b.x} y={toY(b.kW)}
            width={barW} height={Math.max(1, barH(b.kW))}
            fill={dayColors[b.day]} opacity={b.day === 0 ? 0.65 : b.day === 1 ? 0.4 : 0.25}
            rx="1"
          />
        ))}

        {/* Actual production line */}
        {histPoints && histPoints.length > 1 && (
          <polyline
            points={histPoints.join(' ')}
            fill="none" stroke={SOLAR_COLOR}
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            opacity="0.9"
          />
        )}

        {/* Y labels */}
        {yLabels.map((l, i) => (
          <text key={i} x={PAD.left - 6} y={l.y} textAnchor="end" dominantBaseline="middle"
            style={{ fill: 'var(--text-secondary)', fontSize: '10px', opacity: 0.55, fontFamily: 'monospace' }}>
            {l.value.toFixed(1)}
          </text>
        ))}

        {/* Day labels */}
        {dayLabelX.map((l, i) => (
          <text key={i} x={l.x} y={HEIGHT - 4} textAnchor="middle"
            style={{ fill: l.color, fontSize: '10px', opacity: 0.8, fontFamily: 'monospace', fontWeight: 'bold' }}>
            {l.label}
          </text>
        ))}
      </svg>
    </div>
  );
}

// ─── InfoTile ─────────────────────────────────────────────────────────────

const InfoTile = ({ label, value, color = 'var(--text-primary)', sub = '' }) => (
  <div className="popup-surface flex flex-col items-center justify-center gap-1 rounded-2xl p-4">
    <p className="text-[10px] font-bold tracking-[0.15em] uppercase" style={{ color: 'var(--text-muted)' }}>
      {label}
    </p>
    <p className="text-xl font-light leading-tight" style={{ color }}>
      {value ?? '—'}
    </p>
    {sub && <p className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>{sub}</p>}
  </div>
);

// ─── Modal ────────────────────────────────────────────────────────────────

export default function PvModal({
  show,
  onClose,
  entities,
  customNames,
  cardId,
  conn,
  haUrl,
  haToken,
  t,
}) {
  const [mainTab, setMainTab] = useState('leistung');
  const [pvHistory, setPvHistory] = useState([]);
  const [histLoading, setHistLoading] = useState(false);
  const modalTitleId = 'pv-modal-title';

  // Fetch actual production history when on Prognose tab
  useEffect(() => {
    if (!show || mainTab !== 'prognose') return;
    if (!conn && !haUrl) return;

    const fetchHistory = async () => {
      setHistLoading(true);
      const end = new Date();
      const start = new Date(end.getTime() - 48 * 60 * 60 * 1000);
      try {
        const data = await getHistoryRest(haUrl, haToken, {
          entityId: PV_ENTITY_IDS.pvW,
          start, end,
          minimal_response: false,
          no_attributes: false,
          significant_changes_only: false,
        });
        const raw = Array.isArray(data?.[0]) ? data[0] : (Array.isArray(data) ? data : []);
        const pts = raw
          .filter((d) => !isNaN(parseFloat(d?.state)))
          .map((d) => ({
            value: parseFloat(d.state),
            time: new Date(d.last_changed || d.last_updated || d.lu || d.lc),
          }))
          .filter((d) => !isNaN(d.time.getTime()));
        setPvHistory(pts);
      } catch (_e) {
        try {
          const wsData = await getHistory(conn, { entityId: PV_ENTITY_IDS.pvW, start, end });
          const raw = Array.isArray(wsData?.[0]) ? wsData[0] : (Array.isArray(wsData) ? wsData : []);
          setPvHistory(raw
            .filter((d) => !isNaN(parseFloat(d?.state)))
            .map((d) => ({
              value: parseFloat(d.state),
              time: new Date(d.last_changed || d.last_updated || d.lu || d.lc),
            }))
            .filter((d) => !isNaN(d.time.getTime())));
        } catch (_e2) { /* ignore */ }
      }
      setHistLoading(false);
    };
    fetchHistory();
  }, [show, mainTab, conn, haUrl, haToken]);

  if (!show) return null;

  const name = customNames?.[cardId] || 'Solar';

  const e = (id) => entities?.[id];
  const v = (id) => {
    const s = parseFloat(e(id)?.state);
    return Number.isFinite(s) ? s : null;
  };

  const pvW = v(PV_ENTITY_IDS.pvW);
  const pvDaily = v(PV_ENTITY_IDS.pvDaily);
  const pvMonthly = v(PV_ENTITY_IDS.pvMonthly);
  const pvYearly = v(PV_ENTITY_IDS.pvYearly);
  const houseW = v(PV_ENTITY_IDS.houseW);
  const houseDaily = v(PV_ENTITY_IDS.houseDaily);
  const batteryInW = v(PV_ENTITY_IDS.batteryInW);
  const batterySoc = v(PV_ENTITY_IDS.batterySoc);
  const batteryInDaily = v(PV_ENTITY_IDS.batteryInDaily);
  const batteryOutDaily = v(PV_ENTITY_IDS.batteryOutDaily);
  const gridImportW = v(PV_ENTITY_IDS.gridImportW);
  const gridExportW = v(PV_ENTITY_IDS.gridExportW);
  const gridImportDaily = v(PV_ENTITY_IDS.gridImportDaily);
  const gridExportDaily = v(PV_ENTITY_IDS.gridExportDaily);
  const pvToHouseDaily = v(PV_ENTITY_IDS.pvToHouseDaily);
  const forecastRemaining = v(PV_ENTITY_IDS.forecastRemaining);
  const forecastPeakToday = v(PV_ENTITY_IDS.forecastPeakToday);

  // Compute battery discharge estimate
  const batteryOutW = Math.max(0, (houseW ?? 0) - (pvW ?? 0) - (gridImportW ?? 0));
  const batteryDischarging = (batteryInW ?? 0) < 1 && batteryOutW > 10;

  // Self-consumption & self-sufficiency
  const selfConsumption = pvDaily != null && pvDaily > 0 && pvToHouseDaily != null
    ? Math.round((pvToHouseDaily / pvDaily) * 100)
    : null;
  const autarkie = houseDaily != null && houseDaily > 0 && gridImportDaily != null
    ? Math.round(((houseDaily - gridImportDaily) / houseDaily) * 100)
    : null;

  const isProducing = pvW != null && pvW > 10;

  const mainTabs = [
    { key: 'leistung', label: 'Leistung' },
    { key: 'prognose', label: 'Prognose' },
    { key: 'statistik', label: 'Statistik' },
  ];

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
          {/* Close */}
          <div className="absolute top-6 right-6 z-20 md:top-10 md:right-10">
            <button onClick={onClose} className="modal-close" aria-label="Schließen">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Header */}
          <div className="mb-6 flex items-center gap-4 font-sans">
            <div className="rounded-2xl p-4 transition-all duration-500"
              style={{ backgroundColor: 'rgba(251,146,60,0.15)', color: SOLAR_COLOR }}>
              <Sun className="h-8 w-8" />
            </div>
            <div>
              <h3 id={modalTitleId}
                className="text-2xl leading-none font-light tracking-tight text-[var(--text-primary)] uppercase italic">
                {name}
              </h3>
              <div className="mt-2 inline-flex items-center gap-2 rounded-full border px-3 py-1 transition-all duration-500"
                style={{
                  backgroundColor: isProducing ? 'var(--status-success-bg)' : 'var(--glass-bg)',
                  borderColor: isProducing ? 'var(--status-success-border)' : 'var(--glass-border)',
                }}>
                <span className={`h-2 w-2 rounded-full ${isProducing ? 'bg-[var(--status-success-fg)]' : 'bg-[var(--text-muted)]'}`} />
                <p className="text-[10px] font-bold tracking-widest uppercase italic"
                  style={{ color: isProducing ? 'var(--status-success-fg)' : 'var(--text-secondary)' }}>
                  {isProducing ? `${Math.round(pvW)} W` : 'Standby'}
                </p>
              </div>
            </div>
          </div>

          {/* Tab switcher */}
          <div className="mb-6 flex rounded-2xl p-1" style={{ backgroundColor: 'var(--glass-bg)' }}>
            {mainTabs.map(({ key, label }) => (
              <button key={key} onClick={() => setMainTab(key)}
                className="flex-1 rounded-xl py-2 text-[11px] font-bold tracking-widest uppercase transition-all"
                style={mainTab === key
                  ? { backgroundColor: 'rgba(251,146,60,0.15)', borderColor: ACCENT, color: ACCENT, border: `1px solid ${ACCENT}` }
                  : { color: 'var(--text-secondary)' }
                }>
                {label}
              </button>
            ))}
          </div>

          {/* ── Tab: Leistung ── */}
          {mainTab === 'leistung' && (
            <>
              {/* Power flow SVG */}
              <div className="mb-6">
                <p className="mb-3 text-[10px] font-bold tracking-[0.2em] text-[var(--text-muted)] uppercase">
                  Energiefluss
                </p>
                <div className="popup-surface rounded-2xl p-4">
                  <PowerFlowSvg
                    pvW={pvW}
                    houseW={houseW}
                    batteryInW={batteryInW}
                    batteryOutW={batteryDischarging ? batteryOutW : 0}
                    gridImportW={gridImportW}
                    gridExportW={gridExportW}
                    batterySoc={batterySoc}
                    pvDaily={pvDaily}
                  />
                </div>
              </div>

              {/* Today stats */}
              <div>
                <p className="mb-3 text-[10px] font-bold tracking-[0.2em] text-[var(--text-muted)] uppercase">
                  Heute
                </p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <InfoTile label="PV Ertrag" value={pvDaily != null ? `${pvDaily.toFixed(2)} kWh` : null} color={SOLAR_COLOR} />
                  <InfoTile
                    label="Batterie"
                    value={batteryInDaily != null ? `+${batteryInDaily.toFixed(2)}` : null}
                    sub={batteryOutDaily != null ? `-${batteryOutDaily.toFixed(2)} kWh` : ''}
                    color={BATT_COLOR}
                  />
                  <InfoTile label="Einspeisung" value={gridExportDaily != null ? `${gridExportDaily.toFixed(2)} kWh` : null} color="#4ade80" />
                  <InfoTile label="Bezug" value={gridImportDaily != null ? `${gridImportDaily.toFixed(2)} kWh` : null} color="#f87171" />
                </div>
              </div>
            </>
          )}

          {/* ── Tab: Prognose ── */}
          {mainTab === 'prognose' && (
            <div className="space-y-6 font-sans">
              {/* Summary row */}
              <div className="grid grid-cols-3 gap-3">
                <InfoTile
                  label="Heute gesamt"
                  value={v(PV_ENTITY_IDS.forecastToday) != null ? `${v(PV_ENTITY_IDS.forecastToday).toFixed(1)} kWh` : null}
                  color={SOLAR_COLOR}
                />
                <InfoTile
                  label="Morgen"
                  value={v(PV_ENTITY_IDS.forecastTomorrow) != null ? `${v(PV_ENTITY_IDS.forecastTomorrow).toFixed(1)} kWh` : null}
                  color="#fbbf24"
                />
                <InfoTile
                  label="Peak heute"
                  value={forecastPeakToday != null ? `${(forecastPeakToday / 1000).toFixed(2)} kW` : null}
                  color={SOLAR_COLOR}
                  sub={forecastRemaining != null ? `noch ${forecastRemaining.toFixed(1)} kWh` : ''}
                />
              </div>

              {/* Forecast chart */}
              <div className="popup-surface rounded-2xl p-4">
                <p className="mb-3 text-[10px] font-bold tracking-[0.15em] uppercase" style={{ color: 'var(--text-muted)' }}>
                  Prognose · orangefarbene Linie = tatsächliche Produktion
                </p>
                {histLoading ? (
                  <div className="flex h-[160px] items-center justify-center">
                    <div className="h-6 w-6 animate-spin rounded-full border-b-2 opacity-30" style={{ borderColor: SOLAR_COLOR }} />
                  </div>
                ) : (
                  <ForecastBarChart
                    forecastToday={e(PV_ENTITY_IDS.forecastToday)}
                    forecastTomorrow={e(PV_ENTITY_IDS.forecastTomorrow)}
                    forecastDay3={e(PV_ENTITY_IDS.forecastDay3)}
                    pvHistory={pvHistory}
                  />
                )}
              </div>

              {/* 5-day forecast tiles */}
              <div>
                <p className="mb-3 text-[10px] font-bold tracking-[0.2em] text-[var(--text-muted)] uppercase">
                  5-Tage Prognose
                </p>
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
                  {[
                    { key: 'forecastToday',    label: 'Heute' },
                    { key: 'forecastTomorrow', label: 'Morgen' },
                    { key: 'forecastDay3',     label: '+2' },
                    { key: 'forecastDay4',     label: '+3' },
                    { key: 'forecastDay5',     label: '+4' },
                  ].map(({ key, label }, i) => {
                    const val = v(PV_ENTITY_IDS[key]);
                    return (
                      <div key={key} className="popup-surface flex flex-col items-center justify-center gap-1 rounded-2xl p-4">
                        <p className="text-[10px] font-bold tracking-[0.15em] uppercase" style={{ color: 'var(--text-muted)' }}>{label}</p>
                        <p className="text-xl font-light" style={{ color: i === 0 ? SOLAR_COLOR : i === 1 ? '#fbbf24' : 'var(--text-secondary)' }}>
                          {val != null ? val.toFixed(1) : '—'}
                        </p>
                        <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>kWh</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── Tab: Statistik ── */}
          {mainTab === 'statistik' && (
            <div className="space-y-6 font-sans">
              {/* Eigenverbrauch / Autarkie */}
              <div>
                <p className="mb-3 text-[10px] font-bold tracking-[0.2em] text-[var(--text-muted)] uppercase">
                  Heute · Effizienz
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="popup-surface rounded-2xl p-4">
                    <p className="mb-1 text-[10px] font-bold tracking-[0.15em] uppercase" style={{ color: 'var(--text-muted)' }}>
                      Eigenverbrauch
                    </p>
                    <p className="text-2xl font-light" style={{ color: selfConsumption != null && selfConsumption >= 70 ? '#4ade80' : SOLAR_COLOR }}>
                      {selfConsumption != null ? `${selfConsumption}%` : '—'}
                    </p>
                    <p className="mt-1 text-[10px]" style={{ color: 'var(--text-muted)' }}>
                      PV direkt genutzt
                    </p>
                    {/* Progress bar */}
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full" style={{ backgroundColor: 'var(--glass-border)' }}>
                      <div className="h-full rounded-full" style={{ width: `${selfConsumption ?? 0}%`, backgroundColor: selfConsumption != null && selfConsumption >= 70 ? '#4ade80' : SOLAR_COLOR }} />
                    </div>
                  </div>
                  <div className="popup-surface rounded-2xl p-4">
                    <p className="mb-1 text-[10px] font-bold tracking-[0.15em] uppercase" style={{ color: 'var(--text-muted)' }}>
                      Autarkie
                    </p>
                    <p className="text-2xl font-light" style={{ color: autarkie != null && autarkie >= 80 ? '#4ade80' : '#fb923c' }}>
                      {autarkie != null ? `${autarkie}%` : '—'}
                    </p>
                    <p className="mt-1 text-[10px]" style={{ color: 'var(--text-muted)' }}>
                      Unabhängigkeit vom Netz
                    </p>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full" style={{ backgroundColor: 'var(--glass-border)' }}>
                      <div className="h-full rounded-full" style={{ width: `${autarkie ?? 0}%`, backgroundColor: autarkie != null && autarkie >= 80 ? '#4ade80' : '#fb923c' }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Production stats */}
              <div>
                <p className="mb-3 text-[10px] font-bold tracking-[0.2em] text-[var(--text-muted)] uppercase">
                  Ertrag
                </p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <InfoTile label="Heute" value={pvDaily != null ? `${pvDaily.toFixed(2)} kWh` : null} color={SOLAR_COLOR} />
                  <InfoTile label="Monat" value={pvMonthly != null ? `${pvMonthly.toFixed(1)} kWh` : null} color={SOLAR_COLOR} />
                  <InfoTile label="Jahr" value={pvYearly != null ? `${(pvYearly / 1000).toFixed(2)} MWh` : null} color={SOLAR_COLOR} />
                  <InfoTile label="Verbrauch heute" value={houseDaily != null ? `${houseDaily.toFixed(2)} kWh` : null} color={HOUSE_COLOR} />
                </div>
              </div>

              {/* Battery */}
              <div>
                <p className="mb-3 text-[10px] font-bold tracking-[0.2em] text-[var(--text-muted)] uppercase">
                  Batterie
                </p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <InfoTile label="SOC" value={batterySoc != null ? `${batterySoc.toFixed(0)} %` : null} color={getBattSocColor(batterySoc)} />
                  <InfoTile label="Geladen heute" value={batteryInDaily != null ? `${batteryInDaily.toFixed(2)} kWh` : null} color={BATT_COLOR} />
                  <InfoTile label="Entladen heute" value={batteryOutDaily != null ? `${batteryOutDaily.toFixed(2)} kWh` : null} color={BATT_COLOR} />
                  <InfoTile label="Netz Export" value={gridExportDaily != null ? `${gridExportDaily.toFixed(2)} kWh` : null} color="#4ade80" />
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </AccessibleModalShell>
  );
}
