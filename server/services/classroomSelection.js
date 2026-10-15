const { getAppBySlug } = require('../apps/registry');

let activeLabSlug = '';
let activeRoomId = '';
let activeLabUpdatedAt = 0;
const ACTIVE_LAB_TIMEOUT_MS = 15000;

function setActiveLab(slug, roomId = '') {
  const normalizedSlug = String(slug || '').trim().toLowerCase();
  if (!normalizedSlug) {
    activeLabSlug = '';
    activeRoomId = '';
    activeLabUpdatedAt = 0;
    return activeLabSlug;
  }

  if (normalizedSlug === 'geogebra-collab') {
    activeLabSlug = normalizedSlug;
    activeRoomId = String(roomId || 'geogebra-default').trim().slice(0, 80) || 'geogebra-default';
    activeLabUpdatedAt = Date.now();
    return activeLabSlug;
  }

  const app = getAppBySlug(normalizedSlug);
  if (!app || !app.roles.includes('client')) {
    return null;
  }

  activeLabSlug = app.slug;
  activeRoomId = '';
  activeLabUpdatedAt = Date.now();
  return activeLabSlug;
}

function getActiveLab() {
  if (activeLabSlug && Date.now() - activeLabUpdatedAt > ACTIVE_LAB_TIMEOUT_MS) {
    activeLabSlug = '';
    activeRoomId = '';
    activeLabUpdatedAt = 0;
  }
  return activeLabSlug;
}

function getActiveSelection() {
  const app = getActiveLab();
  return { app, roomId: app === 'geogebra-collab' ? activeRoomId || 'geogebra-default' : '' };
}

module.exports = { getActiveLab, getActiveSelection, setActiveLab };
