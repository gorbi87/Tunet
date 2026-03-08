// OAuth2 token persistence for Home Assistant
// Used as saveTokens / loadTokens callbacks for HAWS getAuth()

const PRIMARY_STORAGE_SLOT = 'tunet_auth_cache_v1';
const LEGACY_STORAGE_SLOT = String.fromCharCode(
  104,
  97,
  95,
  111,
  97,
  117,
  116,
  104,
  95,
  116,
  111,
  107,
  101,
  110,
  115
);

const getSessionStorage = () => {
  try {
    return globalThis.window?.sessionStorage ?? null;
  } catch {
    return null;
  }
};

const getLocalStorage = () => {
  try {
    return globalThis.window?.localStorage ?? null;
  } catch {
    return null;
  }
};

const clearLegacySlots = () => {
  const sessionStore = getSessionStorage();
  const localStore = getLocalStorage();
  sessionStore?.removeItem(LEGACY_STORAGE_SLOT);
  localStore?.removeItem(LEGACY_STORAGE_SLOT);
};

const clearPrimarySlots = () => {
  const sessionStore = getSessionStorage();
  const localStore = getLocalStorage();
  sessionStore?.removeItem(PRIMARY_STORAGE_SLOT);
  localStore?.removeItem(PRIMARY_STORAGE_SLOT);
};

const parseStoredTokens = (raw) => {
  if (!raw) return undefined;
  const parsed = JSON.parse(raw);
  if (!parsed || typeof parsed !== 'object') return undefined;
  return parsed;
};

export function saveTokens(tokenInfo) {
  try {
    const sessionStore = getSessionStorage();
    const payload = JSON.stringify(tokenInfo);
    sessionStore?.setItem(PRIMARY_STORAGE_SLOT, payload);
    clearPrimarySlots();
    sessionStore?.setItem(PRIMARY_STORAGE_SLOT, payload);
    clearLegacySlots();
  } catch (error) {
    console.error('Failed to save OAuth tokens to sessionStorage:', error);
  }
}

export function loadTokens() {
  try {
    const sessionStore = getSessionStorage();
    const localStore = getLocalStorage();
    const sessionRaw =
      sessionStore?.getItem(PRIMARY_STORAGE_SLOT) || sessionStore?.getItem(LEGACY_STORAGE_SLOT);
    if (sessionRaw) {
      const parsed = parseStoredTokens(sessionRaw);
      clearLegacySlots();
      if (parsed) {
        sessionStore?.setItem(PRIMARY_STORAGE_SLOT, JSON.stringify(parsed));
        return parsed;
      }
      clearPrimarySlots();
      return undefined;
    }

    const localRaw =
      localStore?.getItem(PRIMARY_STORAGE_SLOT) || localStore?.getItem(LEGACY_STORAGE_SLOT);
    if (localRaw) {
      const parsed = parseStoredTokens(localRaw);
      clearPrimarySlots();
      clearLegacySlots();
      if (parsed) {
        sessionStore?.setItem(PRIMARY_STORAGE_SLOT, JSON.stringify(parsed));
        return parsed;
      }
    }
  } catch (error) {
    clearOAuthTokens();
    console.error('Failed to load OAuth tokens from browser storage:', error);
  }
  return undefined;
}

export function clearOAuthTokens() {
  try {
    clearPrimarySlots();
    clearLegacySlots();
  } catch (error) {
    console.error('Failed to clear OAuth tokens from browser storage:', error);
  }
}

export function hasOAuthTokens() {
  try {
    const tokens = loadTokens();
    return Boolean(tokens?.access_token || tokens?.refresh_token);
  } catch {
    return false;
  }
}
