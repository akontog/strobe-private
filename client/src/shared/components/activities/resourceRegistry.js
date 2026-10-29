export const ACTIVITY_RESOURCE_TYPES = [
  'input-grid',
  'options-grid',
  'placement-board',
  'grouping-drag-drop',
  'venn-board',
  'number-line',
  'algebra-tiles',
  'collaborative-geogebra',
  'vision-board',
  'activity-content',
  'activity-data',
  'icon',
  'equation',
  'plot-widget',
  'equation-answer',
  'identity-expression',
  'identity-polynomial'
];

export function isActivityResourceType(type) {
  return ACTIVITY_RESOURCE_TYPES.includes(String(type || '').trim());
}
