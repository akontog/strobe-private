const { getAppBySlug } = require('../apps/registry');

let activeLabSlug = '';
let activeRoomId = '';
let activeActivity = null;
let activeLabUpdatedAt = 0;
const ACTIVE_LAB_TIMEOUT_MS = 15000;

function setActiveLab(slug, roomId = '') {
  const normalizedSlug = String(slug || '').trim().toLowerCase();
  if (normalizedSlug !== activeLabSlug && normalizedSlug !== 'activity-runner') activeActivity = null;
  if (!normalizedSlug) {
    activeLabSlug = '';
    activeRoomId = '';
    activeActivity = null;
    activeLabUpdatedAt = 0;
    return activeLabSlug;
  }

  if (normalizedSlug === 'geogebra-collab' || normalizedSlug === 'algebra-tiles-collab' || normalizedSlug === 'number-line-collab' || normalizedSlug === 'cartesian-plane-collab' || normalizedSlug === 'options-grid-collab' || normalizedSlug === 'placement-board-collab' || normalizedSlug === 'input-grid-collab') {
    activeLabSlug = normalizedSlug;
    const fallbackRoom = {
      'geogebra-collab': 'geogebra-default',
      'algebra-tiles-collab': 'algebra-tiles-default',
      'number-line-collab': 'number-line-default',
      'cartesian-plane-collab': 'cartesian-plane-default',
      'options-grid-collab': 'options-grid-default',
      'placement-board-collab': 'placement-board-default',
      'input-grid-collab': 'input-grid-default'
    }[normalizedSlug];
    activeRoomId = String(roomId || fallbackRoom).trim().slice(0, 80) || fallbackRoom;
    activeLabUpdatedAt = Date.now();
    return activeLabSlug;
  }

  if (normalizedSlug === 'vision-collab') {
    activeLabSlug = normalizedSlug;
    activeRoomId = '';
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

function setActiveActivity(activity) {
  activeActivity = activity && typeof activity === 'object' ? activity : null;
  activeLabUpdatedAt = Date.now();
  return activeActivity;
}

function getActiveLab() {
  if (activeLabSlug && Date.now() - activeLabUpdatedAt > ACTIVE_LAB_TIMEOUT_MS) {
    activeLabSlug = '';
    activeRoomId = '';
    activeActivity = null;
    activeLabUpdatedAt = 0;
  }
  return activeLabSlug;
}

function getActiveSelection() {
  const app = getActiveLab();
  return {
    app,
    roomId: ['geogebra-collab', 'algebra-tiles-collab', 'number-line-collab', 'cartesian-plane-collab', 'options-grid-collab', 'placement-board-collab', 'input-grid-collab'].includes(app)
      ? activeRoomId || ({
        'geogebra-collab': 'geogebra-default',
        'algebra-tiles-collab': 'algebra-tiles-default',
        'number-line-collab': 'number-line-default',
        'cartesian-plane-collab': 'cartesian-plane-default',
        'options-grid-collab': 'options-grid-default',
        'placement-board-collab': 'placement-board-default',
        'input-grid-collab': 'input-grid-default'
      }[app])
      : '',
    activity: app === 'activity-runner' ? activeActivity : null
  };
}

module.exports = { getActiveLab, getActiveSelection, setActiveLab, setActiveActivity };
