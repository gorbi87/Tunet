import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MediaGroupCard, MediaPlayerCard } from '../components/cards/MediaCards';

const entityId = 'media_player.kitchen';
const entity = {
  entity_id: entityId,
  state: 'playing',
  attributes: {
    friendly_name: 'Sonos kitchen',
    media_title: 'Flowers',
    media_artist: 'Miley Cyrus',
    entity_picture: '/artwork.jpg',
  },
};

const commonProps = {
  dragProps: {},
  controls: null,
  cardStyle: {},
  entities: { [entityId]: entity },
  editMode: false,
  customNames: {},
  customIcons: {},
  getA: (_id, attribute, fallback) => entity.attributes[attribute] ?? fallback,
  getEntityImageUrl: (value) => value,
  callService: vi.fn(),
  isMediaActive: () => true,
  onOpen: vi.fn(),
  isMobile: true,
  isFullWidthMobile: true,
  t: (key) => key,
};

const expectWideControls = (container) => {
  const buttons = container.querySelectorAll('button');
  expect(buttons[0]).toHaveClass('h-11', 'w-11');
  expect(buttons[0].querySelector('svg')).toHaveClass('h-6', 'w-6');
  expect(buttons[1]).toHaveClass('h-14', 'w-14');
  expect(buttons[1].querySelector('svg')).toHaveClass('h-6', 'w-6');
  expect(buttons[2]).toHaveClass('h-11', 'w-11');
};

describe('mobile media controls', () => {
  it('uses larger transport controls for a full-width media player card', () => {
    const settingsKey = 'home::media_player.kitchen';
    const { container } = render(
      <MediaPlayerCard
        {...commonProps}
        cardId={entityId}
        mpId={entityId}
        settingsKey={settingsKey}
        cardSettings={{ [settingsKey]: { artworkMode: 'cover' } }}
      />
    );

    expectWideControls(container);
  });

  it('uses the same larger controls for a full-width media group card', () => {
    const cardId = 'media_group_kitchen';
    const settingsKey = `home::${cardId}`;
    const { container } = render(
      <MediaGroupCard
        {...commonProps}
        cardId={cardId}
        settingsKey={settingsKey}
        cardSettings={{
          [settingsKey]: { mediaIds: [entityId], artworkMode: 'cover' },
        }}
        saveCardSetting={vi.fn()}
      />
    );

    expectWideControls(container);
  });
});
