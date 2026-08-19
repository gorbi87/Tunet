import { ChevronDown, LayoutGrid, Palette, RefreshCw, Type } from '../../icons';

const NAV_ITEMS = [
  { key: 'appearance', icon: Palette, labelKey: 'system.tabAppearance' },
  { key: 'layout', icon: LayoutGrid, labelKey: 'system.tabLayout' },
  { key: 'header', icon: Type, labelKey: 'system.tabHeader' },
];

/** @param {any} props */
export function SidebarNavigation({
  active,
  onSwitchToTheme,
  onSwitchToLayout,
  onSwitchToHeader,
  t,
}) {
  const actions = {
    appearance: onSwitchToTheme,
    layout: onSwitchToLayout,
    header: onSwitchToHeader,
  };

  return (
    <nav className="sidebar-navigation" aria-label={t('settings.appearance')}>
      <div className="sidebar-navigation__items" role="tablist">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const selected = active === item.key;
          return (
            <button
              key={item.key}
              type="button"
              role="tab"
              aria-selected={selected}
              data-testid={`sidebar-nav-${item.key}`}
              className={`sidebar-navigation__item ${selected ? 'is-active' : ''}`}
              onClick={selected ? undefined : actions[item.key]}
            >
              <Icon aria-hidden="true" />
              <span>{t(item.labelKey)}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

/** @param {any} props */
export function SidebarAccordion({ id, icon: Icon, title, children, isOpen, toggle }) {
  const contentId = `sidebar-section-${id}`;
  return (
    <section className={`sidebar-accordion ${isOpen ? 'is-open' : ''}`}>
      <button
        type="button"
        className="sidebar-accordion__trigger"
        aria-expanded={isOpen}
        aria-controls={contentId}
        onClick={() => toggle(id)}
      >
        <Icon aria-hidden="true" />
        <span>{title}</span>
        <ChevronDown className="sidebar-accordion__chevron" aria-hidden="true" />
      </button>
      <div
        id={contentId}
        className="sidebar-accordion__region"
        aria-hidden={!isOpen}
        style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden">
          {isOpen ? <div className="sidebar-accordion__content">{children}</div> : null}
        </div>
      </div>
    </section>
  );
}

/** @param {any} props */
export function SidebarSegmentedControl({ options, value, onChange }) {
  return (
    <div className="sidebar-segmented">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          className={value === option.value ? 'is-active' : ''}
          onClick={() => onChange(option.value)}
        >
          {option.label || option.key}
        </button>
      ))}
    </div>
  );
}

/** @param {any} props */
export function SidebarToggle({ label, value, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      className="sidebar-toggle"
      onClick={() => onChange(!value)}
    >
      <span>{label}</span>
      <span className={`sidebar-toggle__track ${value ? 'is-active' : ''}`} aria-hidden="true">
        <span className="sidebar-toggle__thumb" />
      </span>
    </button>
  );
}

/** @param {any} props */
export function SidebarResetButton({ onClick, title = 'Reset' }) {
  return (
    <button type="button" onClick={onClick} className="sidebar-reset" title={title}>
      <RefreshCw aria-hidden="true" />
    </button>
  );
}

/** @param {any} props */
export function SidebarGroupHeader({ title, action, onAction }) {
  return (
    <div className="sidebar-group-header">
      <h3>{title}</h3>
      {action ? (
        <button type="button" onClick={onAction}>
          {action}
        </button>
      ) : null}
    </div>
  );
}
