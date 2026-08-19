import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import GenericAndroidTVModal from '../modals/GenericAndroidTVModal';

vi.mock('../components/ui/AccessibleModalShell', () => ({
  default: ({ open, children, overlayClassName, panelClassName }) =>
    open ? (
      <div
        data-testid="tv-modal-shell"
        data-overlay-class={overlayClassName}
        data-panel-class={panelClassName}
      >
        {children()}
      </div>
    ) : null,
}));

const props = {
  show: true,
  onClose: vi.fn(),
  entities: {
    'media_player.living_room_tv': {
      entity_id: 'media_player.living_room_tv',
      state: 'playing',
      attributes: { friendly_name: 'Living room TV' },
    },
  },
  mediaPlayerId: 'media_player.living_room_tv',
  remoteId: 'remote.living_room_tv',
  linkedMediaPlayers: [],
  callService: vi.fn(),
  getA: vi.fn((_entityId, _attribute, fallback) => fallback),
  getEntityImageUrl: vi.fn(() => null),
  customNames: {},
  t: (key) =>
    ({
      'common.close': 'Close',
      'status.statusLabel': 'Status',
      'media.homeScreen': 'Home screen',
      'media.noneMedia': 'No media',
      'shield.back': 'Back',
      'shield.home': 'Home',
      'shield.turnOff': 'Turn off',
      'shield.turnOn': 'Turn on',
    })[key] || key,
};

describe('GenericAndroidTVModal mobile layout', () => {
  it('uses compact mobile sizing and keeps the previous sm and desktop dimensions', () => {
    render(<GenericAndroidTVModal {...props} />);

    const shell = screen.getByTestId('tv-modal-shell');
    expect(shell.dataset.overlayClass).toContain('p-2 sm:p-4 md:p-6');
    expect(shell.dataset.panelClass).toContain('max-h-[calc(100dvh-1rem)]');
    expect(shell.dataset.panelClass).toContain('p-4');
    expect(shell.dataset.panelClass).toContain('sm:max-h-[80vh] sm:p-6');
    expect(shell.dataset.panelClass).toContain('md:p-12');

    expect(screen.getByRole('button', { name: 'Up' })).toHaveClass(
      'h-11',
      'w-11',
      'sm:h-14',
      'sm:w-14'
    );
    expect(screen.getByRole('button', { name: 'Select' })).toHaveClass(
      'h-10',
      'w-10',
      'sm:h-12',
      'sm:w-12'
    );
  });
});
