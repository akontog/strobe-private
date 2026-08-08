import React, { useMemo } from 'react';
import { Accordion } from '../../shared-components/Accordion';

// Υπολογίζει output = w1*i1 + w2*i2, λαμβάνοντας υπόψη μόνο τα ενεργά inputs
// (ένα ανενεργό input δεν συνεισφέρει στο άθροισμα).
function computeOutput({ i1, i2 }, { w1, w2 }, activeInputs) {
  const term1 = activeInputs.i1 ? w1 * i1 : 0;
  const term2 = activeInputs.i2 ? w2 * i2 : 0;
  return term1 + term2;
}

// Συγκρίνει μια τιμή με threshold { op, boundary }
function compare(value, threshold) {
  if (!threshold) return null;
  const { op, boundary } = threshold;
  switch (op) {
    case '>':  return value >  boundary;
    case '>=': return value >= boundary;
    case '<':  return value <  boundary;
    case '<=': return value <= boundary;
    default:   return null;
  }
}

// Διαλέγει το σωστό threshold key (both/i1/i2) ανάλογα με τα ενεργά inputs.
function resolveThreshold(thresholdObj, activeInputs) {
  if (!thresholdObj || typeof thresholdObj !== 'object') return null;

  if (activeInputs.i1 && activeInputs.i2) {
    return thresholdObj.both || null;
  }
  if (activeInputs.i1) {
    return thresholdObj.i1 || null;
  }
  if (activeInputs.i2) {
    return thresholdObj.i2 || null;
  }
  return null;
}

export const ExamplesClassifier = ({
  datasets,
  currentDataset,
  currentLinearDemoIndex,
  activityId,
  selectedInputs,
  features,
  weights // { w1, w2 } -- τα τρέχοντα βάρη που έθεσε ο μαθητής/δάσκαλος
}) => {
  const activeInputs = {
    i1: selectedInputs?.i1 !== false,
    i2: Boolean(selectedInputs?.i2)
  };

  const safeWeights = {
    w1: Number.isFinite(weights?.w1) ? weights.w1 : 0,
    w2: Number.isFinite(weights?.w2) ? weights.w2 : 0
  };

  const datasetData = datasets[currentDataset];
  const demo = datasetData?.linear_demos?.[currentLinearDemoIndex];
  const threshold = resolveThreshold(demo?.threshold, activeInputs);
  const showResultDetails = activityId === '4';

  const classifiedExamples = useMemo(() => {
    if (!datasetData?.examples) return [];

    return datasetData.examples.map((ex) => {
      const output = computeOutput({ i1: ex.i1, i2: ex.i2 }, safeWeights, activeInputs);
      const result = threshold ? compare(output, threshold) : null;

      return { ...ex, output, result };
    });
  }, [
    datasetData,
    threshold,
    activeInputs.i1,
    activeInputs.i2,
    safeWeights.w1,
    safeWeights.w2
  ]);

  const confusionMatrix = useMemo(() => {
    if (!showResultDetails || !demo || !threshold) {
      return null;
    }

    return classifiedExamples.reduce((acc, ex) => {
      // Θεωρούμε ως πραγματικά θετικό το τρέχον target παράδειγμα του linear demo.
      const actualPositive = ex.name === demo.example;
      const predictedPositive = Boolean(ex.result);

      if (actualPositive && predictedPositive) acc.tp += 1;
      else if (!actualPositive && predictedPositive) acc.fp += 1;
      else if (!actualPositive && !predictedPositive) acc.tn += 1;
      else acc.fn += 1;

      return acc;
    }, { tp: 0, fp: 0, tn: 0, fn: 0 });
  }, [showResultDetails, demo, threshold, classifiedExamples]);

  const metricValue = (key) => {
    if (!showResultDetails || !threshold || !confusionMatrix) {
      return '';
    }
    return confusionMatrix[key];
  };

  if (!datasetData) {
    return null;
  }

  return (
    <Accordion title="🔎 Ταξινόμηση Παραδειγμάτων">
      <div className="data-section">
        <table className="data-table">
          <thead>
            <tr>
              <th>Παράδειγμα</th>
              {activeInputs.i1 && <th>{features?.i1?.icon} {features?.i1?.label}</th>}
              {activeInputs.i2 && <th>{features?.i2?.icon} {features?.i2?.label}</th>}
              <th>w1·i1 + w2·i2</th>
              {showResultDetails && <th>Αποτέλεσμα</th>}
            </tr>
          </thead>
          <tbody>
            {classifiedExamples.map((ex, idx) => (
              <tr key={idx}>
                <td>
                  <span className="icon-in-table">{ex.icon}</span> {ex.name}
                </td>
                {activeInputs.i1 && <td className="weight-value">{ex.i1}</td>}
                {activeInputs.i2 && <td className="weight-value">{ex.i2}</td>}
                <td className="weight-value">{ex.output.toFixed(2)}</td>
                {showResultDetails && (
                  <td className={threshold ? (ex.result ? 'result-positive' : 'result-negative') : ''}>
                    {threshold ? (ex.result ? '✅ Θετικό' : '❌ Αρνητικό') : ''}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>

        <div className="data-section" style={{ marginTop: '0.8rem' }}>
        <table className="data-table">
            <thead>
            <tr>
                <th colSpan="3" style={{ 
                textAlign: 'center', 
                fontSize: '1.2rem', 
                fontWeight: 'bold',
                padding: '10px 0',
                borderBottom: '2px solid #e2e8f0'
                }}>
                Confusion Matrix
                </th>
            </tr>
            <tr>
                {/* 2η γραμμή: Οι κύριες κατηγορίες στηλών */}
                <th rowSpan="2">Πραγματική κλάση</th>
                <th colSpan="2">Πρόβλεψη</th>
            </tr>
            <tr>
                {/* 3η γραμμή: Οι υποκατηγορίες της πρόβλεψης */}
                <th>Θετικό</th>
                <th>Αρνητικό</th>
            </tr>
            </thead>
            <tbody>
            <tr>
                <td>Θετική</td>
                <td className="result-positive">TP: {metricValue('tp')}</td>
                <td className="result-negative">FN: {metricValue('fn')}</td>
            </tr>
            <tr>
                <td>Αρνητική</td>
                <td className="result-negative">FP: {metricValue('fp')}</td>
                <td className="result-positive">TN: {metricValue('tn')}</td>
            </tr>
            </tbody>
        </table>
        </div>

        <div className="student-inline-note" style={{ marginTop: '0.6rem' }}>
          Τρέχοντα βάρη: w1 = {safeWeights.w1}, w2 = {safeWeights.w2}
          {showResultDetails && threshold && ` | threshold: ${threshold.op} ${threshold.boundary}`}
        </div>
      </div>
    </Accordion>
  );
};