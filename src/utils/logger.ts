type LogArgs = unknown[];

type Logger = {
  debug: (...args: LogArgs) => void;
  info: (...args: LogArgs) => void;
  warn: (...args: LogArgs) => void;
  error: (...args: LogArgs) => void;
};

const importMetaEnv =
  typeof import.meta !== 'undefined'
    ? ((import.meta as ImportMeta & { env?: { DEV?: boolean } }).env ?? undefined)
    : undefined;

const isDev = Boolean(importMetaEnv?.DEV);

export const logger: Logger = {
  debug: (...args) => {
    if (isDev) console.warn('[DEBUG]', ...args);
  },
  info: (...args) => {
    if (isDev) console.warn('[INFO]', ...args);
  },
  warn: (...args) => {
    if (isDev) console.warn(...args);
  },
  error: (...args) => {
    console.error(...args);
  },
};
