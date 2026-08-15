import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import WeatherTempCard from '../components/cards/WeatherTempCard';

vi.mock('../contexts', () => ({
  useConfig: () => ({ unitsMode: 'follow_ha' }),
  useHomeAssistantMeta: () => ({
    haConfig: { unit_system: { temperature: '°C' } },
  }),
}));

vi.mock('../components/charts/WeatherGraph', () => ({
  default: () => <div data-testid="weather-graph" />,
}));

vi.mock('../components/effects/WeatherEffects', () => ({
  default: () => null,
}));

describe('WeatherTempCard', () => {
  it('pins the large weather icon farther into the mobile top-left corner', () => {
    render(
      <WeatherTempCard
        cardId="weather.home"
        dragProps={{}}
        getControls={() => null}
        cardStyle={{}}
        settingsKey="weather_home"
        cardSettings={{ weather_home: { weatherId: 'weather.home' } }}
        entities={{
          'weather.home': {
            state: 'sunny',
            attributes: { temperature: 12, temperature_unit: '°C' },
          },
        }}
        tempHistory={[]}
        tempHistoryById={{}}
        forecastsById={{}}
        outsideTempId={null}
        weatherEntityId="weather.home"
        editMode={false}
        onOpen={vi.fn()}
        t={(key) => (key === 'weather.condition.sunny' ? 'Sol' : key)}
      />
    );

    expect(screen.getByAltText('Sol').parentElement).toHaveClass(
      '-mt-5',
      '-ml-5',
      'sm:-mt-2',
      'sm:-ml-2'
    );
  });
});
