import React from 'react';
import { StudentTable as SharedStudentTable } from '../../../framework/components/StudentTable';

export const StudentTable = ({ 
    i1, 
    i2, 
    selectedInputs = { i1: true, i2: false },
    features,
    participants = [], 
  threshold = { op: '>=', boundary: 5 },
  activity = '1'
  }) => {
  const showInput1 = Boolean(selectedInputs?.i1);
  const showInput2 = Boolean(selectedInputs?.i2);
  const showProducts = activity === '2' || activity === '3' || activity === '4';
  
  // Determine which columns to show based on activity
  let columns = [];

  if (showInput1) {
    columns.push(
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
        render: (student) => student.weights?.w1 ?? (activity !== '3' && activity !== '4' ? 2 : '-')
      }
    );
  }

  if (showInput2) {
    columns.push(
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
        render: (student) => student.weights?.w2 ?? (activity !== '3' && activity !== '4' ? 3 : '-')
      }
    );
  }

  // Add products columns for activities 2+
  if (showProducts && showInput1) {
    columns.push({
      key: 'p1',
      label: 'p₁ (w₁×i₁)',
      render: (student) => student?.products?.p1 ?? '-'
    });
  }

  if (showProducts && showInput2) {
    columns.push({
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
      const showThreshold = activity === '4';
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <span>{resultValue}</span>
          {showThreshold && typeof student.aboveThreshold === 'boolean' && (
            <span style={{ marginLeft: '0.45rem', fontWeight: 700, color: student.aboveThreshold ? '#059669' : '#dc2626' }}>
              {student.aboveThreshold ? `${threshold.op} ${threshold.boundary}` : `όχι ${threshold.op} ${threshold.boundary}`}
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
