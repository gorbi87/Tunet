import { memo } from 'react';
import { Droplets } from '../../icons';
import { getSettings } from '../helpers';

const ZONE_ENTITIES = [
  { switchId: 'switch.irrigation_manual_zone_1', sensorId: 'binary_sensor.irrigation_unlimited_c1_z1', name: 'T. rechts' },
  { switchId: 'switch.irrigation_manual_zone_3', sensorId: 'binary_sensor.irrigation_unlimited_c1_z3', name: 'T. links' },
  { switchId: 'switch.irrigation_manual_zone_2', sensorId: 'binary_sensor.irrigation_unlimited_c1_z2', name: 'Rasen' },
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
  t,
}) {
  const name = customNames?.[cardId] || 'Beregnung';

  const masterActive = entities?.['binary_sensor.beregung_master_status']?.state === 'on';
  const rain = entities?.['sensor.gw2000a_daily_rain']?.state;
  const bucket = entities?.['sensor.rasenflache_bucket']?.state;
  const totalMin = entities?.['sensor.beregnung_gesamtzeit_minuten']?.state;

  const activeZones = ZONE_ENTITIES.filter(
    (z) => entities?.[z.sensorId]?.state === 'on'
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

      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)]">
            <Droplets className={`h-4 w-4 ${masterActive ? 'text-cyan-400' : 'text-[var(--text-secondary)]'}`} />
          </div>
          <div>
            <p className="text-[10px] font-bold tracking-widest text-[var(--text-secondary)] uppercase leading-none">
              Garten
            </p>
            <p className="text-sm font-bold text-[var(--text-primary)] leading-tight">{name}</p>
          </div>
        </div>
        <span className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${
          masterActive
            ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
            : 'border-[var(--glass-border)] bg-[var(--glass-bg)] text-[var(--text-secondary)]'
        }`}>
          <span className={`h-1.5 w-1.5 rounded-full ${masterActive ? 'bg-emerald-400' : 'bg-gray-500'}`} />
          {masterActive ? 'Aktiv' : 'Aus'}
        </span>
      </div>

      {activeZones.length > 0 && (
        <div className="flex flex-col gap-1 mb-2">
          {activeZones.map((z) => (
            <div key={z.switchId} className="flex items-center gap-1.5 text-xs text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {z.name} laeuft
            </div>
          ))}
        </div>
      )}

      <div className="mt-auto flex flex-wrap gap-1.5">
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
        {totalMin != null && Number(totalMin) > 0 && (
          <span className="rounded-lg border border-orange-500/30 bg-orange-500/10 px-2 py-0.5 text-[10px] font-bold text-orange-400">
            {totalMin} min
          </span>
        )}
      </div>
    </div>
  );
});

export function renderBeregnungCard(cardId, dragProps, getControls, cardStyle, settingsKey, ctx) {
  const {
    editMode,
    cardSettings,
    customNames,
    entities,
    setShowBeregnungModal,
    setShowEditCardModal,
    setEditCardSettingsKey,
    t,
  } = ctx;
  const settings = getSettings(cardSettings, settingsKey, cardId);

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
      settings={settings}
      onOpen={() => setShowBeregnungModal?.(cardId)}
      t={t}
    />
  );
}
