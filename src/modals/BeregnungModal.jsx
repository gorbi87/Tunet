import { X, Droplets } from '../icons';
import AccessibleModalShell from '../components/ui/AccessibleModalShell';

const ZONES = [
  {
    key: 'z1',
    name: 'Terrasse rechts',
    icon: 'mdi:sprinkler-variant',
    switchId: 'switch.irrigation_manual_zone_1',
    sensorId: 'binary_sensor.irrigation_unlimited_c1_z1',
    minutesId: 'input_number.manual_irrigation_z1_minutes',
    smartId: 'sensor.smart_irrigation_terrasse_rechts_min',
    bucketId: 'sensor.rasenflache_bucket',
  },
  {
    key: 'z3',
    name: 'Terrasse links',
    icon: 'mdi:sprinkler-variant',
    switchId: 'switch.irrigation_manual_zone_3',
    sensorId: 'binary_sensor.irrigation_unlimited_c1_z3',
    minutesId: 'input_number.manual_irrigation_z3_minutes',
    smartId: 'sensor.smart_irrigation_terrasse_links_min',
    bucketId: 'sensor.rasenflache_bucket',
  },
  {
    key: 'z2',
    name: 'Rasenflaeche',
    icon: 'mdi:grass',
    switchId: 'switch.irrigation_manual_zone_2',
    sensorId: 'binary_sensor.irrigation_unlimited_c1_z2',
    minutesId: 'input_number.manual_irrigation_z2_minutes',
    smartId: 'sensor.smart_irrigation_rasenflache_min',
    bucketId: 'sensor.rasenflache_bucket',
  },
];

function ZoneCard({ zone, entities, callService }) {
  const sw = entities?.[zone.switchId];
  const sensor = entities?.[zone.sensorId];
  const minutesEntity = entities?.[zone.minutesId];
  const smartEntity = entities?.[zone.smartId];
  const bucketEntity = entities?.[zone.bucketId];

  const isActive = sw?.state === 'on';
  const isRunning = sensor?.state === 'on';
  const timeRemaining = sensor?.attributes?.time_remaining;
  const minutes = parseFloat(minutesEntity?.state) || 0;
  const minMin = parseFloat(minutesEntity?.attributes?.min) || 1;
  const minMax = parseFloat(minutesEntity?.attributes?.max) || 60;
  const smartMin = smartEntity?.state;
  const bucket = bucketEntity?.state;

  const toggle = () => callService?.('switch', 'toggle', { entity_id: zone.switchId });
  const setMinutes = (val) =>
    callService?.('input_number', 'set_value', { entity_id: zone.minutesId, value: val });

  return (
    <div
      className="rounded-2xl border p-4 flex flex-col gap-3"
      style={{ borderColor: 'var(--glass-border)', backgroundColor: 'var(--glass-bg)' }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex flex-col min-w-0">
            <p className="text-sm font-bold text-[var(--text-primary)] truncate">{zone.name}</p>
            {isRunning && timeRemaining && (
              <p className="text-xs text-emerald-400">Noch {timeRemaining}</p>
            )}
          </div>
        </div>
        <button
          onClick={toggle}
          className={`shrink-0 flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold border transition-all ${
            isActive
              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
              : 'bg-[var(--glass-bg)] text-[var(--text-secondary)] border-[var(--glass-border)]'
          }`}
        >
          <span className={`h-2 w-2 rounded-full ${isActive ? 'bg-emerald-400' : 'bg-gray-500'}`} />
          {isActive ? 'An' : 'Aus'}
        </button>
      </div>

      <div className="flex gap-2">
        {smartMin != null && (
          <div
            className="flex-1 rounded-xl border px-3 py-2 text-center"
            style={{ borderColor: 'var(--glass-border)', backgroundColor: 'var(--card-bg)' }}
          >
            <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider mb-0.5">Smart</p>
            <p className="text-sm font-bold text-green-400">{smartMin} min</p>
          </div>
        )}
        {bucket != null && (
          <div
            className="flex-1 rounded-xl border px-3 py-2 text-center"
            style={{ borderColor: 'var(--glass-border)', backgroundColor: 'var(--card-bg)' }}
          >
            <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider mb-0.5">Vorrat</p>
            <p className="text-sm font-bold text-cyan-400">{bucket} mm</p>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex justify-between text-[10px] text-[var(--text-secondary)]">
          <span>Manuelle Dauer</span>
          <span className="font-bold text-[var(--text-primary)]">{minutes} min</span>
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

export default function BeregnungModal({ show, onClose, entities, callService }) {
  if (!show) return null;

  const masterActive = entities?.['binary_sensor.beregung_master_status']?.state === 'on';
  const totalMin = entities?.['sensor.beregnung_gesamtzeit_minuten']?.state;
  const rain = entities?.['sensor.gw2000a_daily_rain']?.state;
  const bucket = entities?.['sensor.rasenflache_bucket']?.state;

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
                <p className="text-[10px] font-bold tracking-widest text-[var(--text-secondary)] uppercase">Beregnung</p>
                <h3 id="beregnung-modal-title" className="text-base font-bold text-[var(--text-primary)]">
                  Zonensteuerung
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

          <div className="flex flex-wrap gap-2 px-4 pb-3 shrink-0">
            <span className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${
              masterActive
                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                : 'border-[var(--glass-border)] bg-[var(--glass-bg)] text-[var(--text-secondary)]'
            }`}>
              <span className={`h-2 w-2 rounded-full ${masterActive ? 'bg-emerald-400' : 'bg-gray-500'}`} />
              {masterActive ? 'Aktiv' : 'Inaktiv'}
            </span>
            {totalMin != null && Number(totalMin) > 0 && (
              <span className="flex items-center gap-1 rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-xs font-bold text-orange-400">
                {totalMin} min gesamt
              </span>
            )}
            {rain != null && (
              <span className="flex items-center gap-1 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-bold text-blue-400">
                {rain} mm Regen
              </span>
            )}
            {bucket != null && (
              <span className="flex items-center gap-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-bold text-cyan-400">
                {bucket} mm Vorrat
              </span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-4 flex flex-col gap-3">
            {ZONES.map((zone) => (
              <ZoneCard key={zone.key} zone={zone} entities={entities} callService={callService} />
            ))}
          </div>
        </>
      )}
    </AccessibleModalShell>
  );
}
