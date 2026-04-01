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
      className={`overflow-hidden rounded-2xl border transition-all duration-300 ${
        isOn
          ? 'border-amber-500/30 bg-amber-500/10'
          : 'border-[var(--glass-border)] bg-[var(--glass-bg)]'
      } ${isUnavailable ? 'opacity-50' : ''}`}
    >
      {/* Toggle row */}
      <div className="flex items-center">
        <button
          type="button"
          data-haptic="card"
          disabled={isUnavailable}
          onClick={handleToggle}
          style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
          className={`flex min-w-0 flex-1 items-center gap-2.5 px-3 py-3 text-left transition-transform active:scale-[0.97] ${
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
          {/* Name + state stacked */}
          <div className="min-w-0 flex-1">
            <span className="block truncate text-xs font-semibold leading-tight text-[var(--text-primary)]">
              {name}
            </span>
            <span
              className={`block text-[10px] font-bold uppercase tracking-wide leading-tight mt-0.5 ${
                isUnavailable
                  ? 'text-red-400'
                  : isOn
                    ? 'text-amber-400'
                    : 'text-[var(--text-muted)] opacity-60'
              }`}
            >
              {stateLabel}
            </span>
          </div>
        </button>

        {/* Modal button for light.* entities */}
        {onOpenModal && isLight && (
          <button
            type="button"
            data-haptic="card"
            onClick={(e) => { e.stopPropagation(); onOpenModal(entityId); }}
            style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
            className="flex-shrink-0 px-2 py-3 text-[var(--text-muted)] opacity-30 transition-all hover:opacity-70 active:scale-90"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Brightness slider — only for dimmable lights that are on */}
      {isDimmable && isOn && (
        <div className="px-3 pb-3">
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
  isMobile,
}) => {
  const tabs = settings?.panelTabs || DEFAULT_TABS;
  const [activeTabId, setActiveTabId] = useState(null);
  const resolvedActiveTabId = activeTabId || tabs[0]?.id;
  const activeTab = tabs.find((t) => t.id === resolvedActiveTabId) || tabs[0];

  const cols = isMobile ? 2 : 3;
  const entities_ = activeTab?.entities || [];
  const remainder = entities_.length % cols;
  const spacers = remainder === 0 ? 0 : cols - remainder;

  return (
    <div
      key={cardId}
      {...dragProps}
      className={`glass-texture relative overflow-hidden rounded-3xl border border-[var(--glass-border)] bg-[var(--glass-bg)] font-sans select-none ${editMode ? 'cursor-move' : ''}`}
      style={cardStyle}
    >
      {controls}

      {/* Tab bar — equal-width grid, never overflows */}
      <div
        className="grid border-b border-[var(--glass-border)] gap-2 px-4 py-3"
        style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
      >
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
              className={`flex items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-xs font-bold tracking-wide uppercase transition-all active:scale-95 ${
                isActive
                  ? 'bg-[var(--accent-color)] text-white shadow-sm'
                  : 'bg-[var(--glass-bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <TabIcon className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="truncate">{tab.title}</span>
            </button>
          );
        })}
      </div>

      {/* Tile grid — auto-height, no internal scroll */}
      <div className="p-4">
        <div className={`grid gap-3 ${cols === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
          {entities_.map(({ entityId, name }) => (
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
          {Array.from({ length: spacers }, (_, i) => <div key={`sp-${i}`} />)}
        </div>
      </div>
    </div>
  );
};

export default memo(LightPanelCard);
