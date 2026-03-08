import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearOAuthTokens,
  hasOAuthTokens,
  loadTokens,
  saveTokens,
} from '../services/oauthStorage';

describe('oauthStorage', () => {
  let consoleErrorSpy;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy?.mockRestore();
  });

  it('stores OAuth tokens in session storage only', () => {
    saveTokens({ access_token: 'access-1', refresh_token: 'refresh-1' });

    expect(sessionStorage.getItem('tunet_auth_cache_v1')).toBe(
      JSON.stringify({ access_token: 'access-1', refresh_token: 'refresh-1' })
    );
    expect(localStorage.getItem('tunet_auth_cache_v1')).toBeNull();
  });

  it('migrates legacy local storage OAuth tokens into session storage', () => {
    localStorage.setItem(
      'tunet_auth_cache_v1',
      JSON.stringify({ access_token: 'access-2', refresh_token: 'refresh-2' })
    );

    expect(loadTokens()).toEqual({ access_token: 'access-2', refresh_token: 'refresh-2' });
    expect(sessionStorage.getItem('tunet_auth_cache_v1')).toBe(
      JSON.stringify({ access_token: 'access-2', refresh_token: 'refresh-2' })
    );
    expect(localStorage.getItem('tunet_auth_cache_v1')).toBeNull();
  });

  it('clears malformed OAuth token payloads instead of keeping them around', () => {
    sessionStorage.setItem('tunet_auth_cache_v1', '{bad json');

    expect(loadTokens()).toBeUndefined();
    expect(sessionStorage.getItem('tunet_auth_cache_v1')).toBeNull();
    expect(localStorage.getItem('tunet_auth_cache_v1')).toBeNull();
  });

  it('reports OAuth availability from session-backed tokens', () => {
    sessionStorage.setItem('tunet_auth_cache_v1', JSON.stringify({ access_token: 'access-3' }));

    expect(hasOAuthTokens()).toBe(true);
  });

  it('removes OAuth tokens from all browser storage slots', () => {
    sessionStorage.setItem('tunet_auth_cache_v1', JSON.stringify({ access_token: 'access-4' }));
    localStorage.setItem('ha_oauth_tokens', JSON.stringify({ access_token: 'legacy' }));

    clearOAuthTokens();

    expect(sessionStorage.getItem('tunet_auth_cache_v1')).toBeNull();
    expect(localStorage.getItem('tunet_auth_cache_v1')).toBeNull();
    expect(localStorage.getItem('ha_oauth_tokens')).toBeNull();
  });
});