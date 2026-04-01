import { useState, useRef, useEffect, useCallback, memo } from 'react';
import { Lightbulb, ChevronRight } from '../../icons';
import { getIconComponent } from '../../icons';
import M3Slider from '../ui/M3Slider';

const DEBOUNCE_MS = 200;

const DEFAULT_TABS = [
  {
    id: 'eg',
    title: 'EG',
    icon: 'mdi:home-floor-0',
    entities: [
      { entityId: 'light.kuche', name: 'Küche' },
      { entityId: 'light.beleuchtung_esstisch', name: 'Esstisch' },
      { entityId: 'light.eg_flur', name: 'Flur' },
      { entityId: 'light.wohnzimmer', name: 'Wohnzimmer' },
      { entityId: 'light.gaste_wc', name: 'Gäste WC' },
      { entityId: 'light.eg_hwr', name: 'HWR' },
      { entityId: 'light.wohnzimmer_schattenfuge', name: 'Schattenfuge' },
      { entityId: 'light.bogenlampe', name: 'Bogenlampe' },
      { entityId: 'light.kuche_essen', name: 'Durchgang' },
      { entityId: 'light.eg_buro', name: 'Büro' },
    ],
  },
  {
    id: 'og',
    title: 'OG',
    icon: 'mdi:home-floor-1',
    entities: [
      { entityId: 'light.schlafzimmer', name: 'Schlafzimmer' },
      { entityId: 'light.schlafzimmer_stripe', name: 'Stripe' },
      { entityId: 'light.kinderzimmer', name: 'Kinderzimmer' },
      { entityId: 'light.og_flur', name: 'Flur' },
      { entityId: 'light.og_buro', name: 'Büro' },
      { entityId: 'light.og_badezimmer_decke', name: 'Badezimmer' },
      { entityId: 'light.og_badezimmer_dusche', name: 'Dusche' },
      { entityId: 'light.og_badezimmer_wc', name: 'WC' },
    ],
  },
  {
    id: 'aussen',
    title: 'Außen',
    icon: 'mdi:outdoor-lamp',
    entities: [
      { entityId: 'light.terasse', name: 'Terrasse' },
      { entityId: 'light.eingang', name: 'Eingang' },
      { entityId: 'switch.beleuchtung_schuppen', name: 'Schuppen' },
      { entityId: 'light.wled_anpentaplus', name: 'Vordach' },
      { entityId: 'light.wled_anpentaplus_segment_1', name: 'Weg' },
      { entityId: 'light.wled_anpentaplus_segment_2', name: 'Einfahrt' },
    ],
  },
  {
    id: 'automatik',
    title: 'Automatik',
    icon: 'mdi:auto-mode',
    entities: [
      { entityId: 'input_boolean.sperre_beleuchtung_kuche', name: 'Küche' },
      { entityId: 'input_boolean.sperre_beleuchtung_esstisch', name: 'Esstisch' },
      { entityId: 'input_boolean.sperre_beleuchtung_schattenfuge_wz', name: 'Schattenfuge WZ' },
      { entityId: 'switch.sperre_buro_eg_wled', name: 'Büro EG' },
      { entityId: 'switch.sperre_flur_eg', name: 'Flur EG' },
      { entityId: 'switch.sperre_flur_og', name: 'Flur OG' },
      { entityId: 'input_boolean.sperre_beleuchtung_durchgang', name: 'Durchgang' },
      { entityId: 'switch.sperre_hwr', name: 'HWR' },
      { entityId: 'automation.treppenbeleuchtung_blueprint', name: 'Treppenbeleuchtung' },
    ],
  },
];

/* ── Light Tile ───────────────────────────────────────────────────── */
const LightTile = memo(({ entityId, name, entity, callService, optimisticBrightness, setOptimisticBrightness, onOpenModal }) => {
  const domain = entityId.split('.')[0];
  const state = entity?.state;
  const isOn = state === 'on';
  const isUnavailable = !state || state === 'unavailable' || state === 'unknown';
  const isLight = domain === 'light';

  const isDimmable = isLight && (() => {
    const modes = entity?.attributes?.supported_color_modes;
    if (modes) return !modes.includes('onoff') || modes.length > 1;
    return (entity?.attributes?.supported_features & 1) === 1;
  })();

  const brightness = entity?.attributes?.brightness || 0;
  const displayBrightness = optimisticBrightness[entityId] ?? brightness;
  const displayPct = Math.round((displayBrightness / 255) * 100);

  const debounceRef = useRef(null);
  useEffect(() => () => clearTimeout(debounceRef.current), []);

  const handleToggle = useCallback(() => {
    if (isUnavailable) return;
    callService(domain, isOn ? 'turn_off' : 'turn_on', { entity_id: entityId });
  }, [entityId, domain, isOn, isUnavailable, callService]);

  const handleBrightness = useCallback((e) => {
    const val = parseInt(e.target.value);
    setOptimisticBrightness((prev) => ({ ...prev, [entityId]: val }));
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      callService('light', 'turn_on', { entity_id: entityId, brightness: val });
    }, DEBOUNCE_MS);
  }, [entityId, callService, setOptimisticBrightness]);

  const stateLabel = isUnavailable ? '⚠' : isOn ? (isDimmable ? `${displayPct}%` : 'An') : 'Aus';

  return (
    <div
      className={`relative overflow-hidden rounded-xl border transition-all duration-300 ${
        isOn
          ? 'border-amber-500/30 bg-amber-500/10'
          : 'border-[var(--glass-border)] bg-[var(--glass-bg)]'
      } ${isUnavailable ? 'opacity-60' : ''}`}
    >
      {/* Toggle button */}
      <button
        type="button"
        data-haptic="card"
        disabled={isUnavailable}
        onClick={handleToggle}
        style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
        className={`flex w-full items-center gap-2 px-2.5 py-2.5 text-left transition-transform active:scale-[0.96] ${
          isUnavailable ? 'cursor-default' : 'cursor-pointer'
        }`}
      >
        {/* Icon */}
        <div
          className={`flex-shrink-0 rounded-lg p-1.5 transition-all duration-300 ${
            isOn ? 'bg-amber-500/20 text-amber-400' : 'bg-[var(--glass-bg-hover)] text-[var(--text-muted)]'
          }`}
        >
          <Lightbulb
            className={`h-4 w-4 stroke-[1.5px] transition-all duration-300 ${isOn ? 'fill-amber-400/20' : ''}`}
          />
        </div>
        {/* Name */}
        <span className="min-w-0 flex-1 truncate text-xs font-semibold text-[var(--text-primary)]">
          {name}
        </span>
        {/* State */}
        <span
          className={`flex-shrink-0 text-[10px] font-bold tracking-wide uppercase ${
            isUnavailable
              ? 'text-red-400'
              : isOn
                ? isDimmable
                  ? 'text-amber-400'
                  : 'text-amber-400'
                : 'text-[var(--text-muted)] opacity-60'
          }`}
        >
          {stateLabel}
        </span>
      </button>

      {/* Modal open button — only for light entities */}
      {onOpenModal && isLight && (
        <button
          type="button"
          data-haptic="card"
          onClick={(e) => { e.stopPropagation(); onOpenModal(entityId); }}
          style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
          className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-md text-[var(--text-muted)] opacity-40 transition-all hover:opacity-80 active:scale-90"
        >
          <ChevronRight className="h-3 w-3" />
        </button>
      )}

      {/* Brightness slider — only for dimmable lights that are on */}
      {isDimmable && isOn && (
        <div className="px-2.5 pb-2.5">
          <M3Slider
            variant="thinLg"
            min={0}
            max={255}
            step={1}
            value={displayBrightness}
            disabled={isUnavailable}
            onChange={handleBrightness}
            colorClass="bg-amber-500"
            ariaLabel="Helligkeit"
          />
        </div>
      )}
    </div>
  );
});

/* ── Light Panel Card ─────────────────────────────────────────────── */
const LightPanelCard = ({
  cardId,
  dragProps,
  controls,
  cardStyle,
  editMode,
  entities,
  callService,
  optimisticLightBrightness,
  setOptimisticLightBrightness,
  settings,
  onOpenLightModal,
}) => {
  const tabs = settings?.panelTabs || DEFAULT_TABS;
  const [activeTabId, setActiveTabId] = useState(null);
  const resolvedActiveTabId = activeTabId || tabs[0]?.id;
  const activeTab = tabs.find((t) => t.id === resolvedActiveTabId) || tabs[0];

  return (
    <div
      key={cardId}
      {...dragProps}
      className={`glass-texture relative flex h-full flex-col overflow-hidden rounded-3xl border border-[var(--glass-border)] bg-[var(--glass-bg)] font-sans select-none ${editMode ? 'cursor-move' : ''}`}
      style={cardStyle}
    >
      {controls}

      {/* Tab bar */}
      <div className="scrollbar-hide flex flex-shrink-0 items-center gap-2 overflow-x-auto border-b border-[var(--glass-border)] px-4 py-3">
        {tabs.map((tab) => {
          const TabIcon = getIconComponent(tab.icon) || Lightbulb;
          const isActive = resolvedActiveTabId === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              data-haptic={editMode ? undefined : 'card'}
              disabled={editMode}
              onClick={() => setActiveTabId(tab.id)}
              style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
              className={`flex flex-shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold tracking-wide uppercase transition-all active:scale-95 ${
                isActive
                  ? 'bg-[var(--accent-color)] text-white shadow-sm'
                  : 'bg-[var(--glass-bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <TabIcon className="h-3.5 w-3.5" />
              <span>{tab.title}</span>
            </button>
          );
        })}
      </div>

      {/* Scrollable tile grid */}
      <div className="scrollbar-hide flex-1 overflow-y-auto px-4 py-3">
        <div className="grid grid-cols-2 gap-3">
          {activeTab.entities.map(({ entityId, name }) => (
            <LightTile
              key={entityId}
              entityId={entityId}
              name={name}
              entity={entities[entityId]}
              callService={callService}
              optimisticBrightness={optimisticLightBrightness}
              setOptimisticBrightness={setOptimisticLightBrightness}
              onOpenModal={!editMode && onOpenLightModal ? onOpenLightModal : null}
            />
          ))}
          {/* Spacer for odd tile count */}
          {activeTab.entities.length % 2 !== 0 && <div />}
        </div>
      </div>
    </div>
  );
};

export default memo(LightPanelCard);
