import { memo } from 'react';
import { Fan } from '../../icons';
import { getIconComponent } from '../../icons';

export const LUFTUNGSANLAGE_ENTITY_IDS = {
  climate: 'climate.blauberg_s21',
  automation: 'automation.blauberg_luftung_smartsteuerung_mit_push_luftqualitats_override',
  saison: 'input_select.luftung_saison',
  lastMode: 'input_text.ventilation_last_mode',
  outsideTemp: 'sensor.wetterstation_temperatur',
  insideTemp: 'sensor.durchschnittstemperatur_haus',
  aussenluft: 'sensor.luftung_aussenluft',
  zuluft: 'sensor.luftung_zuluft',
  abluft: 'sensor.luftung_abluft',
  fortluft: 'sensor.luftung_fortluft',
  bypass: 'sensor.luftung_bypass',
  zuluftRpm: 'sensor.luftung_zuluftforderleistung',
  abluftRpm: 'sensor.luftung_abluftforderleistung',
  luftstufe: 'sensor.luftung_aktuelle_luftungstufe',
  filter: 'sensor.luftung_filter',
  alarm: 'sensor.luftung_alarm',
  lockTimestamp: 'input_datetime.luftung_lock_timestamp',
  luftfeuchtigkeit: 'sensor.luftung_luftfeuchtigkeit',
  feuchtigkeitsDiff: 'sensor.innen_aussen_luftfeuchtigkeit_differenz',
  co2Eg: 'sensor.alpstuga_air_quality_monitor_kohlendioxid',
  feuchteEg: 'sensor.alpstuga_air_quality_monitor_luftfeuchtigkeit',
  pm25Eg: 'sensor.alpstuga_air_quality_monitor_pm25',
  luftqualitaetEg: 'sensor.alpstuga_air_quality_monitor_luftqualitat',
  vocOg: 'sensor.luftqualitatssensor_voc_index',
  feuchteOg: 'sensor.luftqualitatssensor_humidity',
  pm25Og: 'sensor.luftqualitatssensor_pm25',
  tempOg: 'sensor.luftqualitatssensor_temperature',
};

const ACCENT = '#38bdf8';

function getCo2Color(ppm) {
  if (ppm == null) return 'var(--text-primary)';
  if (ppm < 800) return '#4ade80';
  if (ppm < 1000) return '#fb923c';
  return '#f87171';
}

const GenericLuftungsanlageCard = memo(function GenericLuftungsanlageCard({
  cardId,
  dragProps,
  controls,
  cardStyle,
  editMode,
  entities,
  customNames,
  customIcons,
  onOpen,
  isMobile,
  settings = {},
  t,
}) {
  const translate = t || ((key) => key);
  const name = customNames?.[cardId] || translate('luftungsanlage.title');
  const Icon = customIcons?.[cardId] ? getIconComponent(customIcons[cardId]) || Fan : Fan;
  const isDenseMobile = isMobile && settings.size !== 'small';

  const climateEntity = entities?.[LUFTUNGSANLAGE_ENTITY_IDS.climate];
  const zuluftEntity = entities?.[LUFTUNGSANLAGE_ENTITY_IDS.zuluft];
  const co2Entity = entities?.[LUFTUNGSANLAGE_ENTITY_IDS.co2Eg];
  const luftstufeEntity = entities?.[LUFTUNGSANLAGE_ENTITY_IDS.luftstufe];

  const hvacState = climateEntity?.state || null;
  const zuluftTemp = zuluftEntity ? parseFloat(zuluftEntity.state) : null;
  const co2Ppm = co2Entity ? parseFloat(co2Entity.state) : null;
  const luftstufe = luftstufeEntity?.state || null;

  const STATE_LABELS = {
    off: translate('luftungsanlage.state.off') || 'Aus',
    auto: translate('luftungsanlage.state.auto') || 'Auto',
    fan_only: translate('luftungsanlage.state.fanOnly') || 'Lüften',
  };
  const statusLabel = luftstufe || (hvacState ? (STATE_LABELS[hvacState] ?? hvacState) : '—');

  const isActive = hvacState !== 'off' && hvacState != null;
  const iconColor = isActive ? '#4ade80' : 'var(--text-muted)';
  const iconBg = isActive ? 'rgba(74,222,128,0.1)' : 'rgba(127,127,127,0.1)';

  const statusDotColor =
    hvacState === 'off'
      ? 'bg-[var(--text-muted)]'
      : 'bg-[var(--status-success-fg)]';

  const co2Color = getCo2Color(co2Ppm);

  if (settings.size === 'small') {
    return (
      <div
        key={cardId}
        {...dragProps}
        data-haptic={editMode ? undefined : 'card'}
        onClick={(e) => {
          e.stopPropagation();
          if (!editMode && onOpen) onOpen();
        }}
        className={`glass-texture touch-feedback group relative flex h-full items-center justify-between gap-4 overflow-hidden rounded-3xl border p-4 pl-5 font-sans transition-colors duration-500 ${!editMode ? 'cursor-pointer active:scale-[0.98]' : 'cursor-move'}`}
        style={cardStyle}
      >
        {controls}
        <div className="flex min-w-0 items-center gap-4">
          <div
            className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl transition-transform duration-500 group-hover:scale-110"
            style={{ backgroundColor: iconBg, color: iconColor }}
          >
            <Icon className="h-6 w-6 stroke-[1.5px]" />
          </div>
          <div className="flex min-w-0 flex-col">
            <div className="mb-1.5 flex items-center gap-2">
              <p className="truncate text-xs leading-none font-bold tracking-widest text-[var(--text-secondary)] uppercase opacity-70">
                {name}
              </p>
              <span
                className={`h-2.5 w-2.5 shrink-0 rounded-full shadow-sm ring-2 ${statusDotColor}`}
                title={statusLabel}
              />
            </div>
            <div className="flex items-baseline gap-1 leading-none">
              <span className="text-xl font-bold text-[var(--text-primary)]">
                {zuluftTemp != null ? zuluftTemp.toFixed(1) : '—'}
              </span>
              <span className="text-xs font-medium text-[var(--text-muted)]">°C</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      key={cardId}
      {...dragProps}
      data-haptic={editMode ? undefined : 'card'}
      onClick={(e) => {
        e.stopPropagation();
        if (!editMode && onOpen) onOpen();
      }}
      className={`glass-texture touch-feedback group relative flex h-full flex-col justify-between overflow-hidden rounded-3xl border font-sans transition-colors duration-500 ${isDenseMobile ? 'p-5' : 'p-7'} ${!editMode ? 'cursor-pointer active:scale-[0.98]' : 'cursor-move'}`}
      style={cardStyle}
    >
      {controls}
      <div className="relative z-10">
        {/* Top row: icon + status badge */}
        <div className="flex items-start justify-between">
          <div
            className={`transition-transform duration-500 group-hover:scale-110 ${isDenseMobile ? 'rounded-xl p-2.5' : 'rounded-2xl p-3'}`}
            style={{ backgroundColor: iconBg, color: iconColor }}
          >
            <Icon
              className={isDenseMobile ? 'h-4 w-4' : 'h-5 w-5'}
              style={{ strokeWidth: 1.5 }}
            />
          </div>
          <div
            className="flex items-center gap-1.5 rounded-full border px-3 py-1"
            style={{ backgroundColor: 'var(--glass-bg)', borderColor: 'var(--glass-border)' }}
          >
            <span className={`h-2 w-2 rounded-full ${statusDotColor}`} />
            <span className="text-xs font-bold tracking-widest uppercase text-[var(--text-secondary)]">
              {statusLabel}
            </span>
          </div>
        </div>

        {/* Card name */}
        <div className={isDenseMobile ? 'mt-3' : 'mt-2'}>
          <p
            className={`${isDenseMobile ? 'mb-1 text-[10px]' : 'mb-0.5 text-xs'} leading-none font-bold text-[var(--text-secondary)] uppercase opacity-60`}
            style={{ letterSpacing: '0.05em' }}
          >
            {name}
          </p>
        </div>

        {/* Zuluft temp (large) */}
        <div className={`flex items-end justify-between ${isDenseMobile ? 'mt-2' : 'mt-3'}`}>
          <div className="flex items-baseline gap-1 leading-none">
            <span
              className={`leading-none font-thin text-[var(--text-primary)] ${isDenseMobile ? 'text-3xl' : 'text-4xl'}`}
            >
              {zuluftTemp != null ? zuluftTemp.toFixed(1) : '—'}
            </span>
            <span className="ml-1 text-sm font-medium text-[var(--text-muted)]">
              °C {translate('luftungsanlage.zuluft') || 'Zuluft'}
            </span>
          </div>
        </div>

        {/* Bottom row: CO2 */}
        {!isDenseMobile && (
          <div className="mt-4 flex items-center gap-4 border-t border-[var(--glass-border)] pt-3">
            {co2Ppm != null && (
              <div className="flex flex-col">
                <span className="text-[10px] font-bold tracking-widest text-[var(--text-muted)] uppercase">
                  {translate('luftungsanlage.co2') || 'CO₂'}
                </span>
                <span className="text-lg font-light" style={{ color: co2Color }}>
                  {co2Ppm.toFixed(0)} ppm
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

export default GenericLuftungsanlageCard;
