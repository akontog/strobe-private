import React from 'react';
import { StudentTable as SharedStudentTable } from '../../shared/components/StudentTable';

export const StudentTable = ({ 
    i1, 
    i2, 
    features,
    participants = [], threshold = 5 }) => (
  <SharedStudentTable
    title="📋 Πίνακας μαθητών"
    participants={participants}
    emptyMessage="Δεν υπάρχουν συνδεδεμένοι μαθητές."
    nameFallback="Μαθητής"
    getRowKey={(student, index) => student.id || student.username || student.name || index}
    getDisplayName={(student) => student.username || student.name || student.displayName || 'Μαθητής'}
    getIsConnected={(student) => student.isConnected ?? true}
    columns={[
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
        render: (student) => student.weights?.w1 ?? '-'
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
        render: (student) => student.weights?.w2 ?? '-'
      },
      {
        key: 'result',
        label: 'Αποτέλεσμα o',
        className: 'result-visible',
        render: (student) => (
          <>
            {student.total ?? student.result ?? '-'}
            {typeof student.aboveThreshold === 'boolean' && (
              <span style={{ marginLeft: '0.45rem', fontWeight: 700, color: student.aboveThreshold ? '#059669' : '#dc2626' }}>
                {student.aboveThreshold ? `>= ${threshold}` : `< ${threshold}`}
              </span>
            )}
          </>
        )
      }
    ]}
  />
);
