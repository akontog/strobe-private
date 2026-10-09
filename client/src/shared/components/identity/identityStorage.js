const NAME_KEY = 'strobeStudentConnectName';
const COLOR_KEY = 'strobeStudentColor';
const IDENTITY_EVENT = 'strobe:identity-change';

function safeStorage() {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null;
  }
  return window.localStorage;
}

function emitIdentityChange(detail) {
  if (typeof window === 'undefined' || typeof window.dispatchEvent !== 'function') {
    return;
  }

  window.dispatchEvent(new CustomEvent(IDENTITY_EVENT, { detail }));
}

export function randomIdentityColor() {
  const palette = ['#4ECDC4', '#3B82F6', '#A855F7', '#F97316', '#22C55E', '#EF4444', '#14B8A6', '#EAB308'];
  return palette[Math.floor(Math.random() * palette.length)];
}

export function readIdentitySnapshot({ nameFallback = '', colorFallback = '#4ECDC4' } = {}) {
  return {
    name: readIdentityName(nameFallback),
    color: readIdentityColor(colorFallback)
  };
}

export function readIdentityName(fallback = '') {
  const storage = safeStorage();
  if (!storage) {
    return fallback;
  }

  const value = String(storage.getItem(NAME_KEY) || '').trim();
  return value || fallback;
}

export function writeIdentityName(value) {
  const storage = safeStorage();
  if (!storage) {
    return;
  }

  const normalized = String(value || '').trim();
  if (!normalized) {
    storage.removeItem(NAME_KEY);
    emitIdentityChange({ name: '' });
    return;
  }

  storage.setItem(NAME_KEY, normalized);
  emitIdentityChange({ name: normalized });
}

export function readIdentityColor(fallback = '#4ECDC4') {
  const storage = safeStorage();
  if (!storage) {
    return fallback;
  }

  const value = String(storage.getItem(COLOR_KEY) || '').trim();
  return value || fallback;
}

export function writeIdentityColor(value) {
  const storage = safeStorage();
  if (!storage) {
    return;
  }

  const normalized = String(value || '').trim();
  if (!normalized) {
    storage.removeItem(COLOR_KEY);
    emitIdentityChange({ color: '' });
    return;
  }

  storage.setItem(COLOR_KEY, normalized);
  emitIdentityChange({ color: normalized });
}
