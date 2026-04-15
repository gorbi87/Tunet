import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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

// Animated dashed line — values="26;0" flows in drawing direction, "0;26" reverses
function AnimatedLine({ x1, y1, x2, y2, color, active, reverse = false }) {
  if (!active) {
    return <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth="1" strokeOpacity="0.12" />;
  }
  return (
    <line x1={x1} y1={y1} x2={x2} y2={y2}
      stroke={color} strokeWidth="2.5" strokeOpacity="0.75" strokeDasharray="8 5">
      <animate attributeName="stroke-dashoffset" values={reverse ? '0;26' : '26;0'} dur="1.2s" repeatCount="indefinite" />
    </line>
  );
}

// Arrowhead placed at 58% along the line so it's clearly mid-line, not touching boxes
function MidArrow({ x1, y1, x2, y2, color, active }) {
  if (!active) return null;
  const mx = x1 + (x2 - x1) * 0.58;
  const my = y1 + (y2 - y1) * 0.58;
  const dx = x2 - x1, dy = y2 - y1;
  const s = 7;
  let pts;
  if (Math.abs(dy) > Math.abs(dx)) {
    pts = dy > 0
      ? `${mx},${my + s} ${mx - s * 0.55},${my - s * 0.45} ${mx + s * 0.55},${my - s * 0.45}`
      : `${mx},${my - s} ${mx - s * 0.55},${my + s * 0.45} ${mx + s * 0.55},${my + s * 0.45}`;
  } else {
    pts = dx > 0
      ? `${mx + s},${my} ${mx - s * 0.45},${my - s * 0.55} ${mx - s * 0.45},${my + s * 0.55}`
      : `${mx - s},${my} ${mx + s * 0.45},${my - s * 0.55} ${mx + s * 0.45},${my + s * 0.55}`;
  }
  return <polygon points={pts} fill={color} opacity="0.9" />;
}

// Battery icon with fill level + SOC% and optional charge indicator inside
function BatteryIcon({ x, y, w, h, soc, color, charging }) {
  const nibH = Math.round(h * 0.5);
  const nibY = y + (h - nibH) / 2;
  const innerW = w - 3;
  const fillW = soc != null ? Math.max(0, Math.min(innerW * soc / 100, innerW)) : 0;
  // Use white text when battery is more than 1/3 full (fill covers center), else use color
  const textFill = fillW > innerW / 3 ? 'white' : color;
  const label = soc != null
    ? `${soc.toFixed(0)}%${charging ? ' ⚡' : ''}`
    : '—';
  return (
    <>
      <rect x={x} y={y} width={w} height={h} rx="3" fill="none" stroke={color} strokeWidth="1.2" strokeOpacity="0.5" />
      <rect x={x + w} y={nibY} width={4} height={nibH} rx="1" fill={color} opacity="0.45" />
      {soc != null && (
        <rect x={x + 1.5} y={y + 1.5} width={fillW} height={h - 3} rx="2" fill={color} opacity={charging ? 0.9 : 0.65} />
      )}
      <text x={x + w / 2} y={y + h / 2 + 4} textAnchor="middle" fontSize="10" fontWeight="bold" fill={textFill} opacity="0.95">
        {label}
      </text>
    </>
  );
}

// Returns "voll in Xh Ym" or "leer in Xh Ym" or null
function fmtBattTime(soc, maxKwh, powerW, charging) {
  if (soc == null || maxKwh == null || maxKwh <= 0 || !powerW || powerW < 10) return null;
  const powerKw = powerW / 1000;
  const hrs = charging
    ? (maxKwh * (1 - soc / 100)) / powerKw          // charge to 100%
    : (maxKwh * Math.max(0, soc - 10) / 100) / powerKw; // discharge to 10% min
  if (hrs <= 0 || hrs > 48) return null;
  const h = Math.floor(hrs);
  const m = Math.round((hrs - h) * 60);
  const time = h > 0 ? `${h}h${m > 0 ? ` ${m}m` : ''}` : `${m}min`;
  return `${charging ? 'voll' : 'leer'} in ${time}`;
}

function PowerFlowSvg({ pvW, houseW, heatPumpW, batteryInW, batteryOutW, gridImportW, gridExportW, batterySoc, batteryMaxEnergy, pvDaily }) {
  const solarActive = pvW != null && pvW > 10;
  const battCharge = batteryInW != null && batteryInW > 10;
  const battDischarge = !battCharge && batteryOutW != null && batteryOutW > 10;
  const gridExport = gridExportW != null && gridExportW > 10;
  const gridImport = !gridExport && gridImportW != null && gridImportW > 10;
  const houseActive = houseW != null && houseW > 10;

  const socColor = getBattSocColor(batterySoc);
  const fmt = (w) => w != null ? (w >= 1000 ? `${(w / 1000).toFixed(1)} kW` : `${Math.round(w)} W`) : '—';

  // Time to full / empty
  const battTimeStr = battCharge
    ? fmtBattTime(batterySoc, batteryMaxEnergy, batteryInW, true)
    : battDischarge
      ? fmtBattTime(batterySoc, batteryMaxEnergy, batteryOutW, false)
      : null;

  // Layout — viewBox 340 × 226
  // Middle row boxes h=58 so battery icon + time line fits cleanly
  const CX = 170;
  const SOLAR = { x: 120, y: 8,   w: 100, h: 44, cx: 170, cy: 30  };
  const BATT  = { x: 5,   y: 88,  w: 82,  h: 58, cx: 46,  cy: 117 };
  const INV   = { x: 130, y: 88,  w: 80,  h: 58, cx: 170, cy: 117 };
  const GRID  = { x: 253, y: 88,  w: 82,  h: 58, cx: 294, cy: 117 };
  const HOUSE = { x: 120, y: 172, w: 100, h: 44, cx: 170, cy: 194 };
  const WP    = { x: 253, y: 172, w: 82,  h: 44, cx: 294, cy: 194 };
  const wpActive = heatPumpW != null && heatPumpW > 10;
  const WP_COLOR = '#f472b6';

  // Battery icon: tall enough to fit SOC% inside, centered in upper part of BATT box
  const battIconW = 60, battIconH = 26;
  const battIconX = BATT.x + Math.round((BATT.w - battIconW) / 2);
  const battIconY = BATT.y + 14;

  return (
    <svg viewBox="0 0 340 226" className="w-full" style={{ fontFamily: 'inherit' }}>
      {/* ── Connecting lines + mid-arrows ── */}

      {/* Solar → Inverter (down) */}
      <AnimatedLine x1={CX} y1={SOLAR.y + SOLAR.h} x2={CX} y2={INV.y} color={SOLAR_COLOR} active={solarActive} />
      <MidArrow x1={CX} y1={SOLAR.y + SOLAR.h} x2={CX} y2={INV.y} color={SOLAR_COLOR} active={solarActive} />

      {/* Battery ↔ Inverter: line drawn left→right; charge = reverse */}
      <AnimatedLine
        x1={BATT.x + BATT.w} y1={INV.cy} x2={INV.x} y2={INV.cy}
        color={BATT_COLOR} active={battCharge || battDischarge} reverse={battCharge}
      />
      <MidArrow
        x1={battCharge ? INV.x : BATT.x + BATT.w} y1={INV.cy}
        x2={battCharge ? BATT.x + BATT.w : INV.x} y2={INV.cy}
        color={BATT_COLOR} active={battCharge || battDischarge}
      />
      {(battCharge || battDischarge) && (() => {
        const lx = Math.round((BATT.x + BATT.w + INV.x) / 2);
        const pw = fmt(battCharge ? batteryInW : batteryOutW);
        return (
          <>
            <rect x={lx - 18} y={INV.cy - 14} width={36} height={11} rx="3"
              fill="var(--card-bg)" opacity="0.85" />
            <text x={lx} y={INV.cy - 6} textAnchor="middle" fontSize="7.5" fontWeight="bold" fill={socColor}>
              {battCharge ? '+' : '−'}{pw}
            </text>
          </>
        );
      })()}

      {/* Inverter ↔ Grid: line drawn left→right; import = reverse */}
      <AnimatedLine
        x1={INV.x + INV.w} y1={INV.cy} x2={GRID.x} y2={INV.cy}
        color={GRID_COLOR} active={gridImport || gridExport} reverse={gridImport}
      />
      <MidArrow
        x1={gridExport ? INV.x + INV.w : GRID.x} y1={INV.cy}
        x2={gridExport ? GRID.x : INV.x + INV.w} y2={INV.cy}
        color={GRID_COLOR} active={gridImport || gridExport}
      />

      {/* Inverter → House (down) */}
      <AnimatedLine x1={CX} y1={INV.y + INV.h} x2={CX} y2={HOUSE.y} color={HOUSE_COLOR} active={houseActive} />
      <MidArrow x1={CX} y1={INV.y + INV.h} x2={CX} y2={HOUSE.y} color={HOUSE_COLOR} active={houseActive} />

      {/* ── Solar box ── */}
      <rect x={SOLAR.x} y={SOLAR.y} width={SOLAR.w} height={SOLAR.h} rx="8" fill="rgba(251,146,60,0.08)" stroke={SOLAR_COLOR} strokeWidth="1" strokeOpacity="0.5" />
      <text x={SOLAR.cx} y={SOLAR.y + 14} textAnchor="middle" fontSize="7" fontWeight="bold" fill={SOLAR_COLOR} letterSpacing="0.08em" opacity="0.7">SOLAR</text>
      <text x={SOLAR.cx} y={SOLAR.y + 30} textAnchor="middle" fontSize="14" fontWeight="300" fill={SOLAR_COLOR}>{fmt(pvW)}</text>
      {pvDaily != null && (
        <text x={SOLAR.cx} y={SOLAR.y + 42} textAnchor="middle" fontSize="7" fill={SOLAR_COLOR} opacity="0.5">{pvDaily.toFixed(1)} kWh heute</text>
      )}

      {/* ── Inverter box ── */}
      <rect x={INV.x} y={INV.y} width={INV.w} height={INV.h} rx="8" fill="var(--glass-bg)" stroke="var(--glass-border)" strokeWidth="1" />
      <text x={INV.cx} y={INV.y + 16} textAnchor="middle" fontSize="7" fontWeight="bold" fill="var(--text-secondary)" letterSpacing="0.08em" opacity="0.6">INVERTER</text>
      <text x={INV.cx} y={INV.y + 31} textAnchor="middle" fontSize="8" fill="var(--text-secondary)" opacity="0.5">SolarEdge</text>
      <text x={INV.cx} y={INV.y + 44} textAnchor="middle" fontSize="7" fill="var(--text-muted)" opacity="0.4">SE5K</text>

      {/* ── Battery box ── */}
      <rect x={BATT.x} y={BATT.y} width={BATT.w} height={BATT.h} rx="8" fill="rgba(240,98,146,0.08)" stroke={BATT_COLOR} strokeWidth="1" strokeOpacity="0.4" />
      <text x={BATT.cx} y={BATT.y + 12} textAnchor="middle" fontSize="7" fontWeight="bold" fill={BATT_COLOR} letterSpacing="0.08em" opacity="0.7">BATT</text>
      <BatteryIcon
        x={battIconX} y={battIconY} w={battIconW} h={battIconH}
        soc={batterySoc} color={socColor} charging={battCharge}
      />
      {battTimeStr && (
        <text x={BATT.cx} y={BATT.y + BATT.h - 6} textAnchor="middle" fontSize="7" fill={socColor} opacity="0.8">
          {battTimeStr}
        </text>
      )}

      {/* ── Grid box ── */}
      <rect x={GRID.x} y={GRID.y} width={GRID.w} height={GRID.h} rx="8" fill="rgba(100,181,246,0.08)" stroke={GRID_COLOR} strokeWidth="1" strokeOpacity="0.4" />
      <text x={GRID.cx} y={GRID.y + 14} textAnchor="middle" fontSize="7" fontWeight="bold" fill={GRID_COLOR} letterSpacing="0.08em" opacity="0.7">NETZ</text>
      <text x={GRID.cx} y={GRID.y + 32} textAnchor="middle" fontSize="13" fontWeight="300"
        fill={gridExport ? '#4ade80' : gridImport ? '#f87171' : 'var(--text-secondary)'}>
        {gridExport ? `+${fmt(gridExportW)}` : gridImport ? `-${fmt(gridImportW)}` : '0 W'}
      </text>
      <text x={GRID.cx} y={GRID.y + 46} textAnchor="middle" fontSize="7" fill={GRID_COLOR} opacity="0.5">
        {gridExport ? 'Einspeisung' : gridImport ? 'Bezug' : 'Ausgeglichen'}
      </text>

      {/* House → WP */}
      <AnimatedLine x1={HOUSE.x + HOUSE.w} y1={HOUSE.cy} x2={WP.x} y2={WP.cy} color={WP_COLOR} active={wpActive} />
      <MidArrow x1={HOUSE.x + HOUSE.w} y1={HOUSE.cy} x2={WP.x} y2={WP.cy} color={WP_COLOR} active={wpActive} />

      {/* ── House box ── */}
      <rect x={HOUSE.x} y={HOUSE.y} width={HOUSE.w} height={HOUSE.h} rx="8" fill="rgba(129,199,132,0.08)" stroke={HOUSE_COLOR} strokeWidth="1" strokeOpacity="0.4" />
      <text x={HOUSE.cx} y={HOUSE.y + 14} textAnchor="middle" fontSize="7" fontWeight="bold" fill={HOUSE_COLOR} letterSpacing="0.08em" opacity="0.7">HAUS</text>
      <text x={HOUSE.cx} y={HOUSE.y + 30} textAnchor="middle" fontSize="14" fontWeight="300" fill={HOUSE_COLOR}>{fmt(houseW)}</text>
      <text x={HOUSE.cx} y={HOUSE.y + 41} textAnchor="middle" fontSize="7" fill={HOUSE_COLOR} opacity="0.5">Verbrauch</text>

      {/* ── WP box ── */}
      <rect x={WP.x} y={WP.y} width={WP.w} height={WP.h} rx="8" fill="rgba(244,114,182,0.08)" stroke={WP_COLOR} strokeWidth="1" strokeOpacity={wpActive ? 0.6 : 0.25} />
      <text x={WP.cx} y={WP.y + 14} textAnchor="middle" fontSize="7" fontWeight="bold" fill={WP_COLOR} letterSpacing="0.08em" opacity="0.7">WÄRMEPUMPE</text>
      <text x={WP.cx} y={WP.y + 30} textAnchor="middle" fontSize="13" fontWeight="300" fill={wpActive ? WP_COLOR : 'var(--text-secondary)'}>
        {wpActive ? fmt(heatPumpW) : '—'}
      </text>
      <text x={WP.cx} y={WP.y + 41} textAnchor="middle" fontSize="7" fill={WP_COLOR} opacity="0.5">
        {wpActive ? 'aktiv' : 'inaktiv'}
      </text>
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
  const [energyFullscreen, setEnergyFullscreen] = useState(false);
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
  const heatPumpW = v('sensor.daikin_heizung_leistung');
  const batteryInW = v(PV_ENTITY_IDS.batteryInW);
  const batterySoc = v(PV_ENTITY_IDS.batterySoc);
  const batteryInDaily = v(PV_ENTITY_IDS.batteryInDaily);
  const batteryOutDaily = v(PV_ENTITY_IDS.batteryOutDaily);
  const gridImportW = v(PV_ENTITY_IDS.gridImportW);
  const gridExportW = v(PV_ENTITY_IDS.gridExportW);
  const gridImportDaily = v(PV_ENTITY_IDS.gridImportDaily);
  const gridExportDaily = v(PV_ENTITY_IDS.gridExportDaily);
  const pvToHouseDaily = v(PV_ENTITY_IDS.pvToHouseDaily);
  const batteryMaxEnergy = v(PV_ENTITY_IDS.batteryMaxEnergy);
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

  const isCompact = window.innerHeight < 900 ||
    window.matchMedia('(hover: none) and (pointer: coarse)').matches;

  const mainTabs = [
    { key: 'leistung', label: 'Leistung' },
    { key: 'prognose', label: 'Prognose' },
    { key: 'statistik', label: 'Statistik' },
    { key: 'energie', label: 'Energy Dashboard' },
  ];

  return (
    <>
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
          {/* ── Fixed header ── */}
          <div
            className={`flex-shrink-0 border-b ${isCompact ? 'p-4 pb-3' : 'p-8 pb-5'}`}
            style={{ borderColor: 'var(--glass-border)' }}
          >
          {/* Close */}
          <div className="absolute top-4 right-4 z-20">
            <button onClick={onClose} className="modal-close" aria-label="Schließen">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Header */}
          <div className="mb-4 flex items-center gap-3 pr-10 font-sans">
            <div className="rounded-2xl p-3 transition-all duration-500"
              style={{ backgroundColor: 'rgba(251,146,60,0.15)', color: SOLAR_COLOR }}>
              <Sun className="h-6 w-6" />
            </div>
            <div>
              <h3 id={modalTitleId}
                className="text-xl leading-none font-light tracking-tight text-[var(--text-primary)] uppercase italic">
                {name}
              </h3>
              <div className="mt-1.5 inline-flex items-center gap-2 rounded-full border px-3 py-1 transition-all duration-500"
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
          <div className="flex rounded-2xl p-1" style={{ backgroundColor: 'var(--glass-bg)' }}>
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
          </div>{/* end fixed header */}

          {/* ── Scrollable content ── */}
          <div className={`flex-1 overflow-y-auto ${isCompact ? 'p-4' : 'p-8'}`}>

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
                    heatPumpW={heatPumpW}
                    batteryInW={batteryInW}
                    batteryOutW={batteryDischarging ? batteryOutW : 0}
                    gridImportW={gridImportW}
                    gridExportW={gridExportW}
                    batterySoc={batterySoc}
                    batteryMaxEnergy={batteryMaxEnergy}
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
          {/* ── Tab: Energy Dashboard ── */}
          {mainTab === 'energie' && (
            <div className="flex h-full flex-col items-center justify-center gap-6">
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="rounded-2xl p-4" style={{ backgroundColor: 'rgba(251,146,60,0.1)' }}>
                  <Sun className="h-8 w-8" style={{ color: SOLAR_COLOR }} />
                </div>
                <p className="text-base font-medium text-[var(--text-primary)]">Energy Dashboard</p>
                <p className="text-[11px] text-[var(--text-muted)]">Detaillierte Energieauswertung</p>
              </div>
              <button
                onClick={() => setEnergyFullscreen(true)}
                className="rounded-2xl px-6 py-3 text-sm font-semibold text-white transition-opacity active:opacity-70"
                style={{ backgroundColor: SOLAR_COLOR }}
              >
                Im Vollbild öffnen
              </button>
            </div>
          )}
          </div>{/* end scrollable content */}
        </>
      )}
    </AccessibleModalShell>

    {/* ── Energy Dashboard Fullscreen Overlay ── */}
    {energyFullscreen && createPortal(
      <div className="fixed inset-0 z-[500] flex flex-col bg-black">
        {/* Back bar */}
        <div
          className="flex flex-shrink-0 items-center gap-3 px-4 py-3"
          style={{ backgroundColor: 'rgba(0,0,0,0.85)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}
        >
          <button
            onClick={() => setEnergyFullscreen(false)}
            className="flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-semibold text-white transition-opacity active:opacity-70"
            style={{ backgroundColor: 'rgba(251,146,60,0.2)', border: '1px solid rgba(251,146,60,0.4)' }}
          >
            <span style={{ color: SOLAR_COLOR }}>←</span>
            <span style={{ color: SOLAR_COLOR }}>Zurück zu Solar</span>
          </button>
        </div>
        {import.meta.env.DEV ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-white opacity-50">
            <Sun className="h-10 w-10" style={{ color: SOLAR_COLOR }} />
            <p className="text-sm">Nur in Home Assistant verfügbar</p>
            <p className="text-[11px]">/local/community/ha-energy-dashboard/index.html</p>
          </div>
        ) : (
          <iframe
            src="/local/community/ha-energy-dashboard/index.html"
            className="flex-1 border-0"
            title="Energy Dashboard"
            sandbox="allow-scripts allow-same-origin allow-forms"
            style={{ width: '100%' }}
          />
        )}
      </div>,
      document.body
    )}
    </>
  );
}
