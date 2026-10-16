export const RESOURCE_DEFAULTS = {
  'input-grid': {
    props: {
      rows: 1,
      columns: 2,
      fields: [
        { id: 'cell-r1-c1', row: 1, column: 1, label: 'Input 1', placeholder: '', type: 'text', correctAnswer: '' },
        { id: 'cell-r1-c2', row: 1, column: 2, label: 'Input 2', placeholder: '', type: 'text', correctAnswer: '' }
      ]
    },
    widgets: []
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
    widgets: []
  },
  'algebra-tiles': {
    props: { activity: '', tiles: [] },
    widgets: []
  },
  'collaborative-geogebra': {
    props: {
      roomId: 'activity-room',
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
    widgets: []
  }
};
