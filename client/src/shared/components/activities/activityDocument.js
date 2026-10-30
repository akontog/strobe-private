const ACTIVITY_SCHEMA_VERSION = '1.0';

function getResourceType(resource) {
  const baseType = String(resource || '').replace(/-collab$/, '');
  if (baseType === 'venn') return 'venn-board';
  if (baseType === 'vision') return 'vision-board';
  return baseType;
}

/** Builds the shared activity document saved by resource workspaces. */
export function createActivityDocument({ resource, language, title, objective, notes, config, widgets = [] }) {
  const mainType = getResourceType(resource);
  const mainId = `${mainType}-main`;
  const widgetResources = widgets.map((widget, index) => ({
    id: widget.id || `${mainType}-widget-${index + 1}`,
    type: widget.type,
    region: widget.position,
    config: { settings: widget.settings || {} }
  }));
  const resources = [
    { id: mainId, type: mainType, region: 'center', config: { settings: config || {} } },
    ...widgetResources
  ];

  return {
    schemaVersion: ACTIVITY_SCHEMA_VERSION,
    documentType: 'activity',
    language: String(language || 'el').split('-')[0],
    resources,
    activity: {
      id: `${mainType}-activity`,
      code: '1.',
      title: String(title || ''),
      objective: String(objective || ''),
      notes: String(notes || ''),
      mode: mainType,
      usesResources: resources.map((entry) => entry.id)
    }
  };
}

/** Resolves a stored activity document to the runtime resource shape. */
export function resolveActivityDocument(document) {
  if (document?.documentType !== 'activity' || !document.activity) {
    return document;
  }

  const resourcesById = new Map((document.resources || []).map((resource) => [resource.id, resource]));
  const usedResources = (document.activity.usesResources || [])
    .map((id) => resourcesById.get(id))
    .filter(Boolean);
  const mainResource = usedResources.find((resource) => resource.region === 'center') || usedResources[0];
  if (!mainResource) return null;

  const widgets = usedResources
    .filter((resource) => resource !== mainResource && ['left', 'right'].includes(resource.region))
    .map((resource) => ({
      id: resource.id,
      type: resource.type,
      position: resource.region,
      settings: resource.config?.settings || {}
    }));

  return {
    ...document.activity,
    filename: document.filename,
    name: document.activity.title,
    subtitle: document.activity.objective || '',
    notes: document.activity.notes || '',
    resource: mainResource.type,
    config: {
      ...(mainResource.config?.settings || {}),
      resource: mainResource.type,
      widgets
    }
  };
}

/** Resolves a workshop document and its linked resources for existing renderers. */
export function resolveWorkshopDocument(document, standaloneDocuments = []) {
  if (document?.documentType !== 'workshop') return document;

  const standaloneByActivityId = new Map(standaloneDocuments
    .filter((entry) => entry?.documentType === 'activity' && entry.activity?.id)
    .map((entry) => [entry.activity.id, entry]));
  const standaloneResources = [];
  const catalogActivities = (document.activities || []).map((activity) => {
    const standalone = standaloneByActivityId.get(activity.id);
    if (!standalone) return activity;
    standaloneResources.push(...(standalone.resources || []));
    return {
      ...activity,
      ...standalone.activity,
      labels: standalone.activity.labels || activity.labels
    };
  });
  const allResources = [...(document.resources || []), ...standaloneResources];
  const resourcesById = new Map(allResources.map((resource) => [resource.id, resource]));
  const datasets = {};
  allResources.forEach((resource) => {
    if (resource.type === 'activity-data' && resource.id.startsWith('dataset-')) {
      datasets[resource.id.slice('dataset-'.length)] = {
        ...(resource.config?.data || {}),
        presentation: resource.config?.presentation || {}
      };
    }
  });

  const lessons = {};
  const activities = catalogActivities.map((activity) => {
    const usedResources = (activity.usesResources || [])
      .map((id) => resourcesById.get(id))
      .filter(Boolean);
    const contentResource = usedResources.find((resource) => resource.id === `activity-data-${activity.id}`);
    const centerResource = usedResources.find((resource) => resource.region === 'center');
    const data = contentResource?.config?.data || centerResource?.config?.data || {};
    if (centerResource?.config?.data) lessons[activity.id] = centerResource.config.data;

    const dataset = usedResources.find((resource) => resource.type === 'activity-data' && resource.id.startsWith('dataset-'));
    const widgets = usedResources
      .filter((resource) => ['left', 'center', 'right'].includes(resource.region)
        && resource.type !== 'activity-content'
        && resource.type !== 'activity-data')
      .map((resource) => ({
        id: resource.id,
        type: resource.type,
        region: resource.region,
        ...(resource.config?.settings || {}),
        settings: resource.config?.settings || {},
        presentation: resource.config?.presentation || {},
        ...(resource.config?.display || {})
      }));

    return {
      ...activity,
      ...data,
      datasetId: dataset ? dataset.id.slice('dataset-'.length) : activity.datasetId,
      resourceSettings: centerResource?.config?.settings || {},
      presentation: centerResource?.config?.presentation,
      widgets
    };
  });

  return {
    ...document,
    labels: document.workshop?.presentation?.labels || document.labels || activities[0]?.labels || {},
    datasets,
    lessons,
    activities
  };
}

