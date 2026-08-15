import SettingsDropdown from '../components/ui/SettingsDropdown';

export default function SettingsMenuControl({
  setShowConfigModal,
  setConfigTab,
  setShowThemeSidebar,
  setShowLayoutSidebar,
  setShowHeaderEditModal,
  onToggleEdit,
  editMode,
  updateCount,
  isMobile,
  t,
}) {
  return (
    <div
      className={`relative flex flex-shrink-0 items-center justify-center ${isMobile ? 'ml-auto' : ''}`}
      data-testid="settings-menu-control"
    >
      <SettingsDropdown
        onOpenSettings={() => {
          setShowConfigModal(true);
          setConfigTab('connection');
        }}
        onOpenTheme={() => setShowThemeSidebar(true)}
        onOpenLayout={() => setShowLayoutSidebar(true)}
        onOpenHeader={() => setShowHeaderEditModal(true)}
        onToggleEdit={isMobile ? onToggleEdit : undefined}
        editMode={editMode}
        isMobile={isMobile}
        t={t}
      />
      {updateCount > 0 && (
        <div className="pointer-events-none absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-[var(--card-bg)] bg-gray-600 shadow-sm">
          <span className="pt-[1px] text-[11px] leading-none font-bold text-white">
            {updateCount}
          </span>
        </div>
      )}
    </div>
  );
}
