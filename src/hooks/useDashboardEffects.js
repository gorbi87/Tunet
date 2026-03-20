import { useState, useEffect, useRef } from 'react';
import {
  ENTITY_UPDATE_INTERVAL,
  MEDIA_TICK_INTERVAL,
  INITIAL_FETCH_DELAY,
} from '../config/constants';

/** @typedef {import('../types/dashboard').UseDashboardEffectsDeps} UseDashboardEffectsDeps */
/** @typedef {import('../types/dashboard').UseDashboardEffectsResult} UseDashboardEffectsResult */

/**
 * Miscellaneous App-level side-effects that don't belong in a specific domain:
 *   – `now` clock tick
 *   – media-tick timer
 *   – optimistic-light-brightness clear
 *   – haptic-feedback listener
 *   – document-title / favicon / viewport meta
 *   – inactivity/idle auto-reset timer
 */
export function useDashboardEffects({
  resolvedHeaderTitle,
  inactivityTimeout,
  resetToHome,
  activeMediaModal,
  entities,
}) {
  const [now, setNow] = useState(new Date());
  const [mediaTick, setMediaTick] = useState(0);
  const [optimisticLightBrightness, setOptimisticLightBrightness] = useState({});

  // ── Stable ref so the inactivity timer always calls the latest resetToHome
  const resetToHomeRef = useRef(resetToHome);
  useEffect(() => {
    resetToHomeRef.current = resetToHome;
  });

  // ── Clock tick ─────────────────────────────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), ENTITY_UPDATE_INTERVAL);
    return () => clearInterval(id);
  }, []);

  // ── Media tick (only while a media modal is open) ──────────────────────
  useEffect(() => {
    if (!activeMediaModal) return;
    setMediaTick(Date.now());
    const id = setInterval(() => setMediaTick(Date.now()), MEDIA_TICK_INTERVAL);
    return () => clearInterval(id);
  }, [activeMediaModal]);

  // ── Clear optimistic brightness when real entity state arrives ─────────
  useEffect(() => {
    const id = setTimeout(() => setOptimisticLightBrightness({}), INITIAL_FETCH_DELAY);
    return () => clearTimeout(id);
  }, [entities]);

  // ── Haptic feedback on touch ───────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (e.pointerType !== 'touch' && e.pointerType !== 'pen') return;
      if (!e.target?.closest?.('[data-haptic]')) return;
      // Check for user activation (Chrome requires user interaction before vibrating)
      if (
        typeof navigator.userActivation !== 'undefined' &&
        !navigator.userActivation.hasBeenActive
      ) {
        return;
      }

      try {
        if (navigator.vibrate) navigator.vibrate(8);
      } catch (_err) {
        // Ignore vibration errors
      }
    };
    document.addEventListener('pointerdown', handler);
    return () => document.removeEventListener('pointerdown', handler);
  }, []);

  // ── Touch-to-click: fire click immediately on touchend for card elements ──
  // iOS Safari delays or misses click events on <div> after CSS transforms.
  // We fire click synchronously on touchend and block the ghost click.
  useEffect(() => {
    let touchMoved = false;
    let touchStartX = 0;
    let touchStartY = 0;

    const onTouchStart = (e) => {
      touchMoved = false;
      const t = e.touches[0];
      if (t) { touchStartX = t.clientX; touchStartY = t.clientY; }
    };
    const onTouchMove = (e) => {
      const t = e.touches[0];
      if (!t) return;
      const dx = Math.abs(t.clientX - touchStartX);
      const dy = Math.abs(t.clientY - touchStartY);
      if (dx > 8 || dy > 8) touchMoved = true;
    };
    const onTouchEnd = (e) => {
      if (touchMoved) return;
      const target = e.target?.closest?.('[data-haptic]');
      if (!target) return;
      e.preventDefault(); // block iOS ghost click (300 ms delayed synthetic click)
      target.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    };

    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchmove', onTouchMove, { passive: true });
    document.addEventListener('touchend', onTouchEnd, { passive: false });
    return () => {
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
    };
  }, []);

  // ── Document title, favicon & viewport meta ────────────────────────────
  useEffect(() => {
    document.title = resolvedHeaderTitle;

    /** @type {HTMLLinkElement | null} */
    let link = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.type = 'image/svg+xml';
    link.href =
      "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🏠</text></svg>";

    /** @type {HTMLMetaElement | null} */
    let meta = document.querySelector("meta[name='viewport']");
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'viewport';
      document.head.appendChild(meta);
    }
    meta.content = 'width=device-width, initial-scale=1.0';
  }, [resolvedHeaderTitle]);

  // ── Inactivity / idle timer ────────────────────────────────────────────
  useEffect(() => {
    let timer;
    const reset = () => {
      clearTimeout(timer);
      if (!inactivityTimeout || inactivityTimeout <= 0) return;
      timer = setTimeout(() => {
        if (resetToHomeRef.current) resetToHomeRef.current();
      }, inactivityTimeout * 1000);
    };
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach((e) => document.addEventListener(e, reset));
    reset();
    return () => {
      clearTimeout(timer);
      events.forEach((e) => document.removeEventListener(e, reset));
    };
  }, [inactivityTimeout]);

  return /** @type {UseDashboardEffectsResult} */ ({
    now,
    mediaTick,
    optimisticLightBrightness,
    setOptimisticLightBrightness,
  });
}
