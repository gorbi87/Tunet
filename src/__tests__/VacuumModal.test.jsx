import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import VacuumModal from '../modals/VacuumModal';

vi.mock('../components/ui/AccessibleModalShell', () => ({
  default: ({ open, children }) => (open ? <div>{children()}</div> : null),
}));

const t = (key) =>
  ({
    'common.close': 'Close',
    'status.statusLabel': 'Status',
    'vacuum.reset': 'Reset',
    'vacuum.confirmResetShort': 'Sure?',
    'vacuum.sensors': 'Sensors',
    'vacuum.filter': 'Filter',
    'vacuum.mainBrush': 'Main Brush',
    'vacuum.start': 'Start',
    'vacuum.home': 'Home',
    'vacuum.charging': 'Charging',
    'vacuum.maintenance': 'Maintenance',
    'vacuum.controls': 'Controls',
    'vacuum.roomCleaning': 'Room cleaning',
    'vacuum.statsHistory': 'History',
  })[key] || key;

const vacuum = {
  'vacuum.roborock_s7': {
    entity_id: 'vacuum.roborock_s7',
    state: 'docked',
    attributes: { friendly_name: 'Roborock S7' },
  },
};

// Entity ids and units below match what the Home Assistant Roborock integration
// actually exposes: consumables are duration sensors, not percentages.
const sensorConsumable = {
  'sensor.roborock_s7_sensor_time_left': {
    entity_id: 'sensor.roborock_s7_sensor_time_left',
    state: '900',
    attributes: {
      friendly_name: 'Roborock S7 Sensor time left',
      unit_of_measurement: 'min',
      device_class: 'duration',
    },
  },
  'button.roborock_s7_reset_sensor_consumable': {
    entity_id: 'button.roborock_s7_reset_sensor_consumable',
    state: 'unknown',
    attributes: { friendly_name: 'Roborock S7 Reset sensor consumable' },
  },
};

const baseProps = (entities, overrides = {}) => ({
  show: true,
  onClose: vi.fn(),
  entities,
  callService: vi.fn(),
  getA: (entityId, attr, fallback) => {
    const value = entities[entityId]?.attributes?.[attr];
    return value == null ? fallback : value;
  },
  t,
  vacuumId: 'vacuum.roborock_s7',
  vacuumSettings: {},
  conn: null,
  getEntityImageUrl: vi.fn(),
  ...overrides,
});

const openMaintenance = () => fireEvent.click(screen.getByRole('button', { name: 'History' }));

describe('VacuumModal consumables', () => {
  it('presses the matched Home Assistant reset button for the sensors consumable', async () => {
    const callService = vi.fn();
    const entities = { ...vacuum, ...sensorConsumable };
    render(<VacuumModal {...baseProps(entities, { callService })} />);

    openMaintenance();
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
    fireEvent.click(screen.getByRole('button', { name: 'Sure?' }));

    await waitFor(() => {
      expect(callService).toHaveBeenCalledWith('button', 'press', {
        entity_id: 'button.roborock_s7_reset_sensor_consumable',
      });
    });
  });

  it('converts remaining duration to a percentage of the consumable lifetime', () => {
    const entities = {
      ...vacuum,
      ...sensorConsumable,
      'sensor.roborock_s7_filter_time_left': {
        entity_id: 'sensor.roborock_s7_filter_time_left',
        state: '105',
        attributes: {
          friendly_name: 'Roborock S7 Filter time left',
          unit_of_measurement: 'h',
          device_class: 'duration',
        },
      },
    };
    render(<VacuumModal {...baseProps(entities)} />);

    openMaintenance();

    // 900 min of a 30 h sensor life, and 105 h of a 150 h filter life.
    expect(screen.getByText('50%')).toBeInTheDocument();
    expect(screen.getByText('70%')).toBeInTheDocument();
    expect(screen.queryByText('900%')).not.toBeInTheDocument();
    expect(screen.queryByText('105%')).not.toBeInTheDocument();
  });

  it('uses a percentage sensor as-is when the integration already reports one', () => {
    const entities = {
      ...vacuum,
      'sensor.roborock_s7_main_brush_left': {
        entity_id: 'sensor.roborock_s7_main_brush_left',
        state: '42',
        attributes: {
          friendly_name: 'Roborock S7 Main brush left',
          unit_of_measurement: '%',
        },
      },
    };
    render(<VacuumModal {...baseProps(entities)} />);

    openMaintenance();

    expect(screen.getByText('42%')).toBeInTheDocument();
  });

  it('still offers the reset button when no matching sensor is exposed', () => {
    const entities = {
      ...vacuum,
      'button.roborock_s7_reset_sensor_consumable':
        sensorConsumable['button.roborock_s7_reset_sensor_consumable'],
    };
    render(<VacuumModal {...baseProps(entities)} />);

    openMaintenance();

    expect(screen.getByRole('button', { name: 'Reset' })).toBeEnabled();

    const row = screen.getByText('Sensors').closest('div').parentElement;
    expect(within(row).getByText('--')).toBeInTheDocument();
  });
});
