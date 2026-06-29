import React from 'react';
import { StudentTable as SharedStudentTable } from '../../shared/components/StudentTable';

export const StudentTable = ({ 
    i1, 
    i2, 
    features,
    participants = [], 
    threshold = 5,
    activity = '1a'
  }) => {
  
  // Determine which columns to show based on activity
  let columns = [
    {
      key: 'i1',
      label:  `i₁ (${features.i1.label})`,
      render: (student) => <>{student?.inputs?.i1 ?? i1} <span className="icon-in-table">{features.i1.icon}</span></>
    },
    {
      key: 'w1',
      label: 'w₁',
      className: 'weight-value',
      style: { background: '#ef4444', color: 'white' },
      render: (student) => student.weights?.w1 ?? (activity !== '3b' && activity !== '4b' ? 2 : '-')
    },
    {
      key: 'i2',
      label:  `i₂ (${features.i2.label})`,
      render: (student) => <>{student?.inputs?.i2 ?? i2} <span className="icon-in-table">{features.i2.icon} </span></>
    },
    {
      key: 'w2',
      label: 'w₂',
      className: 'weight-value',
      style: { background: '#ef4444', color: 'white' },
      render: (student) => student.weights?.w2 ?? (activity !== '3b' && activity !== '4b' ? 3 : '-')
    }
  ];

  // Add products columns for activities 2+
  if (activity === '2a' || activity === '2b' || activity === '3a' || activity === '3b' || activity === '4a' || activity === '4b') {
    columns.push({
      key: 'p1',
      label: 'p₁ (w₁×i₁)',
      render: (student) => student?.products?.p1 ?? '-'
    },
    {
      key: 'p2',
      label: 'p₂ (w₂×i₂)',
      render: (student) => student?.products?.p2 ?? '-'
    });
  }

  // Add result column
  columns.push({
    key: 'result',
    label: 'Αποτέλεσμα o',
    className: 'result-visible',
    render: (student) => {
      const resultValue = student.total ?? student.result ?? '-';
      const showThreshold = activity === '4a' || activity === '4b';
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <span>{resultValue}</span>
          {showThreshold && typeof student.aboveThreshold === 'boolean' && (
            <span style={{ marginLeft: '0.45rem', fontWeight: 700, color: student.aboveThreshold ? '#059669' : '#dc2626' }}>
              {student.aboveThreshold ? `>= ${threshold}` : `< ${threshold}`}
            </span>
          )}
        </div>
      );
    }
  });

  return (
    <SharedStudentTable
      title="📋 Πίνακας μαθητών"
      participants={participants}
      emptyMessage="Δεν υπάρχουν συνδεδεμένοι μαθητές."
      nameFallback="Μαθητής"
      getRowKey={(student, index) => student.id || student.username || student.name || index}
      getDisplayName={(student) => student.username || student.name || student.displayName || 'Μαθητής'}
      getIsConnected={(student) => student.isConnected ?? true}
      columns={columns}
    />
  );
};
