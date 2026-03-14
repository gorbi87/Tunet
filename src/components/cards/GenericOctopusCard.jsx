import { memo } from 'react';
import SparkLine from '../charts/SparkLine';
import { Zap } from '../../icons';
import { getIconComponent } from '../../icons';

const GenericOctopusCard = memo(function GenericOctopusCard({
  cardId,
  dragProps,
  controls,
  cardStyle,
  editMode,
  entity,
  customNames,
  customIcons,
  onOpen,
  isMobile,
  t,
  settings = {},
}) {
  const translate = t || ((key) => key);

  if (!entity) return null;

  const name = customNames?.[cardId] || entity.attributes?.friendly_name || cardId;
  const decimals = settings.decimals ?? 4;
  const Icon = customIcons?.[cardId] ? getIconComponent(customIcons[cardId]) || Zap : Zap;
  const isDenseMobile = isMobile && settings.size !== 'small';

  // Extract rates from sensor attributes
  const rates = Array.isArray(entity.attributes?.rates) ? entity.attributes.rates : [];
  const unit = entity.attributes?.unit_of_measurement || '€/kWh';

  // Map rates to { start, end, value } for SparkLine
  const fullPriceData = rates.map((r) => ({
    start: r.start,
    end: r.end,
    value: typeof r.value_inc_vat === 'number' ? r.value_inc_vat : 0,
  }));

  // Find current price index based on actual timestamps
  const now = new Date();
  const currentPriceIndex = fullPriceData.findIndex((d) => {
    const start = new Date(d.start);
    const end = new Date(d.end);
    return now >= start && now < end;
  });

  // Current price from entity state or from rates
  const currentPrice =
    currentPriceIndex >= 0
      ? fullPriceData[currentPriceIndex].value
      : typeof entity.state === 'number'
        ? entity.state
        : parseFloat(entity.state) || 0;

  // Calculate stats
  const values = fullPriceData.map((d) => d.value).filter((v) => !Number.isNaN(v));
  const priceStats =
    values.length > 0
      ? {
          min: Math.min(...values),
          max: Math.max(...values),
          avg: values.reduce((a, b) => a + b, 0) / values.length,
        }
      : { min: 0, max: 0, avg: 0 };

  // Determine price level
  let levelText = translate('power.level.normal');
  let levelTone = 'normal';
  let levelColor = 'text-[var(--accent-color)]';

  if (!Number.isNaN(currentPrice) && priceStats.avg > 0) {
    if (currentPrice >= priceStats.avg * 1.4) {
      levelText = translate('power.level.veryHigh');
      levelTone = 'high';
      levelColor = 'text-[var(--status-error-fg)]';
    } else if (currentPrice >= priceStats.avg * 1.15) {
      levelText = translate('power.level.high');
      levelTone = 'warn';
      levelColor = 'text-orange-400';
    } else if (currentPrice <= priceStats.avg * 0.9) {
      levelText = translate('power.level.low');
      levelTone = 'low';
      levelColor = 'text-[var(--status-success-fg)]';
    }
  }

  const priceDisplay = currentPrice > 0 ? currentPrice.toFixed(decimals) : '0';

  if (settings.size === 'small') {
    let indicatorClass = 'bg-[var(--accent-color)] ring-[var(--accent-color)]';
    if (levelTone === 'high') {
      indicatorClass =
        'bg-[var(--status-error-fg)] ring-[var(--status-error-fg)]/30 shadow-[0_0_0_0.375rem_var(--status-error-bg)]';
    } else if (levelTone === 'warn') {
      indicatorClass = 'bg-orange-400 ring-orange-400/30 shadow-orange-500/40';
    } else if (levelTone === 'low') {
      indicatorClass =
        'bg-[var(--status-success-fg)] ring-[var(--status-success-fg)]/30 shadow-[0_0_0_0.375rem_var(--status-success-bg)]';
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
        className={`glass-texture touch-feedback group relative flex h-full items-center justify-between gap-4 overflow-hidden rounded-3xl border p-4 pl-5 font-sans transition-colors duration-500 ${!editMode ? 'cursor-pointer active:scale-[0.98]' : 'cursor-move'}`}
        style={cardStyle}
      >
        {controls}

        <div className="flex min-w-0 items-center gap-4">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-[var(--glass-bg)] text-amber-400 transition-transform duration-500 group-hover:scale-110">
            <Icon className="h-6 w-6 stroke-[1.5px]" />
          </div>

          <div className="flex min-w-0 flex-col">
            <div className="mb-1.5 flex items-center gap-2">
              <p className="truncate text-xs leading-none font-bold tracking-widest text-[var(--text-secondary)] uppercase opacity-70">
                {name}
              </p>
              <span
                className={`h-2.5 w-2.5 shrink-0 rounded-full shadow-sm ring-2 ${indicatorClass}`}
                title={levelText}
                aria-label={levelText}
              />
            </div>
            <div className="flex items-baseline gap-1 leading-none">
              <span className="text-xl font-bold text-[var(--text-primary)]">{priceDisplay}</span>
              <span className="text-xs font-medium text-[var(--text-muted)]">{unit}</span>
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
      <div className={`relative z-10 ${isDenseMobile ? 'pb-16' : 'pb-20'}`}>
        <div className="flex items-start justify-between">
          <div
            className={`text-amber-400 transition-transform duration-500 group-hover:scale-110 ${isDenseMobile ? 'rounded-xl p-2.5' : 'rounded-2xl p-3'}`}
            style={{ backgroundColor: 'rgba(217, 119, 6, 0.1)' }}
          >
            <Icon
              className={isDenseMobile ? 'h-4 w-4' : 'h-5 w-5'}
              style={{ strokeWidth: 1.5 }}
            />
          </div>
          {isDenseMobile ? (
            <div className="flex items-end gap-1 leading-none">
              <span className="text-2xl leading-none font-light text-[var(--text-primary)]">
                {String(priceDisplay)}
              </span>
              <span className="text-[11px] font-medium text-[var(--text-muted)]">{unit}</span>
            </div>
          ) : (
            <div
              className="flex items-center gap-1.5 rounded-full border px-3 py-1"
              style={{ backgroundColor: 'var(--glass-bg)', borderColor: 'var(--glass-border)' }}
            >
              <span className={`text-xs font-bold tracking-widest uppercase ${levelColor}`}>
                {levelText}
              </span>
            </div>
          )}
        </div>
        <div className={isDenseMobile ? 'mt-3' : 'mt-2'}>
          <p
            className={`${isDenseMobile ? 'mb-1 text-[10px]' : 'mb-0.5 text-xs'} leading-none font-bold text-[var(--text-secondary)] uppercase opacity-60`}
            style={{ letterSpacing: '0.05em' }}
          >
            {name}
          </p>
          {isDenseMobile ? (
            <span className={`text-[10px] font-bold tracking-widest uppercase ${levelColor}`}>
              {levelText}
            </span>
          ) : (
            <div className="mt-2 flex items-baseline gap-1 leading-none">
              <span className="text-4xl leading-none font-thin text-[var(--text-primary)]">
                {String(priceDisplay)}
              </span>
              <span className="ml-1 text-base font-medium text-[var(--text-muted)]">{unit}</span>
            </div>
          )}
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-0">
        <SparkLine
          data={fullPriceData}
          currentIndex={currentPriceIndex}
          height={isDenseMobile ? 72 : 84}
          variant={settings.graphStyle === 'bar' ? 'bar' : 'line'}
        />
      </div>
    </div>
  );
});

export default GenericOctopusCard;
