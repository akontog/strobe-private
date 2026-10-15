export const RESOURCE_DEFAULTS = {
  'input-grid': {
    props: {
      columns: 2,
      className: '',
      customLayout: false,
      labelClassName: 'activity-input-grid__label',
      fields: [
        { id: 'field-1', label: 'Input 1', placeholder: '', type: 'text', correctAnswer: '' },
        { id: 'field-2', label: 'Input 2', placeholder: '', type: 'text', correctAnswer: '' }
      ]
    },
    labCard: { type: 'icon', icon: '🧩', expression: '' }
  },
  'grouping-drag-drop': {
    props: {
      items: [{ id: 'item-1', content: 'Item 1' }],
      groups: [
        { id: 'group-1', title: 'Group 1' },
        { id: 'group-2', title: 'Group 2' }
      ],
      placements: {},
      bankLabel: 'Items to group'
    },
    grading: { correctGroupByItem: { 'item-1': 'group-1' } },
    labCard: { type: 'icon', icon: '↔️', expression: '' }
  },
  'algebra-tiles': {
    props: { activity: '', tiles: [] },
    labCard: { type: 'icon', icon: '🔢', expression: '' }
  },
  'collaborative-geogebra': {
    props: {
      roomId: 'activity-room',
      className: '',
      showStatus: true,
      showLegend: true,
      showToolBar: true,
      showAlgebraView: true,
      showAlgebraInput: true,
      showMenuBar: false,
      showResetIcon: false,
      showZoomButtons: false,
      showFullscreenButton: false,
      showSuggestionButtons: false
    },
    labCard: { type: 'icon', icon: '📐', expression: '' }
  }
};
