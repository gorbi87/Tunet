import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import GenericClimateCard from '../components/cards/GenericClimateCard';

vi.mock('../contexts', () => ({
  useConfig: () => ({ unitsMode: 'follow_ha' }),
  useHomeAssistantMeta: () => ({
    haConfig: {
      unit_system: {
        temperature: '°C',
      },
    },
  }),
}));

const baseProps = (entityOverrides = {}) => ({
  cardId: 'climate_card_1',
  entityId: 'climate.living_room',
  entity: {
    state: 'cool',
    attributes: {
      friendly_name: 'Living Room AC',
      temperature: 22,
      current_temperature: 24,
      hvac_action: 'cooling',
      fan_mode: 'auto',
      fan_modes: ['auto', 'low', 'medium', 'high'],
      ...entityOverrides,
    },
  },
  dragProps: {},
  controls: null,
  cardStyle: {},
  editMode: false,
  customNames: {},
  customIcons: {},
  onOpen: vi.fn(),
  onSetTemperature: vi.fn(),
  settings: { size: 'large' },
  t: (key) => key,
});

describe('GenericClimateCard', () => {
  it('shows AUTO text when fan mode is auto', () => {
    render(<GenericClimateCard {...baseProps({ fan_mode: 'auto' })} />);

    expect(screen.getByText('climate.fanAuto')).toBeInTheDocument();
  });

  it('does not show AUTO text for lowercase non-auto fan mode', () => {
    render(<GenericClimateCard {...baseProps({ fan_mode: 'medium' })} />);

    expect(screen.queryByText('climate.fanAuto')).not.toBeInTheDocument();
  });

  it('does not show AUTO text for dashed fan mode variants', () => {
    render(
      <GenericClimateCard
        {...baseProps({
          fan_mode: 'high-mid',
          fan_modes: ['auto', 'low', 'mid', 'high-mid', 'high'],
        })}
      />
    );

    expect(screen.queryByText('climate.fanAuto')).not.toBeInTheDocument();
  });

  it('hides the fan block on mobile large cards', () => {
    render(<GenericClimateCard {...baseProps({ fan_mode: 'auto' })} isMobile />);

    expect(screen.queryByText('climate.fanAuto')).not.toBeInTheDocument();
  });
});
