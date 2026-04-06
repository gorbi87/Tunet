import { useState, useRef, useEffect, useCallback, memo } from 'react';
import { ChevronUp, ChevronDown, Pause, Workflow } from '../../icons';
import { getIconComponent } from '../../icons';

const DEFAULT_TABS = [
  {
    id: 'eg',
    title: 'EG',
    icon: 'mdi:home-floor-0',
    entities: [
      { entityId: 'cover.eg_kuche_fenster',    name: 'Küche Fenster' },
      { entityId: 'cover.eg_kuche_tur',         name: 'Küche Tür' },
      { entityId: 'cover.eg_esstisch_tur',      name: 'Esstisch Tür' },
      { entityId: 'cover.eg_wohnzimmer_fenster',name: 'Wohnzimmer' },
      { entityId: 'cover.eg_gaste_wc',          name: 'Gäste WC' },
      { entityId: 'cover.eg_buro',              name: 'Büro' },
    ],
  },
  {
    id: 'og',
    title: 'OG',
    icon: 'mdi:home-floor-1',
    entities: [
      { entityId: 'cover.og_schlafzimmer',  name: 'Schlafzimmer' },
      { entityId: 'cover.og_kinderzimmer',  name: 'Kinderzimmer' },
      { entityId: 'cover.og_badezimmer',    name: 'Badezimmer' },
      { entityId: 'cover.og_buro_rechts',   name: 'Büro rechts' },
      { entityId: 'cover.eg_buro_links',    name: 'Büro links' },
      { entityId: 'cover.og_flur',          name: 'Flur' },
    ],
  },
  {
    id: 'automatik',
    title: 'Automatik',
    icon: 'mdi:auto-mode',
    entities: [
      { entityId: 'switch.sperre_automatische_beschattung_eg', name: 'Sperre EG' },
      { entityId: 'switch.sperre_automatische_beschattung_og', name: 'Sperre OG' },
    ],
  },
];

/* ── Cover Tile ──────────────────────────────────────────────────────── */
const CoverTile = memo(({ entityId, name, entity, callService, isMobile }) => {
  const state = entity?.state;
  const isUnavailable = !state || state === 'unavailable' || state === 'unknown';
  const isOpening = state === 'opening';
  const isClosing = state === 'closing';
  const isMoving = isOpening || isClosing;

  const supportedFeatures = entity?.attributes?.supported_features ?? 0;
  const supportsPosition = (supportedFeatures & 4) !== 0;
  const position = entity?.attributes?.current_position;

  const [localPos, setLocalPos] = useState(position ?? 0);
  const isDraggingRef = useRef(false);
  useEffect(() => {
    if (!isDraggingRef.current && typeof position === 'number') setLocalPos(position);
  }, [position]);

  const iconName = entity?.attributes?.icon;
  const TileIcon = (iconName ? getIconComponent(iconName) : null) || Workflow;

  const open  = useCallback(() => callService('cover', 'open_cover',  { entity_id: entityId }), [entityId, callService]);
  const close = useCallback(() => callService('cover', 'close_cover', { entity_id: entityId }), [entityId, callService]);
  const stop  = useCallback(() => callService('cover', 'stop_cover',  { entity_id: entityId }), [entityId, callService]);

  const stateLabel = isUnavailable ? '⚠'
    : isOpening ? 'öffnet'
    : isClosing ? 'schließt'
    : supportsPosition && typeof position === 'number' ? `${localPos}%`
    : state === 'closed' ? 'Zu'
    : 'Offen';

  const px = isMobile ? 'px-3' : 'px-4';
  const py = isMobile ? 'py-3' : 'py-4';
  const iconSize = isMobile ? 'h-9 w-9 rounded-xl' : 'h-12 w-12 rounded-2xl';
  const iconInner = isMobile ? 'h-5 w-5' : 'h-6 w-6';
  const btnSize = isMobile ? 'h-7 w-7 rounded-lg' : 'h-8 w-8 rounded-xl';
  const btnIcon = isMobile ? 'h-3.5 w-3.5' : 'h-4 w-4';
  const stateSize = isMobile ? 'text-base' : 'text-lg';

  const iconBg = isUnavailable
    ? { backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444' }
    : isMoving
    ? { backgroundColor: 'rgba(96,165,250,0.12)', color: '#60a5fa' }
    : { backgroundColor: 'var(--glass-bg-hover)', color: 'var(--text-muted)' };

  return (
    <div className={`glass-texture overflow-hidden rounded-2xl border border-[var(--glass-border)] bg-[var(--card-bg)] transition-all duration-300 ${isUnavailable ? 'opacity-50' : ''}`}>
      <div className={`flex items-center ${px} ${py} gap-3`}>
        {/* Icon */}
        <div
          className={`flex flex-shrink-0 items-center justify-center ${iconSize} transition-all duration-300`}
          style={iconBg}
        >
          <TileIcon className={`${iconInner} stroke-[1.5px] ${isMoving ? 'animate-pulse' : ''}`} />
        </div>

        {/* Name + state */}
        <div className="min-w-0 flex-1">
          <p className={`mb-1.5 text-[10px] font-bold leading-tight tracking-widest uppercase text-[var(--text-secondary)] opacity-60 ${isMobile ? 'line-clamp-2 hyphens-auto' : 'truncate'}`} lang={isMobile ? 'de' : undefined}>
            {name}
          </p>
          <p className={`${stateSize} font-medium leading-none ${
            isUnavailable ? 'text-red-400' : isMoving ? 'text-blue-400' : 'text-[var(--text-primary)]'
          }`}>
            {stateLabel}
          </p>
        </div>

        {/* Open / Stop / Close buttons */}
        <div className="flex flex-shrink-0 items-center gap-0.5">
          <button
            type="button"
            data-haptic="card"
            disabled={isUnavailable}
            onClick={open}
            title="Öffnen"
            style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
            className={`flex items-center justify-center ${btnSize} text-[var(--text-muted)] opacity-40 transition-all hover:opacity-80 active:scale-90 hover:text-emerald-400`}
          >
            <ChevronUp className={btnIcon} />
          </button>
          <button
            type="button"
            data-haptic="card"
            disabled={isUnavailable}
            onClick={stop}
            title="Stopp"
            style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
            className={`flex items-center justify-center ${btnSize} text-[var(--text-muted)] opacity-40 transition-all hover:opacity-80 active:scale-90 hover:text-amber-400`}
          >
            <Pause className={btnIcon} />
          </button>
          <button
            type="button"
            data-haptic="card"
            disabled={isUnavailable}
            onClick={close}
            title="Schließen"
            style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
            className={`flex items-center justify-center ${btnSize} text-[var(--text-muted)] opacity-40 transition-all hover:opacity-80 active:scale-90 hover:text-red-400`}
          >
            <ChevronDown className={btnIcon} />
          </button>
        </div>
      </div>
    </div>
  );
});

/* ── Switch Tile (for Automatik tab) ─────────────────────────────────── */
const SwitchTile = memo(({ entityId, name, entity, callService, isMobile }) => {
  const isOn = entity?.state === 'on';
  const isUnavailable = !entity?.state || entity.state === 'unavailable';

  const toggle = useCallback(() => {
    if (isUnavailable) return;
    const domain = entityId.split('.')[0];
    callService(domain, isOn ? 'turn_off' : 'turn_on', { entity_id: entityId });
  }, [entityId, isOn, isUnavailable, callService]);

  const px = isMobile ? 'px-3' : 'px-4';
  const py = isMobile ? 'py-3' : 'py-4';
  const iconSize = isMobile ? 'h-9 w-9 rounded-xl' : 'h-12 w-12 rounded-2xl';
  const iconInner = isMobile ? 'h-5 w-5' : 'h-6 w-6';
  const stateSize = isMobile ? 'text-base' : 'text-lg';

  return (
    <div className={`glass-texture col-span-full overflow-hidden rounded-2xl border border-[var(--glass-border)] bg-[var(--card-bg)] transition-all duration-300 ${isUnavailable ? 'opacity-50' : ''}`}>
      <button
        type="button"
        data-haptic="card"
        disabled={isUnavailable}
        onClick={toggle}
        style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
        className={`flex w-full items-center gap-3 ${px} ${py} text-left transition-all active:scale-[0.97] ${isUnavailable ? 'cursor-default' : 'cursor-pointer'}`}
      >
        <div
          className={`flex flex-shrink-0 items-center justify-center ${iconSize} transition-all duration-300`}
          style={isOn ? { backgroundColor: 'rgba(251,146,60,0.15)', color: '#fb923c' } : { backgroundColor: 'var(--glass-bg-hover)', color: 'var(--text-muted)' }}
        >
          <Workflow className={`${iconInner} stroke-[1.5px]`} />
        </div>
        <div className="min-w-0 flex-1">
          <p className={`mb-1.5 text-[10px] font-bold leading-tight tracking-widest uppercase text-[var(--text-secondary)] opacity-60 ${isMobile ? 'line-clamp-2 hyphens-auto' : 'truncate'}`} lang={isMobile ? 'de' : undefined}>
            {name}
          </p>
          <p className={`${stateSize} font-medium leading-none ${isOn ? 'text-orange-400' : 'text-[var(--text-muted)] opacity-40'}`}>
            {isOn ? 'Gesperrt' : 'Automatik'}
          </p>
        </div>
      </button>
    </div>
  );
});

/* ── Cover Panel Card ────────────────────────────────────────────────── */
const CoverPanelCard = ({
  cardId,
  dragProps,
  controls,
  cardStyle,
  editMode,
  entities,
  callService,
  settings,
  isMobile,
}) => {
  const tabs = settings?.panelTabs || DEFAULT_TABS;
  const [activeTabId, setActiveTabId] = useState(null);
  const resolvedActiveTabId = activeTabId || tabs[0]?.id;
  const activeTab = tabs.find((t) => t.id === resolvedActiveTabId) || tabs[0];

  const cols = isMobile ? 2 : 3;
  const tabEntities = activeTab?.entities || [];
  const isAutomatikTab = resolvedActiveTabId === 'automatik';

  const remainder = tabEntities.length % cols;
  const spacers = !isAutomatikTab && remainder !== 0 ? cols - remainder : 0;

  // Strip card surface from outer container — bg handled per tile
  const layoutStyle = cardStyle ? {
    transform: cardStyle.transform,
    opacity: cardStyle.opacity,
    zIndex: cardStyle.zIndex,
    pointerEvents: cardStyle.pointerEvents,
    transition: cardStyle.transition,
  } : {};

  return (
    <div
      key={cardId}
      {...dragProps}
      className={`relative flex flex-col gap-3 font-sans select-none ${editMode ? 'cursor-move' : ''}`}
      style={layoutStyle}
    >
      {controls}

      {/* Tab bar */}
      {isMobile ? (
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => {
            const TabIcon = getIconComponent(tab.icon) || Workflow;
            const isActive = resolvedActiveTabId === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                data-haptic={editMode ? undefined : 'card'}
                disabled={editMode}
                onClick={() => setActiveTabId(tab.id)}
                style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
                className={`flex flex-shrink-0 items-center gap-1.5 rounded-2xl border px-4 py-2 text-[10px] font-bold tracking-widest whitespace-nowrap uppercase transition-all active:scale-95 ${
                  isActive
                    ? 'border-[var(--glass-border)] bg-[var(--glass-bg-hover)] text-[var(--text-primary)]'
                    : 'border-transparent bg-[var(--glass-bg)] text-[var(--text-secondary)]'
                }`}
              >
                <TabIcon className="h-3.5 w-3.5 flex-shrink-0" />
                <span>{tab.title}</span>
              </button>
            );
          })}
        </div>
      ) : (
        <div
          className="grid gap-2"
          style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
        >
          {tabs.map((tab) => {
            const TabIcon = getIconComponent(tab.icon) || Workflow;
            const isActive = resolvedActiveTabId === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                data-haptic={editMode ? undefined : 'card'}
                disabled={editMode}
                onClick={() => setActiveTabId(tab.id)}
                style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
                className={`flex items-center justify-center gap-1.5 rounded-2xl border px-2 py-2 text-[10px] font-bold tracking-widest whitespace-nowrap uppercase transition-all active:scale-95 ${
                  isActive
                    ? 'border-[var(--glass-border)] bg-[var(--glass-bg-hover)] text-[var(--text-primary)]'
                    : 'border-transparent bg-[var(--glass-bg)] text-[var(--text-secondary)] hover:bg-[var(--glass-bg-hover)] hover:text-[var(--text-primary)]'
                }`}
              >
                <TabIcon className="h-3.5 w-3.5 flex-shrink-0" />
                <span>{tab.title}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Tile grid */}
      <div className={`grid gap-3 ${cols === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
        {tabEntities.map(({ entityId, name }) => {
          const entity = entities[entityId];
          const domain = entityId.split('.')[0];
          if (domain === 'cover') {
            return (
              <CoverTile
                key={entityId}
                entityId={entityId}
                name={name}
                entity={entity}
                callService={callService}
                isMobile={isMobile}
              />
            );
          }
          return (
            <SwitchTile
              key={entityId}
              entityId={entityId}
              name={name}
              entity={entity}
              callService={callService}
              isMobile={isMobile}
            />
          );
        })}
        {Array.from({ length: spacers }, (_, i) => <div key={`sp-${i}`} />)}
      </div>
    </div>
  );
};

export default memo(CoverPanelCard);
