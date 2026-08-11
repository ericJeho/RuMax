'use client';

import { useEffect } from 'react';

/**
 * Registers the service worker in production only.
 *
 * In development a stale worker serving cached pages is a reliable way to lose an hour to
 * a bug that does not exist, so registration is skipped and any previously installed
 * worker is unregistered.
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    if (process.env.NODE_ENV !== 'production') {
      navigator.serviceWorker
        .getRegistrations()
        .then((registrations) => registrations.forEach((registration) => registration.unregister()))
        .catch(() => undefined);
      return;
    }

    const register = () => {
      navigator.serviceWorker.register('/sw.js').catch((error) => {
        console.error('[pwa] service worker registration failed', error);
      });
    };

    // Registering after load keeps the worker off the critical path for first paint.
    if (document.readyState === 'complete') register();
    else window.addEventListener('load', register, { once: true });
  }, []);

  return null;
}
