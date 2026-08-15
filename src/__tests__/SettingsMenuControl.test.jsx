import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import SettingsMenuControl from '../layouts/SettingsMenuControl';

const makeProps = (overrides = {}) => ({
  setShowConfigModal: vi.fn(),
  setConfigTab: vi.fn(),
  setShowThemeSidebar: vi.fn(),
  setShowLayoutSidebar: vi.fn(),
  setShowHeaderEditModal: vi.fn(),
  onToggleEdit: vi.fn(),
  editMode: false,
  updateCount: 0,
  isMobile: true,
  t: (key) => key,
  ...overrides,
});

describe('SettingsMenuControl', () => {
  it('uses a 44px mobile trigger and keeps edit mode in the menu', () => {
    const props = makeProps();
    render(<SettingsMenuControl {...props} />);

    const trigger = screen.getByTestId('settings-dropdown-trigger');
    expect(trigger).toHaveClass('h-11', 'w-11');

    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole('button', { name: 'menu.edit' }));

    expect(props.onToggleEdit).toHaveBeenCalledOnce();
  });

  it('opens system settings and preserves the update badge', () => {
    const props = makeProps({ updateCount: 3 });
    render(<SettingsMenuControl {...props} />);

    expect(screen.getByText('3')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('settings-dropdown-trigger'));
    fireEvent.click(screen.getByTestId('settings-menu-system'));

    expect(props.setShowConfigModal).toHaveBeenCalledWith(true);
    expect(props.setConfigTab).toHaveBeenCalledWith('connection');
  });
});
