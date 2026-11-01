export const ACTIVITY_WIDGETS = [
  {
    type: 'icon',
    titleKey: 'activityBuilder.widgetNames.icon',
    defaults: { code: '' }
  },
  {
    type: 'equation',
    titleKey: 'activityBuilder.widgetNames.equation',
    defaults: { expression: '' }
  },
  {
    type: 'math-preview',
    titleKey: 'activityBuilder.widgetNames.mathPreview',
    defaults: { label: 'Απάντηση', formula: '' }
  },
  {
    type: 'plot-widget',
    titleKey: 'activityBuilder.widgetNames.graph',
    defaults: {
      title: '',
      xMin: -10,
      xMax: 10,
      yMin: -10,
      yMax: 10,
      showLegend: true,
      showGrid: true,
      graphItems: [{ id: 'graph-item-1', type: 'equation', expression: 'y=x' }]
    }
  }
];
