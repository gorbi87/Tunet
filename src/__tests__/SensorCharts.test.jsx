import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import BinaryTimeline from '../components/charts/BinaryTimeline';
import { Bar, Donut, Gauge } from '../components/charts/SensorGauge';
import SensorHistoryGraph from '../components/charts/SensorHistoryGraph';
import SparkLine from '../components/charts/SparkLine';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('sensor chart geometry', () => {
  it('keeps sparkline points inside a shared horizontal safe inset', () => {
    const { container } = render(
      <SparkLine
        data={[{ value: 10 }, { value: 20 }, { value: 15 }]}
        currentIndex={2}
        height={60}
        ariaLabel="Temperature history"
      />
    );

    const wrapper = container.querySelector('[data-chart-safe-inset="12"]');
    const marker = container.querySelector('circle');

    expect(wrapper).not.toBeNull();
    expect(Number(marker.getAttribute('cx'))).toBeLessThanOrEqual(288);
    expect(screen.getByRole('img', { name: 'Temperature history' })).toBeInTheDocument();
  });

  it('keeps range visuals clean while retaining accessible labels', () => {
    const { container } = render(
      <>
        <Gauge value={48} min={0} max={100} ariaLabel="Humidity gauge" />
        <Bar
          value={48}
          min={0}
          max={100}
          height={2}
          ariaLabel="Humidity bar"
        />
        <Donut value={48} min={0} max={100} size={80} ariaLabel="Humidity donut" />
      </>
    );

    expect(screen.getByRole('img', { name: 'Humidity gauge' }).querySelectorAll('line')).toHaveLength(
      0
    );
    const bar = screen.getByRole('img', { name: 'Humidity bar' });
    expect(bar.style.height).toBe('6px');
    expect(bar.querySelectorAll(':scope > div')).toHaveLength(1);
    expect(container.querySelectorAll('svg text')).toHaveLength(0);
    expect(screen.getByRole('img', { name: 'Humidity donut' })).toBeInTheDocument();
  });
});

describe('SensorHistoryGraph', () => {
  it('uses stable gradient ids and adapts label density to the container', async () => {
    class ResizeObserverMock {
      constructor(callback) {
        this.callback = callback;
      }

      observe() {
        this.callback([{ contentRect: { width: 320 } }]);
      }

      disconnect() {}
    }
    vi.stubGlobal('ResizeObserver', ResizeObserverMock);
    const data = Array.from({ length: 60 }, (_, index) => ({
      value: index === 30 ? 100 : 20,
      time: new Date(2026, 0, 1, index, 0),
    }));
    const { container, rerender } = render(
      <SensorHistoryGraph data={data} height={220} ariaLabel="Pollen history" />
    );

    await waitFor(() => {
      expect(container.firstElementChild).toHaveAttribute('data-chart-label-count', '3');
    });
    const firstGradientId = container.querySelector('linearGradient').id;
    const linePath = [...container.querySelectorAll('path')].find(
      (path) => path.getAttribute('fill') === 'none'
    );
    expect(linePath.getAttribute('d')).not.toMatch(/,\s*-/);

    rerender(<SensorHistoryGraph data={data} height={220} ariaLabel="Pollen history" />);
    expect(container.querySelector('linearGradient').id).toBe(firstGradientId);

    expect(container.querySelector('circle')).toBeNull();
    expect(screen.queryByText(/^Min /)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Avg /)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Max /)).not.toBeInTheDocument();
  });
});

describe('BinaryTimeline', () => {
  it('keeps brief active events visible and exposes a textual summary', () => {
    const startTime = new Date('2026-07-25T10:00:00.000Z');
    const endTime = new Date('2026-07-25T11:00:00.000Z');
    render(
      <BinaryTimeline
        startTime={startTime}
        endTime={endTime}
        activeLabel="Aktiv"
        eventLabel="hendingar"
        events={[
          { state: 'off', time: startTime },
          { state: 'on', time: new Date('2026-07-25T10:10:00.000Z') },
          { state: 'off', time: new Date('2026-07-25T10:10:01.000Z') },
        ]}
      />
    );

    expect(screen.queryByText('Aktiv 0m')).not.toBeInTheDocument();
    expect(screen.queryByText('1 hendingar')).not.toBeInTheDocument();
    expect(screen.getByRole('img')).toHaveAccessibleName('Aktiv: 0m. hendingar: 1.');
    expect(screen.getByTitle(/^on:/)).toHaveStyle({ minWidth: '4px' });
  });
});
