import { useState } from 'react';
import { X, Droplets, Play, Pause, CloudRain } from '../icons';
import AccessibleModalShell from '../components/ui/AccessibleModalShell';

const ZONES = [
  {
    key: 'z1',
    name: 'Terrasse rechts',
    switchId: 'switch.irrigation_manual_zone_1',
    sensorId: 'binary_sensor.irrigation_unlimited_c1_z1',
    minutesId: 'input_number.manual_irrigation_z1_minutes',
    smartMinId: 'sensor.smart_irrigation_terrasse_rechts_min',
  },
  {
    key: 'z3',
    name: 'Terrasse links',
    switchId: 'switch.irrigation_manual_zone_3',
    sensorId: 'binary_sensor.irrigation_unlimited_c1_z3',
    minutesId: 'input_number.manual_irrigation_z3_minutes',
    smartMinId: 'sensor.smart_irrigation_terrasse_links_min',
  },
  {
    key: 'z2',
    name: 'Rasenfläche',
    switchId: 'switch.irrigation_manual_zone_2',
    sensorId: 'binary_sensor.irrigation_unlimited_c1_z2',
    minutesId: 'input_number.manual_irrigation_z2_minutes',
    smartMinId: 'sensor.smart_irrigation_rasenflache_min',
  },
];

const TABS = ['Zonen', 'Regen', 'Ventile'];

function StatChip({ label, value, unit, color }) {
  return (
    <div
      className="flex flex-col items-center rounded-2xl border p-3 gap-0.5"
      style={{ borderColor: 'var(--glass-border)', backgroundColor: 'var(--glass-bg)' }}
    >
      <p className="text-[10px] uppercase tracking-wider text-[var(--text-secondary)]">{label}</p>
      <p className="text-lg font-bold" style={{ color: color || 'var(--text-primary)' }}>
        {value ?? '—'}
      </p>
      {unit && <p className="text-[10px] text-[var(--text-secondary)]">{unit}</p>}
    </div>
  );
}

function ZoneCard({ zone, entities, callService }) {
  const sw = entities?.[zone.switchId];
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
      className="rounded-2xl border p-4 flex flex-col gap-3"
      style={{ borderColor: 'var(--glass-border)', backgroundColor: 'var(--glass-bg)' }}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            {isRunning && (
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            )}
            <p className="text-sm font-bold text-[var(--text-primary)]">{zone.name}</p>
          </div>
          {isRunning && timeRemaining && (
            <p className="text-xs text-emerald-400 mt-0.5">Läuft noch {timeRemaining}</p>
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
            className="shrink-0 flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold border bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
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

function ZonenTab({ entities, callService }) {
  const masterActive = entities?.['binary_sensor.beregung_master_status']?.state === 'on';
  const totalMin = entities?.['sensor.beregnung_gesamtzeit_minuten']?.state;

  const stopAll = () =>
    callService?.('irrigation_unlimited', 'cancel', {
      entity_id: 'irrigation_unlimited.coordinator',
    });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
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
          {totalMin != null && Number(totalMin) > 0 && (
            <span className="rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-xs font-bold text-orange-400">
              {totalMin} min gesamt
            </span>
          )}
        </div>
        {masterActive && (
          <button
            onClick={stopAll}
            className="flex items-center gap-1.5 rounded-xl border border-red-500/40 bg-red-500/20 px-3 py-1.5 text-xs font-bold text-red-400"
          >
            <Pause className="h-3 w-3" /> Alle stoppen
          </button>
        )}
      </div>

      {ZONES.map((zone) => (
        <ZoneCard key={zone.key} zone={zone} entities={entities} callService={callService} />
      ))}
    </div>
  );
}

function RegenTab({ entities }) {
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
    <div className="flex flex-col gap-4">
      <div>
        <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)]">
          Niederschlag
        </p>
        <div className="grid grid-cols-4 gap-2">
          <StatChip
            label="Rate"
            value={rate}
            unit="mm/h"
            color={Number(rate) > 0 ? '#60a5fa' : undefined}
          />
          <StatChip label="Täglich" value={daily} unit="mm" color="#60a5fa" />
          <StatChip label="Wöchentl." value={weekly} unit="mm" color="#60a5fa" />
          <StatChip label="Jährlich" value={yearly} unit="mm" color="#60a5fa" />
        </div>
      </div>

      <div>
        <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)]">
          Smart Irrigation
        </p>
        <div className="grid grid-cols-3 gap-2">
          {smartZones.map((z) => (
            <StatChip
              key={z.id}
              label={z.name}
              value={entities?.[z.id]?.state ?? '—'}
              unit="min"
              color="#4ade80"
            />
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
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)]">
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

function VentileTab({ entities, callService }) {
  const ventile = [
    { id: 'switch.irrigation_manual_zone_1', name: 'Terrasse rechts' },
    { id: 'switch.irrigation_manual_zone_2', name: 'Rasenfläche' },
    { id: 'switch.irrigation_manual_zone_3', name: 'Terrasse links' },
  ];

  const masterBs = entities?.['binary_sensor.irrigation_unlimited_c1_m'];
  const coordinator = entities?.['irrigation_unlimited.coordinator'];

  return (
    <div className="flex flex-col gap-3">
      <div
        className="flex items-center justify-between rounded-2xl border px-4 py-3"
        style={{ borderColor: 'var(--glass-border)', backgroundColor: 'var(--glass-bg)' }}
      >
        <div>
          <p className="text-sm font-bold text-[var(--text-primary)]">Irrigation Unlimited</p>
          <p className="text-xs text-[var(--text-secondary)]">System-Status</p>
        </div>
        <span
          className={`text-xs font-bold px-2 py-1 rounded-full border ${
            masterBs?.state === 'on'
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/40'
              : 'bg-[var(--glass-bg)] text-[var(--text-secondary)] border-[var(--glass-border)]'
          }`}
        >
          {coordinator?.state ?? masterBs?.state ?? '—'}
        </span>
      </div>

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

export default function BeregnungModal({ show, onClose, entities, callService }) {
  const [activeTab, setActiveTab] = useState(0);
  if (!show) return null;

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
          <div className="flex items-center justify-between gap-3 p-4 pb-3 shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)]">
                <Droplets className="h-4 w-4 text-cyan-400" />
              </div>
              <div>
                <p className="text-[10px] font-bold tracking-widest text-[var(--text-secondary)] uppercase">
                  Garten
                </p>
                <h3
                  id="beregnung-modal-title"
                  className="text-base font-bold text-[var(--text-primary)]"
                >
                  Beregnung
                </h3>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] p-1.5 text-[var(--text-secondary)]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

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

          <div className="flex-1 overflow-y-auto px-4 pb-4">
            {activeTab === 0 && <ZonenTab entities={entities} callService={callService} />}
            {activeTab === 1 && <RegenTab entities={entities} />}
            {activeTab === 2 && <VentileTab entities={entities} callService={callService} />}
          </div>
        </>
      )}
    </AccessibleModalShell>
  );
}
