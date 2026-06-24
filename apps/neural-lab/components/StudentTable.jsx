import React from 'react';
import { Accordion } from './Accordion';

export const StudentTable = ({ i1, i2, participants = [], threshold = 5 }) => {
  const rows = Array.isArray(participants) ? participants : [];

  return (
    <Accordion title="📋 Πίνακας μαθητών (ζωντανή αναφορά)">
      <div className="data-section">
        <table className="data-table">
          <thead>
            <tr>
              <th>Μαθητές</th>
              <th>i₁ (ρόδες)</th>
              <th>w₁</th>
              <th>i₂ (μηχανές)</th>
              <th>w₂</th>
              <th>Αποτέλεσμα o</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', opacity: 0.7 }}>
                  Δεν υπάρχουν συνδεδεμένοι μαθητές.
                </td>
              </tr>
            )}
            {rows.map((student) => (
              <tr key={student.id || student.name}>
                <td><span className="green-dot"></span> {student.name || 'Μαθητής'}</td>
                <td>{i1} <span className="icon-in-table">🛞</span></td>
                <td className="weight-value" style={{ background: '#ef4444', color: 'white' }}>{student.weights?.w1 ?? '-'}</td>
                <td>{i2} <span className="icon-in-table">⚙️</span></td>
                <td className="weight-value" style={{ background: '#ef4444', color: 'white' }}>{student.weights?.w2 ?? '-'}</td>
                <td className="result-visible">
                  {student.result ?? '-'}
                  {typeof student.aboveThreshold === 'boolean' && (
                    <span style={{ marginLeft: '0.45rem', fontWeight: 700, color: student.aboveThreshold ? '#059669' : '#dc2626' }}>
                      {student.aboveThreshold ? `>= ${threshold}` : `< ${threshold}`}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Accordion>
  );
};
