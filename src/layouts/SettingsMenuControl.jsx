import SettingsDropdown from '../components/ui/SettingsDropdown';

export default function SettingsMenuControl({
  setShowConfigModal,
  setConfigTab,
  setShowThemeSidebar,
  setShowLayoutSidebar,
  setShowHeaderEditModal,
  onAddCard,
  onToggleEdit,
  editMode,
  updateCount,
  isMobile,
  floating = false,
  t,
}) {
  return (
    <div
      className={`flex flex-shrink-0 items-center justify-center ${
        floating ? 'fixed z-[80]' : `relative ${isMobile ? 'ml-auto' : ''}`
      }`}
      style={
        floating
          ? {
              right: 'max(1rem, env(safe-area-inset-right))',
              bottom: 'max(1rem, env(safe-area-inset-bottom))',
            }
          : undefined
      }
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
        onAddCard={onAddCard}
        onToggleEdit={isMobile ? onToggleEdit : undefined}
        editMode={editMode}
        isMobile={isMobile}
        floating={floating}
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
