import React from 'react';
import { useTranslation } from 'react-i18next';

export default function ClassificationTable({ rows, featureKeys }) {
  const { t } = useTranslation('interface');
  return (
    <table className="linear-table">
      <thead>
        <tr>
          <th>{t('linearSeparationExample')}</th>
          {featureKeys.map((key) => <th key={key}>{key}</th>)}
          <th>w·x</th>
          <th>{t('linearSeparationPrediction')}</th>
          <th>{t('linearSeparationLabel')}</th>
          <th>{t('linearSeparationCorrect')}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.name}>
            <td>{row.name}</td>
            {row.x.map((value, idx) => <td key={`${row.name}-${idx}`}>{value}</td>)}
            <td>{row.value.toFixed(3)}</td>
            <td>{row.predictedPositive ? t('linearSeparationPositive') : t('linearSeparationNegative')}</td>
            <td>{row.actualPositive ? t('linearSeparationTarget') : t('linearSeparationOthers')}</td>
            <td className={row.correct ? 'linear-ok' : 'linear-bad'}>{row.correct ? '✓' : '✗'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
