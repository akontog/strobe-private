const { getAppBySlug } = require('../apps/registry');

let activeLabSlug = '';
let activeLabUpdatedAt = 0;
const ACTIVE_LAB_TIMEOUT_MS = 15000;

function setActiveLab(slug) {
  const normalizedSlug = String(slug || '').trim().toLowerCase();
  if (!normalizedSlug) {
    activeLabSlug = '';
    activeLabUpdatedAt = 0;
    return activeLabSlug;
  }

  if (normalizedSlug === 'geogebra-collab') {
    activeLabSlug = normalizedSlug;
    activeLabUpdatedAt = Date.now();
    return activeLabSlug;
  }

  const app = getAppBySlug(normalizedSlug);
  if (!app || !app.roles.includes('client')) {
    return null;
  }

  activeLabSlug = app.slug;
  activeLabUpdatedAt = Date.now();
  return activeLabSlug;
}

function getActiveLab() {
  if (activeLabSlug && Date.now() - activeLabUpdatedAt > ACTIVE_LAB_TIMEOUT_MS) {
    activeLabSlug = '';
    activeLabUpdatedAt = 0;
  }
  return activeLabSlug;
}

module.exports = { getActiveLab, setActiveLab };
