import React from 'react';
import { Accordion } from './Accordion';

export const StudentTable = ({ i1, i2, w1 = 2, w2 = 3 }) => {
  const students = ["Αλέξανδρος", "Θανάσης", "Μυρτώ", "Κωνσταντίνος"];
  const total = (w1 * i1) + (w2 * i2);

  return (
    <Accordion title="📋 Πίνακας μαθητών (σταθερή αναφορά)">
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
            {students.map((student) => (
              <tr key={student}>
                <td><span className="green-dot"></span> {student}</td>
                <td>{i1} <span className="icon-in-table">🛞</span></td>
                <td className="weight-value" style={{ background: '#ef4444', color: 'white' }}>{w1}</td>
                <td>{i2} <span className="icon-in-table">⚙️</span></td>
                <td className="weight-value" style={{ background: '#ef4444', color: 'white' }}>{w2}</td>
                <td className="result-visible">{total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Accordion>
  );
};
