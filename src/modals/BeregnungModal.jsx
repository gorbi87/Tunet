import { useState, useEffect } from 'react';
import { X, Droplets, Play, Pause } from '../icons';
import AccessibleModalShell from '../components/ui/AccessibleModalShell';
import { getHistoryRest, getHistory } from '../services/haClient';

const MASTER_ENTITY = 'binary_sensor.irrigation_unlimited_c1_m';
const MASTER_STATUS = 'binary_sensor.beregung_master_status';

const ZONES = [
  {
    key: 'z1',
    name: 'Terrasse rechts',
    switchId: 'switch.irrigation_manual_zone_1',
    sensorId: 'binary_sensor.irrigation_unlimited_c1_z1',
    minutesId: 'input_number.manual_irrigation_z1_minutes',
    smartMinId: 'sensor.smart_irrigation_terrasse_rechts_min',
    color: '#34d399',
  },
  {
    key: 'z3',
    name: 'Terrasse links',
    switchId: 'switch.irrigation_manual_zone_3',
    sensorId: 'binary_sensor.irrigation_unlimited_c1_z3',
    minutesId: 'input_number.manual_irrigation_z3_minutes',
    smartMinId: 'sensor.smart_irrigation_terrasse_links_min',
    color: '#60a5fa',
  },
  {
    key: 'z2',
    name: 'Rasenfläche',
    switchId: 'switch.irrigation_manual_zone_2',
    sensorId: 'binary_sensor.irrigation_unlimited_c1_z2',
    minutesId: 'input_number.manual_irrigation_z2_minutes',
    smartMinId: 'sensor.smart_irrigation_rasenflache_min',
    color: '#a78bfa',
  },
];

const MAIN_TABS = [
  { key: 'regen', label: 'Regen' },
  { key: 'zonen', label: 'Zonen' },
  { key: 'verlauf', label: 'Verlauf' },
  { key: 'ventile', label: 'Ventile' },
];

const HIST_DAYS = 14;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getLastNDays(n) {
  const days = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    days.push(d);
  }
  return days;
}

function fmtDay(date) {
  return `${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')}`;
}

async function fetchEntityHistory(conn, haUrl, haToken, entityId, start) {
  const end = new Date();
  const opts = { entityId, start, end, minimal_response: false, no_attributes: true, significant_changes_only: false };
  // Try WebSocket first (always available), fall back to REST
  if (conn) {
    try {
      const wsData = await getHistory(conn, opts);
      const raw = Array.isArray(wsData?.[0]) ? wsData[0] : Array.isArray(wsData) ? wsData : [];
      if (raw.length > 0) return raw;
    } catch (_e) {}
  }
  try {
    const data = await getHistoryRest(haUrl, haToken, opts);
    return Array.isArray(data?.[0]) ? data[0] : Array.isArray(data) ? data : [];
  } catch (_e2) {
    return [];
  }
}

function getTs(item) {
  const ts = item.last_changed ?? item.lu ?? item.lc ?? item.last_updated;
  if (typeof ts === 'number') return new Date(ts * 1000);
  return new Date(ts);
}

function parseZoneMinutesByDay(histData, days) {
  const byDate = {};
  days.forEach((d) => { byDate[d.toDateString()] = 0; });
  if (!Array.isArray(histData) || !histData.length) return byDate;
  let onTime = null;
  for (const item of histData) {
    const t = getTs(item);
    if (isNaN(t.getTime())) continue;
    const state = item.state ?? item.s;
    if (state === 'on') {
      onTime = t;
    } else if (state === 'off' && onTime) {
      const dMin = (t - onTime) / 60000;
      const d = new Date(onTime);
      d.setHours(0, 0, 0, 0);
      if (byDate[d.toDateString()] !== undefined) byDate[d.toDateString()] += dMin;
      onTime = null;
    }
  }
  if (onTime) {
    const d = new Date(onTime);
    d.setHours(0, 0, 0, 0);
    if (byDate[d.toDateString()] !== undefined) byDate[d.toDateString()] += (new Date() - onTime) / 60000;
  }
  return byDate;
}

function parseRainByDay(histData, days) {
  const byDate = {};
  days.forEach((d) => { byDate[d.toDateString()] = null; });
  if (!Array.isArray(histData) || !histData.length) return byDate;
  for (const item of histData) {
    const val = parseFloat(item.state ?? item.s);
    if (isNaN(val)) continue;
    const t = getTs(item);
    if (isNaN(t.getTime())) continue;
    const d = new Date(t);
    d.setHours(0, 0, 0, 0);
    const key = d.toDateString();
    if (key in byDate) byDate[key] = Math.max(byDate[key] ?? 0, val);
  }
  return byDate;
}

// ─── SVG Charts ──────────────────────────────────────────────────────────────

function BarChart({ days, valuesByDay, color, height = 160 }) {
  const W = 400, H = height;
  const PAD = { top: 10, right: 6, bottom: 20, left: 28 };
  const GW = W - PAD.left - PAD.right;
  const GH = H - PAD.top - PAD.bottom;
  const vals = days.map((d) => valuesByDay[d.toDateString()] ?? 0);
  const maxVal = Math.max(...vals, 0.1);
  const step = GW / days.length;
  const barW = Math.max(1, step - 2);
  const toX = (i) => PAD.left + i * step + (step - barW) / 2;
  const toY = (v) => PAD.top + GH - (v / maxVal) * GH;
  const labelStep = Math.ceil(days.length / 6);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height }}>
      {[0, maxVal / 2, maxVal].map((v, i) => (
        <g key={i}>
          <line x1={PAD.left} y1={toY(v)} x2={W - PAD.right} y2={toY(v)}
            stroke="currentColor" strokeOpacity="0.07" strokeDasharray="3 3" />
          <text x={PAD.left - 3} y={toY(v) + 3} textAnchor="end" fontSize="7" fill="currentColor" opacity="0.4">
            {v >= 10 ? v.toFixed(0) : v.toFixed(1)}
          </text>
        </g>
      ))}
      {days.map((d, i) => {
        const v = vals[i];
        const bH = Math.max(v > 0 ? 2 : 0, (v / maxVal) * GH);
        return <rect key={i} x={toX(i)} y={toY(v)} width={barW} height={bH} fill={color} opacity={0.75} rx="1" />;
      })}
      {days.map((d, i) => {
        if (i % labelStep !== 0 && i !== days.length - 1) return null;
        return (
          <text key={i} x={toX(i) + barW / 2} y={H - 3} textAnchor="middle" fontSize="7" fill="currentColor" opacity="0.45">
            {fmtDay(d)}
          </text>
        );
      })}
    </svg>
  );
}

function StackedBarChart({ days, zoneData, height = 160 }) {
  const W = 400, H = height;
  const PAD = { top: 10, right: 6, bottom: 20, left: 32 };
  const GW = W - PAD.left - PAD.right;
  const GH = H - PAD.top - PAD.bottom;
  const totals = days.map((d) =>
    ZONES.reduce((s, z) => s + (zoneData[z.key]?.[d.toDateString()] ?? 0), 0)
  );
  const maxVal = Math.max(...totals, 1);
  const step = GW / days.length;
  const barW = Math.max(1, step - 2);
  const toX = (i) => PAD.left + i * step + (step - barW) / 2;
  const labelStep = Math.ceil(days.length / 6);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height }}>
      {[0, maxVal / 2, maxVal].map((v, i) => (
        <g key={i}>
          <line x1={PAD.left} y1={PAD.top + GH * (1 - v / maxVal)} x2={W - PAD.right} y2={PAD.top + GH * (1 - v / maxVal)}
            stroke="currentColor" strokeOpacity="0.07" strokeDasharray="3 3" />
          <text x={PAD.left - 3} y={PAD.top + GH * (1 - v / maxVal) + 3} textAnchor="end" fontSize="7" fill="currentColor" opacity="0.4">
            {v.toFixed(0)}
          </text>
        </g>
      ))}
      {days.map((d, i) => {
        const key = d.toDateString();
        let cumMin = 0;
        return ZONES.map((z) => {
          const v = zoneData[z.key]?.[key] ?? 0;
          if (v <= 0) return null;
          const bH = Math.max(2, (v / maxVal) * GH);
          const y = PAD.top + GH - ((cumMin + v) / maxVal) * GH;
          cumMin += v;
          return <rect key={z.key} x={toX(i)} y={y} width={barW} height={bH} fill={z.color} opacity={0.8} rx="1" />;
        });
      })}
      {days.map((d, i) => {
        if (i % labelStep !== 0 && i !== days.length - 1) return null;
        return (
          <text key={i} x={toX(i) + barW / 2} y={H - 3} textAnchor="middle" fontSize="7" fill="currentColor" opacity="0.45">
            {fmtDay(d)}
          </text>
        );
      })}
    </svg>
  );
}

// ─── Shared stat chip ────────────────────────────────────────────────────────

function StatBox({ label, value, unit, color }) {
  return (
    <div className="popup-surface flex flex-col items-center justify-center gap-1 rounded-2xl p-3">
      <p className="text-[10px] font-bold tracking-[0.15em] uppercase" style={{ color: 'var(--text-muted)' }}>
        {label}
      </p>
      <p className="text-xl font-light" style={{ color: color || 'var(--text-primary)' }}>
        {value ?? '—'}
      </p>
      {unit && <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{unit}</p>}
    </div>
  );
}

// ─── Zone card ───────────────────────────────────────────────────────────────

function ZoneCard({ zone, entities, callService }) {
  const sensor = entities?.[zone.sensorId];
  const minutesEntity = entities?.[zone.minutesId];
  const smartEntity = entities?.[zone.smartMinId];

  const isRunning = sensor?.state === 'on';
  const timeRemaining = sensor?.attributes?.time_remaining;
  const minutes = parseFloat(minutesEntity?.state) || 0;
  const minMin = parseFloat(minutesEntity?.attributes?.min) || 1;
  const minMax = parseFloat(minutesEntity?.attributes?.max) || 60;
  const smartMin = smartEntity ? parseFloat(smartEntity.state) : null;

  const start = () => callService?.('switch', 'turn_on', { entity_id: zone.switchId });
  const stop = () => callService?.('switch', 'turn_off', { entity_id: zone.switchId });
  const setMinutes = (val) =>
    callService?.('input_number', 'set_value', { entity_id: zone.minutesId, value: val });

  return (
    <div
      className="popup-surface rounded-2xl p-4 flex flex-col gap-3 transition-colors"
      style={isRunning ? { borderColor: `${zone.color}50`, backgroundColor: `${zone.color}0d` } : {}}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            {isRunning && (
              <span className="h-2 w-2 rounded-full animate-pulse shrink-0" style={{ backgroundColor: zone.color }} />
            )}
            <p className="text-sm font-semibold text-[var(--text-primary)]">{zone.name}</p>
          </div>
          {isRunning && timeRemaining && (
            <p className="text-xs mt-0.5 font-light" style={{ color: zone.color }}>Läuft noch {timeRemaining}</p>
          )}
        </div>
        {isRunning ? (
          <button onClick={stop}
            className="shrink-0 flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold border bg-red-500/20 text-red-400 border-red-500/40 uppercase tracking-wider">
            <Pause className="h-3 w-3" /> Stopp
          </button>
        ) : (
          <button onClick={start}
            className="shrink-0 flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold border uppercase tracking-wider transition-all"
            style={{ backgroundColor: `${zone.color}20`, color: zone.color, borderColor: `${zone.color}50` }}>
            <Play className="h-3 w-3" /> Start
          </button>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between items-center">
          <p className="text-[10px] font-bold tracking-[0.15em] uppercase" style={{ color: 'var(--text-muted)' }}>
            Manuelle Dauer
          </p>
          <div className="flex items-center gap-2">
            {smartMin != null && smartMin > 0 && (
              <span className="text-[10px] text-green-400 border border-green-500/30 bg-green-500/10 rounded-full px-2 py-0.5">
                Smart: {smartMin} min
              </span>
            )}
            <span className="text-sm font-light text-[var(--text-primary)]">{minutes} min</span>
          </div>
        </div>
        <input type="range" min={minMin} max={minMax} step={1} value={minutes}
          onChange={(e) => setMinutes(Number(e.target.value))}
          className="w-full accent-emerald-400" />
      </div>
    </div>
  );
}

// ─── Tab: Zonen ──────────────────────────────────────────────────────────────

function ZonenTab({ entities, callService, isCompact }) {
  const totalMin = entities?.['sensor.beregnung_gesamtzeit_minuten']?.state;

  return (
    <div className="space-y-3">
      {totalMin != null && Number(totalMin) > 0 && (
        <p className="text-sm font-light" style={{ color: 'var(--text-secondary)' }}>
          <span className="font-semibold text-orange-400">{totalMin} min</span> gesamt aktiv
        </p>
      )}
      {ZONES.map((zone) => (
        <ZoneCard key={zone.key} zone={zone} entities={entities} callService={callService} />
      ))}
    </div>
  );
}

// ─── Tab: Regen ──────────────────────────────────────────────────────────────

function RegenTab({ entities, rainHistory, days, loading, isPhone }) {
  const daily = entities?.['sensor.gw2000a_daily_rain']?.state;
  const hourly = entities?.['sensor.gw2000a_hourly_rain']?.state;
  const weekly = entities?.['sensor.gw2000a_weekly_rain']?.state;
  const yearly = entities?.['sensor.gw2000a_yearly_rain']?.state;
  const rate = entities?.['sensor.gw2000a_rain_rate']?.state;
  const bucket = entities?.['sensor.rasenflache_bucket']?.state;
  const water = entities?.['sensor.wasserzaehler_value']?.state;

  const smartZones = [
    { name: 'T. rechts', id: 'sensor.smart_irrigation_terrasse_rechts_min' },
    { name: 'T. links', id: 'sensor.smart_irrigation_terrasse_links_min' },
    { name: 'Rasen', id: 'sensor.smart_irrigation_rasenflache_min' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-2 text-[10px] font-bold tracking-[0.2em] uppercase" style={{ color: 'var(--text-muted)' }}>
          Niederschlag
        </p>
        <div className={`grid gap-2 mb-4 ${isPhone ? 'grid-cols-2' : 'grid-cols-4'}`}>
          <StatBox label="Rate" value={rate} unit="mm/h" color={Number(rate) > 0 ? '#60a5fa' : undefined} />
          <StatBox label="Täglich" value={daily} unit="mm" color="#60a5fa" />
          <StatBox label="Wöchentl." value={weekly} unit="mm" color="#60a5fa" />
          <StatBox label="Jährlich" value={yearly} unit="mm" color="#60a5fa" />
        </div>
        <div className="popup-surface rounded-2xl p-4">
          <p className="mb-2 text-[10px] font-bold tracking-[0.15em] uppercase" style={{ color: 'var(--text-muted)' }}>
            14-Tage-Verlauf
          </p>
          {loading ? (
            <div className="flex h-20 items-center justify-center text-xs" style={{ color: 'var(--text-secondary)' }}>Lade…</div>
          ) : (
            <BarChart days={days} valuesByDay={rainHistory} color="#60a5fa" height={160} />
          )}
        </div>
      </div>

      <div>
        <p className="mb-2 text-[10px] font-bold tracking-[0.2em] uppercase" style={{ color: 'var(--text-muted)' }}>
          Smart Irrigation
        </p>
        <div className="grid grid-cols-3 gap-2">
          {smartZones.map((z) => (
            <StatBox key={z.id} label={z.name} value={entities?.[z.id]?.state ?? '—'} unit="min" color="#4ade80" />
          ))}
        </div>
        {bucket != null && (
          <div className="popup-surface mt-2 flex items-center justify-between rounded-2xl px-4 py-3">
            <p className="text-sm font-light" style={{ color: 'var(--text-secondary)' }}>Bodenwasser-Vorrat</p>
            <p className="text-sm font-semibold text-cyan-400">{bucket} mm</p>
          </div>
        )}
      </div>

      {water != null && (
        <div>
          <p className="mb-2 text-[10px] font-bold tracking-[0.2em] uppercase" style={{ color: 'var(--text-muted)' }}>
            Wasserzähler
          </p>
          <div className="popup-surface flex items-center justify-between rounded-2xl px-4 py-3">
            <p className="text-sm font-light" style={{ color: 'var(--text-secondary)' }}>Gesamtverbrauch</p>
            <p className="text-sm font-semibold text-[var(--text-primary)]">{parseFloat(water).toFixed(2)} m³</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tab: Verlauf ─────────────────────────────────────────────────────────────

function VerlaufTab({ zoneData, days, loading }) {
  const hasData = ZONES.some((z) => Object.values(zoneData[z.key] ?? {}).some((v) => v > 0));
  const todayKey = new Date().toDateString();

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-2 text-[10px] font-bold tracking-[0.2em] uppercase" style={{ color: 'var(--text-muted)' }}>
          Bewässerung pro Tag (min)
        </p>
        <div className="popup-surface rounded-2xl p-4">
          {loading ? (
            <div className="flex h-28 items-center justify-center text-xs" style={{ color: 'var(--text-secondary)' }}>Lade…</div>
          ) : !hasData ? (
            <div className="flex h-28 items-center justify-center text-xs" style={{ color: 'var(--text-secondary)' }}>
              Keine Daten für die letzten 14 Tage
            </div>
          ) : (
            <StackedBarChart days={days} zoneData={zoneData} height={160} />
          )}
        </div>
        <div className="mt-2 flex gap-4 flex-wrap">
          {ZONES.map((z) => (
            <div key={z.key} className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: z.color }} />
              {z.name}
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-[10px] font-bold tracking-[0.2em] uppercase" style={{ color: 'var(--text-muted)' }}>
          Heute
        </p>
        <div className="space-y-2">
          {ZONES.map((z) => {
            const todayMin = zoneData[z.key]?.[todayKey] ?? 0;
            return (
              <div key={z.key} className="popup-surface flex items-center gap-3 rounded-2xl px-4 py-3">
                <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: z.color }} />
                <p className="flex-1 text-sm font-light text-[var(--text-primary)]">{z.name}</p>
                <p className="text-sm font-semibold" style={{ color: todayMin > 0 ? z.color : 'var(--text-muted)' }}>
                  {todayMin > 0 ? `${todayMin.toFixed(0)} min` : '—'}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Ventile ─────────────────────────────────────────────────────────────

function VentileTab({ entities, callService }) {
  const ventile = [
    { id: 'switch.irrigation_manual_zone_1', name: 'Terrasse rechts' },
    { id: 'switch.irrigation_manual_zone_2', name: 'Rasenfläche' },
    { id: 'switch.irrigation_manual_zone_3', name: 'Terrasse links' },
  ];

  return (
    <div className="space-y-2">
      {ventile.map((v) => {
        const isOn = entities?.[v.id]?.state === 'on';
        return (
          <div key={v.id} className="popup-surface flex items-center justify-between rounded-2xl px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">{v.name}</p>
              <p className="text-xs font-light" style={{ color: 'var(--text-muted)' }}>{v.id}</p>
            </div>
            <button
              onClick={() => callService?.('switch', isOn ? 'turn_off' : 'turn_on', { entity_id: v.id })}
              className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider border transition-all ${
                isOn
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                  : 'border-[var(--glass-border)] text-[var(--text-secondary)]'
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${isOn ? 'bg-emerald-400' : 'bg-gray-500'}`} />
              {isOn ? 'An' : 'Aus'}
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

export default function BeregnungModal({ show, onClose, entities, callService, conn, haUrl, haToken }) {
  const [mainTab, setMainTab] = useState('regen');
  const [zoneData, setZoneData] = useState({ z1: {}, z2: {}, z3: {} });
  const [rainHistory, setRainHistory] = useState({});
  const [histLoading, setHistLoading] = useState(false);

  const days = getLastNDays(HIST_DAYS);
  const masterRunning = entities?.[MASTER_STATUS]?.state === 'on';

  // Check if IU controller is enabled (attributes may expose this)
  const masterEntity = entities?.[MASTER_ENTITY];
  const masterEnabled = masterEntity?.attributes?.enabled !== false; // default assume enabled

  const toggleMaster = () => {
    callService?.('irrigation_unlimited', 'toggle', { entity_id: MASTER_ENTITY });
  };

  const stopAll = () => {
    callService?.('irrigation_unlimited', 'cancel', { entity_id: MASTER_ENTITY });
  };

  useEffect(() => {
    if (!show) return;
    if (mainTab !== 'regen' && mainTab !== 'verlauf') return;
    if (!haUrl && !conn) return;

    const start = new Date();
    start.setDate(start.getDate() - HIST_DAYS);
    start.setHours(0, 0, 0, 0);

    setHistLoading(true);

    if (mainTab === 'verlauf') {
      Promise.all(
        ZONES.map((z) =>
          fetchEntityHistory(conn, haUrl, haToken, z.sensorId, start).then((data) => ({ key: z.key, data }))
        )
      )
        .then((results) => {
          const newZoneData = {};
          results.forEach(({ key, data }) => { newZoneData[key] = parseZoneMinutesByDay(data, days); });
          setZoneData(newZoneData);
        })
        .catch(() => {})
        .finally(() => setHistLoading(false));
    } else {
      fetchEntityHistory(conn, haUrl, haToken, 'sensor.gw2000a_daily_rain', start)
        .then((data) => setRainHistory(parseRainByDay(data, days)))
        .catch(() => {})
        .finally(() => setHistLoading(false));
    }
  }, [show, mainTab, conn, haUrl, haToken]);

  if (!show) return null;

  const isCompact =
    window.innerHeight < 900 || window.matchMedia('(hover: none) and (pointer: coarse)').matches;
  const isPhone = window.innerWidth < 640;

  return (
    <AccessibleModalShell
      open={show}
      onClose={onClose}
      titleId="beregnung-modal-title"
      overlayClassName={
        isCompact
          ? 'fixed inset-0 z-50 flex items-stretch justify-center'
          : 'fixed inset-0 z-50 flex items-center justify-center p-6'
      }
      overlayStyle={{ backdropFilter: 'blur(20px)', backgroundColor: 'rgba(0,0,0,0.3)' }}
      panelClassName={
        isCompact
          ? 'popup-anim relative flex flex-col w-full max-w-2xl h-full overflow-hidden rounded-none border font-sans backdrop-blur-xl'
          : 'popup-anim relative flex flex-col w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-[3rem] border font-sans backdrop-blur-xl'
      }
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

            {/* Icon + title + status */}
            <div className="mb-4 flex items-center gap-3 pr-10 font-sans">
              <div
                className="rounded-2xl p-3 transition-all duration-500"
                style={{
                  backgroundColor: masterRunning ? 'rgba(52,211,153,0.15)' : 'rgba(100,116,139,0.15)',
                  color: masterRunning ? '#34d399' : 'var(--text-secondary)',
                }}
              >
                <Droplets className="h-6 w-6" />
              </div>
              <div>
                <h3
                  id="beregnung-modal-title"
                  className="text-xl leading-none font-light tracking-tight text-[var(--text-primary)] uppercase italic"
                >
                  Beregnung
                </h3>
                <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                  {/* Status badge */}
                  <div
                    className="inline-flex items-center gap-2 rounded-full border px-3 py-1 transition-all duration-500"
                    style={{
                      backgroundColor: masterRunning ? 'var(--status-success-bg)' : 'var(--glass-bg)',
                      borderColor: masterRunning ? 'var(--status-success-border)' : 'var(--glass-border)',
                    }}
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${masterRunning ? 'bg-[var(--status-success-fg)] animate-pulse' : 'bg-[var(--text-muted)]'}`}
                    />
                    <p
                      className="text-[10px] font-bold tracking-widest uppercase italic"
                      style={{ color: masterRunning ? 'var(--status-success-fg)' : 'var(--text-secondary)' }}
                    >
                      {masterRunning ? 'Aktiv' : 'Inaktiv'}
                    </p>
                  </div>
                  {/* Master toggle */}
                  <button
                    onClick={toggleMaster}
                    className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-bold tracking-widest uppercase italic transition-all"
                    style={{
                      backgroundColor: masterEnabled ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)',
                      borderColor: masterEnabled ? 'rgba(52,211,153,0.4)' : 'rgba(248,113,113,0.4)',
                      color: masterEnabled ? '#34d399' : '#f87171',
                    }}
                  >
                    {masterEnabled ? 'Aktiviert' : 'Deaktiviert'}
                  </button>
                  {/* Stop all — only when running */}
                  {masterRunning && (
                    <button
                      onClick={stopAll}
                      className="inline-flex items-center gap-1.5 rounded-full border border-red-500/40 bg-red-500/10 px-3 py-1 text-[10px] font-bold tracking-widest uppercase italic text-red-400"
                    >
                      <Pause className="h-3 w-3" /> Alle stoppen
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Tab bar */}
            <div className="flex rounded-2xl p-1" style={{ backgroundColor: 'var(--glass-bg)' }}>
              {MAIN_TABS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setMainTab(key)}
                  className="flex-1 rounded-xl py-2 text-[11px] font-bold tracking-widest uppercase transition-all"
                  style={
                    mainTab === key
                      ? {
                          backgroundColor: 'var(--accent-bg)',
                          color: 'var(--accent-color)',
                          border: '1px solid var(--accent-color)',
                        }
                      : { color: 'var(--text-secondary)' }
                  }
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Scrollable content ── */}
          <div className={`flex-1 overflow-y-auto ${isCompact ? 'p-4' : 'p-8'}`}>
            {mainTab === 'zonen' && (
              <ZonenTab entities={entities} callService={callService} isCompact={isCompact} />
            )}
            {mainTab === 'regen' && (
              <RegenTab
                entities={entities}
                rainHistory={rainHistory}
                days={days}
                loading={histLoading}
                isPhone={isPhone}
              />
            )}
            {mainTab === 'verlauf' && (
              <VerlaufTab zoneData={zoneData} days={days} loading={histLoading} />
            )}
            {mainTab === 'ventile' && (
              <VentileTab entities={entities} callService={callService} />
            )}
          </div>
        </>
      )}
    </AccessibleModalShell>
  );
}
