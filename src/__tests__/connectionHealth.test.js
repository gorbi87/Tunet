import { describe, it, expect } from 'vitest';
import {
  isEntityDataStale,
  ENTITY_STALE_DISCONNECT_GRACE_MS,
  ENTITY_STALE_NO_UPDATE_MS,
  CONNECTION_WARNING_DELAY_MS,
  MOBILE_CONNECTION_WARNING_DELAY_MS,
  getConnectionWarningDelayMs,
} from '../utils/connectionHealth';

describe('connectionHealth › warning delay', () => {
  it('gives mobile app launches more time to reconnect silently', () => {
    expect(getConnectionWarningDelayMs(390)).toBe(MOBILE_CONNECTION_WARNING_DELAY_MS);
    expect(MOBILE_CONNECTION_WARNING_DELAY_MS).toBeGreaterThan(CONNECTION_WARNING_DELAY_MS);
  });

  it('keeps the existing warning delay outside the mobile breakpoint', () => {
    expect(getConnectionWarningDelayMs(480)).toBe(CONNECTION_WARNING_DELAY_MS);
    expect(getConnectionWarningDelayMs(1440)).toBe(CONNECTION_WARNING_DELAY_MS);
  });
});

describe('connectionHealth › isEntityDataStale', () => {
  it('returns false when entities are not loaded', () => {
    expect(
      isEntityDataStale({
        entitiesLoaded: false,
        connected: false,
        disconnectedSince: Date.now() - (ENTITY_STALE_DISCONNECT_GRACE_MS + 1_000),
        lastEntityUpdateAt: 0,
        now: Date.now(),
      })
    ).toBe(false);
  });

  it('returns false while disconnected within grace period', () => {
    const now = Date.now();
    expect(
      isEntityDataStale({
        entitiesLoaded: true,
        connected: false,
        disconnectedSince: now - (ENTITY_STALE_DISCONNECT_GRACE_MS - 1_000),
        lastEntityUpdateAt: now - 5_000,
        now,
      })
    ).toBe(false);
  });

  it('returns true while disconnected after grace period', () => {
    const now = Date.now();
    expect(
      isEntityDataStale({
        entitiesLoaded: true,
        connected: false,
        disconnectedSince: now - (ENTITY_STALE_DISCONNECT_GRACE_MS + 1_000),
        lastEntityUpdateAt: now - 5_000,
        now,
      })
    ).toBe(true);
  });

  it('returns false when connected and entity updates are recent', () => {
    const now = Date.now();
    expect(
      isEntityDataStale({
        entitiesLoaded: true,
        connected: true,
        disconnectedSince: null,
        lastEntityUpdateAt: now - (ENTITY_STALE_NO_UPDATE_MS - 1_000),
        now,
      })
    ).toBe(false);
  });

  it('returns true when connected but no entity updates for stale window', () => {
    const now = Date.now();
    expect(
      isEntityDataStale({
        entitiesLoaded: true,
        connected: true,
        disconnectedSince: null,
        lastEntityUpdateAt: now - (ENTITY_STALE_NO_UPDATE_MS + 1_000),
        now,
      })
    ).toBe(true);
  });

  it('returns false when connected and no entity update timestamp exists yet', () => {
    expect(
      isEntityDataStale({
        entitiesLoaded: true,
        connected: true,
        disconnectedSince: null,
        lastEntityUpdateAt: 0,
        now: Date.now(),
      })
    ).toBe(false);
  });
});
