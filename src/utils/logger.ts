/**
 * Simple logger utility for the web app
 */

const isDevelopment = import.meta.env.DEV;

export const logger = {
  log: (...args: any[]) => {
    if (isDevelopment) {
      console.log('[Nuvio]', ...args);
    }
  },

  info: (...args: any[]) => {
    if (isDevelopment) {
      console.info('[Nuvio]', ...args);
    }
  },

  warn: (...args: any[]) => {
    console.warn('[Nuvio]', ...args);
  },

  error: (...args: any[]) => {
    console.error('[Nuvio]', ...args);
  },

  debug: (...args: any[]) => {
    if (isDevelopment) {
      console.debug('[Nuvio]', ...args);
    }
  },
};

