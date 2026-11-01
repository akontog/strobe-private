const APP_SLUG_BY_WORKSHOP = {
  equations: 'equations-lab',
  factorization: 'factorization-lab',
  identities: 'identities-lab',
  'linear-systems': 'linear-systems-lab',
  polynomial: 'polynomial-lab',
  probabilities: 'probabilities-lab'
};

const activityFiles = Object.entries(import.meta.glob('./*/data/activities/*.json', {
  eager: true,
  import: 'default'
}));

export const WORKSHOP_ACTIVITY_DOCUMENTS = activityFiles.map(([path, rawDocument], index) => {
  const parts = path.split('/');
  const workshopId = parts[1];
  const filename = parts[parts.length - 1];
  const appSlug = APP_SLUG_BY_WORKSHOP[workshopId];
  const document = { ...rawDocument, sourceWorkshop: workshopId };

  return {
    key: `${workshopId}/${filename}`,
    workshopId,
    appSlug,
    filename,
    name: document.activity?.title || filename,
    document,
    index
  };
}).filter((activity) => activity.appSlug);

export function getWorkshopAppSlug(activityDocument) {
  const directSource = String(activityDocument?.resource || '');
  if (Object.values(APP_SLUG_BY_WORKSHOP).includes(directSource)) return directSource;
  if (APP_SLUG_BY_WORKSHOP[directSource]) return APP_SLUG_BY_WORKSHOP[directSource];
  if (APP_SLUG_BY_WORKSHOP[activityDocument?.sourceWorkshop]) {
    return APP_SLUG_BY_WORKSHOP[activityDocument.sourceWorkshop];
  }

  const resources = Array.isArray(activityDocument?.resources) ? activityDocument.resources : [];
  const resourceIds = resources.map((resource) => String(resource.id || '')).join(' ');
  const resourceTypes = new Set(resources.map((resource) => String(resource.type || '')));

  if (/linear-systems-/i.test(resourceIds)) return APP_SLUG_BY_WORKSHOP['linear-systems'];
  if (/dataset-(monomial|polynomial)|activity-content-[12]\.|activity-data-2\./i.test(resourceIds)) return APP_SLUG_BY_WORKSHOP.polynomial;
  if (resourceTypes.has('identity-expression') || resourceTypes.has('identity-polynomial')) return APP_SLUG_BY_WORKSHOP.identities;
  if (resourceTypes.has('equation-answer')) return APP_SLUG_BY_WORKSHOP.equations;
  if (resourceTypes.has('activity-content')) {
    const content = resources.find((resource) => resource.type === 'activity-content');
    const data = content?.config?.data || content?.data || {};
    if (data.diagram || data.correctPlacementByItem) return APP_SLUG_BY_WORKSHOP.probabilities;
  }
  if (resourceTypes.has('algebra-tiles') && resources.some((resource) => resource.type === 'activity-data')) {
    return APP_SLUG_BY_WORKSHOP.factorization;
  }

  return '';
}
