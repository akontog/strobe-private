const WORKSHOP_SLUG_BY_APP_SLUG = {
  'polynomial-lab': 'polynomials',
  'linear-systems-lab': 'linear-systems'
};

const APP_SLUG_BY_WORKSHOP_SLUG = Object.fromEntries(
  Object.entries(WORKSHOP_SLUG_BY_APP_SLUG).map(([appSlug, workshopSlug]) => [workshopSlug, appSlug])
);

export function getWorkshopSlug(appSlug) {
  return WORKSHOP_SLUG_BY_APP_SLUG[appSlug] || appSlug;
}

export function getAppSlug(workshopSlug) {
  return APP_SLUG_BY_WORKSHOP_SLUG[workshopSlug] || workshopSlug;
}

export function getWorkshopPath(appSlug, role) {
  return `/workshops/${getWorkshopSlug(appSlug)}/${role}`;
}
