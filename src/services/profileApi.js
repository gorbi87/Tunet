/**
 * Frontend API client for the Tunet backend.
 * All calls go to /api/* which Vite proxies to the backend in dev mode,
 * and Express serves directly in production.
 */

import { getHomeAssistantRequestHeaders } from './apiAuth';

const API_BASE = './api';

async function request(path, options = {}) {
  const mergedHeaders = options.headers
    ? {
        'Content-Type': 'application/json',
        ...options.headers,
      }
    : { 'Content-Type': 'application/json' };

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: mergedHeaders,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const error = new Error(body.error || `API error ${res.status}`);
    error.status = res.status;
    error.body = body;
    throw error;
  }

  return res.json();
}

const requestHeaders = () => getHomeAssistantRequestHeaders();

// ── Profiles ─────────────────────────────────────────────────────────

export function fetchProfiles(haUserId) {
  return request(`/profiles?ha_user_id=${encodeURIComponent(haUserId)}`, {
    headers: requestHeaders(),
  });
}

export function fetchProfile(id, _haUserId) {
  return request(`/profiles/${id}`, {
    headers: requestHeaders(),
  });
}

export function createProfile({ ha_user_id, name, device_label, data }) {
  return request('/profiles', {
    method: 'POST',
    headers: requestHeaders(),
    body: JSON.stringify({ ha_user_id, name, device_label, data }),
  });
}

export function updateProfile(id, { ha_user_id, name, device_label, data }) {
  return request(`/profiles/${id}`, {
    method: 'PUT',
    headers: requestHeaders(),
    body: JSON.stringify({ ha_user_id, name, device_label, data }),
  });
}

export function deleteProfile(id, _haUserId) {
  return request(`/profiles/${id}`, {
    method: 'DELETE',
    headers: requestHeaders(),
  });
}

// ── Templates ────────────────────────────────────────────────────────
