import React from 'react';
import { formatRule } from '../logic/datasetUtils';
import ClassificationTable from './ClassificationTable';

export default function Results({ result }) {
  if (!result) {
    return <p>Δεν υπάρχουν αρκετά στοιχεία ακόμα.</p>;
  }

  if (!result.separable) {
    return (
      <div>
        <p className="tool-error">Δεν βρέθηκε διαχωριστής.</p>
        <p>{result.reason}</p>
      </div>
    );
  }

  return (
    <>
      <p><strong>Βρέθηκε διαχωριστής.</strong> Μικρότερο max|w|: {result.radius}, margin: {result.margin.toFixed(3)}</p>
      <code className="linear-rule">{formatRule(result.w, result.featureKeys, result.theta)}</code>
      <ClassificationTable rows={result.rows} featureKeys={result.featureKeys} />
    </>
  );
}