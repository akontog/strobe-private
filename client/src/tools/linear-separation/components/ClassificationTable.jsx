import React from 'react';

export default function ClassificationTable({ rows, featureKeys }) {
  return (
    <table className="linear-table">
      <thead>
        <tr>
          <th>Στοιχείο</th>
          {featureKeys.map((key) => <th key={key}>{key}</th>)}
          <th>w·x</th>
          <th>Πρόβλεψη</th>
          <th>Label</th>
          <th>OK</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.name}>
            <td>{row.name}</td>
            {row.x.map((value, idx) => <td key={`${row.name}-${idx}`}>{value}</td>)}
            <td>{row.value.toFixed(3)}</td>
            <td>{row.predictedPositive ? 'θετικό' : 'αρνητικό'}</td>
            <td>{row.actualPositive ? 'στόχος' : 'λοιπά'}</td>
            <td className={row.correct ? 'linear-ok' : 'linear-bad'}>{row.correct ? '✓' : '✗'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}