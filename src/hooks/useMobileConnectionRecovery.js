import { useEffect, useRef } from 'react';
import { MOBILE_BREAKPOINT } from '../config/constants';

export const CONNECTION_PROBE_TIMEOUT_MS = 3000;

export function isMobileViewport() {
  return (
    typeof globalThis.window !== 'undefined' && globalThis.window.innerWidth < MOBILE_BREAKPOINT
  );
}

export async function probeAndRecoverConnection(
  conn,
  { timeoutMs = CONNECTION_PROBE_TIMEOUT_MS, onHealthy = () => {}, onRecovering = () => {} } = {}
) {
  if (!conn) return 'unavailable';

  if (conn.connected === false) {
    onRecovering();
    conn.reconnect?.(true);
    return 'reconnecting';
  }

  let timeoutId;
  try {
    await Promise.race([
      Promise.resolve().then(() => conn.ping()),
      new Promise((_, reject) => {
        timeoutId = globalThis.setTimeout(
          () => reject(new Error('Home Assistant connection probe timed out')),
          timeoutMs
        );
      }),
    ]);
    onHealthy();
    return 'healthy';
  } catch {
    onRecovering();
    conn.reconnect?.(true);
    return 'reconnecting';
  } finally {
    if (timeoutId) globalThis.clearTimeout(timeoutId);
  }
}

export function useMobileConnectionRecovery({ conn, onHealthy, onRecovering }) {
  const recoveryPromiseRef = useRef(null);

  useEffect(() => {
    if (
      !conn ||
      typeof globalThis.window === 'undefined' ||
      typeof globalThis.document === 'undefined'
    ) {
      return undefined;
    }

    const recoverIfNeeded = () => {
      if (
        !isMobileViewport() ||
        globalThis.document.visibilityState !== 'visible' ||
        recoveryPromiseRef.current
      ) {
        return;
      }

      const recoveryPromise = probeAndRecoverConnection(conn, {
        onHealthy,
        onRecovering,
      });
      recoveryPromiseRef.current = recoveryPromise;
      recoveryPromise.finally(() => {
        if (recoveryPromiseRef.current === recoveryPromise) {
          recoveryPromiseRef.current = null;
        }
      });
    };

    globalThis.document.addEventListener('visibilitychange', recoverIfNeeded);
    globalThis.window.addEventListener('pageshow', recoverIfNeeded);
    globalThis.window.addEventListener('online', recoverIfNeeded);

    return () => {
      globalThis.document.removeEventListener('visibilitychange', recoverIfNeeded);
      globalThis.window.removeEventListener('pageshow', recoverIfNeeded);
      globalThis.window.removeEventListener('online', recoverIfNeeded);
      recoveryPromiseRef.current = null;
    };
  }, [conn, onHealthy, onRecovering]);
}
