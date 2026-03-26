import { useState, useEffect } from 'react';
import { X, Droplets, Play, Pause } from '../icons';
import AccessibleModalShell from '../components/ui/AccessibleModalShell';
import { getHistoryRest, getHistory } from '../services/haClient';

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

const TABS = ['Zonen', 'Regen', 'Verlauf', 'Ventile'];
const HIST_DAYS = 14;

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
  try {
    const data = await getHistoryRest(haUrl, haToken, opts);
    const raw = Array.isArray(data?.[0]) ? data[0] : Array.isArray(data) ? data : [];
    return raw;
  } catch (_e) {
    try {
      const wsData = await getHistory(conn, opts);
      return Array.isArray(wsData?.[0]) ? wsData[0] : Array.isArray(wsData) ? wsData : [];
    } catch (_e2) {
      return [];
    }
  }
}

function parseZoneMinutesByDay(histData, days) {
  const byDate = {};
  days.forEach((d) => { byDate[d.toDateString()] = 0; });
  if (!Array.isArray(histData) || !histData.length) return byDate;
  let onTime = null;
  for (const item of histData) {
    const t = new Date(item.last_changed || item.lu || item.lc || item.last_updated);
    if (isNaN(t.getTime())) continue;
    if (item.state === 'on') {
      onTime = t;
    } else if (item.state === 'off' && onTime) {
      const dMin = (t - onTime) / 60000;
      const d = new Date(onTime);
      d.setHours(0, 0, 0, 0);
      if (byDate[d.toDateString()] !== undefined) byDate[d.toDateString()] += dMin;
      onTime = null;
    }
  }
  if (onTime) {
    const dMin = (new Date() - onTime) / 60000;
    const d = new Date(onTime);
    d.setHours(0, 0, 0, 0);
    if (byDate[d.toDateString()] !== undefined) byDate[d.toDateString()] += dMin;
  }
  return byDate;
}

function parseRainByDay(histData, days) {
  const byDate = {};
  days.forEach((d) => { byDate[d.toDateString()] = null; });
  if (!Array.isArray(histData) || !histData.length) return byDate;
  for (const item of histData) {
    const val = parseFloat(item.state);
    if (isNaN(val)) continue;
    const t = new Date(item.last_changed || item.lu || item.lc || item.last_updated);
    if (isNaN(t.getTime())) continue;
    const d = new Date(t);
    d.setHours(0, 0, 0, 0);
    const key = d.toDateString();
    if (key in byDate) byDate[key] = Math.max(byDate[key] ?? 0, val);
  }
  return byDate;
}

// ─── SVG Charts ────────────────────────────────────────────────────────────

function BarChart({ days, valuesByDay, color, height = 90 }) {
  const W = 400;
  const H = height;
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
          <line
            x1={PAD.left} y1={toY(v)} x2={W - PAD.right} y2={toY(v)}
            stroke="currentColor" strokeOpacity="0.07" strokeDasharray="3 3"
          />
          <text x={PAD.left - 3} y={toY(v) + 3} textAnchor="end" fontSize="7" fill="currentColor" opacity="0.4">
            {v >= 10 ? v.toFixed(0) : v.toFixed(1)}
          </text>
        </g>
      ))}
      {days.map((d, i) => {
        const v = vals[i];
        const bH = Math.max(v > 0 ? 2 : 0, (v / maxVal) * GH);
        return (
          <rect key={i} x={toX(i)} y={toY(v)} width={barW} height={bH} fill={color} opacity={0.75} rx="1" />
        );
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

function StackedBarChart({ days, zoneData, height = 120 }) {
  const W = 400;
  const H = height;
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
          <line
            x1={PAD.left} y1={PAD.top + GH * (1 - v / maxVal)}
            x2={W - PAD.right} y2={PAD.top + GH * (1 - v / maxVal)}
            stroke="currentColor" strokeOpacity="0.07" strokeDasharray="3 3"
          />
          <text
            x={PAD.left - 3} y={PAD.top + GH * (1 - v / maxVal) + 3}
            textAnchor="end" fontSize="7" fill="currentColor" opacity="0.4"
          >
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
          return (
            <rect key={z.key} x={toX(i)} y={y} width={barW} height={bH} fill={z.color} opacity={0.8} rx="1" />
          );
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

// ─── Zone Card ──────────────────────────────────────────────────────────────

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
      className="rounded-2xl border p-4 flex flex-col gap-3 transition-colors"
      style={{
        borderColor: isRunning ? `${zone.color}50` : 'var(--glass-border)',
        backgroundColor: isRunning ? `${zone.color}0d` : 'var(--glass-bg)',
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            {isRunning && (
              <span
                className="h-2 w-2 rounded-full animate-pulse shrink-0"
                style={{ backgroundColor: zone.color }}
              />
            )}
            <p className="text-sm font-bold text-[var(--text-primary)]">{zone.name}</p>
          </div>
          {isRunning && timeRemaining && (
            <p className="text-xs mt-0.5" style={{ color: zone.color }}>
              Läuft noch {timeRemaining}
            </p>
          )}
        </div>
        {isRunning ? (
          <button
            onClick={stop}
            className="shrink-0 flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold border bg-red-500/20 text-red-400 border-red-500/40"
          >
            <Pause className="h-3 w-3" /> Stopp
          </button>
        ) : (
          <button
            onClick={start}
            className="shrink-0 flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold border transition-all"
            style={{ backgroundColor: `${zone.color}20`, color: zone.color, borderColor: `${zone.color}50` }}
          >
            <Play className="h-3 w-3" /> Start
          </button>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between items-center text-xs">
          <span className="text-[var(--text-secondary)]">Manuelle Dauer</span>
          <div className="flex items-center gap-2">
            {smartMin != null && smartMin > 0 && (
              <span className="text-[10px] text-green-400 border border-green-500/30 bg-green-500/10 rounded-full px-2 py-0.5">
                Smart: {smartMin} min
              </span>
            )}
            <span className="font-bold text-[var(--text-primary)]">{minutes} min</span>
          </div>
        </div>
        <input
          type="range"
          min={minMin}
          max={minMax}
          step={1}
          value={minutes}
          onChange={(e) => setMinutes(Number(e.target.value))}
          className="w-full accent-emerald-400"
        />
      </div>
    </div>
  );
}

// ─── Tab: Zonen ─────────────────────────────────────────────────────────────

function ZonenTab({ entities, callService }) {
  const totalMin = entities?.['sensor.beregnung_gesamtzeit_minuten']?.state;

  return (
    <div className="flex flex-col gap-3">
      {totalMin != null && Number(totalMin) > 0 && (
        <span className="self-start rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-xs font-bold text-orange-400">
          {totalMin} min gesamt
        </span>
      )}
      {ZONES.map((zone) => (
        <ZoneCard key={zone.key} zone={zone} entities={entities} callService={callService} />
      ))}
    </div>
  );
}

// ─── Tab: Regen ──────────────────────────────────────────────────────────────

function RegenTab({ entities, rainHistory, days, loading }) {
  const daily = entities?.['sensor.gw2000a_daily_rain']?.state;
  const hourly = entities?.['sensor.gw2000a_hourly_rain']?.state;
  const weekly = entities?.['sensor.gw2000a_weekly_rain']?.state;
  const yearly = entities?.['sensor.gw2000a_yearly_rain']?.state;
  const rate = entities?.['sensor.gw2000a_rain_rate']?.state;
  const bucket = entities?.['sensor.rasenflache_bucket']?.state;
  const water = entities?.['sensor.wasserzaehler_value']?.state;

  const statItems = [
    { label: 'Rate', value: rate, unit: 'mm/h', color: Number(rate) > 0 ? '#60a5fa' : undefined },
    { label: 'Täglich', value: daily, unit: 'mm', color: '#60a5fa' },
    { label: 'Wöchentl.', value: weekly, unit: 'mm', color: '#60a5fa' },
    { label: 'Jährlich', value: yearly, unit: 'mm', color: '#60a5fa' },
  ];

  const smartZones = [
    { name: 'T. rechts', id: 'sensor.smart_irrigation_terrasse_rechts_min' },
    { name: 'T. links', id: 'sensor.smart_irrigation_terrasse_links_min' },
    { name: 'Rasen', id: 'sensor.smart_irrigation_rasenflache_min' },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)]">
          Niederschlag
        </p>
        <div className="grid grid-cols-4 gap-2 mb-3">
          {statItems.map((item) => (
            <div
              key={item.label}
              className="flex flex-col items-center rounded-2xl border p-2.5 gap-0.5"
              style={{ borderColor: 'var(--glass-border)', backgroundColor: 'var(--glass-bg)' }}
            >
              <p className="text-[10px] uppercase tracking-wider text-[var(--text-secondary)]">{item.label}</p>
              <p className="text-base font-bold" style={{ color: item.color || 'var(--text-primary)' }}>
                {item.value ?? '—'}
              </p>
              <p className="text-[10px] text-[var(--text-secondary)]">{item.unit}</p>
            </div>
          ))}
        </div>
        <div
          className="rounded-2xl border p-3"
          style={{ borderColor: 'var(--glass-border)', backgroundColor: 'var(--glass-bg)' }}
        >
          <p className="mb-1.5 text-[10px] text-[var(--text-secondary)] uppercase tracking-wider">
            14 Tage Verlauf
          </p>
          {loading ? (
            <div className="flex h-20 items-center justify-center text-xs text-[var(--text-secondary)]">
              Lade…
            </div>
          ) : (
            <BarChart days={days} valuesByDay={rainHistory} color="#60a5fa" height={90} />
          )}
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)]">
          Smart Irrigation
        </p>
        <div className="grid grid-cols-3 gap-2">
          {smartZones.map((z) => (
            <div
              key={z.id}
              className="flex flex-col items-center rounded-2xl border p-2.5 gap-0.5"
              style={{ borderColor: 'var(--glass-border)', backgroundColor: 'var(--glass-bg)' }}
            >
              <p className="text-[10px] uppercase tracking-wider text-[var(--text-secondary)]">{z.name}</p>
              <p className="text-base font-bold text-green-400">{entities?.[z.id]?.state ?? '—'}</p>
              <p className="text-[10px] text-[var(--text-secondary)]">min</p>
            </div>
          ))}
        </div>
        {bucket != null && (
          <div
            className="mt-2 flex items-center justify-between rounded-2xl border px-4 py-3"
            style={{ borderColor: 'var(--glass-border)', backgroundColor: 'var(--glass-bg)' }}
          >
            <p className="text-sm text-[var(--text-secondary)]">Bodenwasser-Vorrat</p>
            <p className="text-sm font-bold text-cyan-400">{bucket} mm</p>
          </div>
        )}
      </div>

      {water != null && (
        <div>
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)]">
            Wasserzähler
          </p>
          <div
            className="flex items-center justify-between rounded-2xl border px-4 py-3"
            style={{ borderColor: 'var(--glass-border)', backgroundColor: 'var(--glass-bg)' }}
          >
            <p className="text-sm text-[var(--text-secondary)]">Gesamtverbrauch</p>
            <p className="text-sm font-bold text-[var(--text-primary)]">
              {parseFloat(water).toFixed(2)} m³
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tab: Verlauf ────────────────────────────────────────────────────────────

function VerlaufTab({ zoneData, days, loading }) {
  const hasData = ZONES.some((z) =>
    Object.values(zoneData[z.key] ?? {}).some((v) => v > 0)
  );
  const todayKey = new Date().toDateString();

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)]">
          Bewässerung pro Tag (min)
        </p>
        <div
          className="rounded-2xl border p-3"
          style={{ borderColor: 'var(--glass-border)', backgroundColor: 'var(--glass-bg)' }}
        >
          {loading ? (
            <div className="flex h-28 items-center justify-center text-xs text-[var(--text-secondary)]">
              Lade…
            </div>
          ) : !hasData ? (
            <div className="flex h-28 items-center justify-center text-xs text-[var(--text-secondary)]">
              Keine Daten für die letzten 14 Tage
            </div>
          ) : (
            <StackedBarChart days={days} zoneData={zoneData} height={120} />
          )}
        </div>
        <div className="mt-2 flex gap-3 flex-wrap">
          {ZONES.map((z) => (
            <div key={z.key} className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: z.color }} />
              {z.name}
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)]">
          Heute
        </p>
        <div className="flex flex-col gap-2">
          {ZONES.map((z) => {
            const todayMin = zoneData[z.key]?.[todayKey] ?? 0;
            return (
              <div
                key={z.key}
                className="flex items-center gap-3 rounded-2xl border px-4 py-2.5"
                style={{ borderColor: 'var(--glass-border)', backgroundColor: 'var(--glass-bg)' }}
              >
                <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: z.color }} />
                <p className="flex-1 text-sm text-[var(--text-primary)]">{z.name}</p>
                <p className="text-sm font-bold" style={{ color: todayMin > 0 ? z.color : 'var(--text-secondary)' }}>
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

// ─── Tab: Ventile ────────────────────────────────────────────────────────────

function VentileTab({ entities, callService }) {
  const ventile = [
    { id: 'switch.irrigation_manual_zone_1', name: 'Terrasse rechts' },
    { id: 'switch.irrigation_manual_zone_2', name: 'Rasenfläche' },
    { id: 'switch.irrigation_manual_zone_3', name: 'Terrasse links' },
  ];

  return (
    <div className="flex flex-col gap-3">
      {ventile.map((v) => {
        const sw = entities?.[v.id];
        const isOn = sw?.state === 'on';
        return (
          <div
            key={v.id}
            className="flex items-center justify-between rounded-2xl border px-4 py-3"
            style={{ borderColor: 'var(--glass-border)', backgroundColor: 'var(--glass-bg)' }}
          >
            <div>
              <p className="text-sm font-bold text-[var(--text-primary)]">{v.name}</p>
              <p className="text-xs text-[var(--text-secondary)]">{v.id}</p>
            </div>
            <button
              onClick={() =>
                callService?.('switch', isOn ? 'turn_off' : 'turn_on', { entity_id: v.id })
              }
              className={`shrink-0 flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold border transition-all ${
                isOn
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                  : 'bg-[var(--glass-bg)] text-[var(--text-secondary)] border-[var(--glass-border)]'
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

// ─── Main Modal ──────────────────────────────────────────────────────────────

export default function BeregnungModal({ show, onClose, entities, callService, conn, haUrl, haToken }) {
  const [activeTab, setActiveTab] = useState(0);
  const [zoneData, setZoneData] = useState({ z1: {}, z2: {}, z3: {} });
  const [rainHistory, setRainHistory] = useState({});
  const [histLoading, setHistLoading] = useState(false);

  const days = getLastNDays(HIST_DAYS);
  const masterActive = entities?.['binary_sensor.beregung_master_status']?.state === 'on';

  useEffect(() => {
    if (!show || (activeTab !== 1 && activeTab !== 2)) return;
    if (!conn && !haUrl) return;

    const start = new Date();
    start.setDate(start.getDate() - HIST_DAYS);
    start.setHours(0, 0, 0, 0);

    setHistLoading(true);

    if (activeTab === 2) {
      Promise.all(
        ZONES.map((z) =>
          fetchEntityHistory(conn, haUrl, haToken, z.sensorId, start).then((data) => ({
            key: z.key,
            data,
          }))
        )
      )
        .then((results) => {
          const newZoneData = {};
          results.forEach(({ key, data }) => {
            newZoneData[key] = parseZoneMinutesByDay(data, days);
          });
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
  }, [show, activeTab, conn, haUrl, haToken]);

  if (!show) return null;

  const stopAll = () =>
    callService?.('irrigation_unlimited', 'cancel', { entity_id: 'irrigation_unlimited.coordinator' });

  return (
    <AccessibleModalShell
      open={show}
      onClose={onClose}
      titleId="beregnung-modal-title"
      overlayClassName="fixed inset-0 z-[130] flex items-center justify-center p-3 sm:p-5"
      overlayStyle={{ backdropFilter: 'blur(20px)', backgroundColor: 'rgba(0,0,0,0.5)' }}
      panelClassName="popup-anim relative flex max-h-[92vh] w-full max-w-2xl flex-col rounded-2xl border font-sans shadow-2xl backdrop-blur-xl sm:rounded-3xl overflow-hidden"
      panelStyle={{
        background: 'linear-gradient(135deg, var(--card-bg) 0%, var(--modal-bg) 100%)',
        borderColor: 'var(--glass-border)',
        color: 'var(--text-primary)',
      }}
    >
      {() => (
        <>
          {/* Header */}
          <div className="flex items-center justify-between gap-3 p-4 pb-3 shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)]">
                <Droplets className={`h-4 w-4 ${masterActive ? 'text-cyan-400' : 'text-[var(--text-secondary)]'}`} />
              </div>
              <div>
                <p className="text-[10px] font-bold tracking-widest text-[var(--text-secondary)] uppercase">
                  Garten
                </p>
                <h3 id="beregnung-modal-title" className="text-base font-bold text-[var(--text-primary)]">
                  Beregnung
                </h3>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {masterActive && (
                <button
                  onClick={stopAll}
                  className="flex items-center gap-1.5 rounded-xl border border-red-500/40 bg-red-500/20 px-3 py-1.5 text-xs font-bold text-red-400"
                >
                  <Pause className="h-3 w-3" /> Alle stoppen
                </button>
              )}
              <span
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${
                  masterActive
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                    : 'border-[var(--glass-border)] bg-[var(--glass-bg)] text-[var(--text-secondary)]'
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${masterActive ? 'bg-emerald-400 animate-pulse' : 'bg-gray-500'}`}
                />
                {masterActive ? 'Aktiv' : 'Inaktiv'}
              </span>
              <button
                onClick={onClose}
                className="rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] p-1.5 text-[var(--text-secondary)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 px-4 pb-3 shrink-0">
            {TABS.map((tab, i) => (
              <button
                key={tab}
                onClick={() => setActiveTab(i)}
                className={`rounded-xl px-4 py-1.5 text-xs font-bold transition-all ${
                  activeTab === i
                    ? 'bg-[var(--accent-bg)] text-[var(--accent-color)] border border-[var(--accent-color)]'
                    : 'text-[var(--text-secondary)] border border-transparent hover:border-[var(--glass-border)]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            {activeTab === 0 && <ZonenTab entities={entities} callService={callService} />}
            {activeTab === 1 && (
              <RegenTab
                entities={entities}
                rainHistory={rainHistory}
                days={days}
                loading={histLoading}
              />
            )}
            {activeTab === 2 && (
              <VerlaufTab zoneData={zoneData} days={days} loading={histLoading} />
            )}
            {activeTab === 3 && <VentileTab entities={entities} callService={callService} />}
          </div>
        </>
      )}
    </AccessibleModalShell>
  );
}
