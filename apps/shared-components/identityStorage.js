export const IDENTITY_NAME_KEY = 'strobeStudentConnectName';
export const IDENTITY_COLOR_KEY = 'strobeStudentColor';

export const IDENTITY_COLORS = ['#22c55e', '#f97316', '#6366f1', '#e11d48', '#14b8a6', '#f59e0b', '#0ea5e9', '#8b5cf6'];

export const randomIdentityColor = () => IDENTITY_COLORS[Math.floor(Math.random() * IDENTITY_COLORS.length)];

export function readIdentityName(fallback) {
  try {
    return localStorage.getItem(IDENTITY_NAME_KEY) || fallback;
  } catch {
    return fallback;
  }
}

export function writeIdentityName(name) {
  try {
    localStorage.setItem(IDENTITY_NAME_KEY, name);
  } catch {
    // ignore storage failures
  }
}

export function readIdentityColor(fallback) {
  try {
    return localStorage.getItem(IDENTITY_COLOR_KEY) || fallback;
  } catch {
    return fallback;
  }
}

export function writeIdentityColor(color) {
  try {
    localStorage.setItem(IDENTITY_COLOR_KEY, color);
  } catch {
    // ignore storage failures
  }
}
