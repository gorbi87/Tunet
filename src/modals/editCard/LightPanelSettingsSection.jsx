import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { SearchableSelect } from './CarMappingsSection';

const DEFAULT_TABS_FALLBACK = [
  { id: 'eg', title: 'EG', icon: 'mdi:home-floor-0', entities: [] },
  { id: 'og', title: 'OG', icon: 'mdi:home-floor-1', entities: [] },
  { id: 'aussen', title: 'Außen', icon: 'mdi:outdoor-lamp', entities: [] },
  { id: 'automatik', title: 'Automatik', icon: 'mdi:auto-mode', entities: [] },
];

export function LightPanelSettingsSection({
  editSettings,
  editSettingsKey,
  saveCardSetting,
  entities,
  t,
}) {
  const [activeTabId, setActiveTabId] = useState(null);

  const tabs = editSettings?.panelTabs || DEFAULT_TABS_FALLBACK;
  const resolvedActiveTabId = activeTabId || tabs[0]?.id;
  const activeTab = tabs.find((tab) => tab.id === resolvedActiveTabId) || tabs[0];

  const saveTabs = (newTabs) => {
    saveCardSetting(editSettingsKey, 'panelTabs', newTabs);
  };

  const removeEntity = (entityId) => {
    const newTabs = tabs.map((tab) =>
      tab.id === resolvedActiveTabId
        ? { ...tab, entities: tab.entities.filter((e) => e.entityId !== entityId) }
        : tab
    );
    saveTabs(newTabs);
  };

  const addEntity = (entityId) => {
    if (!entityId) return;
    const already = activeTab.entities.some((e) => e.entityId === entityId);
    if (already) return;
    const friendlyName = entities[entityId]?.attributes?.friendly_name || '';
    const newTabs = tabs.map((tab) =>
      tab.id === resolvedActiveTabId
        ? { ...tab, entities: [...tab.entities, { entityId, name: friendlyName }] }
        : tab
    );
    saveTabs(newTabs);
  };

  const updateEntityName = (entityId, name) => {
    const newTabs = tabs.map((tab) =>
      tab.id === resolvedActiveTabId
        ? {
            ...tab,
            entities: tab.entities.map((e) =>
              e.entityId === entityId ? { ...e, name } : e
            ),
          }
        : tab
    );
    saveTabs(newTabs);
  };

  // Available entities: light, switch, input_boolean, automation
  const allOptions = Object.keys(entities || {}).filter(
    (id) =>
      id.startsWith('light.') ||
      id.startsWith('switch.') ||
      id.startsWith('input_boolean.') ||
      id.startsWith('automation.')
  );
  const usedIds = new Set((activeTab?.entities || []).map((e) => e.entityId));
  const addOptions = allOptions.filter((id) => !usedIds.has(id));

  return (
    <div className="space-y-4">
      <label className="ml-1 text-xs font-bold text-[var(--text-muted)] uppercase">
        Licht Panel Konfiguration
      </label>

      {/* Tab selector */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTabId(tab.id)}
            className={`rounded-xl px-3 py-1.5 text-xs font-bold tracking-wide uppercase transition-all ${
              resolvedActiveTabId === tab.id
                ? 'bg-[var(--accent-color)] text-white'
                : 'popup-surface popup-surface-hover text-[var(--text-secondary)]'
            }`}
          >
            {tab.title}
            <span className="ml-1.5 opacity-60">({tab.entities.length})</span>
          </button>
        ))}
      </div>

      {/* Entity list for active tab */}
      <div className="space-y-2">
        {(activeTab?.entities || []).length === 0 ? (
          <p className="text-xs text-[var(--text-muted)] italic">Keine Entitäten in diesem Tab.</p>
        ) : (
          (activeTab?.entities || []).map(({ entityId, name }) => (
            <div
              key={entityId}
              className="popup-surface flex items-center gap-2 rounded-xl px-3 py-2"
            >
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="truncate text-[10px] text-[var(--text-muted)]">{entityId}</span>
                <input
                  type="text"
                  defaultValue={name}
                  onBlur={(e) => updateEntityName(entityId, e.target.value)}
                  placeholder={entities[entityId]?.attributes?.friendly_name || entityId}
                  className="w-full bg-transparent text-xs font-semibold text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] placeholder:opacity-50"
                />
              </div>
              <button
                type="button"
                onClick={() => removeEntity(entityId)}
                className="flex-shrink-0 rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-red-500/10 hover:text-red-400"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Add entity */}
      <SearchableSelect
        label={`Entität zu ${activeTab?.title || ''} hinzufügen`}
        value={null}
        options={addOptions}
        onChange={(id) => { if (id) addEntity(id); }}
        placeholder="Entität auswählen..."
        entities={entities}
        t={t || ((k) => k)}
      />
    </div>
  );
}
