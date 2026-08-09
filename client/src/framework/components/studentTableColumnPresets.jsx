import React from 'react';

export const createNeuralLabColumns = ({ i1, i2, threshold = 5 }) => [
  {
    key: 'i1',
    label: 'i₁ (ρόδες)',
    render: () => <>{i1} <span className="icon-in-table">🛞</span></>
  },
  {
    key: 'w1',
    label: 'w₁',
    className: 'weight-value',
    style: { background: '#ef4444', color: 'white' },
    render: (student) => student.weights?.w1 ?? '-'
  },
  {
    key: 'i2',
    label: 'i₂ (μηχανές)',
    render: () => <>{i2} <span className="icon-in-table">⚙️</span></>
  },
  {
    key: 'w2',
    label: 'w₂',
    className: 'weight-value',
    style: { background: '#ef4444', color: 'white' },
    render: (student) => student.weights?.w2 ?? '-'
  },
  {
    key: 'result',
    label: 'Αποτέλεσμα o',
    className: 'result-visible',
    render: (student) => (
      <>
        {student.result ?? '-'}
        {typeof student.aboveThreshold === 'boolean' && (
          <span style={{ marginLeft: '0.45rem', fontWeight: 700, color: student.aboveThreshold ? '#059669' : '#dc2626' }}>
            {student.aboveThreshold ? `>= ${threshold}` : `< ${threshold}`}
          </span>
        )}
      </>
    )
  }
];

export const createBuffonColumns = () => [
  {
    key: 'team',
    label: 'Ομάδα',
    render: (student) => student.team || student.name || '-'
  },
  {
    key: 'drops',
    label: 'Ρίψεις',
    render: (student) => Number.isFinite(Number(student.drops)) ? Number(student.drops) : 0
  },
  {
    key: 'hits',
    label: 'Επιτυχίες',
    render: (student) => Number.isFinite(Number(student.hits)) ? Number(student.hits) : 0
  },
  {
    key: 'piEst',
    label: 'π εκτίμηση',
    render: (student) => Number.isFinite(Number(student.piEst)) ? Number(student.piEst).toFixed(4) : '-'
  },
  {
    key: 'score',
    label: 'Σκορ',
    render: (student) => Number.isFinite(Number(student.score)) ? Number(student.score) : '-'
  }
];

export const createGeometryColumns = () => [
  {
    key: 'x',
    label: 'Θέση X',
    render: (student) => Number.isFinite(Number(student.x)) ? Number(student.x).toFixed(1) : '-'
  },
  {
    key: 'y',
    label: 'Θέση Y',
    render: (student) => Number.isFinite(Number(student.y)) ? Number(student.y).toFixed(1) : '-'
  },
  {
    key: 'role',
    label: 'Ρόλος',
    render: (student) => student.role || '-'
  },
  {
    key: 'shape',
    label: 'Σχήμα',
    render: (student) => student.shape || '-'
  }
];
