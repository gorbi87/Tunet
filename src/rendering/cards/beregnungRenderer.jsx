import { memo } from 'react';
import { Droplets } from '../../icons';
import { getSettings } from '../helpers';

const ZONES = [
  { key: 'z1', name: 'Terrasse rechts', sensorId: 'binary_sensor.irrigation_unlimited_c1_z1', color: '#34d399' },
  { key: 'z3', name: 'Terrasse links', sensorId: 'binary_sensor.irrigation_unlimited_c1_z3', color: '#60a5fa' },
  { key: 'z2', name: 'Rasenfläche', sensorId: 'binary_sensor.irrigation_unlimited_c1_z2', color: '#a78bfa' },
];

const BeregnungCard = memo(function BeregnungCard({
  cardId,
  dragProps,
  controls,
  cardStyle,
  editMode,
  customNames,
  entities,
  onOpen,
}) {
  const name = customNames?.[cardId] || 'Beregnung';

  const masterActive = entities?.['binary_sensor.beregung_master_status']?.state === 'on';
  const rain = entities?.['sensor.gw2000a_daily_rain']?.state;
  const bucket = entities?.['sensor.rasenflache_bucket']?.state;
  const totalMin = entities?.['sensor.beregnung_gesamtzeit_minuten']?.state;

  const activeZones = ZONES.filter((z) => entities?.[z.sensorId]?.state === 'on').map((z) => ({
    ...z,
    timeRemaining: entities?.[z.sensorId]?.attributes?.time_remaining,
  }));

  const smartMax = Math.max(
    ...ZONES.map((z) => {
      const smartId = `sensor.smart_irrigation_${
        z.key === 'z1' ? 'terrasse_rechts' : z.key === 'z3' ? 'terrasse_links' : 'rasenflache'
      }_min`;
      return parseFloat(entities?.[smartId]?.state) || 0;
    })
  );

  return (
    <div
      {...dragProps}
      data-haptic={editMode ? undefined : 'card'}
      className="glass-texture touch-feedback group relative flex h-full flex-col overflow-hidden rounded-3xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4 font-sans backdrop-blur-xl transition-all duration-300 cursor-pointer active:scale-[0.98]"
      style={cardStyle}
      onClick={(e) => { e.stopPropagation(); if (!editMode) onOpen?.(); }}
    >
      {controls}

      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] transition-colors"
            style={masterActive ? { borderColor: '#34d39940', backgroundColor: '#34d3990d' } : {}}
          >
            <Droplets
              className="h-4 w-4 transition-colors"
              style={{ color: masterActive ? '#34d399' : 'var(--text-secondary)' }}
            />
          </div>
          <div>
            <p className="text-[10px] font-bold tracking-widest text-[var(--text-secondary)] uppercase leading-none">
              Garten
            </p>
            <p className="text-sm font-bold text-[var(--text-primary)] leading-tight">{name}</p>
          </div>
        </div>
        <span
          className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${
            masterActive
              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
              : 'border-[var(--glass-border)] bg-[var(--glass-bg)] text-[var(--text-secondary)]'
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${masterActive ? 'bg-emerald-400 animate-pulse' : 'bg-gray-500'}`} />
          {masterActive ? 'Aktiv' : 'Aus'}
        </span>
      </div>

      {/* Active zones — shown when running */}
      {activeZones.length > 0 ? (
        <div className="flex flex-col gap-1.5 mb-auto">
          {activeZones.map((z) => (
            <div
              key={z.key}
              className="flex items-center justify-between rounded-xl px-2.5 py-1.5 text-xs"
              style={{ backgroundColor: `${z.color}15`, borderRadius: 10 }}
            >
              <div className="flex items-center gap-1.5">
                <span
                  className="h-1.5 w-1.5 rounded-full animate-pulse shrink-0"
                  style={{ backgroundColor: z.color }}
                />
                <span className="font-semibold" style={{ color: z.color }}>{z.name}</span>
              </div>
              {z.timeRemaining && (
                <span className="text-[10px]" style={{ color: z.color }}>
                  {z.timeRemaining}
                </span>
              )}
            </div>
          ))}
          {totalMin != null && Number(totalMin) > 0 && (
            <p className="text-[10px] text-orange-400 mt-0.5">{totalMin} min gesamt</p>
          )}
        </div>
      ) : (
        /* Idle state — show smart suggestion or empty hint */
        <div className="flex-1 flex flex-col justify-center">
          {smartMax > 0 ? (
            <p className="text-xs text-[var(--text-secondary)]">
              <span className="font-bold text-green-400">{smartMax} min</span> Smart-Empfehlung
            </p>
          ) : (
            <p className="text-xs text-[var(--text-secondary)]">Keine aktiven Zonen</p>
          )}
        </div>
      )}

      {/* Footer chips */}
      <div className="mt-auto pt-2 flex flex-wrap gap-1.5">
        {rain != null && (
          <span className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-400">
            {rain} mm
          </span>
        )}
        {bucket != null && (
          <span className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-bold text-cyan-400">
            {bucket} mm Vorrat
          </span>
        )}
      </div>
    </div>
  );
});

export function renderBeregnungCard(cardId, dragProps, getControls, cardStyle, settingsKey, ctx) {
  const { editMode, cardSettings, customNames, entities, setShowBeregnungModal, t } = ctx;
  getSettings(cardSettings, settingsKey, cardId);

  return (
    <BeregnungCard
      key={cardId}
      cardId={cardId}
      dragProps={dragProps}
      controls={getControls(cardId)}
      cardStyle={cardStyle}
      editMode={editMode}
      customNames={customNames}
      entities={entities}
      onOpen={() => setShowBeregnungModal?.(cardId)}
      t={t}
    />
  );
}
