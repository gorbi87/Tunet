import { memo } from 'react';
import { Sun } from '../../icons';
import { getIconComponent } from '../../icons';

export const PV_ENTITY_IDS = {
  pvW: 'sensor.solar_panel_production_w',
  pvDaily: 'sensor.solar_panel_production_daily',
  pvMonthly: 'sensor.solar_panel_production_monthly',
  pvYearly: 'sensor.solar_panel_production_yearly',
  houseW: 'sensor.solar_house_consumption_w',
  houseDaily: 'sensor.solar_house_consumption_daily',
  batteryDcPower: 'sensor.solaredge_b1_dc_power',
  batteryInW: 'sensor.solar_battery_in_w',
  batterySoc: 'sensor.solaredge_b1_state_of_energy',
  batteryInDaily: 'sensor.solar_battery_in_daily',
  batteryOutDaily: 'sensor.solar_battery_out_daily',
  gridW: 'sensor.solaredge_m1_ac_power',
  gridImportW: 'sensor.solar_imported_power_w',
  gridExportW: 'sensor.solar_exported_power_w',
  gridImportDaily: 'sensor.solar_imported_power_daily',
  gridExportDaily: 'sensor.solar_exported_power_daily',
  forecastToday: 'sensor.solcast_pv_forecast_prognose_heute',
  forecastTomorrow: 'sensor.solcast_pv_forecast_prognose_morgen',
  forecastDay3: 'sensor.solcast_pv_forecast_prognose_tag_3',
  forecastDay4: 'sensor.solcast_pv_forecast_prognose_tag_4',
  forecastDay5: 'sensor.solcast_pv_forecast_prognose_tag_5',
  forecastCurrent: 'sensor.solcast_pv_forecast_aktuelle_leistung',
  forecastPeakToday: 'sensor.solcast_pv_forecast_prognose_spitzenleistung_heute',
  forecastRemaining: 'sensor.solcast_pv_forecast_prognose_verbleibende_leistung_heute',
  pvToHouseDaily: 'sensor.solar_panel_to_house_daily',
  batteryMaxEnergy: 'sensor.solaredge_b1_maximum_energy',
};

function getBattSocColor(soc) {
  if (soc == null) return 'var(--text-muted)';
  if (soc >= 60) return '#4ade80';
  if (soc >= 30) return '#fb923c';
  return '#f87171';
}

const GenericPvCard = memo(function GenericPvCard({
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
  const name = customNames?.[cardId] || 'Solar';
  const Icon = customIcons?.[cardId] ? getIconComponent(customIcons[cardId]) || Sun : Sun;
  const isDenseMobile = isMobile && settings.size !== 'small';

  const v = (id) => {
    const s = parseFloat(entities?.[id]?.state);
    return Number.isFinite(s) ? s : null;
  };

  const pvW = v(PV_ENTITY_IDS.pvW);
  const pvDaily = v(PV_ENTITY_IDS.pvDaily);
  const batterySoc = v(PV_ENTITY_IDS.batterySoc);
  const gridImportW = v(PV_ENTITY_IDS.gridImportW);
  const gridExportW = v(PV_ENTITY_IDS.gridExportW);

  const isProducing = pvW != null && pvW > 10;
  const netGrid = (gridExportW ?? 0) - (gridImportW ?? 0); // positive = exporting

  const iconColor = isProducing ? '#fb923c' : 'var(--text-muted)';
  const iconBg = isProducing ? 'rgba(251,146,60,0.12)' : 'rgba(127,127,127,0.1)';
  const statusLabel = isProducing ? `${pvW != null ? Math.round(pvW) : '—'} W` : 'Standby';
  const statusDotColor = isProducing ? 'bg-[var(--status-success-fg)]' : 'bg-[var(--text-muted)]';
  const socColor = getBattSocColor(batterySoc);

  if (settings.size === 'small') {
    return (
      <div
        key={cardId}
        {...dragProps}
        data-haptic={editMode ? undefined : 'card'}
        onClick={(e) => { e.stopPropagation(); if (!editMode && onOpen) onOpen(); }}
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
              <span className={`h-2.5 w-2.5 shrink-0 rounded-full shadow-sm ring-2 ${statusDotColor}`} />
            </div>
            <div className="flex items-baseline gap-1 leading-none">
              <span className="text-xl font-bold text-[var(--text-primary)]">
                {pvW != null ? Math.round(pvW) : '—'}
              </span>
              <span className="text-xs font-medium text-[var(--text-muted)]">W</span>
            </div>
          </div>
        </div>
        {batterySoc != null && (
          <div className="flex flex-col items-end gap-0.5">
            <span className="text-xs font-bold" style={{ color: socColor }}>{batterySoc.toFixed(0)}%</span>
            <span className="text-[9px] text-[var(--text-muted)]">Batt</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      key={cardId}
      {...dragProps}
      data-haptic={editMode ? undefined : 'card'}
      onClick={(e) => { e.stopPropagation(); if (!editMode && onOpen) onOpen(); }}
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
            <Icon className={isDenseMobile ? 'h-4 w-4' : 'h-5 w-5'} style={{ strokeWidth: 1.5 }} />
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

        {/* PV W large */}
        <div className={`flex items-end justify-between ${isDenseMobile ? 'mt-2' : 'mt-3'}`}>
          <div className="flex items-baseline gap-1 leading-none">
            <span className={`leading-none font-thin text-[var(--text-primary)] ${isDenseMobile ? 'text-3xl' : 'text-4xl'}`}>
              {pvW != null ? Math.round(pvW) : '—'}
            </span>
            <span className="ml-1 text-sm font-medium text-[var(--text-muted)]">W</span>
          </div>
          {pvDaily != null && !isDenseMobile && (
            <div className="flex items-baseline gap-1 text-right leading-none">
              <span className="text-xl font-light text-[var(--text-secondary)]">
                {pvDaily.toFixed(1)}
              </span>
              <span className="text-xs font-medium text-[var(--text-muted)]">kWh</span>
            </div>
          )}
        </div>

        {/* Bottom: battery SOC + grid */}
        {!isDenseMobile && (
          <div className="mt-4 flex items-center gap-4 border-t border-[var(--glass-border)] pt-3">
            {batterySoc != null && (
              <div className="flex flex-col">
                <span className="text-[10px] font-bold tracking-widest text-[var(--text-muted)] uppercase">Batt</span>
                <span className="text-lg font-light" style={{ color: socColor }}>{batterySoc.toFixed(0)}%</span>
              </div>
            )}
            <div className="flex flex-col">
              <span className="text-[10px] font-bold tracking-widest text-[var(--text-muted)] uppercase">Netz</span>
              <span className="text-lg font-light" style={{ color: netGrid > 0 ? '#4ade80' : netGrid < -50 ? '#f87171' : 'var(--text-primary)' }}>
                {netGrid > 0 ? '+' : ''}{Math.round(netGrid)} W
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export default GenericPvCard;
