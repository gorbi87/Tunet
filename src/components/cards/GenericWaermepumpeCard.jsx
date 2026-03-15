import { memo } from 'react';
import { Flame } from '../../icons';
import { getIconComponent } from '../../icons';

export const WAERMEPUMPE_ENTITY_IDS = {
  kompressor: 'binary_sensor.warmepumpe_kompressor_aktiv',
  aussentemp: 'sensor.daikin_heizung_aussentemperatur',
  vorlauf: 'sensor.daikin_heizung_vorlauftemeratur_tv',
  ruecklauf: 'sensor.daikin_heizung_r_cklauftemperatur',
  warmwasser: 'sensor.daikin_heizung_warmwassertemperatur',
  stromTaglich: 'sensor.warmepumpe_elektrische_energie_taglich',
  waermeTaglich: 'sensor.warmepumpe_thermische_energie_taglich',
  stromMonatlich: 'sensor.warmepumpe_elektrische_energie_monatlich',
  waermeMonatlich: 'sensor.warmepumpe_thermische_energie_monatlich',
  heizstab: 'input_number.warmepumpe_heizstab',
  heizstabTaglich: 'sensor.warmepumpe_heizstab_verbrauch_taglich',
  wwSoll: 'select.daikin_heizung_t_ww_soll1',
  betriebsmodus: 'select.daikin_heizung_betriebsmodus',
  heizstabSelect: 'select.daikin_heizung_heizst_be_f_r_pumpen_nach_oktober_2018',
  betriebsart: 'sensor.daikin_3_r_ech2o_seriell_can_betriebsart_can',
};

const GenericWaermepumpeCard = memo(function GenericWaermepumpeCard({
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
  const name = customNames?.[cardId] || translate('waermepumpe.title');
  const Icon = customIcons?.[cardId] ? getIconComponent(customIcons[cardId]) || Flame : Flame;
  const isDenseMobile = isMobile && settings.size !== 'small';

  const kompressorEntity = entities?.[WAERMEPUMPE_ENTITY_IDS.kompressor];
  const warmwasserEntity = entities?.[WAERMEPUMPE_ENTITY_IDS.warmwasser];
  const aussentempEntity = entities?.[WAERMEPUMPE_ENTITY_IDS.aussentemp];
  const stromEntity = entities?.[WAERMEPUMPE_ENTITY_IDS.stromTaglich];
  const waermeEntity = entities?.[WAERMEPUMPE_ENTITY_IDS.waermeTaglich];

  const betriebsartEntity = entities?.[WAERMEPUMPE_ENTITY_IDS.betriebsart];
  const kompressorAktiv = kompressorEntity?.state === 'on';
  const betriebsart = betriebsartEntity?.state || null;
  const wwTemp = warmwasserEntity ? parseFloat(warmwasserEntity.state) : null;
  const aussenTemp = aussentempEntity ? parseFloat(aussentempEntity.state) : null;
  const stromKwh = stromEntity ? parseFloat(stromEntity.state) : null;
  const waermeKwh = waermeEntity ? parseFloat(waermeEntity.state) : null;
  const cop =
    stromKwh != null && waermeKwh != null && stromKwh > 0
      ? (waermeKwh / stromKwh).toFixed(1)
      : null;

  const kompressorColor = kompressorAktiv
    ? 'bg-[var(--status-success-fg)]'
    : 'bg-[var(--text-muted)]';
  const BETRIEBSART_SHORT = {
    'Warmwasserbereitung': 'DHW',
    'Heizen': 'Heizen',
    'Kühlen': 'Kühlen',
    'Bereitschaft': 'Standby',
    'Abtauen': 'Abtauen',
  };
  const betriebsartShort = betriebsart
    ? (BETRIEBSART_SHORT[betriebsart] ?? betriebsart)
    : null;
  // When active: show betriebsart text if available, else "Aktiv"
  const statusLabel = kompressorAktiv
    ? (betriebsartShort || translate('waermepumpe.kompressor.on'))
    : translate('waermepumpe.kompressor.off');

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
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-[var(--glass-bg)] text-orange-400 transition-transform duration-500 group-hover:scale-110">
            <Icon className="h-6 w-6 stroke-[1.5px]" />
          </div>
          <div className="flex min-w-0 flex-col">
            <div className="mb-1.5 flex items-center gap-2">
              <p className="truncate text-xs leading-none font-bold tracking-widest text-[var(--text-secondary)] uppercase opacity-70">
                {name}
              </p>
              <span
                className={`h-2.5 w-2.5 shrink-0 rounded-full shadow-sm ring-2 ${kompressorColor}`}
                title={statusLabel}
              />
            </div>
            <div className="flex items-baseline gap-1 leading-none">
              <span className="text-xl font-bold text-[var(--text-primary)]">
                {wwTemp != null ? wwTemp.toFixed(1) : '—'}
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
        {/* Top row: icon + kompressor status */}
        <div className="flex items-start justify-between">
          <div
            className={`text-orange-400 transition-transform duration-500 group-hover:scale-110 ${isDenseMobile ? 'rounded-xl p-2.5' : 'rounded-2xl p-3'}`}
            style={{ backgroundColor: 'rgba(234, 88, 12, 0.1)' }}
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
            <span
              className={`h-2 w-2 rounded-full ${kompressorColor}`}
            />
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

        {/* WW Temp (large) + Außentemp */}
        <div className={`flex items-end justify-between ${isDenseMobile ? 'mt-2' : 'mt-3'}`}>
          <div className="flex items-baseline gap-1 leading-none">
            <span
              className={`leading-none font-thin text-[var(--text-primary)] ${isDenseMobile ? 'text-3xl' : 'text-4xl'}`}
            >
              {wwTemp != null ? wwTemp.toFixed(1) : '—'}
            </span>
            <span className="ml-1 text-sm font-medium text-[var(--text-muted)]">°C WW</span>
          </div>
          {aussenTemp != null && !isDenseMobile && (
            <div className="flex items-baseline gap-1 text-right leading-none">
              <span className="text-xl font-light text-[var(--text-secondary)]">
                {aussenTemp.toFixed(1)}
              </span>
              <span className="text-xs font-medium text-[var(--text-muted)]">°C</span>
            </div>
          )}
        </div>

        {/* Bottom row: COP + Strom */}
        {!isDenseMobile && (
          <div className="mt-4 flex items-center gap-4 border-t border-[var(--glass-border)] pt-3">
            {cop != null && (
              <div className="flex flex-col">
                <span className="text-[10px] font-bold tracking-widest text-[var(--text-muted)] uppercase">
                  COP
                </span>
                <span className="text-lg font-light text-[var(--accent-color)]">{cop}</span>
              </div>
            )}
            {stromKwh != null && (
              <div className="flex flex-col">
                <span className="text-[10px] font-bold tracking-widest text-[var(--text-muted)] uppercase">
                  {translate('waermepumpe.strom')}
                </span>
                <span className="text-lg font-light text-[var(--text-primary)]">
                  {stromKwh.toFixed(2)} kWh
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

export default GenericWaermepumpeCard;
