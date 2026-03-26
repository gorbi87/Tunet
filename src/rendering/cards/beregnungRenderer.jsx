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

  const iconColor = masterActive ? '#34d399' : 'var(--text-muted)';
  const iconBg = masterActive ? 'rgba(52,211,153,0.12)' : 'rgba(127,127,127,0.1)';
  const statusDotColor = masterActive ? 'bg-emerald-400' : 'bg-gray-500';

  return (
    <div
      {...dragProps}
      data-haptic={editMode ? undefined : 'card'}
      className={`glass-texture touch-feedback group relative flex h-full flex-col justify-between overflow-hidden rounded-3xl border font-sans transition-colors duration-500 p-7 ${!editMode ? 'cursor-pointer active:scale-[0.98]' : 'cursor-move'}`}
      style={cardStyle}
      onClick={(e) => { e.stopPropagation(); if (!editMode) onOpen?.(); }}
    >
      {controls}

      <div className="relative z-10">
        {/* Top row: icon + status badge */}
        <div className="flex items-start justify-between">
          <div
            className="rounded-2xl p-3 transition-transform duration-500 group-hover:scale-110"
            style={{ backgroundColor: iconBg, color: iconColor }}
          >
            <Droplets className="h-5 w-5" style={{ strokeWidth: 1.5 }} />
          </div>
          <div
            className="flex items-center gap-1.5 rounded-full border px-3 py-1"
            style={{ backgroundColor: 'var(--glass-bg)', borderColor: 'var(--glass-border)' }}
          >
            <span className={`h-2 w-2 rounded-full ${masterActive ? 'animate-pulse ' : ''}${statusDotColor}`} />
            <span className="text-xs font-bold tracking-widest uppercase text-[var(--text-secondary)]">
              {masterActive ? 'Aktiv' : 'Aus'}
            </span>
          </div>
        </div>

        {/* Card name */}
        <div className="mt-2">
          <p className="mb-0.5 text-xs leading-none font-bold text-[var(--text-secondary)] uppercase opacity-60" style={{ letterSpacing: '0.05em' }}>
            {name}
          </p>
        </div>

        {/* Active zones or idle state */}
        {activeZones.length > 0 ? (
          <div className="mt-3 flex flex-col gap-1.5">
            {activeZones.map((z) => (
              <div
                key={z.key}
                className="flex items-center justify-between rounded-xl px-2.5 py-1.5 text-xs"
                style={{ backgroundColor: `${z.color}15` }}
              >
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full animate-pulse shrink-0" style={{ backgroundColor: z.color }} />
                  <span className="font-semibold" style={{ color: z.color }}>{z.name}</span>
                </div>
                {z.timeRemaining && (
                  <span className="text-[10px]" style={{ color: z.color }}>{z.timeRemaining}</span>
                )}
              </div>
            ))}
            {totalMin != null && Number(totalMin) > 0 && (
              <p className="text-[10px] text-orange-400 mt-0.5">{totalMin} min gesamt</p>
            )}
          </div>
        ) : (
          <div className="mt-3">
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
        <div className="mt-4 flex items-center gap-4 border-t border-[var(--glass-border)] pt-3 flex-wrap gap-y-1.5">
          {rain != null && (
            <div className="flex flex-col">
              <span className="text-[10px] font-bold tracking-widest text-[var(--text-muted)] uppercase">Regen</span>
              <span className="text-lg font-light text-blue-400">{rain} mm</span>
            </div>
          )}
          {bucket != null && (
            <div className="flex flex-col">
              <span className="text-[10px] font-bold tracking-widest text-[var(--text-muted)] uppercase">Vorrat</span>
              <span className="text-lg font-light text-cyan-400">{bucket} mm</span>
            </div>
          )}
        </div>
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
